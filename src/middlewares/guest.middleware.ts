import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../builder/app-error';
import { Guest } from '../modules/guest/guest.model';
import { TGuest } from '../modules/guest/guest.type';
import catchAsync from '../utils/catch-async';

const COOKIE_NAME = 'guest_token';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 365;

const initialize = async (req: Request, res: Response): Promise<TGuest> => {
  let token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    token = crypto.randomBytes(12).toString('hex');
    res.cookie(COOKIE_NAME, token, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  // Try find guest in DB
  let guest = await Guest.findOne({ token: token });

  // Invalidate expired guest sessions (1 year TTL, matching cookie maxAge)
  const GUEST_TTL_MS = 365 * 24 * 60 * 60 * 1000;
  if (
    guest?.created_at &&
    Date.now() - new Date(guest.created_at).getTime() > GUEST_TTL_MS
  ) {
    guest = null;
  }

  if (!guest) {
    guest = await Guest.create({
      token: token,
      session_id: req.sessionID,
      ip_address: req.ip === '::1' ? '127.0.0.1' : req.ip,
      user_agent: req.get('User-Agent') || '',
      fingerprint: req.get('User-Agent')
        ? crypto.createHash('md5').update(req.get('User-Agent')!).digest('hex')
        : '',
      preferences: {},
    });
  } else {
    guest.session_id = req.sessionID;
    guest.ip_address = req.ip === '::1' ? '127.0.0.1' : req.ip;
    guest.user_agent = req.get('User-Agent') || guest.user_agent;
    await guest.save();
  }

  // Attach to session
  req.session.guest = guest.toObject();

  return guest as unknown as TGuest;
};

// Enrich guest with preferences
export const enrichGuestFromRequest = async (
  guest: TGuest,
  req: Request,
): Promise<void> => {
  const theme = (req.query.theme as string) || req.get('X-Theme');
  if (theme && ['light', 'dark', 'system'].includes(theme)) {
    guest.preferences.theme = theme as 'light' | 'dark' | 'system';
  }

  const timezone = (req.query.tz as string) || req.get('X-Timezone');
  if (timezone) {
    guest.preferences.timezone = timezone;
  }

  const language =
    (req.query.lang as string) || req.get('Accept-Language')?.split(',')[0];
  if (language) {
    guest.preferences.language = language;
  }
};

const guest = (status: 'mandatory' | 'optional') =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let guest: TGuest | undefined = req.session?.guest;

    // Initialize guest if missing or invalid
    if (!guest || !guest?._id) {
      guest = await initialize(req, res);
    }

    // Check mandatory status
    if ((!guest || !guest?._id) && status === 'mandatory') {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Unable to establish guest session.',
      );
    }

    // Attach guest to req for downstream use
    if (guest && guest._id) {
      req.guest = guest;
    }

    next();
  });

export default guest;

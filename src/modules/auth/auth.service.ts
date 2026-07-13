/**
 * Auth Service
 *
 * Contains ONLY business logic. All database access is delegated to
 * `auth.repository.ts`. This makes the service independently
 * unit-testable by mocking the repository.
 */

/* eslint-disable no-console */
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../builder/app-error';
import config from '../../config';
import { TJwtPayload } from '../../types/jsonwebtoken.type';
import { getCache, invalidateCache, setCache } from '../../utils/cache.utils';
import { sendEmail } from '../../utils/send-email';
import { TUserDocument } from '../user/user.type';
import * as AuthRepository from './auth.repository';
import {
  TChangePassword,
  TForgetPassword,
  TResetPassword,
  TSignin,
  TSignup,
} from './auth.type';
import { createToken, verifyToken } from './auth.util';

const client = new OAuth2Client(config.google_client_id);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const invalidateAuthCache = (userId: string) =>
  invalidateCache(`auth:user:${userId}`);

const buildJwtPayload = (user: TUserDocument): TJwtPayload => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  token_version: user.token_version,
  ...(user.image && { image: user.image }),
});

const createTokenPair = (jwtPayload: TJwtPayload) => {
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret!,
    config.jwt_access_secret_expires_in!,
  );
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret!,
    config.jwt_refresh_secret_expires_in!,
  );
  return { access_token: accessToken, refresh_token: refreshToken };
};

// ─── Google Login ─────────────────────────────────────────────────────────────

export const googleLogin = async (idToken: string) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.google_client_id,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid google token');
  }

  const { sub: google_id, email, name, picture } = payload;

  if (!email || !name) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Email and name are required from Google',
    );
  }

  // Try to find by email, then by google_id
  let user =
    (await AuthRepository.findByEmailWithPassword(email)) ||
    (await AuthRepository.findByGoogleIdWithPassword(google_id!));

  if (user) {
    if (user.is_deleted) {
      throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
    }
    if (user.status === 'blocked') {
      throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
    }
    if (!user.google_id) {
      user.google_id = google_id;
    }
    user.auth_source = 'google';
    await AuthRepository.saveDocument(user);
  } else {
    user = await AuthRepository.createUser({
      name,
      email,
      google_id,
      auth_source: 'google',
      image: picture,
      role: 'editor',
      is_verified: true,
    });
  }

  const jwtPayload = buildJwtPayload(user);
  const { access_token, refresh_token } = createTokenPair(jwtPayload);

  return { access_token, refresh_token, info: jwtPayload };
};

// ─── Sign In ──────────────────────────────────────────────────────────────────

export const signin = async (payload: TSignin) => {
  const user = await AuthRepository.findByEmailWithPassword(payload.email);

  // Unknown email and wrong password return the SAME generic response so an
  // attacker cannot enumerate which emails have accounts. Verify the password
  // before surfacing account-state errors (deleted/blocked) for the same reason.
  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(payload.password, user.password))
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password!');
  }
  if (user.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
  }

  const jwtPayload = buildJwtPayload(user);
  const { access_token, refresh_token } = createTokenPair(jwtPayload);

  return { access_token, refresh_token, info: jwtPayload };
};

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export const signup = async (payload: TSignup) => {
  const isExist = await AuthRepository.findByEmailWithPassword(payload.email);
  if (isExist) {
    throw new AppError(httpStatus.CONFLICT, 'User already exists!');
  }

  const user = await AuthRepository.createUser({
    ...payload,
    auth_source: 'email',
    role: 'editor',
  });

  if (!user) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create user!',
    );
  }

  const jwtPayload = buildJwtPayload(user);
  const { access_token, refresh_token } = createTokenPair(jwtPayload);

  return { access_token, refresh_token, info: jwtPayload };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshToken = async (token: string) => {
  const blacklisted = await getCache(`auth:blacklist:${token}`);
  if (blacklisted) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Token has been revoked. Please login again.',
    );
  }

  const decoded = verifyToken(token, config.jwt_refresh_secret!);
  const { email, iat, token_version } = decoded;

  if (!email || typeof iat !== 'number') {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'You do not have the necessary permissions to access this resource.',
    );
  }

  const user = await AuthRepository.findByEmailWithPassword(email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }
  if (user.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
  }

  if (token_version !== undefined && token_version !== user.token_version) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Session invalidated. Please login again.',
    );
  }

  if (user.password_changed_at) {
    const passwordChangedAt = new Date(user.password_changed_at).getTime();
    const tokenIssuedAt = iat * 1000; // convert seconds → ms

    if (passwordChangedAt > tokenIssuedAt) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Password recently changed. Please login again.',
      );
    }
  }

  const jwtPayload = buildJwtPayload(user);
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret!,
    config.jwt_access_secret_expires_in!,
  );

  return { access_token: accessToken, info: jwtPayload };
};

// ─── Change Password ──────────────────────────────────────────────────────────

export const changePassword = async (
  user: JwtPayload,
  payload: TChangePassword,
) => {
  const existing = await AuthRepository.findByEmailWithPassword(user.email);

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }
  if (
    !existing.password ||
    !(await bcrypt.compare(payload.current_password, existing.password))
  ) {
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not matched!');
  }

  const hashedNewPassword = await bcrypt.hash(
    payload.new_password,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await AuthRepository.updatePasswordByEmailAndRole(
    user.email,
    user.role,
    hashedNewPassword,
  );

  await invalidateAuthCache(existing._id.toString());

  return result;
};

// ─── Forget Password ──────────────────────────────────────────────────────────

export const forgetPassword = async (payload: TForgetPassword) => {
  const user = await AuthRepository.findByEmailWithPassword(payload.email);

  // Do not reveal whether the email is registered / deleted / blocked — return
  // the same generic success response in every case (anti-enumeration). Only
  // actually send the reset email when the account is valid.
  if (!user || user.is_deleted || user.status === 'blocked') {
    return;
  }

  const jwtPayload: TJwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_reset_password_secret!,
    config.jwt_reset_password_secret_expires_in || '10m',
  );

  const link = `${config.reset_password_ui_link}?id=${user.email}&token=${resetToken}`;
  const content = `<a href="${link}">Click here to reset your password</a>`;

  // Fire-and-forget: a rejected email promise must never bubble to the global
  // unhandledRejection handler, which shuts the whole server down.
  void (async () => {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Twelve Creative Password Change Link',
        text: 'Reset your password within 10 minuets',
        html: content,
      });
    } catch (err) {
      console.warn('Password reset email failed:', err);
    }
  })();
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (payload: TResetPassword, token: string) => {
  const decoded = verifyToken(token, config.jwt_reset_password_secret!);

  if (!decoded?.email) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'You do not have the necessary permissions to access this resource.',
    );
  }

  const user = await AuthRepository.findByEmailWithPassword(decoded.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }
  if (user.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
  }

  if (user.password_changed_at && typeof decoded.iat === 'number') {
    const passwordChangedAt = new Date(user.password_changed_at).getTime();
    const tokenIssuedAt = decoded.iat * 1000;
    if (passwordChangedAt > tokenIssuedAt) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Reset link has already been used. Please request a new one.',
      );
    }
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await AuthRepository.updatePasswordById(
    user._id.toString(),
    hashedPassword,
  );

  await invalidateAuthCache(user._id.toString());

  return result;
};

// ─── Email Verification Source ────────────────────────────────────────────────

export const emailVerificationSource = async (user: TJwtPayload) => {
  const jwtPayload: TJwtPayload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_email_verification_secret!,
    config.jwt_email_verification_secret_expires_in || '10m',
  );

  const link = `${config.email_verification_ui_link}?id=${user.email}&token=${resetToken}`;
  const content = `<a href="${link}">Click here to verify your email</a>`;

  // Fire-and-forget: a rejected email promise must never bubble to the global
  // unhandledRejection handler, which shuts the whole server down.
  void (async () => {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Twelve Creative Email Verification Link',
        text: 'Verify your email within 10 minuets',
        html: content,
      });
    } catch (err) {
      console.warn('Email verification email failed:', err);
    }
  })();
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (refreshToken: string) => {
  try {
    const decoded = verifyToken(
      refreshToken,
      config.jwt_refresh_secret!,
    ) as JwtPayload;
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await setCache(`auth:blacklist:${refreshToken}`, '1', ttl);
      }
    }
  } catch {
    // Token already expired — no need to blacklist
  }
};

// ─── Logout All Sessions ──────────────────────────────────────────────────────

export const logoutAllSessions = async (userId: string) => {
  await AuthRepository.incrementTokenVersion(userId);
  await invalidateAuthCache(userId);
};

// ─── Email Verification ───────────────────────────────────────────────────────

export const emailVerification = async (token: string) => {
  const decoded = verifyToken(token, config.jwt_email_verification_secret!);

  if (!decoded?.email) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'You do not have the necessary permissions to access this resource.',
    );
  }

  const user = await AuthRepository.findByEmailWithPassword(decoded.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }
  if (user.is_deleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'User is deleted!');
  }
  if (user.status === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is blocked!');
  }

  return await AuthRepository.updateIsVerifiedById(user._id.toString());
};

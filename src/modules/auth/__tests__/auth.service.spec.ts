/**
 * auth.service.test.ts
 *
 * Unit tests for the Auth Service layer.
 * The repository, config, bcrypt, and email utils are fully mocked
 * so these tests run without a real DB, Redis, or SMTP connection.
 */

import httpStatus from 'http-status';

// ── Mock repository before importing service ──────────────────────────────────
jest.mock('../auth.repository');
jest.mock('../../../utils/send-email', () => ({ sendEmail: jest.fn() }));

// ── Mock bcrypt ───────────────────────────────────────────────────────────────
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// ── Mock JWT utils ────────────────────────────────────────────────────────────
jest.mock('../auth.util', () => ({
  createToken: jest.fn().mockReturnValue('mock_token'),
  verifyToken: jest.fn(),
}));

// ── Mock config ───────────────────────────────────────────────────────────────
jest.mock('../../../config', () => ({
  default: {
    jwt_access_secret: 'access_secret',
    jwt_access_secret_expires_in: '1h',
    jwt_refresh_secret: 'refresh_secret',
    jwt_refresh_secret_expires_in: '7d',
    jwt_reset_password_secret: 'reset_secret',
    jwt_reset_password_secret_expires_in: '10m',
    jwt_email_verification_secret: 'verify_secret',
    jwt_email_verification_secret_expires_in: '10m',
    bcrypt_salt_rounds: '10',
    reset_password_ui_link: 'http://localhost:3000/reset-password',
    email_verification_ui_link: 'http://localhost:3000/verify-email',
    google_client_id: 'mock_google_client_id',
  },
}));

import bcrypt from 'bcrypt';
import * as AuthRepository from '../auth.repository';
import * as AuthService from '../auth.service';
import { verifyToken } from '../auth.util';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockUserDoc = (overrides = {}) => ({
  _id: { toString: () => '507f1f77bcf86cd799439011' },
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed',
  role: 'user',
  status: 'in-progress',
  is_deleted: false,
  is_verified: false,
  auth_source: 'email',
  password_changed_at: undefined,
  image: undefined,
  google_id: undefined,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ─── signin ───────────────────────────────────────────────────────────────────

describe('AuthService.signin', () => {
  it('should return tokens on valid credentials', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc(),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await AuthService.signin({
      email: 'john@example.com',
      password: 'password123',
    });

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
    expect(result.info.email).toBe('john@example.com');
  });

  it('should throw 404 when user not found', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      AuthService.signin({ email: 'x@x.com', password: 'pass' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('should throw 403 when user is deleted', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc({ is_deleted: true }),
    );

    await expect(
      AuthService.signin({ email: 'john@example.com', password: 'pass' }),
    ).rejects.toMatchObject({
      status: httpStatus.FORBIDDEN,
      message: 'User is deleted!',
    });
  });

  it('should throw 403 when user is blocked', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc({ status: 'blocked' }),
    );

    await expect(
      AuthService.signin({ email: 'john@example.com', password: 'pass' }),
    ).rejects.toMatchObject({
      status: httpStatus.FORBIDDEN,
      message: 'User is blocked!',
    });
  });

  it('should throw 403 when password does not match', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc(),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      AuthService.signin({ email: 'john@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      status: httpStatus.FORBIDDEN,
      message: 'Password do not matched!',
    });
  });
});

// ─── signup ───────────────────────────────────────────────────────────────────

describe('AuthService.signup', () => {
  it('should create a user and return tokens', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      null,
    );
    (AuthRepository.createUser as jest.Mock).mockResolvedValue(mockUserDoc());

    const result = await AuthService.signup({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    expect(AuthRepository.createUser).toHaveBeenCalled();
    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
  });

  it('should throw 409 when user already exists', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc(),
    );

    await expect(
      AuthService.signup({
        name: 'John',
        email: 'john@example.com',
        password: 'pass',
      }),
    ).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: 'User already exists!',
    });

    expect(AuthRepository.createUser).not.toHaveBeenCalled();
  });
});

// ─── refreshToken ─────────────────────────────────────────────────────────────

describe('AuthService.refreshToken', () => {
  it('should return a new access token for a valid refresh token', async () => {
    (verifyToken as jest.Mock).mockReturnValue({
      email: 'john@example.com',
      iat: Math.floor(Date.now() / 1000) - 100,
    });
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc(),
    );

    const result = await AuthService.refreshToken('valid_refresh_token');

    expect(result).toHaveProperty('access_token');
    expect(result.info.email).toBe('john@example.com');
  });

  it('should throw 403 when password changed after token issued', async () => {
    const pastIat = Math.floor(Date.now() / 1000) - 3600; // 1h ago
    (verifyToken as jest.Mock).mockReturnValue({
      email: 'john@example.com',
      iat: pastIat,
    });
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc({ password_changed_at: new Date() }), // changed NOW (after token)
    );

    await expect(
      AuthService.refreshToken('stale_refresh_token'),
    ).rejects.toMatchObject({
      status: httpStatus.FORBIDDEN,
      message: 'Password recently changed. Please login again.',
    });
  });

  it('should throw 404 when user not found', async () => {
    (verifyToken as jest.Mock).mockReturnValue({
      email: 'ghost@example.com',
      iat: 123456,
    });
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(AuthService.refreshToken('token')).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });
});

// ─── changePassword ───────────────────────────────────────────────────────────

describe('AuthService.changePassword', () => {
  it('should update password and return updated user', async () => {
    const user = mockUserDoc();
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      user,
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (
      AuthRepository.updatePasswordByEmailAndRole as jest.Mock
    ).mockResolvedValue(user);

    const result = await AuthService.changePassword(
      { email: 'john@example.com', role: 'user' },
      { current_password: 'old_pass', new_password: 'new_pass' },
    );

    expect(AuthRepository.updatePasswordByEmailAndRole).toHaveBeenCalledWith(
      'john@example.com',
      'user',
      'hashed_password',
    );
    expect(result).toBeDefined();
  });

  it('should throw 403 when current password is wrong', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc(),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      AuthService.changePassword(
        { email: 'john@example.com', role: 'user' },
        { current_password: 'wrong', new_password: 'new_pass' },
      ),
    ).rejects.toMatchObject({ status: httpStatus.FORBIDDEN });
  });
});

// ─── forgetPassword ───────────────────────────────────────────────────────────

describe('AuthService.forgetPassword', () => {
  it('should send a reset email for a valid user', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc(),
    );
    const { sendEmail } = jest.requireMock('../../../utils/send-email');

    await AuthService.forgetPassword({ email: 'john@example.com' });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        subject: 'Twelve Creative Password Change Link',
      }),
    );
  });

  it('should throw 404 when user not found', async () => {
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      AuthService.forgetPassword({ email: 'ghost@example.com' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe('AuthService.resetPassword', () => {
  it('should reset the password successfully', async () => {
    const user = mockUserDoc();
    (verifyToken as jest.Mock).mockReturnValue({ email: 'john@example.com' });
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      user,
    );
    (AuthRepository.updatePasswordById as jest.Mock).mockResolvedValue(user);

    const result = await AuthService.resetPassword(
      { password: 'new_password' },
      'valid_reset_token',
    );

    expect(AuthRepository.updatePasswordById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'hashed_password',
    );
    expect(result).toBeDefined();
  });

  it('should throw 403 when user is blocked', async () => {
    (verifyToken as jest.Mock).mockReturnValue({ email: 'john@example.com' });
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      mockUserDoc({ status: 'blocked' }),
    );

    await expect(
      AuthService.resetPassword({ password: 'x' }, 'token'),
    ).rejects.toMatchObject({ status: httpStatus.FORBIDDEN });
  });
});

// ─── emailVerificationSource ──────────────────────────────────────────────────

describe('AuthService.emailVerificationSource', () => {
  it('should send a verification email', async () => {
    const { sendEmail } = jest.requireMock('../../../utils/send-email');

    await AuthService.emailVerificationSource({
      _id: '507f1f77bcf86cd799439011',
      name: 'John',
      email: 'john@example.com',
      role: 'user',
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        subject: 'Twelve Creative Email Verification Link',
      }),
    );
  });
});

// ─── emailVerification ────────────────────────────────────────────────────────

describe('AuthService.emailVerification', () => {
  it('should mark user as verified', async () => {
    const user = mockUserDoc();
    (verifyToken as jest.Mock).mockReturnValue({ email: 'john@example.com' });
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      user,
    );
    (AuthRepository.updateIsVerifiedById as jest.Mock).mockResolvedValue({
      ...user,
      is_verified: true,
    });

    const result = await AuthService.emailVerification('valid_token');

    expect(AuthRepository.updateIsVerifiedById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
    expect(result).toBeDefined();
  });

  it('should throw 401 when token has no email', async () => {
    (verifyToken as jest.Mock).mockReturnValue({});

    await expect(
      AuthService.emailVerification('bad_token'),
    ).rejects.toMatchObject({ status: httpStatus.UNAUTHORIZED });
  });

  it('should throw 404 when user not found', async () => {
    (verifyToken as jest.Mock).mockReturnValue({ email: 'ghost@example.com' });
    (AuthRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(AuthService.emailVerification('token')).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });
});

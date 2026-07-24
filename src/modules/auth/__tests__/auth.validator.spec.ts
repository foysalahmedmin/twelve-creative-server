import { z } from 'zod';
import {
  changePasswordValidationSchema,
  resetPasswordValidationSchema,
  signinValidationSchema,
  signupValidationSchema,
} from '../auth.validator';

const maxLengthPassword = `Aa1!${'x'.repeat(96)}`;
const oversizedPassword = `${maxLengthPassword}x`;

type PasswordValidationCase = {
  name: string;
  schema: z.ZodTypeAny;
  validBody: Record<string, string>;
  passwordField: string;
};

const passwordValidationCases: PasswordValidationCase[] = [
  {
    name: 'signin password',
    schema: signinValidationSchema,
    validBody: {
      email: 'admin@example.com',
      password: maxLengthPassword,
    },
    passwordField: 'password',
  },
  {
    name: 'signup password',
    schema: signupValidationSchema,
    validBody: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: maxLengthPassword,
    },
    passwordField: 'password',
  },
  {
    name: 'current password during password change',
    schema: changePasswordValidationSchema,
    validBody: {
      current_password: maxLengthPassword,
      new_password: 'Different1!',
    },
    passwordField: 'current_password',
  },
  {
    name: 'new password during password change',
    schema: changePasswordValidationSchema,
    validBody: {
      current_password: 'Current1!',
      new_password: maxLengthPassword,
    },
    passwordField: 'new_password',
  },
  {
    name: 'reset password',
    schema: resetPasswordValidationSchema,
    validBody: { password: maxLengthPassword },
    passwordField: 'password',
  },
];

describe('Auth password validation', () => {
  it.each(passwordValidationCases)(
    'accepts a strong 100-character $name',
    ({ schema, validBody }) => {
      expect(
        schema.safeParse({
          body: validBody,
        }).success,
      ).toBe(true);
    },
  );

  it.each(passwordValidationCases)(
    'rejects a $name longer than the User model maximum',
    ({ schema, validBody, passwordField }) => {
      expect(
        schema.safeParse({
          body: {
            ...validBody,
            [passwordField]: oversizedPassword,
          },
        }).success,
      ).toBe(false);
    },
  );
});

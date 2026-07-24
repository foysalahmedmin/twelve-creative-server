import { createUserValidationSchema } from '../user.validator';

const maxLengthPassword = `Aa1!${'x'.repeat(96)}`;

describe('User password validation', () => {
  const validRequest = {
    body: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: maxLengthPassword,
    },
  };

  it('accepts a strong password at the User model maximum of 100 characters', () => {
    expect(createUserValidationSchema.safeParse(validRequest).success).toBe(
      true,
    );
  });

  it('rejects a password longer than the User model maximum', () => {
    expect(
      createUserValidationSchema.safeParse({
        body: {
          ...validRequest.body,
          password: `${maxLengthPassword}x`,
        },
      }).success,
    ).toBe(false);
  });
});

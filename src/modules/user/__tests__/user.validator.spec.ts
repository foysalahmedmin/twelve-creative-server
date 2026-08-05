import {
  createUserValidationSchema,
  updateUserValidationSchema,
  updateUsersValidationSchema,
} from '../user.validator';

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

describe('User role assignment', () => {
  const id = '507f1f77bcf86cd799439011';

  // Promoting a teammate to admin is the documented flow on the "New admin
  // user" screen ("Promote to admin from the Users list if needed"), but the
  // schema used to allow only 'editor', so every promotion failed validation.
  it.each(['admin', 'editor'])(
    'accepts role "%s" on a single update',
    (role) => {
      expect(
        updateUserValidationSchema.safeParse({
          params: { id },
          body: { role },
        }).success,
      ).toBe(true);
    },
  );

  it.each(['admin', 'editor'])('accepts role "%s" on a bulk update', (role) => {
    expect(
      updateUsersValidationSchema.safeParse({
        body: { ids: [id], role },
      }).success,
    ).toBe(true);
  });

  it('still rejects a role outside the User model enum', () => {
    expect(
      updateUserValidationSchema.safeParse({
        params: { id },
        body: { role: 'superadmin' },
      }).success,
    ).toBe(false);
  });
});

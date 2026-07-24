import mongoose from 'mongoose';

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn().mockResolvedValue('hashed-password'),
  },
}));

import { User } from '../user.model';

const runPreSaveHooks = async (document: InstanceType<typeof User>) => {
  await new Promise<void>((resolve, reject) => {
    const hooks = (User.schema as any).s.hooks;

    hooks.execPre('save', document, [{}], (error: Error | null | undefined) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

describe('User verification save middleware', () => {
  it('preserves explicit is_verified=true for a new user', async () => {
    const user = new User({
      name: 'Initial Admin',
      email: 'admin@example.com',
      password: 'Initial-strong-password1!',
      auth_source: 'email',
      role: 'admin',
      is_verified: true,
    });

    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.isNew).toBe(true);
    expect(user.is_verified).toBe(true);

    await runPreSaveHooks(user);

    expect(user.is_verified).toBe(true);
    expect(user.password).toBe('hashed-password');
  });

  it("resets verification when an existing user's email changes", async () => {
    const user = User.hydrate({
      _id: new mongoose.Types.ObjectId(),
      name: 'Existing Editor',
      email: 'old-email@example.com',
      google_id: 'existing-editor-google-id',
      auth_source: 'google',
      role: 'editor',
      is_verified: true,
      is_deleted: false,
    });

    expect(user.isNew).toBe(false);
    expect(user.isModified('email')).toBe(false);

    user.email = 'new-email@example.com';

    expect(user.isModified('email')).toBe(true);
    await runPreSaveHooks(user);

    expect(user.is_verified).toBe(false);
  });
});

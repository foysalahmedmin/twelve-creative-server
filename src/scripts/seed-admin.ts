/**
 * Seed / sync the admin user from env (env is the source of truth).
 *
 * Idempotent: won't duplicate. If the admin already exists it is SYNCED to the
 * env values — name + password are reset and the account is ensured admin +
 * verified. (Re-running therefore resets the admin password to ADMIN_SEED_PASSWORD;
 * change it in the panel afterwards if you want a secret the env doesn't hold.)
 * Reads credentials from env:
 *   ADMIN_SEED_NAME       (default: "Twelve Creative Admin")
 *   ADMIN_SEED_EMAIL      (required)
 *   ADMIN_SEED_PASSWORD   (required)
 *
 * Usage:
 *   pnpm seed:admin
 *   pnpm build && pnpm seed:admin:prod # production install/runtime
 */

/* eslint-disable no-console */
import mongoose from 'mongoose';
import { z } from 'zod';
import { disconnectDB, initializeDB } from '../config/db';
import { User } from '../modules/user/user.model';

const run = async (): Promise<void> => {
  const name = process.env.ADMIN_SEED_NAME?.trim() || 'Twelve Creative Admin';
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.error(
      '❌ ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in env.',
    );
    process.exit(1);
  }

  if (!z.string().email().safeParse(email).success) {
    console.error('❌ ADMIN_SEED_EMAIL must be a valid email address.');
    process.exit(1);
  }

  if (password.length < 12 || password.length > 100) {
    console.error(
      '❌ ADMIN_SEED_PASSWORD must be between 12 and 100 characters.',
    );
    process.exit(1);
  }

  await initializeDB();

  try {
    const existing = await User.isUserExistByEmail(email);

    if (existing) {
      // Env is the source of truth: keep the admin's name + password in sync
      // with ADMIN_SEED_* and ensure the account stays an active admin.
      existing.name = name;
      existing.password = password; // pre('save') hook re-hashes it
      existing.role = 'admin';
      existing.is_verified = true;
      await existing.save();
      console.log(
        `✅ Admin ${email} synced from env (name + password reset to ADMIN_SEED_* values).`,
      );
      return;
    }

    await User.create({
      name,
      email,
      password,
      role: 'admin',
      auth_source: 'email',
      is_verified: true,
      status: 'in-progress',
    });

    console.log(`✅ Admin user created: ${email}`);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    await mongoose.connection.close();
  }
};

run();

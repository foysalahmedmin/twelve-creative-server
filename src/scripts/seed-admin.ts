/**
 * Seed the first admin user.
 *
 * Idempotent: re-running won't duplicate or overwrite the existing admin.
 * Reads credentials from env:
 *   ADMIN_SEED_NAME       (default: "Twelve Creative Admin")
 *   ADMIN_SEED_EMAIL      (required)
 *   ADMIN_SEED_PASSWORD   (required)
 *
 * Usage:
 *   pnpm ts-node src/scripts/seed-admin.ts
 */

/* eslint-disable no-console */
import mongoose from 'mongoose';
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

  if (password.length < 6) {
    console.error('❌ ADMIN_SEED_PASSWORD must be at least 6 characters.');
    process.exit(1);
  }

  await initializeDB();

  try {
    const existing = await User.isUserExistByEmail(email);

    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        existing.status = 'in-progress';
        await existing.save();
        console.log(`✅ Promoted existing user ${email} to admin.`);
      } else {
        console.log(`ℹ️  Admin ${email} already exists. No changes.`);
      }
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

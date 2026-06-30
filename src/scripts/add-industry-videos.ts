/**
 * One-off, idempotent patch: give the four seeded industries a promo video.
 *
 * The industry seed historically shipped a `thumbnail` but no `video`, so the
 * public /industries listing falls back to the still image. This sets the
 * shared sample video on each seeded industry — but ONLY where `video` is
 * still missing, so any real video configured in the admin panel is preserved.
 *
 * Run:  npm run patch:industry-videos
 * Safe to run multiple times.
 */

import { disconnectDB, initializeDB } from '../config/db';
import { Industry } from '../modules/industry/industry.model';

const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const SLUGS = ['hospitality', 'real-estate', 'aviation', 'professional-services'];

async function run(): Promise<void> {
  await initializeDB();

  try {
    for (const slug of SLUGS) {
      const res = await Industry.updateOne(
        {
          slug,
          $or: [{ video: { $exists: false } }, { video: null }],
        },
        {
          $set: { video: { source: 'url', value: SAMPLE_VIDEO } },
        },
      );
      const status =
        res.matchedCount === 0
          ? 'skipped (already has a video or slug not found)'
          : res.modifiedCount > 0
            ? 'video added ✅'
            : 'no change';
      console.log(`  ${slug.padEnd(24)} ${status}`);
    }
    console.log('\n✨ Done.');
  } catch (err) {
    console.error('❌ Patch failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();

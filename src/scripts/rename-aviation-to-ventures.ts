/**
 * One-off, idempotent patch: renames the "Aviation" Industry to "Ventures"
 * (name + slug only — icon, headline, description, tagline, work[] are left
 * as-is) and re-sequences the four canonical industries to display order:
 * Real Estate, Hospitality, Ventures, Professional Services.
 *
 * Safe to re-run — every write is a targeted, idempotent $set by slug.
 *
 * Usage:
 *   pnpm build && node dist/scripts/rename-aviation-to-ventures.js
 */

/* eslint-disable no-console */
import { disconnectDB, initializeDB } from '../config/db';
import { Industry } from '../modules/industry/industry.model';

const ORDER: Record<string, number> = {
  'real-estate': 1,
  hospitality: 2,
  ventures: 3,
  'professional-services': 4,
};

async function run(): Promise<void> {
  await initializeDB();

  try {
    const renamed = await Industry.updateOne(
      { slug: 'aviation' },
      { $set: { name: 'Ventures', slug: 'ventures' } },
    );
    console.log(
      renamed.matchedCount
        ? `✅ Renamed Aviation -> Ventures (modified: ${renamed.modifiedCount})`
        : 'ℹ️  No "aviation" slug found (already renamed, or not seeded yet).',
    );

    for (const [slug, order] of Object.entries(ORDER)) {
      const res = await Industry.updateOne({ slug }, { $set: { order } });
      console.log(
        `  ${slug.padEnd(24)} order -> ${order}  (matched: ${res.matchedCount}, modified: ${res.modifiedCount})`,
      );
    }

    console.log('\nFinal state:');
    const docs = await Industry.find({}, { slug: 1, name: 1, order: 1 })
      .sort({ order: 1 })
      .lean();
    for (const d of docs) {
      console.log(`  order=${d.order}  slug=${d.slug.padEnd(24)} name=${d.name}`);
    }
  } finally {
    await disconnectDB();
  }
}

run().catch((error: unknown) => {
  console.error('❌ Migration failed:', error);
  process.exitCode = 1;
});

/**
 * One-off, idempotent patch: the Difference section's image was removed
 * (admin panel + backend + frontend no longer support it). Unsets the two
 * now-schema-invalid fields left over on already-seeded live documents:
 *   - sharedsections(key=difference).content.media
 *   - sitesettings.how_we_structure_image
 *
 * Safe to re-run — each $unset is a no-op once the field is already gone.
 *
 * Usage:
 *   pnpm build && node dist/scripts/remove-difference-image.js
 */

/* eslint-disable no-console */
import { disconnectDB, initializeDB } from '../config/db';
import { SharedSection } from '../modules/shared-section/shared-section.model';
import { SiteSetting } from '../modules/site-setting/site-setting.model';

async function run(): Promise<void> {
  await initializeDB();

  try {
    // Use the raw driver collection, not the Mongoose model: `content.media`
    // and `how_we_structure_image` were just removed from their schemas, so
    // schema-aware update casting (strict: 'throw') would refuse to touch a
    // path it no longer recognizes — even to unset it.
    const diffResult = await SharedSection.collection.updateOne(
      { key: 'difference' },
      { $unset: { 'content.media': '' } },
    );
    console.log(
      `sharedsections(difference).content.media unset — matched: ${diffResult.matchedCount}, modified: ${diffResult.modifiedCount}`,
    );

    const settingResult = await SiteSetting.collection.updateMany(
      {},
      { $unset: { how_we_structure_image: '' } },
    );
    console.log(
      `sitesettings.how_we_structure_image unset — matched: ${settingResult.matchedCount}, modified: ${settingResult.modifiedCount}`,
    );
  } finally {
    await disconnectDB();
  }
}

run().catch((error: unknown) => {
  console.error('❌ Patch failed:', error);
  process.exitCode = 1;
});

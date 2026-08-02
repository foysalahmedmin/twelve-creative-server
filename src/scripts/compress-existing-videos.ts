/* eslint-disable no-console */
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import config from '../config';
import { File } from '../modules/file/file.model';
import { compressInPlace } from '../utils/video-compression';

/**
 * One-off pass that applies the upload pipeline's compression to videos that
 * were uploaded before it existed.
 *
 * Automatic compression only runs on new uploads, so anything already on disk
 * kept whatever bitrate it arrived with — including multi-hundred-megabyte
 * files a phone has to pull down in full before it can show anything.
 *
 * Runs in report-only mode unless called with --apply. Re-runnable: files that
 * are already lean are skipped by the same bitrate check the upload path uses,
 * so a second run is close to a no-op.
 */

const MIN_SIZE_BYTES = 8 * 1024 * 1024;
const APPLY = process.argv.includes('--apply');

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1) + ' MB';

async function main() {
  await mongoose.connect(config.database_url as string);

  const videos = await File.find({ mimetype: 'video/mp4' }).lean();
  console.log(
    `${videos.length} video/mp4 records; ${APPLY ? 'APPLYING' : 'DRY RUN — nothing will be written'}\n`,
  );

  let totalBefore = 0;
  let totalAfter = 0;
  let compressed = 0;
  let skipped = 0;
  let missing = 0;

  for (const video of videos) {
    const filePath = path.join(
      config.upload_dir as string,
      'files',
      video.filename,
    );

    if (!fs.existsSync(filePath)) {
      console.log(`  MISSING  ${video.filename}`);
      missing++;
      continue;
    }

    const before = (await fs.promises.stat(filePath)).size;
    totalBefore += before;

    if (before < MIN_SIZE_BYTES) {
      console.log(
        `  skip     ${video.filename}  ${mb(before)} (under threshold)`,
      );
      totalAfter += before;
      skipped++;
      continue;
    }

    if (!APPLY) {
      console.log(`  would    ${video.filename}  ${mb(before)}`);
      totalAfter += before;
      continue;
    }

    const started = Date.now();
    const newSize = await compressInPlace(filePath);
    const took = ((Date.now() - started) / 1000).toFixed(0);

    if (newSize === null) {
      console.log(
        `  kept     ${video.filename}  ${mb(before)} (already lean, or encode did not help) [${took}s]`,
      );
      totalAfter += before;
      skipped++;
      continue;
    }

    // The stored size is what the admin file list reports; leaving it stale
    // would show the pre-compression figure forever.
    await File.updateOne({ _id: video._id }, { $set: { size: newSize } });
    totalAfter += newSize;
    compressed++;
    const saved = (((before - newSize) / before) * 100).toFixed(0);
    console.log(
      `  OK       ${video.filename}  ${mb(before)} -> ${mb(newSize)}  (-${saved}%) [${took}s]`,
    );
  }

  console.log(
    `\ncompressed ${compressed}, skipped ${skipped}, missing ${missing}`,
  );
  console.log(`total ${mb(totalBefore)} -> ${mb(totalAfter)}`);
  if (totalBefore > 0) {
    console.log(
      `saved ${mb(totalBefore - totalAfter)} (${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0)}%)`,
    );
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('compress-existing-videos failed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});

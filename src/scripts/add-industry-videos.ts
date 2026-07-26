/**
 * One-off, idempotent patch: complete the media fields on seeded Industries.
 *
 * Legacy documents can be missing the detail-page `video` and the dedicated
 * `reel_thumbnail` / `reel_video` used on the home and Core Verticals
 * sections. Null, blank, or incomplete values are treated as missing. Complete
 * media configured in the admin panel is preserved by write-time conditions.
 *
 * Run:  npm run patch:industry-media
 * Safe to run multiple times.
 */

/* eslint-disable no-console */

import { disconnectDB, initializeDB } from '../config/db';
import { Industry } from '../modules/industry/industry.model';
import {
  hasCompleteVideoRef,
  isNonEmptyString,
} from './lib/industry-media-patch';
import {
  INDUSTRY_REEL_MEDIA_SEEDS,
  REQUIRED_INDUSTRY_SLUGS,
} from './seeds/industry-media.seed';

const SAMPLE_VIDEO =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const VIDEO_SOURCES = ['youtube', 'url', 'upload'] as const;

async function run(): Promise<void> {
  await initializeDB();

  try {
    const existingIndustries = await Industry.find({
      slug: { $in: REQUIRED_INDUSTRY_SLUGS },
    })
      .select('_id slug')
      .lean();
    const industryIdsBySlug = new Map(
      existingIndustries.map((industry) => [industry.slug, industry._id]),
    );
    const missingSlugs = REQUIRED_INDUSTRY_SLUGS.filter(
      (slug) => !industryIdsBySlug.has(slug),
    );

    if (missingSlugs.length) {
      throw new Error(
        `Industry media preflight failed; missing Industries: ${missingSlugs.join(', ')}`,
      );
    }

    for (const slug of REQUIRED_INDUSTRY_SLUGS) {
      const industryId = industryIdsBySlug.get(slug)!;
      const activeIndustryFilter = {
        _id: industryId,
        is_deleted: { $ne: true },
      };
      const fields: string[] = [];

      const heroVideoResult = await Industry.updateOne(
        { ...activeIndustryFilter, video: null },
        { $set: { video: { source: 'url', value: SAMPLE_VIDEO } } },
      );
      if (heroVideoResult.modifiedCount > 0) fields.push('video');

      const reelThumbnailResult = await Industry.updateOne(
        { ...activeIndustryFilter, reel_thumbnail: { $not: /\S/ } },
        {
          $set: {
            reel_thumbnail: INDUSTRY_REEL_MEDIA_SEEDS[slug].reel_thumbnail,
          },
        },
      );
      if (reelThumbnailResult.modifiedCount > 0) {
        fields.push('reel_thumbnail');
      }

      const reelVideoResult = await Industry.updateOne(
        {
          ...activeIndustryFilter,
          $or: [
            { 'reel_video.source': { $nin: VIDEO_SOURCES } },
            { 'reel_video.value': { $not: /\S/ } },
          ],
        },
        {
          $set: { reel_video: INDUSTRY_REEL_MEDIA_SEEDS[slug].reel_video },
        },
      );
      if (reelVideoResult.modifiedCount > 0) {
        fields.push('reel_video');
      }

      console.log(
        fields.length
          ? `  ${slug.padEnd(24)} added ${fields.join(', ')} ✅`
          : `  ${slug.padEnd(24)} skipped (media already complete)`,
      );
    }

    const verifiedIndustries = await Industry.find({
      slug: { $in: REQUIRED_INDUSTRY_SLUGS },
    })
      .select('slug reel_thumbnail reel_video')
      .lean();
    const industriesBySlug = new Map(
      verifiedIndustries.map((industry) => [industry.slug, industry]),
    );
    const verificationErrors: string[] = [];

    for (const slug of REQUIRED_INDUSTRY_SLUGS) {
      const industry = industriesBySlug.get(slug);
      if (!industry) {
        verificationErrors.push(`${slug}: Industry not found`);
        continue;
      }
      if (!isNonEmptyString(industry.reel_thumbnail)) {
        verificationErrors.push(`${slug}: reel_thumbnail is missing`);
      }
      if (!hasCompleteVideoRef(industry.reel_video)) {
        verificationErrors.push(`${slug}: reel_video is missing or incomplete`);
      }
    }

    if (verificationErrors.length) {
      throw new Error(
        `Industry media verification failed:\n- ${verificationErrors.join('\n- ')}`,
      );
    }

    console.log('  Verified reel media for all seeded Industries ✅');
    console.log('\n✨ Done.');
  } catch (err) {
    console.error('❌ Patch failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();

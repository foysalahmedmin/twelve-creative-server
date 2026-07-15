/**
 * Scoped Featured Project + Showcase Video reseed.
 *
 * Safe defaults:
 *   node dist/scripts/reseed-industry-media.js --dry-run
 *   node dist/scripts/reseed-industry-media.js --verify-only
 *
 * Destructive apply requires both explicit confirmations:
 *   node dist/scripts/reseed-industry-media.js --apply \
 *     --confirm-db=<database-name> \
 *     --confirm=DELETE_FEATURED_AND_SHOWCASE \
 *     --backup-file=<absolute-path-to-non-empty-backup>
 */

/* eslint-disable no-console */
import { stat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import mongoose, { type ClientSession, Types } from 'mongoose';
import config from '../config/env';
import { disconnectDB } from '../config/db';
import { FeaturedProject } from '../modules/featured-project/featured-project.model';
import { Industry } from '../modules/industry/industry.model';
import { ShowcaseVideo } from '../modules/showcase-video/showcase-video.model';
import { resolveSeedIndustries } from './lib/resolve-industries';
import {
  buildIndustryMediaDocuments,
  FEATURED_PROJECT_SEEDS,
  REQUIRED_INDUSTRY_SLUGS,
  SHOWCASE_VIDEO_SEEDS,
  type IndustryIdMap,
} from './seeds/industry-media.seed';

const APPLY_CONFIRMATION = 'DELETE_FEATURED_AND_SHOWCASE';
const CONTENT_CONFIRMATION = 'REPLACE_CURRENT_MEDIA_CONTENT';
const EXPECTED_FEATURED_COUNT = FEATURED_PROJECT_SEEDS.length;
const EXPECTED_SHOWCASE_COUNT = SHOWCASE_VIDEO_SEEDS.length;

type RawRelatedDocument = {
  _id: Types.ObjectId;
  industry?: unknown;
  aspect?: string;
  order?: number;
};

type ComparableFeaturedProject = {
  title: string;
  aspect: string;
  thumbnail: string;
  video: { source: string; value: string };
  is_active: boolean;
};

type ComparableShowcaseVideo = {
  alt: string;
  aspect: string;
  thumbnail?: string;
  video: { source: string; value: string };
  is_active: boolean;
};

const getArgValue = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
};

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

function assertCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

const validateReplacementDocuments = async (industryIds: IndustryIdMap) => {
  const { featuredProjects, showcaseVideos } =
    buildIndustryMediaDocuments(industryIds);

  await Promise.all([
    ...featuredProjects.map((document) =>
      new FeaturedProject(document).validate(),
    ),
    ...showcaseVideos.map((document) => new ShowcaseVideo(document).validate()),
  ]);

  return { featuredProjects, showcaseVideos };
};

const canonicalRows = (rows: unknown[]): string[] =>
  rows.map((row) => JSON.stringify(row)).sort();

const currentContentMatchesManifest = async (): Promise<boolean> => {
  const [featured, showcase] = await Promise.all([
    FeaturedProject.collection
      .find({})
      .project({
        _id: 0,
        title: 1,
        aspect: 1,
        thumbnail: 1,
        video: 1,
        is_active: 1,
      })
      .toArray() as Promise<ComparableFeaturedProject[]>,
    ShowcaseVideo.collection
      .find({})
      .project({
        _id: 0,
        alt: 1,
        aspect: 1,
        thumbnail: 1,
        video: 1,
        is_active: 1,
      })
      .toArray() as Promise<ComparableShowcaseVideo[]>,
  ]);

  if (featured.length === 0 && showcase.length === 0) return true;

  const expectedFeatured = FEATURED_PROJECT_SEEDS.map(
    ({ industry_slug: _industrySlug, order: _order, ...record }) => record,
  );
  const expectedShowcase = SHOWCASE_VIDEO_SEEDS.map(
    ({ industry_slug: _industrySlug, order: _order, ...record }) => record,
  );

  return (
    JSON.stringify(canonicalRows(featured)) ===
      JSON.stringify(canonicalRows(expectedFeatured)) &&
    JSON.stringify(canonicalRows(showcase)) ===
      JSON.stringify(canonicalRows(expectedShowcase))
  );
};

const requireBackupArtifact = async (): Promise<string> => {
  const backupFile = getArgValue('backup-file');
  assertCondition(backupFile, '--backup-file is required for --apply');
  assertCondition(
    isAbsolute(backupFile),
    '--backup-file must be an absolute path',
  );

  const backupStat = await stat(backupFile);
  assertCondition(backupStat.isFile(), '--backup-file must point to a file');
  assertCondition(backupStat.size > 0, '--backup-file cannot be empty');
  return backupFile;
};

const printManifest = (industryIds: IndustryIdMap): void => {
  console.log('\nReplacement manifest:');
  for (const slug of REQUIRED_INDUSTRY_SLUGS) {
    const featured = FEATURED_PROJECT_SEEDS.filter(
      (item) => item.industry_slug === slug,
    ).length;
    const reels = SHOWCASE_VIDEO_SEEDS.filter(
      (item) => item.industry_slug === slug && item.aspect === 'reel',
    ).length;
    const landscapes = SHOWCASE_VIDEO_SEEDS.filter(
      (item) => item.industry_slug === slug && item.aspect === 'landscape',
    ).length;
    console.log(
      `  ${slug.padEnd(24)} ${String(industryIds.get(slug)).slice(-6)}  featured=${featured}  reels=${reels}  landscape=${landscapes}`,
    );
  }
  console.log(
    `  totals: featured=${EXPECTED_FEATURED_COUNT}, showcase=${EXPECTED_SHOWCASE_COUNT}`,
  );
};

const prepareRelationalIndexes = async (): Promise<void> => {
  // Create the new schema indexes first, then remove only the two known legacy
  // indexes. Avoid syncIndexes(): it can drop unrelated operational indexes.
  // The old full slug index still protects uniqueness while legacy rows are
  // normalised for the new equality-based partial index.
  const deleteFlagBackfill = await Industry.collection.updateMany(
    { is_deleted: { $nin: [true, false] } },
    { $set: { is_deleted: false } },
  );
  if (deleteFlagBackfill.modifiedCount > 0) {
    console.log(
      `  Normalized is_deleted on ${deleteFlagBackfill.modifiedCount} legacy Industry document(s).`,
    );
  }

  await FeaturedProject.createIndexes();
  await ShowcaseVideo.createIndexes();
  await Industry.createIndexes();

  const featuredIndexes = await FeaturedProject.collection.indexes();
  if (featuredIndexes.some((index) => index.name === 'category_1')) {
    await FeaturedProject.collection.dropIndex('category_1');
  }

  const industryIndexes = await Industry.collection.indexes();
  const hasPartialSlugIndex = industryIndexes.some(
    (index) => index.name === 'unique_industry_slug_not_deleted',
  );
  assertCondition(
    hasPartialSlugIndex,
    'Refusing to drop legacy slug_1 before the partial Industry slug index exists',
  );
  if (industryIndexes.some((index) => index.name === 'slug_1')) {
    await Industry.collection.dropIndex('slug_1');
  }
};

const expectedDistribution = (
  seeds: Array<{ industry_slug: string }>,
): Map<string, number> => {
  const result = new Map<string, number>();
  for (const seed of seeds) {
    result.set(seed.industry_slug, (result.get(seed.industry_slug) ?? 0) + 1);
  }
  return result;
};

const verifyDistribution = (
  documents: RawRelatedDocument[],
  industryIds: IndustryIdMap,
  expected: Map<string, number>,
  label: string,
): void => {
  for (const slug of REQUIRED_INDUSTRY_SLUGS) {
    const id = industryIds.get(slug);
    const actual = documents.filter(
      (document) => String(document.industry) === String(id),
    ).length;
    assertCondition(
      actual === (expected.get(slug) ?? 0),
      `${label} distribution mismatch for ${slug}: expected ${expected.get(slug) ?? 0}, got ${actual}`,
    );
  }
};

const verifyNoDuplicateOrder = (
  documents: RawRelatedDocument[],
  includeAspect: boolean,
  label: string,
): void => {
  const keys = new Set<string>();
  for (const document of documents) {
    const key = includeAspect
      ? `${String(document.industry)}:${document.aspect}:${document.order}`
      : `${String(document.industry)}:${document.order}`;
    assertCondition(
      !keys.has(key),
      `${label} has duplicate scoped order ${key}`,
    );
    keys.add(key);
  }
};

const verifyRelationalData = async (
  industryIds: IndustryIdMap,
  session?: ClientSession,
): Promise<{ featuredCount: number; showcaseCount: number }> => {
  const options = session ? { session } : {};
  // Keep operations sequential: MongoDB does not support parallel operations
  // sharing one transaction/session.
  const featured = (await FeaturedProject.collection
    .find({}, options)
    .project({ industry: 1, order: 1 })
    .toArray()) as RawRelatedDocument[];
  const showcase = (await ShowcaseVideo.collection
    .find({}, options)
    .project({ industry: 1, aspect: 1, order: 1 })
    .toArray()) as RawRelatedDocument[];
  const categoryCount = await FeaturedProject.collection.countDocuments(
    { category: { $exists: true } },
    options,
  );

  assertCondition(
    featured.length === EXPECTED_FEATURED_COUNT,
    `Expected ${EXPECTED_FEATURED_COUNT} Featured Projects, found ${featured.length}`,
  );
  assertCondition(
    showcase.length === EXPECTED_SHOWCASE_COUNT,
    `Expected ${EXPECTED_SHOWCASE_COUNT} Showcase Videos, found ${showcase.length}`,
  );
  assertCondition(
    categoryCount === 0,
    `Found ${categoryCount} Featured Project document(s) with legacy category`,
  );

  const related = [...featured, ...showcase];
  assertCondition(
    related.every((document) => document.industry instanceof Types.ObjectId),
    'Every related document must store industry as a BSON ObjectId',
  );

  const referencedIds = [
    ...new Set(related.map((item) => String(item.industry))),
  ];
  const validIndustries = await Industry.collection.countDocuments(
    {
      _id: { $in: referencedIds.map((id) => new Types.ObjectId(id)) },
      is_deleted: { $ne: true },
    },
    options,
  );
  assertCondition(
    validIndustries === referencedIds.length,
    'One or more media records reference a missing/deleted Industry',
  );

  verifyDistribution(
    featured,
    industryIds,
    expectedDistribution(FEATURED_PROJECT_SEEDS),
    'Featured Project',
  );
  verifyDistribution(
    showcase,
    industryIds,
    expectedDistribution(SHOWCASE_VIDEO_SEEDS),
    'Showcase Video',
  );
  verifyNoDuplicateOrder(featured, false, 'Featured Project');
  verifyNoDuplicateOrder(showcase, true, 'Showcase Video');

  return {
    featuredCount: featured.length,
    showcaseCount: showcase.length,
  };
};

const verifyDatabase = async (industryIds: IndustryIdMap): Promise<void> => {
  const [
    { featuredCount, showcaseCount },
    featuredIndexes,
    showcaseIndexes,
    industryIndexes,
    industriesWithInvalidDeleteFlag,
  ] = await Promise.all([
    verifyRelationalData(industryIds),
    FeaturedProject.collection.indexes(),
    ShowcaseVideo.collection.indexes(),
    Industry.collection.indexes(),
    Industry.collection.countDocuments({
      is_deleted: { $nin: [true, false] },
    }),
  ]);

  assertCondition(
    !featuredIndexes.some((index) => index.name === 'category_1'),
    'Legacy Featured Project category_1 index still exists',
  );
  assertCondition(
    featuredIndexes.some(
      (index) =>
        JSON.stringify(index.key) ===
        JSON.stringify({ industry: 1, is_active: 1, order: 1 }),
    ),
    'Featured Project relational index is missing',
  );
  assertCondition(
    showcaseIndexes.some(
      (index) =>
        JSON.stringify(index.key) ===
        JSON.stringify({ industry: 1, aspect: 1, is_active: 1, order: 1 }),
    ),
    'Showcase Video relational index is missing',
  );
  assertCondition(
    !industryIndexes.some((index) => index.name === 'slug_1'),
    'Legacy full Industry slug_1 index still exists',
  );
  assertCondition(
    industryIndexes.some((index) => {
      if (index.name !== 'unique_industry_slug_not_deleted') return false;
      const partial = index.partialFilterExpression as
        | Record<string, unknown>
        | undefined;
      return partial?.is_deleted === false;
    }),
    'Partial Industry slug index is missing',
  );
  assertCondition(
    industriesWithInvalidDeleteFlag === 0,
    `${industriesWithInvalidDeleteFlag} Industry document(s) have a missing or non-boolean is_deleted`,
  );

  console.log('\n✅ Verification passed');
  console.log(`  Featured Projects: ${featuredCount}`);
  console.log(`  Showcase Videos:   ${showcaseCount}`);
  console.log('  Legacy category:   0');
  console.log('  Missing relations: 0');
};

const applyReseed = async (): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(
      async () => {
        const industryIds = await resolveSeedIndustries({ session });
        const { featuredProjects, showcaseVideos } =
          await validateReplacementDocuments(industryIds);

        await FeaturedProject.deleteMany({}, { session });
        await ShowcaseVideo.deleteMany({}, { session });
        await FeaturedProject.insertMany(featuredProjects, { session });
        await ShowcaseVideo.insertMany(showcaseVideos, { session });

        // All data invariants are checked against the transaction snapshot;
        // any mismatch throws before commit and rolls the replacement back.
        await verifyRelationalData(industryIds, session);
      },
      {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        readPreference: 'primary',
      },
    );
  } finally {
    await session.endSession();
  }
};

const run = async (): Promise<void> => {
  const apply = hasFlag('apply');
  const verifyOnly = hasFlag('verify-only');
  const dryRun = hasFlag('dry-run');
  assertCondition(
    [apply, verifyOnly, dryRun].filter(Boolean).length <= 1,
    'Choose at most one mode flag: --dry-run, --verify-only, or --apply',
  );

  // Keep dry-run and verification modes genuinely read-only. This script
  // creates/drops only its explicitly approved indexes after apply guards.
  assertCondition(config.database_url, 'DATABASE_URL is missing in config/env');
  await mongoose.connect(config.database_url, {
    autoIndex: false,
    autoCreate: false,
  });
  try {
    const databaseName = mongoose.connection.name;
    console.log('\nIndustry media reseed');
    console.log(`  environment: ${config.node_env || 'unknown'}`);
    console.log(`  database:    ${databaseName}`);
    console.log(
      `  mode:        ${apply ? 'APPLY' : verifyOnly ? 'VERIFY' : 'DRY RUN'}`,
    );

    const industryIds = await resolveSeedIndustries();

    if (verifyOnly) {
      await verifyDatabase(industryIds);
      return;
    }

    await validateReplacementDocuments(industryIds);
    const [
      currentFeatured,
      currentShowcase,
      featuredWithIndustry,
      showcaseWithIndustry,
      featuredWithLegacyCategory,
      contentMatchesManifest,
    ] = await Promise.all([
      FeaturedProject.collection.countDocuments({}),
      ShowcaseVideo.collection.countDocuments({}),
      FeaturedProject.collection.countDocuments({
        industry: { $type: 'objectId' },
      }),
      ShowcaseVideo.collection.countDocuments({
        industry: { $type: 'objectId' },
      }),
      FeaturedProject.collection.countDocuments({
        category: { $exists: true },
      }),
      currentContentMatchesManifest(),
    ]);
    const industriesWithInvalidDeleteFlag =
      await Industry.collection.countDocuments({
        is_deleted: { $nin: [true, false] },
      });
    console.log('\nCurrent collection counts:');
    console.log(`  Featured Projects: ${currentFeatured}`);
    console.log(`  Showcase Videos:   ${currentShowcase}`);
    console.log(
      `  Featured Industry refs: ${featuredWithIndustry}/${currentFeatured}`,
    );
    console.log(
      `  Showcase Industry refs: ${showcaseWithIndustry}/${currentShowcase}`,
    );
    console.log(
      `  Featured legacy category docs: ${featuredWithLegacyCategory}`,
    );
    console.log(
      `  Industry flags to normalize on apply: ${industriesWithInvalidDeleteFlag}`,
    );
    console.log(
      `  Existing media content matches manifest: ${contentMatchesManifest ? 'yes' : 'NO'}`,
    );
    printManifest(industryIds);

    if (!apply) {
      console.log('\n🔎 Dry run complete. No database writes were made.');
      return;
    }

    const confirmedDatabase = getArgValue('confirm-db');
    const confirmation = getArgValue('confirm');
    assertCondition(
      confirmedDatabase === databaseName,
      `--confirm-db must exactly match "${databaseName}"`,
    );
    assertCondition(
      confirmation === APPLY_CONFIRMATION,
      `--confirm must equal ${APPLY_CONFIRMATION}`,
    );
    if (!contentMatchesManifest) {
      assertCondition(
        getArgValue('confirm-content') === CONTENT_CONFIRMATION,
        `Existing media differs from the manifest; --confirm-content must equal ${CONTENT_CONFIRMATION}`,
      );
    }
    const backupFile = await requireBackupArtifact();

    console.log('\n⚠️  Applying scoped transactional replacement...');
    console.log(`  Verified backup artifact: ${backupFile}`);
    await prepareRelationalIndexes();
    await applyReseed();
    const finalIndustryIds = await resolveSeedIndustries();
    await verifyDatabase(finalIndustryIds);
    console.log('\n✨ Scoped reseed committed successfully.');
  } finally {
    await disconnectDB();
  }
};

run().catch((error: unknown) => {
  console.error('\n❌ Industry media reseed failed:', error);
  process.exitCode = 1;
});

/**
 * Initial content seed for the Twelve Creative database.
 *
 * Populates every module that drives a public-facing surface so the site
 * never renders empty in a demo or fresh-launch scenario. Content mirrors
 * the static seed data the frontend used pre-backend (testimonials, videos,
 * works, brands, FAQs, team) plus 3 launch-ready Insight articles + the
 * site contact/socials singleton.
 *
 * Idempotent — by default each module is skipped if it already has any
 * non-deleted document. Pass `--force` to clear and reseed every module.
 *
 * Usage:
 *   pnpm seed:initial            # safe — only seeds empty modules
 *   pnpm seed:initial --force    # destructive — clears + reseeds everything
 *   pnpm build && pnpm seed:initial:prod # production install/runtime
 *
 * Does NOT seed: users (use pnpm seed:admin), bookings, contact-messages
 * (those are user-submitted and should start empty).
 */

/* eslint-disable no-console */
import { disconnectDB, initializeDB } from '../../config/db';
import { Brand } from '../../modules/brand/brand.model';
import { Faq } from '../../modules/faq/faq.model';
import { FeaturedProject } from '../../modules/featured-project/featured-project.model';
import { Industry } from '../../modules/industry/industry.model';
import { Insight } from '../../modules/insight/insight.model';
import { Service } from '../../modules/service/service.model';
import { ShowcaseVideo } from '../../modules/showcase-video/showcase-video.model';
import { PageHero } from '../../modules/page-hero/page-hero.model';
import { SiteSetting } from '../../modules/site-setting/site-setting.model';
import { TeamMember } from '../../modules/team-member/team-member.model';
import { Testimonial } from '../../modules/testimonial/testimonial.model';
import { Work } from '../../modules/work/work.model';
import { resolveSeedIndustries } from '../lib/resolve-industries';
import { buildIndustryMediaDocuments } from './industry-media.seed';
import {
  attachIndustriesToTestimonials,
  attachIndustriesToWorks,
  backfillIndustryContentRelations,
} from './industry-content.seed';
import { seedBookingSetting } from './booking-setting.seed';
import { seedContactSetting } from './contact-setting.seed';
import { seedProcessSection } from './process-section.seed';
import { seedAboutPage } from './about-page.seed';
import { seedLegalPages } from './legal-page.seed';
import { migrateLegacySiteSettingContent } from './legacy-content-migration.seed';
import { seedPageCtas } from './page-cta.seed';
import { seedSharedSections } from './shared-section.seed';
import { AboutPage } from '../../modules/about-page/about-page.model';

import { BRAND_SEED } from './brand.seed';
import { FAQ_SEED } from './faq.seed';
import { INDUSTRY_SEED } from './industry.seed';
import { INSIGHT_SEED } from './insight.seed';
import { PAGE_HERO_SEED } from './page-hero.seed';
import { SERVICE_SEED } from './service.seed';
import { SITE_SETTING_SEED } from './site-setting.seed';
import { TEAM_MEMBER_SEED } from './team-member.seed';
import { TESTIMONIAL_SEED } from './testimonial.seed';
import { WORK_SEED } from './work.seed';

const FORCE = process.argv.includes('--force');

async function seedPageHeroes(): Promise<SeedReport> {
  const existing = await PageHero.countDocuments();
  if (FORCE) await PageHero.deleteMany({});

  let inserted = 0;
  let updated = 0;
  for (const doc of PAGE_HERO_SEED) {
    const current = FORCE
      ? null
      : await PageHero.findOne({ page: doc.page }).lean();
    if (!current) {
      await PageHero.create(doc);
      inserted += 1;
      continue;
    }

    const missingFields = buildMissingSeedFields(
      current as unknown as Record<string, unknown>,
      doc as unknown as Record<string, unknown>,
    );
    if (Object.keys(missingFields).length) {
      await PageHero.updateOne({ _id: current._id }, { $set: missingFields });
      updated += 1;
    }
  }

  return {
    module: 'page-hero',
    action: FORCE
      ? existing
        ? 'replaced'
        : 'inserted'
      : updated
        ? 'updated'
        : inserted
          ? 'inserted'
          : 'skipped',
    count: FORCE ? PAGE_HERO_SEED.length : inserted + updated,
  };
}

// ─── Runner ──────────────────────────────────────────────────────────────────

interface SeedReport {
  module: string;
  action: 'inserted' | 'skipped' | 'replaced' | 'updated';
  count: number;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof Date);

/** Returns Mongo dot-paths that are absent from an existing document. */
function buildMissingSeedFields(
  current: Record<string, unknown>,
  defaults: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const currentValue = current[key];
    if (currentValue === undefined) {
      fields[path] = defaultValue;
      continue;
    }
    if (isPlainObject(defaultValue) && isPlainObject(currentValue)) {
      Object.assign(
        fields,
        buildMissingSeedFields(currentValue, defaultValue, path),
      );
    }
  }

  return fields;
}

async function seedModule<T>(
  name: string,
  model: {
    countDocuments: (filter: object) => { exec: () => Promise<number> };
    deleteMany: (filter: object) => Promise<unknown>;
    insertMany: (docs: T[]) => Promise<unknown[]>;
  },
  docs: T[],
): Promise<SeedReport> {
  const existing = await model
    .countDocuments({ is_deleted: { $ne: true } })
    .exec();

  if (existing > 0 && !FORCE) {
    return { module: name, action: 'skipped', count: existing };
  }

  if (FORCE) {
    await model.deleteMany({});
  }

  await model.insertMany(docs);
  return {
    module: name,
    action: FORCE && existing > 0 ? 'replaced' : 'inserted',
    count: docs.length,
  };
}

/**
 * Industry is the parent taxonomy for several seeded modules. In safe mode,
 * insert any missing canonical slug individually instead of skipping the
 * entire collection because one administrator-created Industry exists.
 */
async function seedIndustries(): Promise<SeedReport> {
  if (FORCE) return await seedModule('industry', Industry, INDUSTRY_SEED);

  const existing = await Industry.find({
    slug: { $in: INDUSTRY_SEED.map((industry) => industry.slug) },
  })
    .select('slug -_id')
    .lean();
  const existingSlugs = new Set(existing.map((industry) => industry.slug));
  const missing = INDUSTRY_SEED.filter(
    (industry) => !existingSlugs.has(industry.slug),
  );

  if (!missing.length) {
    return { module: 'industry', action: 'skipped', count: existing.length };
  }

  await Industry.insertMany(missing);
  return { module: 'industry', action: 'inserted', count: missing.length };
}

async function seedSiteSetting(): Promise<SeedReport> {
  const existing = await SiteSetting.findOne();

  if (existing && !FORCE) {
    const missingFields = buildMissingSeedFields(
      existing.toObject() as unknown as Record<string, unknown>,
      SITE_SETTING_SEED as unknown as Record<string, unknown>,
    );
    if (!Object.keys(missingFields).length) {
      return { module: 'site-setting', action: 'skipped', count: 0 };
    }
    await SiteSetting.updateOne({ _id: existing._id }, { $set: missingFields });
    return { module: 'site-setting', action: 'updated', count: 1 };
  }

  if (existing && FORCE) {
    await SiteSetting.deleteMany({});
  }

  await SiteSetting.create(SITE_SETTING_SEED);
  return {
    module: 'site-setting',
    action: existing ? 'replaced' : 'inserted',
    count: 1,
  };
}

async function run(): Promise<void> {
  console.log(
    FORCE
      ? '⚠️  --force enabled — existing data in each module will be replaced.'
      : 'ℹ️  Safe mode — modules with existing data will be skipped (use --force to override).',
  );

  await initializeDB();

  try {
    const reports: SeedReport[] = [];

    // Insights use save() hooks (read_minutes, published_at) — can't use insertMany for them.
    const insightCount = await Insight.countDocuments({
      is_deleted: { $ne: true },
    });
    if (insightCount > 0 && !FORCE) {
      reports.push({
        module: 'insight',
        action: 'skipped',
        count: insightCount,
      });
    } else {
      if (FORCE) await Insight.deleteMany({});
      for (const doc of INSIGHT_SEED) {
        await Insight.create(doc);
      }
      reports.push({
        module: 'insight',
        action: FORCE && insightCount > 0 ? 'replaced' : 'inserted',
        count: INSIGHT_SEED.length,
      });
    }

    reports.push(await seedModule('service', Service, SERVICE_SEED));

    // Industries are the canonical parent for Featured Projects and Showcase
    // Videos. Resolve their stable slugs only after the Industry seed has run,
    // then build dependent documents with real ObjectId references.
    reports.push(await seedIndustries());
    // An administrator may intentionally keep a canonical Industry inactive.
    // Relationships still need the stable parent id; public queries enforce
    // active-parent visibility independently.
    const industryIds = await resolveSeedIndustries({ requireActive: false });
    if (!FORCE) {
      const relationReport =
        await backfillIndustryContentRelations(industryIds);
      reports.push({
        module: 'industry-relations',
        action:
          relationReport.testimonialCount + relationReport.workCount > 0
            ? 'updated'
            : 'skipped',
        count: relationReport.testimonialCount + relationReport.workCount,
      });
    }
    reports.push(
      await seedModule(
        'testimonial',
        Testimonial,
        attachIndustriesToTestimonials(TESTIMONIAL_SEED, industryIds),
      ),
    );
    const { featuredProjects, showcaseVideos } =
      buildIndustryMediaDocuments(industryIds);
    reports.push(
      await seedModule('featured-project', FeaturedProject, featuredProjects),
    );
    reports.push(
      await seedModule('showcase-video', ShowcaseVideo, showcaseVideos),
    );

    reports.push(await seedModule('brand', Brand, BRAND_SEED));
    reports.push(await seedModule('faq', Faq, FAQ_SEED));
    reports.push(await seedModule('team-member', TeamMember, TEAM_MEMBER_SEED));
    reports.push(
      await seedModule(
        'work',
        Work,
        attachIndustriesToWorks(WORK_SEED, industryIds),
      ),
    );
    reports.push(await seedPageHeroes());
    reports.push(await seedSiteSetting());
    reports.push(await seedProcessSection(FORCE));
    reports.push(await seedBookingSetting(FORCE));
    reports.push(await seedContactSetting(FORCE));
    reports.push(await seedPageCtas(FORCE));

    const existingAbout = FORCE ? true : await AboutPage.exists({});
    reports.push(await seedSharedSections(FORCE));
    reports.push(await seedAboutPage(FORCE));
    if (!FORCE) {
      const migratedLegacyContent = await migrateLegacySiteSettingContent({
        aboutWasMissing: !existingAbout,
      });
      reports.push({
        module: 'legacy-content',
        action: migratedLegacyContent ? 'updated' : 'skipped',
        count: migratedLegacyContent,
      });
    }
    reports.push(await seedLegalPages(FORCE));

    console.log('\n📊 Seed report:');
    for (const r of reports) {
      const icon =
        r.action === 'inserted'
          ? '✅'
          : r.action === 'replaced'
            ? '♻️ '
            : r.action === 'updated'
              ? '🔄'
              : '⏭️ ';
      console.log(
        `  ${icon} ${r.module.padEnd(20)} ${r.action.padEnd(10)} ${r.count} doc(s)`,
      );
    }
    console.log('\n✨ Done.');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run();

/**
 * One-off, idempotent patch: fixes the 5 already-seeded live documents whose
 * short "list all 4 industries by name" copy still says "aviation" — these
 * predate the Aviation -> Ventures rename (src/scripts/rename-aviation-to-ventures.ts)
 * and are untouched by re-running the safe seed (it only fills UNDEFINED
 * fields, never overwrites existing ones).
 *
 * Does a targeted case-preserving word substitution on the CURRENT live value
 * of each field (not an overwrite from seed source), so any unrelated admin
 * edits to that same field (e.g. a changed city in the contact copy) survive.
 *
 * Safe to re-run — a no-op once "aviation" no longer appears in these fields.
 *
 * Usage:
 *   pnpm build && node dist/scripts/patch-aviation-copy-to-ventures.js
 */

/* eslint-disable no-console */
import { disconnectDB, initializeDB } from '../config/db';
import { AboutPage } from '../modules/about-page/about-page.model';
import { PageCta } from '../modules/page-cta/page-cta.model';
import { PageHero } from '../modules/page-hero/page-hero.model';
import { SiteSetting } from '../modules/site-setting/site-setting.model';

const swap = (text: string): string =>
  text.replace(/aviation/g, 'ventures').replace(/Aviation/g, 'Ventures');

async function run(): Promise<void> {
  await initializeDB();
  let patched = 0;

  try {
    // PageHero(industries).seo.description
    const industriesHero = await PageHero.findOne({ page: 'industries' });
    if (industriesHero?.seo?.description?.includes('aviation')) {
      const before = industriesHero.seo.description;
      industriesHero.seo.description = swap(before);
      await industriesHero.save();
      patched++;
      console.log(`✅ pageheroes(industries).seo.description\n   ${before}\n-> ${industriesHero.seo.description}`);
    } else {
      console.log('ℹ️  pageheroes(industries).seo.description already clean');
    }

    // PageHero(blogs).description
    const blogsHero = await PageHero.findOne({ page: 'blogs' });
    if (blogsHero?.description?.includes('aviation')) {
      const before = blogsHero.description;
      blogsHero.description = swap(before);
      await blogsHero.save();
      patched++;
      console.log(`✅ pageheroes(blogs).description\n   ${before}\n-> ${blogsHero.description}`);
    } else {
      console.log('ℹ️  pageheroes(blogs).description already clean');
    }

    // SiteSetting.contact_page.map.description
    const settings = await SiteSetting.findOne();
    const map = settings?.contact_page?.map;
    if (settings && map?.description?.includes('aviation')) {
      const before = map.description;
      map.description = swap(before);
      await settings.save();
      patched++;
      console.log(`✅ sitesettings.contact_page.map.description\n   ${before}\n-> ${map.description}`);
    } else {
      console.log('ℹ️  sitesettings.contact_page.map.description already clean');
    }

    // PageCta(industries).description
    const industriesCta = await PageCta.findOne({
      placement: 'industries',
      industry: null,
    });
    if (industriesCta?.description?.includes('aviation')) {
      const before = industriesCta.description;
      industriesCta.description = swap(before);
      await industriesCta.save();
      patched++;
      console.log(`✅ pagectas(industries).description\n   ${before}\n-> ${industriesCta.description}`);
    } else {
      console.log('ℹ️  pagectas(industries).description already clean');
    }

    // AboutPage.story_cards[id=business-logic].description
    const about = await AboutPage.findOne();
    const card = about?.story_cards?.find((c) => c.id === 'business-logic');
    if (about && card?.description?.includes('aviation')) {
      const before = card.description;
      card.description = swap(before);
      await about.save();
      patched++;
      console.log(`✅ aboutpages.story_cards[business-logic].description\n   ${before}\n-> ${card.description}`);
    } else {
      console.log('ℹ️  aboutpages.story_cards[business-logic].description already clean');
    }

    console.log(`\n${patched} field(s) patched.`);
  } finally {
    await disconnectDB();
  }
}

run().catch((error: unknown) => {
  console.error('❌ Patch failed:', error);
  process.exitCode = 1;
});

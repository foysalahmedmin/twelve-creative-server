import { AboutPage } from '../../modules/about-page/about-page.model';
import { isSafeImageReference } from '../../modules/cms-content/cms-content.security';
import { SiteSetting } from '../../modules/site-setting/site-setting.model';

type LegacySiteSettingContent = {
  meeting_scene_image?: unknown;
  content_section?: {
    title?: unknown;
    subtitle?: unknown;
    body?: unknown;
    image?: unknown;
  };
};

const cleanText = (value: unknown, maximum: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= maximum ? cleaned : undefined;
};

const cleanImage = (value: unknown): string | undefined => {
  const cleaned = cleanText(value, 2048);
  return cleaned && isSafeImageReference(cleaned) ? cleaned : undefined;
};

export const buildLegacyContentMigration = (
  setting: LegacySiteSettingContent | null,
): {
  about: Record<string, unknown>;
} => {
  const about: Record<string, unknown> = {};
  if (!setting) return { about };

  const founderImage = cleanImage(setting.meeting_scene_image);
  if (founderImage) {
    about['founder.media'] = { type: 'image', image: founderImage };
  }

  const story = setting.content_section;
  const storyLabel = cleanText(story?.subtitle, 100);
  const storyTitle = cleanText(story?.title, 300);
  const storyDescription = cleanText(story?.body, 1200);
  const storyImage = cleanImage(story?.image);
  if (storyLabel) about['story_section.label'] = storyLabel;
  if (storyTitle) about['story_section.title'] = storyTitle;
  if (storyDescription) {
    about['story_section.description'] = storyDescription;
  }
  if (storyImage) {
    about['story_cards.0.media'] = { type: 'image', image: storyImage };
  }

  return { about };
};

export const migrateLegacySiteSettingContent = async (options: {
  aboutWasMissing: boolean;
}): Promise<number> => {
  if (!options.aboutWasMissing) return 0;

  const setting =
    (await SiteSetting.findOne().lean()) as LegacySiteSettingContent | null;
  const updates = buildLegacyContentMigration(setting);
  let changed = 0;

  if (options.aboutWasMissing && Object.keys(updates.about).length) {
    const result = await AboutPage.updateOne(
      {},
      { $set: updates.about },
      { runValidators: true },
    );
    changed += result.modifiedCount;
  }

  return changed;
};

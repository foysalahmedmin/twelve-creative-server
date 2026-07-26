import { buildLegacyContentMigration } from '../seeds/legacy-content-migration.seed';

describe('legacy SiteSetting content migration', () => {
  it('maps reviewed legacy media and story copy into the new owners', () => {
    expect(
      buildLegacyContentMigration({
        how_we_structure_image: '/uploads/difference.webp',
        meeting_scene_image: 'https://cdn.example.com/founder.webp',
        content_section: {
          subtitle: 'Our Story',
          title: 'Merging Art and Science',
          body: 'A connected creative and growth practice.',
          image: '/uploads/story.webp',
        },
      }),
    ).toEqual({
      difference: {
        'content.media': {
          type: 'image',
          image: '/uploads/difference.webp',
        },
      },
      about: {
        'founder.media': {
          type: 'image',
          image: 'https://cdn.example.com/founder.webp',
        },
        'story_section.label': 'Our Story',
        'story_section.title': 'Merging Art and Science',
        'story_section.description':
          'A connected creative and growth practice.',
        'story_cards.0.media': {
          type: 'image',
          image: '/uploads/story.webp',
        },
      },
    });
  });

  it('does not propagate unsafe legacy image references', () => {
    const result = buildLegacyContentMigration({
      how_we_structure_image: 'javascript:alert(1)',
      meeting_scene_image: '//evil.example/founder.jpg',
      content_section: { image: '/uploads/../private.txt' },
    });

    expect(result).toEqual({ difference: {}, about: {} });
  });
});

import { FeaturedProject } from '../featured-project.model';

const validProject = {
  title: 'Hospitality launch film',
  industry: '507f1f77bcf86cd799439011',
  aspect: 'reel' as const,
  thumbnail: '/uploads/images/hospitality-film.webp',
  video: {
    source: 'url' as const,
    value: 'https://media.example.com/hospitality-film.mp4',
  },
};

describe('FeaturedProject media model', () => {
  it('accepts safe renderable media', async () => {
    await expect(
      new FeaturedProject(validProject).validate(),
    ).resolves.toBeUndefined();
  });

  it('rejects unsafe media at the persistence boundary', async () => {
    const project = new FeaturedProject({
      ...validProject,
      thumbnail: 'javascript:alert(1)',
      video: {
        source: 'youtube',
        value: 'https://www.youtube.com/',
      },
    });

    await expect(project.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({
        thumbnail: expect.anything(),
        'video.value': expect.anything(),
      }),
    });
  });

  it('bounds stored media references', async () => {
    const project = new FeaturedProject({
      ...validProject,
      thumbnail: `https://images.example.com/${'x'.repeat(2049)}`,
      video: {
        source: 'url',
        value: `https://media.example.com/${'x'.repeat(2049)}`,
      },
    });

    await expect(project.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({
        thumbnail: expect.anything(),
        'video.value': expect.anything(),
      }),
    });
  });
});

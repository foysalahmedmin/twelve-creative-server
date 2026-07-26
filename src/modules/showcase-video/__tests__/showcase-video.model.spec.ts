import { ShowcaseVideo } from '../showcase-video.model';

const validVideo = {
  industry: '507f1f77bcf86cd799439011',
  video: {
    source: 'url' as const,
    value: 'https://media.example.com/showcase.mp4',
  },
  thumbnail: '/uploads/images/showcase.webp',
  alt: 'Hospitality showcase film',
  aspect: 'landscape' as const,
};

describe('ShowcaseVideo media model', () => {
  it('accepts a valid direct video with its thumbnail', async () => {
    await expect(
      new ShowcaseVideo(validVideo).validate(),
    ).resolves.toBeUndefined();
  });

  it('accepts a playable YouTube URL without a custom thumbnail', async () => {
    const video = new ShowcaseVideo({
      ...validVideo,
      thumbnail: undefined,
      video: {
        source: 'youtube',
        value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    });

    await expect(video.validate()).resolves.toBeUndefined();
  });

  it('requires a thumbnail for direct and uploaded videos', async () => {
    const video = new ShowcaseVideo({
      ...validVideo,
      thumbnail: undefined,
    });

    await expect(video.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({ thumbnail: expect.anything() }),
    });
  });

  it('rejects unsafe media at the persistence boundary', async () => {
    const video = new ShowcaseVideo({
      ...validVideo,
      thumbnail: 'javascript:alert(1)',
      video: {
        source: 'url',
        value: 'http://media.example.com/showcase.mp4',
      },
    });

    await expect(video.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({
        thumbnail: expect.anything(),
        'video.value': expect.anything(),
      }),
    });
  });
});

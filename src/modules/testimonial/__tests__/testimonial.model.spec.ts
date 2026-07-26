import { Testimonial } from '../testimonial.model';

const baseTestimonial = {
  industry: '507f1f77bcf86cd799439011',
  name: 'Jordan Lee',
  designation: 'Founder',
  image: '/uploads/testimonials/jordan.jpg',
  category: 'message' as const,
  message: 'A testimonial long enough to be rendered safely.',
};

describe('Testimonial model media invariants', () => {
  it('accepts a complete text testimonial', async () => {
    await expect(
      new Testimonial(baseTestimonial).validate(),
    ).resolves.toBeUndefined();
  });

  it('rejects unsafe image and video references at the model boundary', async () => {
    await expect(
      new Testimonial({
        ...baseTestimonial,
        image: 'javascript:alert(1)',
      }).validate(),
    ).rejects.toMatchObject({ errors: { image: expect.anything() } });

    await expect(
      new Testimonial({
        ...baseTestimonial,
        category: 'video_message',
        message: undefined,
        video_message: {
          source: 'url',
          value: 'http://media.example.com/testimonial.mp4',
        },
        thumbnail: '/uploads/testimonials/poster.jpg',
      }).validate(),
    ).rejects.toMatchObject({
      errors: { 'video_message.value': expect.anything() },
    });
  });

  it('requires a thumbnail for uploaded and direct videos', async () => {
    await expect(
      new Testimonial({
        ...baseTestimonial,
        category: 'video_message',
        message: undefined,
        video_message: {
          source: 'upload',
          value: '/uploads/testimonials/video.mp4',
        },
      }).validate(),
    ).rejects.toMatchObject({ errors: { thumbnail: expect.anything() } });
  });
});

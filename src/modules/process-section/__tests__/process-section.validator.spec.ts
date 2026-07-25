import { updateProcessSectionValidationSchema } from '../process-section.validator';

const body = {
  label: ' Our Process ',
  title: 'A clear path from understanding to execution.',
  description: 'Clarity comes before execution.',
  thumbnail: 'https://example.com/process.jpg',
  process_steps: [
    {
      id: 'step-1',
      index: '01',
      icon: 'understand',
      title: 'Understand the business',
      description: 'Review the offer and current bottlenecks.',
      image: '/uploads/process/understand.jpg',
    },
  ],
};

describe('Process section validation', () => {
  it('accepts complete content, URL/path images, and round-trip indexes', () => {
    const result = updateProcessSectionValidationSchema.safeParse({ body });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.label).toBe('Our Process');
      expect(result.data.body.process_steps[0].index).toBe('01');
    }
  });

  it('requires every section field and at least one step', () => {
    const noThumbnail = {
      ...body,
      thumbnail: undefined,
      process_steps: [],
    };

    expect(
      updateProcessSectionValidationSchema.safeParse({ body: noThumbnail })
        .success,
    ).toBe(false);
  });

  it('limits the section to twelve process steps', () => {
    const tooMany = {
      ...body,
      process_steps: Array.from({ length: 13 }, (_, index) => ({
        ...body.process_steps[0],
        id: `step-${index + 1}`,
      })),
    };

    expect(
      updateProcessSectionValidationSchema.safeParse({ body: tooMany }).success,
    ).toBe(false);
  });

  it('rejects unsafe ids, unsupported icons, and non-web image references', () => {
    const unsafeStep = {
      ...body,
      process_steps: [
        {
          ...body.process_steps[0],
          id: '../unsafe',
          icon: 'unknown',
          image: 'javascript:alert(1)',
        },
      ],
    };

    expect(
      updateProcessSectionValidationSchema.safeParse({ body: unsafeStep })
        .success,
    ).toBe(false);
  });

  it('rejects protocol-relative paths and overlong content', () => {
    expect(
      updateProcessSectionValidationSchema.safeParse({
        body: {
          ...body,
          title: 'x'.repeat(301),
          thumbnail: '//untrusted.example/image.jpg',
        },
      }).success,
    ).toBe(false);
  });

  it.each([
    '/uploads/../secret.jpg',
    '/uploads/%2e%2e/secret.jpg',
    '/uploads\\unsafe.jpg',
    '/uploads/image\0.jpg',
  ])('rejects unsafe root-relative image path %s', (thumbnail) => {
    expect(
      updateProcessSectionValidationSchema.safeParse({
        body: { ...body, thumbnail },
      }).success,
    ).toBe(false);
  });

  it('rejects malformed round-trip indexes instead of trusting them', () => {
    expect(
      updateProcessSectionValidationSchema.safeParse({
        body: {
          ...body,
          process_steps: [{ ...body.process_steps[0], index: '99' }],
        },
      }).success,
    ).toBe(false);
  });
});

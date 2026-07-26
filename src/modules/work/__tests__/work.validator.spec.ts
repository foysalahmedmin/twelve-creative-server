import {
  createWorkValidationSchema,
  reorderWorksValidationSchema,
  updateWorkValidationSchema,
} from '../work.validator';

const INDUSTRY_ID = '507f1f77bcf86cd799439031';
const WORK_ID = '507f1f77bcf86cd799439032';

const body = {
  industry: INDUSTRY_ID,
  slug: 'hospitality-growth',
  type: 'Brand Transformation',
  title: 'Hospitality growth system',
  description: 'A complete hospitality case study.',
  image: '/uploads/hospitality.jpg',
  image_alt: 'Hospitality project',
};

describe('work validation', () => {
  it('requires an Industry on create', () => {
    const { industry: _industry, ...withoutIndustry } = body;
    expect(
      createWorkValidationSchema.safeParse({ body: withoutIndustry }).success,
    ).toBe(false);
    expect(createWorkValidationSchema.safeParse({ body }).success).toBe(true);
  });

  it('supports explicitly clearing optional case-study sections', () => {
    expect(
      updateWorkValidationSchema.safeParse({
        params: { id: WORK_ID },
        body: {
          client: null,
          outcome_video: null,
          testimonial: null,
          outcome_video_thumbnail: null,
        },
      }).success,
    ).toBe(true);
  });

  it('bounds repeatable case-study content', () => {
    expect(
      createWorkValidationSchema.safeParse({
        body: {
          ...body,
          metrics: Array.from({ length: 13 }, (_, index) => ({
            label: `Metric ${index}`,
            value: `${index}`,
          })),
        },
      }).success,
    ).toBe(false);
  });

  it('rejects unsafe image and video references', () => {
    expect(
      createWorkValidationSchema.safeParse({
        body: { ...body, image: 'javascript:alert(1)' },
      }).success,
    ).toBe(false);
    expect(
      updateWorkValidationSchema.safeParse({
        params: { id: WORK_ID },
        body: {
          outcome_video: { source: 'upload', value: '/private/file.mp4' },
        },
      }).success,
    ).toBe(false);
  });

  it('bounds reorder payloads', () => {
    expect(
      reorderWorksValidationSchema.safeParse({
        body: {
          items: Array.from({ length: 101 }, (_, order) => ({
            _id: WORK_ID,
            order,
          })),
        },
      }).success,
    ).toBe(false);
  });
});

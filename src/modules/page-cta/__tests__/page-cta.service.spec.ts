jest.mock('../page-cta.model', () => ({
  PageCta: {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock('../../industry/industry.repository');

import httpStatus from 'http-status';
import * as IndustryRepository from '../../industry/industry.repository';
import { PageCta } from '../page-cta.model';
import * as PageCtaService from '../page-cta.service';

const cta = {
  _id: '507f1f77bcf86cd799439011',
  placement: 'industry-detail' as const,
  industry: null,
  eyebrow: 'Start here',
  title: 'Ready to build?',
  description: 'Tell us what needs to move next.',
  image: '/uploads/images/cta.jpg',
  primary_cta: { label: 'Start', href: '/contact' },
  secondary_cta: null,
  is_active: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-02'),
};

const payload = {
  placement: 'industry-detail' as const,
  industry: '507f1f77bcf86cd799439012',
  title: cta.title,
  description: cta.description,
  image: cta.image,
  primary_cta: cta.primary_cta,
  secondary_cta: null,
  is_active: true,
};

describe('PageCtaService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves an active Industry override before the global default', async () => {
    (IndustryRepository.findBySlugLean as jest.Mock).mockResolvedValue({
      _id: '507f1f77bcf86cd799439012',
      is_active: true,
    });
    const override = { ...cta, industry: '507f1f77bcf86cd799439012' };
    (PageCta.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(override),
    });

    const result = await PageCtaService.getPublicPageCta(
      'industry-detail',
      ' Hospitality ',
    );

    expect(result).toEqual({
      placement: override.placement,
      eyebrow: override.eyebrow,
      title: override.title,
      description: override.description,
      image: override.image,
      primary_cta: override.primary_cta,
      secondary_cta: override.secondary_cta,
    });
    expect(result).not.toHaveProperty('_id');
    expect(result).not.toHaveProperty('industry');
    expect(IndustryRepository.findBySlugLean).toHaveBeenCalledWith(
      'hospitality',
    );
    expect(PageCta.findOne).toHaveBeenCalledWith({
      placement: 'industry-detail',
      industry: '507f1f77bcf86cd799439012',
      is_active: true,
    });
  });

  it('falls back to the global CTA when an override is absent', async () => {
    (IndustryRepository.findBySlugLean as jest.Mock).mockResolvedValue({
      _id: '507f1f77bcf86cd799439012',
      is_active: true,
    });
    (PageCta.findOne as jest.Mock)
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(cta) });

    await expect(
      PageCtaService.getPublicPageCta('industry-detail', 'hospitality'),
    ).resolves.toMatchObject({ title: cta.title });
    expect(PageCta.findOne).toHaveBeenNthCalledWith(2, {
      placement: 'industry-detail',
      industry: null,
      is_active: true,
    });
  });

  it('rejects an unknown Industry before creating an override', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue(null);
    await expect(PageCtaService.createPageCta(payload)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Industry not found',
    });
    expect(PageCta.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate placement/scope records', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue({
      _id: payload.industry,
    });
    (PageCta.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(cta),
    });

    await expect(PageCtaService.createPageCta(payload)).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
    });
  });

  it('atomically upserts a validated scope and returns a populated record', async () => {
    (IndustryRepository.findByIdLean as jest.Mock).mockResolvedValue({
      _id: payload.industry,
    });
    (PageCta.findOneAndUpdate as jest.Mock).mockResolvedValue({ _id: cta._id });
    const lean = jest
      .fn()
      .mockResolvedValue({ ...cta, industry: { name: 'Hospitality' } });
    const populate = jest.fn().mockReturnValue({ lean });
    (PageCta.findById as jest.Mock).mockReturnValue({ populate });

    await expect(PageCtaService.upsertPageCta(payload)).resolves.toMatchObject({
      title: cta.title,
    });
    expect(PageCta.findOneAndUpdate).toHaveBeenCalledWith(
      { placement: 'industry-detail', industry: payload.industry },
      { $set: { ...payload, industry: payload.industry } },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  });
});

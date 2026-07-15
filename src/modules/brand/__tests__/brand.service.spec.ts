import httpStatus from 'http-status';

jest.mock('../brand.repository');

import * as BrandRepository from '../brand.repository';
import * as BrandService from '../brand.service';

const BRAND_ID = '507f1f77bcf86cd799439011';
const brand = {
  _id: BRAND_ID,
  name: 'Acme',
  logo: 'https://cdn.example.com/acme.svg',
  href: 'https://acme.example.com',
  order: 1,
  is_active: true,
};

describe('BrandService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates a brand through the repository', async () => {
    (BrandRepository.create as jest.Mock).mockResolvedValue(brand);

    await expect(BrandService.createBrand(brand)).resolves.toEqual(brand);

    expect(BrandRepository.create).toHaveBeenCalledWith(brand);
  });

  it('returns the ordered public brands in the service data envelope', async () => {
    (BrandRepository.findPublic as jest.Mock).mockResolvedValue([brand]);

    await expect(BrandService.getPublicBrands()).resolves.toEqual({
      data: [brand],
    });

    expect(BrandRepository.findPublic).toHaveBeenCalledWith();
  });

  it('forwards admin filters and returns the paginated repository result', async () => {
    const query = { filter: 'active', search: 'acme', page: 2 };
    const page = {
      data: [brand],
      meta: { total: 11, page: 2, limit: 10, total_pages: 2 },
    };
    (BrandRepository.findAdminPaginated as jest.Mock).mockResolvedValue(page);

    await expect(BrandService.getBrands(query)).resolves.toEqual(page);

    expect(BrandRepository.findAdminPaginated).toHaveBeenCalledWith(query);
  });

  it('returns a brand by id', async () => {
    (BrandRepository.findByIdLean as jest.Mock).mockResolvedValue(brand);

    await expect(BrandService.getBrand(BRAND_ID)).resolves.toEqual(brand);

    expect(BrandRepository.findByIdLean).toHaveBeenCalledWith(BRAND_ID);
  });

  it('throws 404 when a requested brand does not exist', async () => {
    (BrandRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(BrandService.getBrand(BRAND_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Brand not found',
    });
  });

  it('updates an existing brand', async () => {
    const payload = { name: 'Acme Studio', is_active: false };
    const updated = { ...brand, ...payload };
    (BrandRepository.findByIdLean as jest.Mock).mockResolvedValue(brand);
    (BrandRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(BrandService.updateBrand(BRAND_ID, payload)).resolves.toEqual(
      updated,
    );

    expect(BrandRepository.updateById).toHaveBeenCalledWith(BRAND_ID, payload);
  });

  it('does not update a missing brand', async () => {
    (BrandRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      BrandService.updateBrand(BRAND_ID, { name: 'Missing brand' }),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Brand not found',
    });

    expect(BrandRepository.updateById).not.toHaveBeenCalled();
  });

  it('forwards the complete reorder payload', async () => {
    const items = [
      { _id: BRAND_ID, order: 2 },
      { _id: '507f1f77bcf86cd799439012', order: 1 },
    ];
    (BrandRepository.updateOrder as jest.Mock).mockResolvedValue(undefined);

    await expect(BrandService.reorderBrands(items)).resolves.toBeUndefined();

    expect(BrandRepository.updateOrder).toHaveBeenCalledWith(items);
  });

  it('soft deletes an existing brand document', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (BrandRepository.findById as jest.Mock).mockResolvedValue({
      ...brand,
      softDelete,
    });

    await expect(BrandService.deleteBrand(BRAND_ID)).resolves.toBeUndefined();

    expect(BrandRepository.findById).toHaveBeenCalledWith(BRAND_ID);
    expect(softDelete).toHaveBeenCalledWith();
  });

  it('does not soft delete a missing brand', async () => {
    (BrandRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(BrandService.deleteBrand(BRAND_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Brand not found',
    });
  });

  it('permanently deletes an existing brand', async () => {
    (BrandRepository.findByIdLean as jest.Mock).mockResolvedValue(brand);
    (BrandRepository.hardDeleteById as jest.Mock).mockResolvedValue(undefined);

    await expect(
      BrandService.deleteBrandPermanent(BRAND_ID),
    ).resolves.toBeUndefined();

    expect(BrandRepository.hardDeleteById).toHaveBeenCalledWith(BRAND_ID);
  });

  it('does not permanently delete a missing brand', async () => {
    (BrandRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      BrandService.deleteBrandPermanent(BRAND_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Brand not found',
    });

    expect(BrandRepository.hardDeleteById).not.toHaveBeenCalled();
  });
});

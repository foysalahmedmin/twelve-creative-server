import httpStatus from 'http-status';

jest.mock('../service.repository');
jest.mock('../service.model', () => ({
  Service: { findOne: jest.fn() },
}));

import { Service } from '../service.model';
import * as ServiceRepository from '../service.repository';
import * as ServiceService from '../service.service';
import { TService } from '../service.type';

const SERVICE_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439012';

const service: TService = {
  _id: SERVICE_ID,
  slug: 'positioning',
  title: 'Brand Positioning',
  description: 'A clear positioning system for ambitious brands.',
  highlights: ['Research', 'Strategy'],
  image: '/services/positioning.jpg',
  icon: 'positioning',
  href: '/what-we-build#positioning',
  order: 1,
  is_active: true,
};

const paginated = {
  data: [service],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

describe('ServiceService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createService', () => {
    it('creates a service when its slug is available', async () => {
      (Service.findOne as jest.Mock).mockResolvedValue(null);
      (ServiceRepository.create as jest.Mock).mockResolvedValue(service);

      await expect(ServiceService.createService(service)).resolves.toEqual(
        service,
      );
      expect(Service.findOne).toHaveBeenCalledWith({ slug: service.slug });
      expect(ServiceRepository.create).toHaveBeenCalledWith(service);
    });

    it('rejects a duplicate slug', async () => {
      (Service.findOne as jest.Mock).mockResolvedValue({
        _id: { toString: () => OTHER_ID },
      });

      await expect(ServiceService.createService(service)).rejects.toMatchObject(
        {
          status: httpStatus.CONFLICT,
          message: expect.stringContaining(service.slug),
        },
      );
      expect(ServiceRepository.create).not.toHaveBeenCalled();
    });
  });

  it('returns the public service list', async () => {
    (ServiceRepository.findPublic as jest.Mock).mockResolvedValue([service]);

    await expect(ServiceService.getPublicServices()).resolves.toEqual({
      data: [service],
    });
  });

  it('returns the admin service list with pagination metadata', async () => {
    const query = { page: '1', search: 'brand' };
    (ServiceRepository.findAdminPaginated as jest.Mock).mockResolvedValue(
      paginated,
    );

    await expect(ServiceService.getServices(query)).resolves.toEqual(paginated);
    expect(ServiceRepository.findAdminPaginated).toHaveBeenCalledWith(query);
  });

  describe('getService', () => {
    it('returns a service by id', async () => {
      (ServiceRepository.findByIdLean as jest.Mock).mockResolvedValue(service);

      await expect(ServiceService.getService(SERVICE_ID)).resolves.toEqual(
        service,
      );
    });

    it('throws 404 when the service does not exist', async () => {
      (ServiceRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

      await expect(ServiceService.getService(SERVICE_ID)).rejects.toMatchObject(
        {
          status: httpStatus.NOT_FOUND,
          message: 'Service not found',
        },
      );
    });
  });

  describe('updateService', () => {
    it('updates a service and validates a changed slug', async () => {
      const payload = { slug: 'creative-direction', title: 'Creative' };
      const updated = { ...service, ...payload };
      (ServiceRepository.findByIdLean as jest.Mock).mockResolvedValue(service);
      (Service.findOne as jest.Mock).mockResolvedValue(null);
      (ServiceRepository.updateById as jest.Mock).mockResolvedValue(updated);

      await expect(
        ServiceService.updateService(SERVICE_ID, payload),
      ).resolves.toEqual(updated);
      expect(Service.findOne).toHaveBeenCalledWith({ slug: payload.slug });
      expect(ServiceRepository.updateById).toHaveBeenCalledWith(
        SERVICE_ID,
        payload,
      );
    });

    it('throws 404 before updating a missing service', async () => {
      (ServiceRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

      await expect(
        ServiceService.updateService(SERVICE_ID, { title: 'Updated' }),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
      expect(ServiceRepository.updateById).not.toHaveBeenCalled();
    });

    it('rejects a changed slug that belongs to another service', async () => {
      (ServiceRepository.findByIdLean as jest.Mock).mockResolvedValue(service);
      (Service.findOne as jest.Mock).mockResolvedValue({
        _id: { toString: () => OTHER_ID },
      });

      await expect(
        ServiceService.updateService(SERVICE_ID, { slug: 'creative' }),
      ).rejects.toMatchObject({ status: httpStatus.CONFLICT });
      expect(ServiceRepository.updateById).not.toHaveBeenCalled();
    });
  });

  it('forwards reorder items to the repository', async () => {
    const items = [{ _id: SERVICE_ID, order: 3 }];
    (ServiceRepository.updateOrder as jest.Mock).mockResolvedValue(undefined);

    await ServiceService.reorderServices(items);

    expect(ServiceRepository.updateOrder).toHaveBeenCalledWith(items);
  });

  describe('deleteService', () => {
    it('soft deletes an existing service', async () => {
      const softDelete = jest.fn().mockResolvedValue(undefined);
      (ServiceRepository.findById as jest.Mock).mockResolvedValue({
        softDelete,
      });

      await ServiceService.deleteService(SERVICE_ID);

      expect(softDelete).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when soft deleting a missing service', async () => {
      (ServiceRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        ServiceService.deleteService(SERVICE_ID),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    });
  });

  describe('deleteServicePermanent', () => {
    it('hard deletes an existing service', async () => {
      (ServiceRepository.findByIdLean as jest.Mock).mockResolvedValue(service);

      await ServiceService.deleteServicePermanent(SERVICE_ID);

      expect(ServiceRepository.hardDeleteById).toHaveBeenCalledWith(SERVICE_ID);
    });

    it('throws 404 when permanently deleting a missing service', async () => {
      (ServiceRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

      await expect(
        ServiceService.deleteServicePermanent(SERVICE_ID),
      ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
      expect(ServiceRepository.hardDeleteById).not.toHaveBeenCalled();
    });
  });

  describe('restoreService', () => {
    it('restores a deleted service', async () => {
      (ServiceRepository.restoreById as jest.Mock).mockResolvedValue(service);

      await expect(ServiceService.restoreService(SERVICE_ID)).resolves.toEqual(
        service,
      );
    });

    it('throws 404 when the service is not deleted or does not exist', async () => {
      (ServiceRepository.restoreById as jest.Mock).mockResolvedValue(null);

      await expect(
        ServiceService.restoreService(SERVICE_ID),
      ).rejects.toMatchObject({
        status: httpStatus.NOT_FOUND,
        message: 'Service not found or not deleted',
      });
    });
  });
});

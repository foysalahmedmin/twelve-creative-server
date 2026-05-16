/**
 * user.service.test.ts
 *
 * Unit tests for the User Service layer.
 * The repository is fully mocked so these tests run without a real DB connection.
 * This validates pure business logic: error conditions, cache invalidation calls,
 * data transformations, etc.
 */

import httpStatus from 'http-status';

// ── Mock the entire repository before importing the service ──────────────────
jest.mock('../user.repository');
jest.mock('../../../utils/cache.utils', () => ({
  withCache: jest.fn((_key: string, _ttl: number, fn: () => unknown) => fn()),
  invalidateCache: jest.fn().mockResolvedValue(undefined),
  invalidateCacheByPattern: jest.fn().mockResolvedValue(undefined),
  generateCacheKey: jest.fn(
    (_prefix: string, parts: unknown[]) => `mock:${parts.join(':')}`,
  ),
}));
jest.mock('../../../utils/delete-files', () => ({
  deleteFiles: jest.fn(),
}));

import * as UserRepository from '../user.repository';
import * as UserService from '../user.service';
import { TUser } from '../user.type';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockUser = (): TUser => ({
  _id: '507f1f77bcf86cd799439011' as unknown as never,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  status: 'in-progress',
  is_verified: true,
  is_deleted: false,
  auth_source: 'email',
});

const mockJwtPayload = () => ({
  _id: '507f1f77bcf86cd799439011',
  role: 'user' as const,
  email: 'john@example.com',
  name: 'John Doe',
  iat: 0,
  exp: 0,
});

const mockObjectId = (id: string) => ({ toString: () => id, _id: id });

// ─── getSelf ─────────────────────────────────────────────────────────────────

describe('UserService.getSelf', () => {
  it('should return the authenticated user', async () => {
    const user = mockUser();
    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(user);

    const result = await UserService.getSelf(mockJwtPayload());

    expect(UserRepository.findByIdLean).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
    expect(result).toEqual(user);
  });

  it('should throw 404 when the authenticated user does not exist', async () => {
    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(UserService.getSelf(mockJwtPayload())).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    });
  });
});

// ─── getUser ─────────────────────────────────────────────────────────────────

describe('UserService.getUser', () => {
  it('should return a user by id', async () => {
    const user = mockUser();
    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(user);

    const result = await UserService.getUser('507f1f77bcf86cd799439011');

    expect(result).toEqual(user);
  });

  it('should throw 404 when user not found', async () => {
    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      UserService.getUser('507f1f77bcf86cd799439099'),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'User not found',
    });
  });
});

// ─── getWritersUsers ──────────────────────────────────────────────────────────

describe('UserService.getWritersUsers', () => {
  it('should return paginated writers', async () => {
    const paginated = {
      data: [mockUser()],
      meta: { total: 1, page: 1, limit: 10 },
    };
    (UserRepository.findWritersPaginated as jest.Mock).mockResolvedValue(
      paginated,
    );

    const result = await UserService.getWritersUsers({});

    expect(UserRepository.findWritersPaginated).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});

// ─── getUsers ─────────────────────────────────────────────────────────────────

describe('UserService.getUsers', () => {
  it('should return paginated users for admin', async () => {
    const paginated = {
      data: [mockUser()],
      meta: { total: 1, page: 1, limit: 10 },
    };
    (UserRepository.findAdminPaginated as jest.Mock).mockResolvedValue(
      paginated,
    );

    const result = await UserService.getUsers({});

    expect(UserRepository.findAdminPaginated).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
  });
});

// ─── updateSelf ───────────────────────────────────────────────────────────────

describe('UserService.updateSelf', () => {
  it('should update and return the authenticated user', async () => {
    const existing = mockUser();
    const updated = { ...existing, name: 'Jane Doe' };

    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(existing);
    (UserRepository.updateById as jest.Mock).mockResolvedValue(updated);

    const result = await UserService.updateSelf(mockJwtPayload(), {
      name: 'Jane Doe',
    });

    expect(UserRepository.updateById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { name: 'Jane Doe' },
    );
    expect(result.name).toBe('Jane Doe');
  });

  it('should throw 404 when authenticated user not found', async () => {
    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      UserService.updateSelf(mockJwtPayload(), { name: 'X' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('should throw 409 when new email already belongs to another user', async () => {
    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(mockUser());
    (UserRepository.findByEmail as jest.Mock).mockResolvedValue({
      ...mockUser(),
      _id: 'other-id',
    });

    await expect(
      UserService.updateSelf(mockJwtPayload(), {
        email: 'taken@example.com',
      }),
    ).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: 'Email already exists',
    });

    expect(UserRepository.updateById).not.toHaveBeenCalled();
  });

  it('should invalidate cache after a successful update', async () => {
    const { invalidateCacheByPattern, invalidateCache } = jest.requireMock(
      '../../../utils/cache.utils',
    );
    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(mockUser());
    (UserRepository.updateById as jest.Mock).mockResolvedValue({
      ...mockUser(),
      name: 'Updated',
    });

    await UserService.updateSelf(mockJwtPayload(), { name: 'Updated' });

    expect(invalidateCache).toHaveBeenCalled();
    expect(invalidateCacheByPattern).toHaveBeenCalledWith('user:admin:list:*');
  });
});

// ─── updateUser ───────────────────────────────────────────────────────────────

describe('UserService.updateUser', () => {
  it('should update a user by id', async () => {
    const existing = mockUser();
    const updated = { ...existing, role: 'admin' as const };

    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(existing);
    (UserRepository.updateById as jest.Mock).mockResolvedValue(updated);

    const result = await UserService.updateUser('507f1f77bcf86cd799439011', {
      role: 'admin',
    });

    expect(result.role).toBe('admin');
  });

  it('should throw 404 when user does not exist', async () => {
    (UserRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      UserService.updateUser('507f1f77bcf86cd799439099', { role: 'admin' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(UserRepository.updateById).not.toHaveBeenCalled();
  });
});

// ─── updateUsers ──────────────────────────────────────────────────────────────

describe('UserService.updateUsers', () => {
  it('should update found users and report not-found ids', async () => {
    const foundId = '507f1f77bcf86cd799439011';
    const missingId = '507f1f77bcf86cd799439099';

    (UserRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...mockUser(), _id: mockObjectId(foundId) },
    ]);
    (UserRepository.updateManyByIds as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
    });

    const result = await UserService.updateUsers([foundId, missingId], {
      status: 'blocked',
    });

    expect(result.count).toBe(1);
    expect(result.not_found_ids).toEqual([missingId]);
  });
});

// ─── deleteUser ───────────────────────────────────────────────────────────────

describe('UserService.deleteUser', () => {
  it('should call softDelete on the found user', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (UserRepository.findById as jest.Mock).mockResolvedValue({
      ...mockUser(),
      softDelete,
    });

    await UserService.deleteUser('507f1f77bcf86cd799439011');

    expect(softDelete).toHaveBeenCalled();
  });

  it('should throw 404 when user not found', async () => {
    (UserRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      UserService.deleteUser('507f1f77bcf86cd799439099'),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });
});

// ─── deleteUsers ─────────────────────────────────────────────────────────────

describe('UserService.deleteUsers', () => {
  it('should soft-delete found ids and report missing ones', async () => {
    const foundId = '507f1f77bcf86cd799439011';
    const missingId = '507f1f77bcf86cd799439099';

    (UserRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...mockUser(), _id: mockObjectId(foundId) },
    ]);
    (UserRepository.softDeleteManyByIds as jest.Mock).mockResolvedValue(
      undefined,
    );

    const result = await UserService.deleteUsers([foundId, missingId]);

    expect(UserRepository.softDeleteManyByIds).toHaveBeenCalledWith([foundId]);
    expect(result).toEqual({ count: 1, not_found_ids: [missingId] });
  });
});

// ─── deleteUserPermanent ──────────────────────────────────────────────────────

describe('UserService.deleteUserPermanent', () => {
  it('should hard-delete a user that exists', async () => {
    (UserRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      mockUser(),
    );
    (UserRepository.hardDeleteById as jest.Mock).mockResolvedValue(undefined);

    await UserService.deleteUserPermanent('507f1f77bcf86cd799439011');

    expect(UserRepository.hardDeleteById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });

  it('should throw 404 when user not found', async () => {
    (UserRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(null);

    await expect(
      UserService.deleteUserPermanent('507f1f77bcf86cd799439099'),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });
});

// ─── deleteUsersPermanent ─────────────────────────────────────────────────────

describe('UserService.deleteUsersPermanent', () => {
  it('should hard-delete found ids and report missing ones', async () => {
    const foundId = '507f1f77bcf86cd799439011';
    const missingId = '507f1f77bcf86cd799439099';

    (UserRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...mockUser(), _id: mockObjectId(foundId) },
    ]);
    (UserRepository.hardDeleteManyByIds as jest.Mock).mockResolvedValue(
      undefined,
    );

    const result = await UserService.deleteUsersPermanent([foundId, missingId]);

    expect(UserRepository.hardDeleteManyByIds).toHaveBeenCalledWith([foundId]);
    expect(result).toEqual({ count: 1, not_found_ids: [missingId] });
  });
});

// ─── restoreUser ──────────────────────────────────────────────────────────────

describe('UserService.restoreUser', () => {
  it('should restore a deleted user', async () => {
    const user = mockUser();
    (UserRepository.restoreById as jest.Mock).mockResolvedValue(user);

    const result = await UserService.restoreUser('507f1f77bcf86cd799439011');

    expect(result).toEqual(user);
  });

  it('should throw 404 when user not found or not deleted', async () => {
    (UserRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(
      UserService.restoreUser('507f1f77bcf86cd799439099'),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'User not found or not deleted',
    });
  });
});

// ─── restoreUsers ─────────────────────────────────────────────────────────────

describe('UserService.restoreUsers', () => {
  it('should restore found ids and report missing ones', async () => {
    const foundId = '507f1f77bcf86cd799439011';
    const missingId = '507f1f77bcf86cd799439099';

    (UserRepository.restoreManyByIds as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
    });
    (UserRepository.findRestoredByIds as jest.Mock).mockResolvedValue([
      { ...mockUser(), _id: mockObjectId(foundId) },
    ]);

    const result = await UserService.restoreUsers([foundId, missingId]);

    expect(result.count).toBe(1);
    expect(result.not_found_ids).toEqual([missingId]);
  });
});

import httpStatus from 'http-status';

jest.mock('../notification-recipient.repository');
jest.mock('../notification-recipient.model', () => ({
  NotificationRecipient: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock('../../../utils/cache.utils', () => ({
  generateCacheKey: jest.fn(
    (prefix: string, parts: unknown[]) => `${prefix}:${JSON.stringify(parts)}`,
  ),
  invalidateCacheByPattern: jest.fn().mockResolvedValue(undefined),
  withCache: jest.fn(
    (_key: string, _ttl: number, callback: () => Promise<unknown>) =>
      callback(),
  ),
}));
jest.mock('../../../builder/app-query-find', () =>
  jest.fn().mockImplementation(() => ({
    populate: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    paginate: jest.fn().mockReturnThis(),
    fields: jest.fn().mockReturnThis(),
    tap: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 10 },
    }),
  })),
);

import AppQueryFind from '../../../builder/app-query-find';
import { invalidateCacheByPattern } from '../../../utils/cache.utils';
import { NotificationRecipient } from '../notification-recipient.model';
import * as NotificationRecipientRepository from '../notification-recipient.repository';
import * as NotificationRecipientService from '../notification-recipient.service';

const user = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Admin',
  email: 'admin@twelvecreative.co',
  role: 'admin' as const,
};
const id = '507f1f77bcf86cd799439012';
const notificationId = '507f1f77bcf86cd799439013';
const recipient = {
  _id: id,
  notification: notificationId,
  recipient: user._id,
  metadata: {},
  is_read: false,
  is_deleted: false,
};

const populatedLeanChain = (value: unknown) => {
  const lean = jest.fn().mockResolvedValue(value);
  const populate = jest.fn().mockReturnValue({ lean });
  return { populate, lean };
};

describe('NotificationRecipientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a recipient and invalidates caches', async () => {
    (NotificationRecipientRepository.create as jest.Mock).mockResolvedValue(
      recipient,
    );

    await expect(
      NotificationRecipientService.createNotificationRecipient(
        recipient as any,
      ),
    ).resolves.toEqual(recipient);
    expect(NotificationRecipientRepository.create).toHaveBeenCalledWith(
      recipient,
    );
    expect(invalidateCacheByPattern).toHaveBeenCalledWith(
      'notification-recipient:*',
    );
  });

  it('gets one self-owned recipient with populated relations', async () => {
    const chain = populatedLeanChain(recipient);
    (NotificationRecipient.findOne as jest.Mock).mockReturnValue(chain);

    await expect(
      NotificationRecipientService.getSelfNotificationRecipient(user, id),
    ).resolves.toEqual(recipient);
    expect(NotificationRecipient.findOne).toHaveBeenCalledWith({
      _id: id,
      recipient: user._id,
    });
    expect(chain.populate).toHaveBeenCalledWith(expect.any(Array));
  });

  it('does not expose another user’s recipient through the self lookup', async () => {
    (NotificationRecipient.findOne as jest.Mock).mockReturnValue(
      populatedLeanChain(null),
    );

    await expect(
      NotificationRecipientService.getSelfNotificationRecipient(user, id),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Notification recipient not found',
    });
  });

  it('gets one recipient for admin', async () => {
    (
      NotificationRecipientRepository.findByIdLean as jest.Mock
    ).mockResolvedValue(recipient);

    await expect(
      NotificationRecipientService.getNotificationRecipient(id),
    ).resolves.toEqual(recipient);
  });

  it('throws 404 for a missing admin recipient lookup', async () => {
    (
      NotificationRecipientRepository.findByIdLean as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      NotificationRecipientService.getNotificationRecipient(id),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('returns a user-scoped paginated recipient list', async () => {
    const result =
      await NotificationRecipientService.getSelfNotificationRecipients(user, {
        is_read: false,
      });

    expect(result).toEqual({
      data: [],
      meta: { total: 0, page: 1, limit: 10 },
    });
    expect(AppQueryFind).toHaveBeenCalledWith(NotificationRecipient, {
      recipient: user._id,
      is_read: false,
    });
    const query = (AppQueryFind as unknown as jest.Mock).mock.results[0].value;
    expect(query.execute).toHaveBeenCalledWith([
      { key: 'unread', filter: { is_read: false, recipient: user._id } },
    ]);
  });

  it('returns an admin paginated recipient list', async () => {
    await NotificationRecipientService.getNotificationRecipients({ page: 2 });

    expect(AppQueryFind).toHaveBeenCalledWith(NotificationRecipient, {
      page: 2,
    });
    const query = (AppQueryFind as unknown as jest.Mock).mock.results[0].value;
    expect(query.execute).toHaveBeenCalledWith([
      { key: 'unread', filter: { is_read: false } },
    ]);
  });

  it('marks a self-owned recipient read and assigns read_at automatically', async () => {
    (
      NotificationRecipientRepository.findOneLean as jest.Mock
    ).mockResolvedValue(recipient);
    const updated = { ...recipient, is_read: true, read_at: new Date() };
    const chain = populatedLeanChain(updated);
    (NotificationRecipient.findByIdAndUpdate as jest.Mock).mockReturnValue(
      chain,
    );

    await expect(
      NotificationRecipientService.updateSelfNotificationRecipient(user, id, {
        is_read: true,
      }),
    ).resolves.toEqual(updated);
    expect(NotificationRecipient.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { is_read: true, read_at: expect.any(Date) },
      { new: true, runValidators: true },
    );
    expect(invalidateCacheByPattern).toHaveBeenCalledWith(
      'notification-recipient:*',
    );
  });

  it('clears read_at when a self-owned recipient is marked unread', async () => {
    (
      NotificationRecipientRepository.findOneLean as jest.Mock
    ).mockResolvedValue(recipient);
    (NotificationRecipient.findByIdAndUpdate as jest.Mock).mockReturnValue(
      populatedLeanChain({ ...recipient, is_read: false }),
    );

    await NotificationRecipientService.updateSelfNotificationRecipient(
      user,
      id,
      { is_read: false },
    );

    expect(NotificationRecipient.findByIdAndUpdate).toHaveBeenCalledWith(
      id,
      { is_read: false, read_at: null },
      expect.any(Object),
    );
  });

  it('does not update a recipient not owned by the user', async () => {
    (
      NotificationRecipientRepository.findOneLean as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      NotificationRecipientService.updateSelfNotificationRecipient(user, id, {
        is_read: true,
      }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(NotificationRecipient.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('updates one recipient for admin and invalidates caches', async () => {
    const updated = { ...recipient, is_read: true };
    (
      NotificationRecipientRepository.findByIdLean as jest.Mock
    ).mockResolvedValue(recipient);
    (NotificationRecipientRepository.updateById as jest.Mock).mockResolvedValue(
      updated,
    );

    await expect(
      NotificationRecipientService.updateNotificationRecipient(id, {
        is_read: true,
      }),
    ).resolves.toEqual(updated);
    expect(NotificationRecipientRepository.updateById).toHaveBeenCalledWith(
      id,
      { is_read: true },
    );
  });

  it('does not admin-update a missing recipient', async () => {
    (
      NotificationRecipientRepository.findByIdLean as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      NotificationRecipientService.updateNotificationRecipient(id, {
        is_read: true,
      }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('marks every unread self recipient as read and returns the count', async () => {
    (
      NotificationRecipientRepository.updateManyByFilter as jest.Mock
    ).mockResolvedValue({ modifiedCount: 3 });

    await expect(
      NotificationRecipientService.readAllNotificationRecipients(user),
    ).resolves.toEqual({ count: 3 });
    expect(
      NotificationRecipientRepository.updateManyByFilter,
    ).toHaveBeenCalledWith(
      { recipient: user._id, is_read: false },
      { is_read: true, read_at: expect.any(Date) },
    );
    expect(invalidateCacheByPattern).toHaveBeenCalled();
  });

  it('does not invalidate caches when read-all changes nothing', async () => {
    (
      NotificationRecipientRepository.updateManyByFilter as jest.Mock
    ).mockResolvedValue({ modifiedCount: 0 });

    await NotificationRecipientService.readAllNotificationRecipients(user);

    expect(invalidateCacheByPattern).not.toHaveBeenCalled();
  });

  it('bulk-updates only self-owned recipients and reports unowned ids', async () => {
    (
      NotificationRecipientRepository.findManyByFilter as jest.Mock
    ).mockResolvedValue([{ ...recipient, _id: { toString: () => 'owned' } }]);
    (
      NotificationRecipientRepository.updateManyByFilter as jest.Mock
    ).mockResolvedValue({ modifiedCount: 1 });

    await expect(
      NotificationRecipientService.updateSelfNotificationRecipients(
        user,
        ['owned', 'unowned'],
        { is_read: true },
      ),
    ).resolves.toEqual({ count: 1, not_found_ids: ['unowned'] });
    expect(
      NotificationRecipientRepository.updateManyByFilter,
    ).toHaveBeenCalledWith(
      { _id: { $in: ['owned'] }, recipient: user._id },
      { is_read: true, read_at: expect.any(Date) },
    );
  });

  it('bulk-updates recipients for admin and reports missing ids', async () => {
    (
      NotificationRecipientRepository.findManyByIds as jest.Mock
    ).mockResolvedValue([{ ...recipient, _id: { toString: () => 'found' } }]);
    (
      NotificationRecipientRepository.updateManyByIds as jest.Mock
    ).mockResolvedValue({ modifiedCount: 1 });

    await expect(
      NotificationRecipientService.updateNotificationRecipients(
        ['found', 'missing'],
        { is_read: true },
      ),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(
      NotificationRecipientRepository.updateManyByIds,
    ).toHaveBeenCalledWith(['found'], { is_read: true });
  });

  it('soft-deletes one self-owned recipient and invalidates caches', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (NotificationRecipientRepository.findOne as jest.Mock).mockResolvedValue({
      softDelete,
    });

    await expect(
      NotificationRecipientService.deleteSelfNotificationRecipient(user, id),
    ).resolves.toBeUndefined();
    expect(NotificationRecipientRepository.findOne).toHaveBeenCalledWith({
      _id: id,
      recipient: user._id,
    });
    expect(softDelete).toHaveBeenCalledWith();
  });

  it('rejects self-delete for an unowned recipient', async () => {
    (NotificationRecipientRepository.findOne as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      NotificationRecipientService.deleteSelfNotificationRecipient(user, id),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('soft-deletes one recipient for admin', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (NotificationRecipientRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });

    await NotificationRecipientService.deleteNotificationRecipient(id);

    expect(softDelete).toHaveBeenCalledWith();
  });

  it('rejects admin delete for a missing recipient', async () => {
    (NotificationRecipientRepository.findById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      NotificationRecipientService.deleteNotificationRecipient(id),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('permanently deletes a recipient using the bypass lookup', async () => {
    (
      NotificationRecipientRepository.findByIdWithBypass as jest.Mock
    ).mockResolvedValue(recipient);

    await NotificationRecipientService.deleteNotificationRecipientPermanent(id);

    expect(NotificationRecipientRepository.hardDeleteById).toHaveBeenCalledWith(
      id,
    );
  });

  it('rejects permanent delete for a missing recipient', async () => {
    (
      NotificationRecipientRepository.findByIdWithBypass as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      NotificationRecipientService.deleteNotificationRecipientPermanent(id),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('bulk soft-deletes only self-owned recipients', async () => {
    (
      NotificationRecipientRepository.findManyByFilter as jest.Mock
    ).mockResolvedValue([{ ...recipient, _id: { toString: () => 'owned' } }]);

    await expect(
      NotificationRecipientService.deleteSelfNotificationRecipients(user, [
        'owned',
        'unowned',
      ]),
    ).resolves.toEqual({ count: 1, not_found_ids: ['unowned'] });
    expect(
      NotificationRecipientRepository.softDeleteManyByIds,
    ).toHaveBeenCalledWith(['owned']);
  });

  it('bulk soft-deletes admin-selected recipients', async () => {
    (
      NotificationRecipientRepository.findManyByIds as jest.Mock
    ).mockResolvedValue([{ ...recipient, _id: { toString: () => 'found' } }]);

    await expect(
      NotificationRecipientService.deleteNotificationRecipients([
        'found',
        'missing',
      ]),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
  });

  it('bulk permanently deletes only deleted recipients', async () => {
    (
      NotificationRecipientRepository.findManyByFilter as jest.Mock
    ).mockResolvedValue([{ ...recipient, _id: { toString: () => 'deleted' } }]);

    await expect(
      NotificationRecipientService.deleteNotificationRecipientsPermanent([
        'deleted',
        'missing',
      ]),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(
      NotificationRecipientRepository.findManyByFilter,
    ).toHaveBeenCalledWith({
      _id: { $in: ['deleted', 'missing'] },
      is_deleted: true,
    });
    expect(
      NotificationRecipientRepository.hardDeleteManyByIds,
    ).toHaveBeenCalledWith(['deleted']);
  });

  it('restores one self-owned recipient with populated relations', async () => {
    (NotificationRecipient.findOneAndUpdate as jest.Mock).mockReturnValue(
      populatedLeanChain(recipient),
    );

    await expect(
      NotificationRecipientService.restoreSelfNotificationRecipient(user, id),
    ).resolves.toEqual(recipient);
    expect(NotificationRecipient.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: id, is_deleted: true, recipient: user._id },
      { is_deleted: false },
      { new: true },
    );
  });

  it('rejects self restore for a missing or active recipient', async () => {
    (NotificationRecipient.findOneAndUpdate as jest.Mock).mockReturnValue(
      populatedLeanChain(null),
    );

    await expect(
      NotificationRecipientService.restoreSelfNotificationRecipient(user, id),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('restores one recipient for admin', async () => {
    (
      NotificationRecipientRepository.restoreById as jest.Mock
    ).mockResolvedValue(recipient);

    await expect(
      NotificationRecipientService.restoreNotificationRecipient(id),
    ).resolves.toEqual(recipient);
  });

  it('rejects admin restore for a missing or active recipient', async () => {
    (
      NotificationRecipientRepository.restoreById as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      NotificationRecipientService.restoreNotificationRecipient(id),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('bulk-restores only self-owned recipients and reports missing ids', async () => {
    (
      NotificationRecipientRepository.updateManyByFilter as jest.Mock
    ).mockResolvedValue({ modifiedCount: 1 });
    (
      NotificationRecipientRepository.findManyByFilter as jest.Mock
    ).mockResolvedValue([
      { ...recipient, _id: { toString: () => 'restored' } },
    ]);

    await expect(
      NotificationRecipientService.restoreSelfNotificationRecipients(user, [
        'restored',
        'missing',
      ]),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(
      NotificationRecipientRepository.updateManyByFilter,
    ).toHaveBeenCalledWith(
      {
        _id: { $in: ['restored', 'missing'] },
        is_deleted: true,
        recipient: user._id,
      },
      { is_deleted: false },
    );
  });

  it('bulk-restores admin-selected recipients and reports missing ids', async () => {
    (
      NotificationRecipientRepository.restoreManyByIds as jest.Mock
    ).mockResolvedValue({
      modifiedCount: 1,
    });
    (
      NotificationRecipientRepository.findManyByIds as jest.Mock
    ).mockResolvedValue([
      { ...recipient, _id: { toString: () => 'restored' } },
    ]);

    await expect(
      NotificationRecipientService.restoreNotificationRecipients([
        'restored',
        'missing',
      ]),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
  });
});

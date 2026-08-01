import httpStatus from 'http-status';

jest.mock('../contact-message.repository');
jest.mock('../../../utils/send-email', () => ({ sendEmail: jest.fn() }));
jest.mock('../../../utils/create-system-notification', () => ({
  createSystemNotification: jest.fn(),
}));
jest.mock('../../../utils/delete-system-notifications', () => ({
  deleteSystemNotificationsByReference: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../utils/notification-recipient', () => ({
  resolveNotificationRecipients: jest
    .fn()
    .mockResolvedValue(['notifications@twelvecreative.co']),
}));
jest.mock('../../../config/env', () => ({
  __esModule: true,
  default: {
    smtp_email: 'notifications@twelvecreative.co',
    email: 'fallback@twelvecreative.co',
  },
}));

import { createSystemNotification } from '../../../utils/create-system-notification';
import { deleteSystemNotificationsByReference } from '../../../utils/delete-system-notifications';
import { resolveNotificationRecipients } from '../../../utils/notification-recipient';
import { sendEmail } from '../../../utils/send-email';
import * as ContactMessageRepository from '../contact-message.repository';
import * as ContactMessageService from '../contact-message.service';

const id = '507f1f77bcf86cd799439011';
const message = {
  _id: id,
  name: '<Taylor & Co>',
  email: 'taylor@example.com',
  phone: '+8801000000000',
  subject: 'A "new" project',
  message: 'Can we build <something> memorable?',
  is_read: false,
  is_archived: false,
};

describe('ContactMessageService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sendEmail as jest.Mock).mockResolvedValue(undefined);
    (resolveNotificationRecipients as jest.Mock).mockResolvedValue([
      'notifications@twelvecreative.co',
    ]);
  });

  it('creates an unread message, notifies admins, and escapes email HTML', async () => {
    (ContactMessageRepository.create as jest.Mock).mockResolvedValue(message);

    await expect(
      ContactMessageService.createContactMessage({
        ...message,
        is_read: true,
        is_archived: true,
      }),
    ).resolves.toEqual(message);

    expect(ContactMessageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ is_read: false, is_archived: false }),
    );
    expect(createSystemNotification).toHaveBeenCalledWith({
      title: `New message from ${message.name}`,
      message: message.subject,
      type: 'contact',
      // `reference` lets the notification be removed again if the message is
      // ever permanently deleted.
      metadata: { url: '/admin/messages', reference: id },
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['notifications@twelvecreative.co'],
        subject: `Contact: ${message.subject}`,
        html: expect.stringContaining('&lt;Taylor &amp; Co&gt;'),
      }),
    );
    expect((sendEmail as jest.Mock).mock.calls[0][0].html).toContain(
      'Can we build &lt;something&gt; memorable?',
    );
  });

  it('falls back to the sender email in the system notification when subject is absent', async () => {
    const noSubject = { ...message, subject: undefined };
    (ContactMessageRepository.create as jest.Mock).mockResolvedValue(noSubject);

    await ContactMessageService.createContactMessage(noSubject);

    expect(createSystemNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: message.email }),
    );
  });

  it('returns paginated contact messages', async () => {
    const page = {
      data: [message],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    };
    (
      ContactMessageRepository.findAdminPaginated as jest.Mock
    ).mockResolvedValue(page);

    await expect(
      ContactMessageService.getContactMessages({ filter: 'unread' }),
    ).resolves.toEqual(page);
    expect(ContactMessageRepository.findAdminPaginated).toHaveBeenCalledWith({
      filter: 'unread',
    });
  });

  it('gets a message by id', async () => {
    (ContactMessageRepository.findByIdLean as jest.Mock).mockResolvedValue(
      message,
    );

    await expect(ContactMessageService.getContactMessage(id)).resolves.toEqual(
      message,
    );
  });

  it('throws 404 when getting a missing message', async () => {
    (ContactMessageRepository.findByIdLean as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      ContactMessageService.getContactMessage(id),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Message not found',
    });
  });

  it('updates an existing message', async () => {
    const updated = { ...message, is_read: true };
    (ContactMessageRepository.findByIdLean as jest.Mock).mockResolvedValue(
      message,
    );
    (ContactMessageRepository.updateById as jest.Mock).mockResolvedValue(
      updated,
    );

    await expect(
      ContactMessageService.updateContactMessage(id, { is_read: true }),
    ).resolves.toEqual(updated);
    expect(ContactMessageRepository.updateById).toHaveBeenCalledWith(id, {
      is_read: true,
    });
  });

  it('does not update a missing message', async () => {
    (ContactMessageRepository.findByIdLean as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      ContactMessageService.updateContactMessage(id, { is_archived: true }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(ContactMessageRepository.updateById).not.toHaveBeenCalled();
  });

  it('soft-deletes an existing message', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (ContactMessageRepository.findById as jest.Mock).mockResolvedValue({
      softDelete,
    });

    await expect(
      ContactMessageService.deleteContactMessage(id),
    ).resolves.toBeUndefined();
    expect(softDelete).toHaveBeenCalledWith();
  });

  it('does not soft-delete a missing message', async () => {
    (ContactMessageRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      ContactMessageService.deleteContactMessage(id),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });

  it('permanently deletes an existing message', async () => {
    (ContactMessageRepository.findByIdLean as jest.Mock).mockResolvedValue(
      message,
    );

    await expect(
      ContactMessageService.deleteContactMessagePermanent(id),
    ).resolves.toBeUndefined();
    expect(ContactMessageRepository.hardDeleteById).toHaveBeenCalledWith(id);
    // The bell notifications for this message must go with it.
    expect(deleteSystemNotificationsByReference).toHaveBeenCalledWith(id);
  });

  it('does not permanently delete a missing message', async () => {
    (ContactMessageRepository.findByIdLean as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      ContactMessageService.deleteContactMessagePermanent(id),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
    expect(ContactMessageRepository.hardDeleteById).not.toHaveBeenCalled();
    expect(deleteSystemNotificationsByReference).not.toHaveBeenCalled();
  });

  it('returns the unread message count', async () => {
    (ContactMessageRepository.countUnread as jest.Mock).mockResolvedValue(5);

    await expect(ContactMessageService.getUnreadCount()).resolves.toBe(5);
  });
});

/* eslint-disable no-console */
import { Notification } from '../modules/notification/notification.model';
import { NotificationRecipient } from '../modules/notification-recipient/notification-recipient.model';
import { User } from '../modules/user/user.model';
import { invalidateCacheByPattern } from './cache.utils';

interface SystemNotificationPayload {
  title: string;
  message: string;
  type: 'booking' | 'contact';
  metadata?: { url?: string };
}

/**
 * Creates an in-app notification and a NotificationRecipient for every
 * admin/editor user. Fire-and-forget — never throws to the caller.
 */
export const createSystemNotification = (
  payload: SystemNotificationPayload,
): void => {
  void (async () => {
    try {
      const notification = await Notification.create({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: 'high',
        channels: ['web'],
        status: 'active',
      });

      const admins = await User.find({
        role: { $in: ['admin', 'editor'] },
        is_deleted: { $ne: true },
        status: { $ne: 'blocked' },
      })
        .select('_id')
        .lean();

      if (!admins.length) return;

      const recipients = admins.map((u) => ({
        notification: notification._id,
        recipient: u._id,
        metadata: payload.metadata ?? {},
        is_read: false,
      }));

      await NotificationRecipient.insertMany(recipients, { ordered: false });
      await invalidateCacheByPattern('notification-recipient:*');
    } catch (err) {
      console.warn('createSystemNotification failed (non-fatal):', err);
    }
  })();
};

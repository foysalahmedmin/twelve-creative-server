/* eslint-disable no-console */
import { Notification } from '../modules/notification/notification.model';
import { NotificationRecipient } from '../modules/notification-recipient/notification-recipient.model';
import { invalidateCacheByPattern } from './cache.utils';

/**
 * Removes the in-app notifications raised for a source record (a booking or a
 * contact message) once that record is permanently deleted, so the bell never
 * points at something that no longer exists.
 *
 * Fire-and-forget by contract: a cleanup failure must never turn a successful
 * delete into an error response, so everything is caught and logged.
 *
 * Reads go through `.collection` deliberately — the schema's `pre(/^find/)`
 * hook force-filters `is_deleted`, which would hide soft-deleted recipients
 * and leave them behind as exactly the orphans this is meant to remove.
 */
export const deleteSystemNotificationsByReference = async (
  reference: string,
): Promise<void> => {
  try {
    const recipients = await NotificationRecipient.collection
      .find({ 'metadata.reference': reference })
      .project({ notification: 1 })
      .toArray();

    if (!recipients.length) return;

    // One row exists per admin, so the same notification id repeats here;
    // duplicates inside `$in` are harmless.
    const notificationIds = recipients.map((r) => r.notification);

    await NotificationRecipient.collection.deleteMany({
      'metadata.reference': reference,
    });
    await Notification.collection.deleteMany({
      _id: { $in: notificationIds },
    });

    await invalidateCacheByPattern('notification-recipient:*');
  } catch (err) {
    console.warn(
      'deleteSystemNotificationsByReference failed (non-fatal):',
      err,
    );
  }
};

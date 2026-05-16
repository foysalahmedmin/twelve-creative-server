import { publish } from '../../events/event-publisher';

export const emitNotificationSent = (
  notificationId: string,
  recipientCount: number,
) => publish('notification.sent', { notificationId, recipientCount });

export const emitNotificationRead = (notificationId: string, userId: string) =>
  publish('notification.sent', { notificationId, userId, type: 'read' });

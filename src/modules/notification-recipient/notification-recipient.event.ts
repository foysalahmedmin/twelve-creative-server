import { publish } from '../../events/event-publisher';

export const emitNotificationDelivered = (
  recipientId: string,
  notificationId: string,
  userId: string,
) =>
  publish('notification.sent', {
    recipientId,
    notificationId,
    userId,
    type: 'delivered',
  });

export const emitNotificationRead = (recipientId: string, userId: string) =>
  publish('notification.sent', { recipientId, userId, type: 'recipient_read' });

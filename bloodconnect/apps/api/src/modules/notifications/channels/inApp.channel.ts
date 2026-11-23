import { dbStore } from '../../../data/dbStore';
import { sseHub } from '../sseHub';
import { NotificationChannel, DeliveryStatus } from '@bloodconnect/shared';

export interface InAppPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class InAppChannel {
  static async send(payload: InAppPayload): Promise<void> {
    const notification = await dbStore.notifications.create({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      dataJson: payload.data ? JSON.stringify(payload.data) : null,
    });

    await dbStore.notificationDeliveries.create({
      notificationId: notification.id,
      channel: NotificationChannel.IN_APP,
      status: DeliveryStatus.SENT,
      attempts: 1,
      sentAt: new Date().toISOString(),
    });

    // Real-time delivery via SSE Hub
    sseHub.broadcastToUser(payload.userId, 'notification', {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      data: payload.data,
      createdAt: notification.createdAt,
    });
  }
}

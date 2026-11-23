import { logger } from '../../../common/logger/pino';
import { NotificationChannel, DeliveryStatus } from '@bloodconnect/shared';
import { dbStore } from '../../../data/dbStore';
import { config } from '../../../config/index';

export interface EmailPayload {
  toEmail: string;
  userId?: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  notificationId?: string;
}

export class EmailChannel {
  static async send(payload: EmailPayload): Promise<void> {
    logger.info({
      to: payload.toEmail,
      subject: payload.subject,
      preview: payload.textBody.slice(0, 80),
    }, '[EMAIL DISPATCH] Mock Email Delivered to inbox');

    if (payload.notificationId) {
      await dbStore.notificationDeliveries.create({
        notificationId: payload.notificationId,
        channel: NotificationChannel.EMAIL,
        status: DeliveryStatus.SENT,
        attempts: 1,
        sentAt: new Date().toISOString(),
      });
    }
  }
}

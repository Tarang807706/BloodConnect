import { Request } from 'express';
import { logger } from '../../common/logger/pino';
import { dbStore } from '../../data/dbStore';

export interface CreateAuditLogParams {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  details?: Record<string, any>;
  req?: Request;
}

export class AuditService {
  static async log(params: CreateAuditLogParams): Promise<void> {
    const ipAddress = params.req?.ip || params.req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = params.req?.headers['user-agent'] || 'BloodConnect-Internal';

    try {
      await dbStore.auditLogs.create({
        actorUserId: params.actorUserId ?? (params.req?.user?.userId || null),
        actorRole: params.actorRole ?? (params.req?.user?.role || null),
        action: params.action,
        targetEntity: params.targetEntity,
        targetId: params.targetId || null,
        ipAddress: String(ipAddress),
        userAgent: String(userAgent),
        detailsJson: params.details ? JSON.stringify(params.details) : null,
      });

      logger.info({
        action: params.action,
        entity: params.targetEntity,
        targetId: params.targetId,
        actor: params.actorUserId || 'system',
      }, 'Audit log recorded');
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to write audit log');
    }
  }
}

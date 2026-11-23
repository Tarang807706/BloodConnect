import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';

export class AdminController {
  static async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listUsers();
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.toggleUserStatus(
        req.params.id,
        req.body.isActive,
        req.user!.userId
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async listOrganizations(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.listOrganizations();
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.verifyOrganization(
        req.params.id,
        req.body.status,
        req.body.adminNotes,
        req.user!.userId
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getAnalytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAnalytics();
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAuditLogs(req.query as any);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async exportAuditLogs(_req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await AdminService.exportAuditLogsCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="bloodconnect-audit-logs.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  static async getStageRules(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getStageRules();
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateStageRule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.updateStageRule(req.body);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getSystemConfigs(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getSystemConfigs();
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateSystemConfig(req: Request, res: Response, next: NextFunction) {
    try {
      await AdminService.updateSystemConfig(
        req.body.configKey,
        req.body.configValue,
        req.body.description,
        req.user!.userId
      );
      res.envelope({ success: true });
    } catch (err) {
      next(err);
    }
  }

  static async getGroupMappings(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getGroupMappings();
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async setGroupMapping(req: Request, res: Response, next: NextFunction) {
    try {
      await AdminService.setGroupMapping(
        req.body.requestedGroup,
        req.body.targetDonorGroup,
        req.body.notes
      );
      res.envelope({ success: true }, undefined, 201);
    } catch (err) {
      next(err);
    }
  }
}

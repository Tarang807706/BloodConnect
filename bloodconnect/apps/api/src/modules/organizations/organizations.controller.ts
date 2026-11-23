import { Request, Response, NextFunction } from 'express';
import { OrganizationsService } from './organizations.service';

export class OrganizationsController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrganizationsService.register(req.body);
      res.envelope(result, undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrganizationsService.getMyOrganization(req.user!.organizationId!);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async listCentres(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrganizationsService.listAuthorizedCentres();
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }
}

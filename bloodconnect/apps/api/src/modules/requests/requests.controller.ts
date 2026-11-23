import { Request, Response, NextFunction } from 'express';
import { RequestsService } from './requests.service';

export class RequestsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RequestsService.createRequest(
        req.user!.organizationId!,
        req.user!.userId,
        req.body
      );
      res.envelope(result, undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RequestsService.listRequests({
        role: req.user!.role,
        organizationId: req.user!.organizationId,
      });
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RequestsService.getRequestDetail(req.params.id, {
        role: req.user!.role,
        organizationId: req.user!.organizationId,
      });
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RequestsService.cancelRequest(
        req.params.id,
        req.user!.organizationId!,
        req.user!.userId,
        req.body
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getPendingForCentre(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RequestsService.getPendingForCentre(req.user!.organizationId!);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RequestsService.verifyRequest(
        req.params.id,
        req.user!.organizationId!,
        req.user!.userId,
        req.body
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }
}

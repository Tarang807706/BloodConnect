import { Request, Response, NextFunction } from 'express';
import { NgoService } from './ngo.service';

export class NgoController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NgoService.getDashboard(req.user!.organizationId!);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getCases(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NgoService.getActivatedCases(req.user!.organizationId!);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async listVolunteers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NgoService.listVolunteers(req.user!.organizationId!);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async createVolunteer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NgoService.createVolunteer(req.user!.organizationId!, req.body);
      res.envelope(result, undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async broadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NgoService.broadcastToVolunteers(req.params.id, req.user!.organizationId!, req.body);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async recordResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NgoService.recordVolunteerResponse(req.user!.organizationId!, req.body);
      res.envelope(result, undefined, 201);
    } catch (err) {
      next(err);
    }
  }
}

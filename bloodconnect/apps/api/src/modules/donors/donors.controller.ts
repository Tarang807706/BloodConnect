import { Request, Response, NextFunction } from 'express';
import { DonorsService } from './donors.service';

export class DonorsController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonorsService.getProfile(req.user!.userId);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonorsService.updateProfile(req.user!.userId, req.body);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonorsService.updateAvailability(req.user!.userId, req.body);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonorsService.updatePreferences(req.user!.userId, req.body);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonorsService.getReceivedRequests(req.user!.userId);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getResponses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DonorsService.getResponseHistory(req.user!.userId);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }
}

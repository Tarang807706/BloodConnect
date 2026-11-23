import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  static async registerDonor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerDonor(req.body);
      res.envelope(result, undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refreshTokens(req.body.refreshToken);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logout(req.body?.refreshToken);
      res.envelope({ message: 'Successfully logged out' });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getCurrentUser(req.user!.userId);
      res.envelope(user);
    } catch (err) {
      next(err);
    }
  }
}

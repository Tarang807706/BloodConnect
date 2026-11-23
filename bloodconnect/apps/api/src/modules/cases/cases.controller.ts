import { Request, Response, NextFunction } from 'express';
import { CasesService } from './cases.service';

export class CasesController {
  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.activateCase(
        req.params.requestId,
        req.user!.organizationId!,
        req.user!.userId,
        req.body?.notes
      );
      res.envelope(result, undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.listCases({
        role: req.user!.role,
        organizationId: req.user!.organizationId,
        donorProfileId: req.user!.donorProfileId,
      });
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.getCaseDetail(req.params.id, {
        role: req.user!.role,
        organizationId: req.user!.organizationId,
        donorProfileId: req.user!.donorProfileId,
      });
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async respond(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.submitDonorResponse(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async escalate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.manualEscalate(
        req.params.id,
        req.user!.userId,
        req.body.reason
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async pause(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.pauseCase(
        req.params.id,
        req.user!.userId,
        req.body.reason
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.resumeCase(req.params.id, req.user!.userId);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.cancelCase(
        req.params.id,
        req.user!.userId,
        req.body.reason
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.closeCase(
        req.params.id,
        req.user!.userId,
        req.body.closingNotes
      );
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }

  static async recordOutcome(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.recordDonationOutcome(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.envelope(result, undefined, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getOutcomes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CasesService.getOutcomes(req.params.id);
      res.envelope(result);
    } catch (err) {
      next(err);
    }
  }
}

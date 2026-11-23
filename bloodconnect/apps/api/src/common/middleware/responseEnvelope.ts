import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Response {
      envelope: (data: any, meta?: Record<string, any>, statusCode?: number) => Response;
    }
  }
}

export const responseEnvelopeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.envelope = (data: any, meta?: Record<string, any>, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      meta: {
        requestId: (req as any).id,
        ...meta,
      },
    });
  };
  next();
};

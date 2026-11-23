import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../logger/pino';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as any).id || 'unknown';

  if (err instanceof AppError) {
    logger.warn({
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      path: req.originalUrl,
    }, 'Handled operational error');

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        requestId,
      },
    });
  }

  // Unhandled internal errors
  logger.error({
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
  }, 'Unhandled internal error');

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please contact support.',
    },
    meta: {
      requestId,
    },
  });
};

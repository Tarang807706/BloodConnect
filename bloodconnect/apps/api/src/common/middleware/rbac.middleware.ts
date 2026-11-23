import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@bloodconnect/shared';
import { AppError } from '../errors/AppError';

export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (req.user.role === UserRole.ADMIN) {
      return next(); // Admins have supervisory override
    }

    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Action requires one of the following roles: [${roles.join(', ')}]`));
    }

    return next();
  };
};

export const requireOrganization = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(AppError.unauthorized());
  }

  if (req.user.role === UserRole.DONOR) {
    return next(AppError.forbidden('Action is reserved for verified organizations'));
  }

  if (req.user.role !== UserRole.ADMIN && !req.user.organizationId) {
    return next(AppError.forbidden('User does not belong to an active organization'));
  }

  return next();
};

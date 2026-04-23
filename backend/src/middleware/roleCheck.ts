import { Request, Response, NextFunction } from 'express';
import { forbidden } from '../utils/errors';

/**
 * Middleware factory that checks if the authenticated user has one of the allowed roles.
 * Must be used after authMiddleware.
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.dbUser) {
      const error = forbidden('Authentication required');
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message, details: {} },
      });
      return;
    }

    if (!allowedRoles.includes(req.dbUser.role)) {
      const error = forbidden(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message, details: {} },
      });
      return;
    }

    next();
  };
};

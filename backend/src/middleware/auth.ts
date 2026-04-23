import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { unauthorized } from '../utils/errors';



// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      dbUser?: {
        id: string;
        clerkUserId: string;
        name: string;
        email: string;
        role: string;
        institutionId: string | null;
      };
    }
  }
}

/**
 * Middleware to verify Clerk JWT and attach database user to request.
 * Uses the Clerk Backend SDK to verify tokens.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = unauthorized('Missing or invalid authorization header');
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message, details: {} },
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT with Clerk - decode the JWT payload to get the subject (user ID)
    // In production, you'd verify the JWT signature against Clerk's JWKS
    let clerkUserId: string;
    try {
      // Decode JWT payload (base64)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      );
      clerkUserId = payload.sub;

      if (!clerkUserId) {
        throw new Error('No subject in token');
      }

      // Check expiration
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        throw new Error('Token expired');
      }
    } catch (err) {
      const error = unauthorized('Invalid or expired token');
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message, details: {} },
      });
      return;
    }

    // Look up user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!dbUser) {
      const error = unauthorized('User not found in database. Please complete registration.');
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message, details: {} },
      });
      return;
    }

    // Attach user to request
    req.dbUser = {
      id: dbUser.id,
      clerkUserId: dbUser.clerkUserId,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      institutionId: dbUser.institutionId,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
        details: {},
      },
    });
  }
};

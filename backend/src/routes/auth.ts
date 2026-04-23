import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/errors';

const router = Router();


/**
 * POST /auth/register
 * Create user account and sync with Clerk.
 * Public endpoint - no auth required.
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkUserId, name, email, role, institutionId } = req.body;

    // Validate required fields
    if (!clerkUserId || !name || !email || !role) {
      res.status(400).json(
        errorResponse(400, 'VALIDATION_ERROR', 'Missing required fields: clerkUserId, name, email, role')
      );
      return;
    }

    // Validate role
    const validRoles = ['student', 'trainer', 'institution', 'programme_manager', 'monitoring_officer'];
    if (!validRoles.includes(role)) {
      res.status(400).json(
        errorResponse(400, 'VALIDATION_ERROR', `Invalid role. Must be one of: ${validRoles.join(', ')}`)
      );
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkUserId }, { email }],
      },
    });

    if (existingUser) {
      res.status(409).json(
        errorResponse(409, 'DUPLICATE_ENTRY', 'User with this email or Clerk ID already exists')
      );
      return;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        clerkUserId,
        name,
        email,
        role,
        institutionId: institutionId || null,
      },
    });

    res.status(201).json(successResponse(user));
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(
      errorResponse(500, 'INTERNAL_ERROR', 'Failed to register user')
    );
  }
});

/**
 * GET /auth/me
 * Get current user profile.
 * Requires authentication.
 */
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.dbUser!.id },
      include: {
        institution: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      res.status(404).json(errorResponse(404, 'NOT_FOUND', 'User not found'));
      return;
    }

    res.json(successResponse(user));
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json(
      errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch user profile')
    );
  }
});

/**
 * GET /auth/institutions
 * List all institutions (for registration dropdown).
 * Public endpoint.
 */
router.get('/institutions', async (_req: Request, res: Response): Promise<void> => {
  try {
    const institutions = await prisma.institution.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });

    res.json(successResponse(institutions));
  } catch (error) {
    console.error('List institutions error:', error);
    res.status(500).json(
      errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch institutions')
    );
  }
});

export default router;

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { successResponse, errorResponse } from '../utils/errors';
import crypto from 'crypto';

const router = Router();

/**
 * POST /batches
 * Create a new batch.
 * Allowed: Trainer, Institution
 */
router.post(
  '/',
  authMiddleware,
  requireRole('trainer', 'institution'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, institutionId } = req.body;

      if (!name || !institutionId) {
        res.status(400).json(
          errorResponse(400, 'VALIDATION_ERROR', 'Missing required fields: name, institutionId')
        );
        return;
      }

      // Validate institution exists
      const institution = await prisma.institution.findUnique({
        where: { id: institutionId },
      });

      if (!institution) {
        res.status(404).json(errorResponse(404, 'NOT_FOUND', 'Institution not found'));
        return;
      }

      // Validate access
      if (req.dbUser!.role === 'trainer' && req.dbUser!.institutionId !== institutionId) {
        res.status(403).json(
          errorResponse(403, 'FORBIDDEN', 'You can only create batches for your assigned institution')
        );
        return;
      }

      if (req.dbUser!.role === 'institution' && req.dbUser!.institutionId !== institutionId) {
        res.status(403).json(
          errorResponse(403, 'FORBIDDEN', 'You can only create batches for your own institution')
        );
        return;
      }

      const batch = await prisma.batch.create({
        data: { name, institutionId },
      });

      // If trainer creates the batch, auto-assign them
      if (req.dbUser!.role === 'trainer') {
        await prisma.batchTrainer.create({
          data: {
            batchId: batch.id,
            trainerId: req.dbUser!.id,
          },
        });
      }

      res.status(201).json(successResponse(batch));
    } catch (error) {
      console.error('Create batch error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to create batch')
      );
    }
  }
);

/**
 * GET /batches
 * List batches for current user.
 * Trainers: batches they are assigned to
 * Students: batches they are enrolled in
 * Institution: batches under their institution
 */
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.dbUser!;
      let batches;

      if (user.role === 'trainer') {
        batches = await prisma.batch.findMany({
          where: {
            trainers: { some: { trainerId: user.id } },
          },
          include: {
            institution: { select: { id: true, name: true } },
            students: { select: { id: true } },
            sessions: { select: { id: true } },
          },
        });
      } else if (user.role === 'student') {
        batches = await prisma.batch.findMany({
          where: {
            students: { some: { studentId: user.id } },
          },
          include: {
            institution: { select: { id: true, name: true } },
            trainers: {
              include: { trainer: { select: { id: true, name: true } } },
            },
          },
        });
      } else if (user.role === 'institution') {
        batches = await prisma.batch.findMany({
          where: { institutionId: user.institutionId! },
          include: {
            students: { select: { id: true } },
            sessions: { select: { id: true } },
            trainers: {
              include: { trainer: { select: { id: true, name: true } } },
            },
          },
        });
      } else {
        // Programme Manager or Monitoring Officer - see all batches
        batches = await prisma.batch.findMany({
          include: {
            institution: { select: { id: true, name: true } },
            students: { select: { id: true } },
            sessions: { select: { id: true } },
          },
        });
      }

      // Map to include counts
      const batchesWithCounts = batches.map((batch: any) => ({
        ...batch,
        studentCount: batch.students?.length || 0,
        sessionCount: batch.sessions?.length || 0,
      }));

      res.json(successResponse(batchesWithCounts));
    } catch (error) {
      console.error('List batches error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch batches')
      );
    }
  }
);

/**
 * POST /batches/:id/invite
 * Generate invite link for batch.
 * Allowed: Trainer
 */
router.post(
  '/:id/invite',
  authMiddleware,
  requireRole('trainer'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { expiresIn = 7 } = req.body; // days

      // Verify trainer is assigned to this batch
      const batchTrainer = await prisma.batchTrainer.findFirst({
        where: { batchId: id as string, trainerId: req.dbUser!.id },
      });

      if (!batchTrainer) {
        res.status(403).json(
          errorResponse(403, 'FORBIDDEN', 'You are not assigned to this batch')
        );
        return;
      }

      // Generate unique invite code
      const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      const invite = await prisma.batchInvite.create({
        data: {
          batchId: id as string,
          inviteCode,
          createdBy: req.dbUser!.id,
          expiresAt,
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      res.status(201).json(
        successResponse({
          inviteCode: invite.inviteCode,
          inviteUrl: `${frontendUrl}/join/${invite.inviteCode}`,
          batchId: id,
          expiresAt: invite.expiresAt,
        })
      );
    } catch (error) {
      console.error('Generate invite error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to generate invite link')
      );
    }
  }
);

/**
 * POST /batches/join
 * Student joins batch using invite code.
 * Allowed: Student
 */
router.post(
  '/join',
  authMiddleware,
  requireRole('student'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { inviteCode } = req.body;

      if (!inviteCode) {
        res.status(400).json(
          errorResponse(400, 'VALIDATION_ERROR', 'Missing invite code')
        );
        return;
      }

      // Find invite
      const invite = await prisma.batchInvite.findUnique({
        where: { inviteCode },
        include: { batch: true },
      });

      if (!invite) {
        res.status(400).json(
          errorResponse(400, 'INVALID_INVITE', 'Invite code not found')
        );
        return;
      }

      if (!invite.isActive) {
        res.status(400).json(
          errorResponse(400, 'INVALID_INVITE', 'This invite has been deactivated')
        );
        return;
      }

      if (invite.expiresAt && new Date() > invite.expiresAt) {
        res.status(400).json(
          errorResponse(400, 'EXPIRED_INVITE', 'This invite code has expired')
        );
        return;
      }

      // Check if student is already in batch
      const existing = await prisma.batchStudent.findFirst({
        where: {
          batchId: invite.batchId,
          studentId: req.dbUser!.id,
        },
      });

      if (existing) {
        res.status(409).json(
          errorResponse(409, 'DUPLICATE_ENTRY', 'You are already in this batch')
        );
        return;
      }

      // Add student to batch
      const enrollment = await prisma.batchStudent.create({
        data: {
          batchId: invite.batchId,
          studentId: req.dbUser!.id,
        },
      });

      res.json(
        successResponse({
          batchId: enrollment.batchId,
          batchName: invite.batch.name,
          studentId: enrollment.studentId,
          joinedAt: enrollment.joinedAt,
        })
      );
    } catch (error) {
      console.error('Join batch error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to join batch')
      );
    }
  }
);

/**
 * GET /batches/:id/summary
 * Get attendance summary for a batch.
 * Allowed: Institution, Trainer
 */
router.get(
  '/:id/summary',
  authMiddleware,
  requireRole('institution', 'trainer', 'programme_manager'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const batch: any = await prisma.batch.findUnique({
        where: { id: id as string },
        include: {
          institution: { select: { id: true, name: true } },
          students: {
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
          },
          sessions: {
            include: {
              attendance: true,
            },
          },
        },
      });

      if (!batch) {
        res.status(404).json(errorResponse(404, 'NOT_FOUND', 'Batch not found'));
        return;
      }

      // Validate access for institution users
      if (
        req.dbUser!.role === 'institution' &&
        batch.institutionId !== req.dbUser!.institutionId
      ) {
        res.status(403).json(
          errorResponse(403, 'FORBIDDEN', 'You can only view batches from your institution')
        );
        return;
      }

      // Calculate student summaries
      const totalSessions = batch.sessions.length;
      const studentSummaries = batch.students.map((bs) => {
        const studentAttendances = batch.sessions.flatMap((s) =>
          s.attendance.filter((a) => a.studentId === bs.studentId)
        );
        const sessionsAttended = studentAttendances.filter(
          (a) => a.status === 'present' || a.status === 'late'
        ).length;

        return {
          studentId: bs.student.id,
          studentName: bs.student.name,
          sessionsAttended,
          totalSessions,
          attendanceRate: totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 1000) / 10 : 0,
        };
      });

      const totalStudents = batch.students.length;
      const avgAttendance =
        studentSummaries.length > 0
          ? Math.round(
              (studentSummaries.reduce((sum, s) => sum + s.attendanceRate, 0) /
                studentSummaries.length) *
                10
            ) / 10
          : 0;

      res.json(
        successResponse({
          batchId: batch.id,
          batchName: batch.name,
          institution: batch.institution,
          totalSessions,
          totalStudents,
          averageAttendance: avgAttendance,
          studentSummaries,
        })
      );
    } catch (error) {
      console.error('Batch summary error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch batch summary')
      );
    }
  }
);

export default router;

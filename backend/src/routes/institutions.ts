import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { successResponse, errorResponse } from '../utils/errors';

const router = Router();


/**
 * GET /institutions
 * List all institutions.
 * Allowed: Programme Manager, Monitoring Officer
 */
router.get(
  '/',
  authMiddleware,
  requireRole('programme_manager', 'monitoring_officer', 'institution'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      let institutions;

      if (req.dbUser!.role === 'institution') {
        // Institution user sees only their own institution
        institutions = await prisma.institution.findMany({
          where: { id: req.dbUser!.institutionId! },
          include: {
            batches: {
              select: { id: true },
            },
            users: {
              where: { role: 'trainer' },
              select: { id: true },
            },
          },
        });
      } else {
        institutions = await prisma.institution.findMany({
          include: {
            batches: {
              select: { id: true },
            },
            users: {
              where: { role: 'trainer' },
              select: { id: true },
            },
          },
          orderBy: { name: 'asc' },
        });
      }

      const enhanced = institutions.map((inst: any) => ({
        id: inst.id,
        name: inst.name,
        code: inst.code,
        batchCount: inst.batches.length,
        trainerCount: inst.users.length,
        createdAt: inst.createdAt,
      }));

      res.json(successResponse(enhanced));
    } catch (error) {
      console.error('List institutions error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch institutions')
      );
    }
  }
);

/**
 * GET /institutions/:id/summary
 * Get attendance summary for all batches in institution.
 * Allowed: Programme Manager, Institution
 */
router.get(
  '/:id/summary',
  authMiddleware,
  requireRole('programme_manager', 'institution', 'monitoring_officer'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate institution access
      if (req.dbUser!.role === 'institution' && req.dbUser!.institutionId !== id) {
        res.status(403).json(
          errorResponse(403, 'FORBIDDEN', 'You can only view your own institution summary')
        );
        return;
      }

      const institution = await prisma.institution.findUnique({
        where: { id },
        include: {
          batches: {
            include: {
              students: { select: { id: true } },
              sessions: {
                include: {
                  attendance: { select: { status: true } },
                },
              },
              trainers: {
                include: {
                  trainer: { select: { id: true, name: true } },
                },
              },
            },
          },
          users: {
            where: { role: 'trainer' },
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!institution) {
        res.status(404).json(errorResponse(404, 'NOT_FOUND', 'Institution not found'));
        return;
      }

      // Calculate batch summaries
      const batchSummaries = institution.batches.map((batch) => {
        const totalSessions = batch.sessions.length;
        const totalStudents = batch.students.length;

        let totalAttendanceRate = 0;
        if (totalSessions > 0 && totalStudents > 0) {
          const totalPossible = totalSessions * totalStudents;
          const totalPresent = batch.sessions.reduce((sum, s) => {
            return sum + s.attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
          }, 0);
          totalAttendanceRate = Math.round((totalPresent / totalPossible) * 1000) / 10;
        }

        return {
          batchId: batch.id,
          batchName: batch.name,
          studentCount: totalStudents,
          sessionCount: totalSessions,
          averageAttendance: totalAttendanceRate,
          trainers: batch.trainers.map((bt) => ({
            id: bt.trainer.id,
            name: bt.trainer.name,
          })),
        };
      });

      const totalBatches = institution.batches.length;
      const totalStudents = batchSummaries.reduce((sum, b) => sum + b.studentCount, 0);
      const totalSessions = batchSummaries.reduce((sum, b) => sum + b.sessionCount, 0);
      const averageAttendance =
        batchSummaries.length > 0
          ? Math.round(
              (batchSummaries.reduce((sum, b) => sum + b.averageAttendance, 0) / batchSummaries.length) * 10
            ) / 10
          : 0;

      res.json(
        successResponse({
          institutionId: institution.id,
          institutionName: institution.name,
          institutionCode: institution.code,
          totalBatches,
          totalStudents,
          totalSessions,
          averageAttendance,
          trainers: institution.users,
          batchSummaries,
        })
      );
    } catch (error) {
      console.error('Institution summary error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch institution summary')
      );
    }
  }
);

export default router;

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { successResponse, errorResponse } from '../utils/errors';

const router = Router();


/**
 * GET /programme/summary
 * Get programme-wide attendance summary.
 * Allowed: Programme Manager, Monitoring Officer
 */
router.get(
  '/summary',
  authMiddleware,
  requireRole('programme_manager', 'monitoring_officer'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const institutions = await prisma.institution.findMany({
        include: {
          batches: {
            include: {
              students: { select: { id: true } },
              sessions: {
                include: {
                  attendance: { select: { status: true } },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Calculate per-institution summaries
      const institutionSummaries = institutions.map((inst) => {
        const batchCount = inst.batches.length;
        const studentCount = inst.batches.reduce(
          (sum, b) => sum + b.students.length,
          0
        );
        const sessionCount = inst.batches.reduce(
          (sum, b) => sum + b.sessions.length,
          0
        );

        // Calculate average attendance
        let totalPossible = 0;
        let totalPresent = 0;

        inst.batches.forEach((batch) => {
          const batchStudents = batch.students.length;
          batch.sessions.forEach((session) => {
            totalPossible += batchStudents;
            totalPresent += session.attendance.filter(
              (a) => a.status === 'present' || a.status === 'late'
            ).length;
          });
        });

        const averageAttendance =
          totalPossible > 0
            ? Math.round((totalPresent / totalPossible) * 1000) / 10
            : 0;

        return {
          institutionId: inst.id,
          institutionName: inst.name,
          institutionCode: inst.code,
          batchCount,
          studentCount,
          sessionCount,
          averageAttendance,
        };
      });

      // Overall stats
      const totalInstitutions = institutions.length;
      const totalBatches = institutionSummaries.reduce(
        (sum, i) => sum + i.batchCount,
        0
      );
      const totalStudents = institutionSummaries.reduce(
        (sum, i) => sum + i.studentCount,
        0
      );
      const totalSessions = institutionSummaries.reduce(
        (sum, i) => sum + i.sessionCount,
        0
      );
      const averageAttendance =
        institutionSummaries.length > 0
          ? Math.round(
              (institutionSummaries.reduce(
                (sum, i) => sum + i.averageAttendance,
                0
              ) /
                institutionSummaries.length) *
                10
            ) / 10
          : 0;

      res.json(
        successResponse({
          totalInstitutions,
          totalBatches,
          totalStudents,
          totalSessions,
          averageAttendance,
          institutionSummaries,
        })
      );
    } catch (error) {
      console.error('Programme summary error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch programme summary')
      );
    }
  }
);

export default router;

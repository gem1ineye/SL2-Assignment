import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { successResponse, errorResponse } from '../utils/errors';

const router = Router();


/**
 * POST /attendance/mark
 * Student marks their own attendance.
 * Allowed: Student
 */
router.post(
  '/mark',
  authMiddleware,
  requireRole('student'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, status } = req.body;

      if (!sessionId || !status) {
        res.status(400).json(
          errorResponse(400, 'VALIDATION_ERROR', 'Missing required fields: sessionId, status')
        );
        return;
      }

      // Validate status
      const validStatuses = ['present', 'absent', 'late'];
      if (!validStatuses.includes(status)) {
        res.status(400).json(
          errorResponse(400, 'VALIDATION_ERROR', `Invalid status. Must be one of: ${validStatuses.join(', ')}`)
        );
        return;
      }

      // Find session
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          batch: {
            include: {
              students: { where: { studentId: req.dbUser!.id } },
            },
          },
        },
      });

      if (!session) {
        res.status(404).json(errorResponse(404, 'NOT_FOUND', 'Session not found'));
        return;
      }

      // Check if student is enrolled in the batch
      if (session.batch.students.length === 0) {
        res.status(403).json(
          errorResponse(403, 'FORBIDDEN', 'You are not enrolled in this batch')
        );
        return;
      }

      // Check if already marked - update instead
      const existing = await prisma.attendance.findFirst({
        where: {
          sessionId,
          studentId: req.dbUser!.id,
        },
      });

      let attendance;
      if (existing) {
        attendance = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status, updatedAt: new Date() },
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            sessionId,
            studentId: req.dbUser!.id,
            status,
          },
        });
      }

      res.status(existing ? 200 : 201).json(
        successResponse({
          id: attendance.id,
          sessionId: attendance.sessionId,
          studentId: attendance.studentId,
          status: attendance.status,
          markedAt: attendance.markedAt,
          updated: !!existing,
        })
      );
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to mark attendance')
      );
    }
  }
);

/**
 * GET /attendance/my
 * Get attendance history for current student.
 * Allowed: Student
 */
router.get(
  '/my',
  authMiddleware,
  requireRole('student'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const attendances = await prisma.attendance.findMany({
        where: { studentId: req.dbUser!.id },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              date: true,
              startTime: true,
              endTime: true,
              batch: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { markedAt: 'desc' },
      });

      const totalSessions = attendances.length;
      const presentCount = attendances.filter((a) => a.status === 'present').length;
      const lateCount = attendances.filter((a) => a.status === 'late').length;
      const absentCount = attendances.filter((a) => a.status === 'absent').length;

      res.json(
        successResponse({
          summary: {
            total: totalSessions,
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            attendanceRate:
              totalSessions > 0
                ? Math.round(((presentCount + lateCount) / totalSessions) * 1000) / 10
                : 0,
          },
          records: attendances,
        })
      );
    } catch (error) {
      console.error('My attendance error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch attendance history')
      );
    }
  }
);

export default router;

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { successResponse, errorResponse } from '../utils/errors';

const router = Router();


/**
 * POST /sessions
 * Create a training session.
 * Allowed: Trainer
 */
router.post(
  '/',
  authMiddleware,
  requireRole('trainer'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId, title, date, startTime, endTime } = req.body;

      if (!batchId || !title || !date || !startTime || !endTime) {
        res.status(400).json(
          errorResponse(400, 'VALIDATION_ERROR', 'Missing required fields: batchId, title, date, startTime, endTime')
        );
        return;
      }

      // Validate time
      if (startTime >= endTime) {
        res.status(400).json(
          errorResponse(400, 'VALIDATION_ERROR', 'End time must be after start time')
        );
        return;
      }

      // Verify trainer is assigned to this batch
      const batchTrainer = await prisma.batchTrainer.findFirst({
        where: { batchId, trainerId: req.dbUser!.id },
      });

      if (!batchTrainer) {
        res.status(403).json(
          errorResponse(403, 'FORBIDDEN', 'You are not assigned to this batch')
        );
        return;
      }

      const session = await prisma.session.create({
        data: {
          batchId,
          trainerId: req.dbUser!.id,
          title,
          date: new Date(date),
          startTime,
          endTime,
        },
        include: {
          batch: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(successResponse(session));
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to create session')
      );
    }
  }
);

/**
 * GET /sessions
 * List sessions for current user.
 * Trainers: sessions they created
 * Students: sessions from enrolled batches
 */
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.dbUser!;
      let sessions;

      if (user.role === 'trainer') {
        sessions = await prisma.session.findMany({
          where: { trainerId: user.id },
          include: {
            batch: { select: { id: true, name: true } },
            attendance: { select: { id: true, status: true } },
          },
          orderBy: { date: 'desc' },
        });
      } else if (user.role === 'student') {
        sessions = await prisma.session.findMany({
          where: {
            batch: {
              students: { some: { studentId: user.id } },
            },
          },
          include: {
            batch: { select: { id: true, name: true } },
            attendance: {
              where: { studentId: user.id },
              select: { status: true, markedAt: true },
            },
          },
          orderBy: { date: 'desc' },
        });
      } else {
        sessions = await prisma.session.findMany({
          include: {
            batch: { select: { id: true, name: true } },
            attendance: { select: { id: true, status: true } },
          },
          orderBy: { date: 'desc' },
        });
      }

      // Enhance with attendance stats
      const enhanced = sessions.map((session: any) => {
        const attendanceRecords = session.attendance || [];
        return {
          ...session,
          presentCount: attendanceRecords.filter((a: any) => a.status === 'present').length,
          absentCount: attendanceRecords.filter((a: any) => a.status === 'absent').length,
          lateCount: attendanceRecords.filter((a: any) => a.status === 'late').length,
          totalRecords: attendanceRecords.length,
        };
      });

      res.json(successResponse(enhanced));
    } catch (error) {
      console.error('List sessions error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch sessions')
      );
    }
  }
);

/**
 * GET /sessions/active
 * Get active sessions for current student.
 * Allowed: Student
 */
router.get(
  '/active',
  authMiddleware,
  requireRole('student'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sessions = await prisma.session.findMany({
        where: {
          batch: {
            students: { some: { studentId: req.dbUser!.id } },
          },
          date: { gte: today },
        },
        include: {
          batch: { select: { id: true, name: true } },
          trainer: { select: { id: true, name: true } },
          attendance: {
            where: { studentId: req.dbUser!.id },
            select: { status: true, markedAt: true },
          },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });

      const enhanced = sessions.map((session) => {
        const myAttendance = session.attendance[0];
        const now = new Date();
        const sessionDate = new Date(session.date);
        const isToday = sessionDate.toDateString() === now.toDateString();

        // Check if attendance window is open
        // Window: 15 min before start to 30 min after start
        let canMarkAttendance = false;
        if (isToday && !myAttendance) {
          const [startH, startM] = session.startTime.split(':').map(Number);
          const windowStart = new Date(now);
          windowStart.setHours(startH, startM - 15, 0, 0);
          const windowEnd = new Date(now);
          windowEnd.setHours(startH, startM + 30, 0, 0);
          canMarkAttendance = now >= windowStart && now <= windowEnd;
        }

        return {
          id: session.id,
          title: session.title,
          batchName: session.batch.name,
          batchId: session.batch.id,
          trainerName: session.trainer.name,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          attendanceStatus: myAttendance?.status || null,
          canMarkAttendance,
        };
      });

      res.json(successResponse(enhanced));
    } catch (error) {
      console.error('Active sessions error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch active sessions')
      );
    }
  }
);

/**
 * GET /sessions/:id/attendance
 * Get attendance for a specific session.
 * Allowed: Trainer, Institution
 */
router.get(
  '/:id/attendance',
  authMiddleware,
  requireRole('trainer', 'institution'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const session: any = await prisma.session.findUnique({
        where: { id: id as string },
        include: {
          batch: {
            select: { id: true, name: true },
            include: {
              students: {
                include: {
                  student: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          trainer: { select: { id: true, name: true } },
          attendance: {
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (!session) {
        res.status(404).json(errorResponse(404, 'NOT_FOUND', 'Session not found'));
        return;
      }

      // Validate trainer access
      if (req.dbUser!.role === 'trainer' && session.trainerId !== req.dbUser!.id) {
        res.status(403).json(
          errorResponse(403, 'FORBIDDEN', 'You can only view attendance for your own sessions')
        );
        return;
      }

      const totalStudents = session.batch.students.length;
      const presentCount = session.attendance.filter((a) => a.status === 'present').length;
      const absentCount = session.attendance.filter((a) => a.status === 'absent').length;
      const lateCount = session.attendance.filter((a) => a.status === 'late').length;

      res.json(
        successResponse({
          sessionId: session.id,
          sessionTitle: session.title,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          trainerName: session.trainer.name,
          batchName: session.batch.name,
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          unmarkedCount: totalStudents - session.attendance.length,
          attendanceRecords: session.attendance.map((a) => ({
            studentId: a.student.id,
            studentName: a.student.name,
            studentEmail: a.student.email,
            status: a.status,
            markedAt: a.markedAt,
          })),
        })
      );
    } catch (error) {
      console.error('Session attendance error:', error);
      res.status(500).json(
        errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch session attendance')
      );
    }
  }
);

export default router;

// ============================================
// SkillBridge TypeScript Type Definitions
// ============================================

export type UserRole = 'student' | 'trainer' | 'institution' | 'programme_manager' | 'monitoring_officer';
export type AttendanceStatus = 'present' | 'absent' | 'late';

// ---- User Types ----
export interface User {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId: string | null;
  institution?: Institution | null;
  createdAt: string;
}

// ---- Institution Types ----
export interface Institution {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface InstitutionSummary {
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  totalBatches: number;
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  trainers: { id: string; name: string; email: string }[];
  batchSummaries: BatchSummaryItem[];
}

export interface InstitutionListItem {
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  batchCount: number;
  studentCount: number;
  sessionCount: number;
  averageAttendance: number;
}

// ---- Batch Types ----
export interface Batch {
  id: string;
  name: string;
  institutionId: string;
  institution?: { id: string; name: string };
  studentCount?: number;
  sessionCount?: number;
  trainers?: { trainer: { id: string; name: string } }[];
  createdAt: string;
  updatedAt: string;
}

export interface BatchSummary {
  batchId: string;
  batchName: string;
  institution: { id: string; name: string };
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
  studentSummaries: StudentSummary[];
}

export interface BatchSummaryItem {
  batchId: string;
  batchName: string;
  studentCount: number;
  sessionCount: number;
  averageAttendance: number;
  trainers: { id: string; name: string }[];
}

// ---- Session Types ----
export interface Session {
  id: string;
  batchId: string;
  trainerId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  batch?: { id: string; name: string };
  trainer?: { id: string; name: string };
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  totalRecords?: number;
  attendance?: { status: AttendanceStatus; markedAt: string }[];
  createdAt: string;
}

export interface ActiveSession {
  id: string;
  title: string;
  batchName: string;
  batchId: string;
  trainerName: string;
  date: string;
  startTime: string;
  endTime: string;
  attendanceStatus: AttendanceStatus | null;
  canMarkAttendance: boolean;
}

export interface SessionAttendance {
  sessionId: string;
  sessionTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  trainerName: string;
  batchName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  attendanceRecords: AttendanceRecord[];
}

// ---- Attendance Types ----
export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  status: AttendanceStatus;
  markedAt: string;
}

export interface StudentSummary {
  studentId: string;
  studentName: string;
  sessionsAttended: number;
  totalSessions: number;
  attendanceRate: number;
}

export interface AttendanceHistory {
  summary: {
    total: number;
    present: number;
    late: number;
    absent: number;
    attendanceRate: number;
  };
  records: {
    id: string;
    status: AttendanceStatus;
    markedAt: string;
    session: {
      id: string;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      batch: { id: string; name: string };
    };
  }[];
}

// ---- Invite Types ----
export interface InviteResponse {
  inviteCode: string;
  inviteUrl: string;
  batchId: string;
  expiresAt: string;
}

// ---- Programme Types ----
export interface ProgrammeSummary {
  totalInstitutions: number;
  totalBatches: number;
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  institutionSummaries: InstitutionListItem[];
}

// ---- API Response Types ----
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

// ---- Create/Input Types ----
export interface CreateSessionInput {
  batchId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface MarkAttendanceInput {
  sessionId: string;
  status: AttendanceStatus;
}

export interface RegisterInput {
  clerkUserId: string;
  name: string;
  email: string;
  role: UserRole;
  institutionId?: string;
}

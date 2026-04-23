import axios from 'axios';
import type {
  ApiResponse,
  User,
  Batch,
  Session,
  ActiveSession,
  SessionAttendance,
  InviteResponse,
  BatchSummary,
  InstitutionSummary,
  ProgrammeSummary,
  AttendanceHistory,
  CreateSessionInput,
  MarkAttendanceInput,
  RegisterInput,
  Institution,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token for all requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// ============================================
// Auth API
// ============================================

export const authApi = {
  register: async (data: RegisterInput): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/auth/register', data);
    return res.data.data!;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data!;
  },

  getInstitutions: async (): Promise<Institution[]> => {
    const res = await api.get<ApiResponse<Institution[]>>('/auth/institutions');
    return res.data.data!;
  },
};

// ============================================
// Batch API
// ============================================

export const batchApi = {
  create: async (data: { name: string; institutionId: string }): Promise<Batch> => {
    const res = await api.post<ApiResponse<Batch>>('/batches', data);
    return res.data.data!;
  },

  list: async (): Promise<Batch[]> => {
    const res = await api.get<ApiResponse<Batch[]>>('/batches');
    return res.data.data!;
  },

  generateInvite: async (batchId: string, expiresIn = 7): Promise<InviteResponse> => {
    const res = await api.post<ApiResponse<InviteResponse>>(`/batches/${batchId}/invite`, { expiresIn });
    return res.data.data!;
  },

  join: async (inviteCode: string): Promise<{ batchId: string; batchName: string; joinedAt: string }> => {
    const res = await api.post<ApiResponse<{ batchId: string; batchName: string; joinedAt: string }>>('/batches/join', { inviteCode });
    return res.data.data!;
  },

  getSummary: async (batchId: string): Promise<BatchSummary> => {
    const res = await api.get<ApiResponse<BatchSummary>>(`/batches/${batchId}/summary`);
    return res.data.data!;
  },
};

// ============================================
// Session API
// ============================================

export const sessionApi = {
  create: async (data: CreateSessionInput): Promise<Session> => {
    const res = await api.post<ApiResponse<Session>>('/sessions', data);
    return res.data.data!;
  },

  list: async (): Promise<Session[]> => {
    const res = await api.get<ApiResponse<Session[]>>('/sessions');
    return res.data.data!;
  },

  getActive: async (): Promise<ActiveSession[]> => {
    const res = await api.get<ApiResponse<ActiveSession[]>>('/sessions/active');
    return res.data.data!;
  },

  getAttendance: async (sessionId: string): Promise<SessionAttendance> => {
    const res = await api.get<ApiResponse<SessionAttendance>>(`/sessions/${sessionId}/attendance`);
    return res.data.data!;
  },
};

// ============================================
// Attendance API
// ============================================

export const attendanceApi = {
  mark: async (data: MarkAttendanceInput) => {
    const res = await api.post<ApiResponse<{ id: string; status: string; markedAt: string }>>('/attendance/mark', data);
    return res.data.data!;
  },

  getMyHistory: async (): Promise<AttendanceHistory> => {
    const res = await api.get<ApiResponse<AttendanceHistory>>('/attendance/my');
    return res.data.data!;
  },
};

// ============================================
// Institution API
// ============================================

export const institutionApi = {
  list: async () => {
    const res = await api.get<ApiResponse<{ id: string; name: string; code: string; batchCount: number; trainerCount: number }[]>>('/institutions');
    return res.data.data!;
  },

  getSummary: async (institutionId: string): Promise<InstitutionSummary> => {
    const res = await api.get<ApiResponse<InstitutionSummary>>(`/institutions/${institutionId}/summary`);
    return res.data.data!;
  },
};

// ============================================
// Programme API
// ============================================

export const programmeApi = {
  getSummary: async (): Promise<ProgrammeSummary> => {
    const res = await api.get<ApiResponse<ProgrammeSummary>>('/programme/summary');
    return res.data.data!;
  },
};

export default api;

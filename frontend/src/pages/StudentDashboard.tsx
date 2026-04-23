import { useState, useEffect } from 'react';
import { sessionApi, attendanceApi, batchApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import type { ActiveSession, AttendanceHistory, AttendanceStatus } from '../types';
import {
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  TrendingUp,
  Users,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, refreshToken } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [history, setHistory] = useState<AttendanceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingSession, setMarkingSession] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningBatch, setJoiningBatch] = useState(false);

  const loadData = async () => {
    try {
      await refreshToken();
      const [sessions, hist] = await Promise.all([
        sessionApi.getActive().catch(() => []),
        attendanceApi.getMyHistory().catch(() => null),
      ]);
      setActiveSessions(sessions);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAttendance = async (sessionId: string, status: AttendanceStatus) => {
    setMarkingSession(sessionId);
    try {
      await refreshToken();
      await attendanceApi.mark({ sessionId, status });
      toast.success(`Attendance marked as ${status}!`);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to mark attendance');
    } finally {
      setMarkingSession(null);
    }
  };

  const handleJoinBatch = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code or paste an invite link');
      return;
    }

    // Extract invite code from URL if user pasted full link
    // Supports: http://host/join/CODE, /join/CODE, or just CODE
    let code = inviteCode.trim();
    const joinMatch = code.match(/\/join\/([A-Za-z0-9]+)$/);
    if (joinMatch) {
      code = joinMatch[1];
    }

    setJoiningBatch(true);
    try {
      await refreshToken();
      const result = await batchApi.join(code);
      toast.success(`Joined batch: ${result.batchName}`);
      setInviteCode('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to join batch');
    } finally {
      setJoiningBatch(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus | null) => {
    if (!status) return <span className="badge-pending">Not Marked</span>;
    if (status === 'present') return <span className="badge-present"><CheckCircle2 className="w-3 h-3" /> Present</span>;
    if (status === 'absent') return <span className="badge-absent"><XCircle className="w-3 h-3" /> Absent</span>;
    return <span className="badge-late"><AlertCircle className="w-3 h-3" /> Late</span>;
  };

  if (loading) return <DashboardLayout><LoadingSpinner message="Loading your sessions..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-dark-400">Track your sessions and mark attendance.</p>
        </div>

        {/* Stats Row */}
        {history && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="metric-card">
              <BookOpen className="w-5 h-5 text-primary-400" />
              <div className="metric-value">{history.summary.total}</div>
              <div className="metric-label">Total Sessions</div>
            </div>
            <div className="metric-card">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div className="metric-value text-emerald-400">{history.summary.present}</div>
              <div className="metric-label">Present</div>
            </div>
            <div className="metric-card">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <div className="metric-value text-amber-400">{history.summary.late}</div>
              <div className="metric-label">Late</div>
            </div>
            <div className="metric-card">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div className="metric-value text-blue-400">{history.summary.attendanceRate}%</div>
              <div className="metric-label">Attendance Rate</div>
            </div>
          </div>
        )}

        {/* Join Batch */}
        <div className="glass-card p-6">
          <h2 className="section-title">
            <LinkIcon className="w-5 h-5 text-primary-400" />
            Join a Batch
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Paste invite link or code..."
              className="input-field flex-1"
            />
            <button
              onClick={handleJoinBatch}
              disabled={joiningBatch}
              className="btn-primary whitespace-nowrap"
            >
              {joiningBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Batch'}
            </button>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h2 className="section-title">
            <CalendarDays className="w-5 h-5 text-primary-400" />
            Upcoming Sessions
          </h2>

          {activeSessions.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BookOpen className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 font-medium">No upcoming sessions</p>
              <p className="text-dark-500 text-sm mt-1">Join a batch to see your sessions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="glass-card-hover p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{session.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {session.batchName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-4 h-4" />
                          {new Date(session.date).toLocaleDateString('en-US', { 
                            weekday: 'short', month: 'short', day: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(session.attendanceStatus)}
                      
                      {!session.attendanceStatus && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkAttendance(session.id, 'present')}
                            disabled={markingSession === session.id}
                            className="btn-success text-xs px-3 py-1.5"
                          >
                            {markingSession === session.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : 'Present'}
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(session.id, 'late')}
                            disabled={markingSession === session.id}
                            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 transition-all"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(session.id, 'absent')}
                            disabled={markingSession === session.id}
                            className="btn-danger text-xs px-3 py-1.5"
                          >
                            Absent
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance History */}
        {history && history.records.length > 0 && (
          <div>
            <h2 className="section-title">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              Attendance History
            </h2>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Session</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Batch</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Date</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {history.records.slice(0, 10).map((record) => (
                      <tr key={record.id} className="hover:bg-dark-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-white">{record.session.title}</td>
                        <td className="px-6 py-4 text-sm text-dark-300">{record.session.batch.name}</td>
                        <td className="px-6 py-4 text-sm text-dark-400">
                          {new Date(record.session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

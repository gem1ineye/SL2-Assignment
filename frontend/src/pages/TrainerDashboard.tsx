import { useState, useEffect } from 'react';
import { sessionApi, batchApi, authApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Session, Batch, SessionAttendance, CreateSessionInput, Institution } from '../types';
import {
  Plus,
  CalendarDays,
  Clock,
  Users,
  BookOpen,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  X,
  BarChart3,
} from 'lucide-react';

export default function TrainerDashboard() {
  const { refreshToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<SessionAttendance | null>(null);
  const [, setLoadingAttendance] = useState(false);
  const [inviteModalBatch, setInviteModalBatch] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchInstitutionId, setBatchInstitutionId] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  const [form, setForm] = useState<CreateSessionInput>({
    batchId: '',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const loadData = async () => {
    try {
      await refreshToken();
      const [sessionsData, batchesData, institutionsData] = await Promise.all([
        sessionApi.list().catch(() => []),
        batchApi.list().catch(() => []),
        authApi.getInstitutions().catch(() => []),
      ]);
      setSessions(sessionsData);
      setBatches(batchesData);
      setInstitutions(institutionsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async () => {
    if (!form.batchId || !form.title || !form.date || !form.startTime || !form.endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      await refreshToken();
      await sessionApi.create(form);
      toast.success('Session created successfully!');
      setShowCreateForm(false);
      setForm({ batchId: '', title: '', date: '', startTime: '', endTime: '' });
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleViewAttendance = async (sessionId: string) => {
    setLoadingAttendance(true);
    try {
      await refreshToken();
      const data = await sessionApi.getAttendance(sessionId);
      setSelectedAttendance(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to load attendance');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleGenerateInvite = async (batchId: string) => {
    setGeneratingInvite(true);
    try {
      await refreshToken();
      const data = await batchApi.generateInvite(batchId);
      setInviteUrl(data.inviteUrl);
      setInviteModalBatch(batchId);
      toast.success('Invite link generated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to generate invite');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!batchName.trim() || !batchInstitutionId) {
      toast.error('Please enter a batch name and select an institution');
      return;
    }
    setCreatingBatch(true);
    try {
      await refreshToken();
      await batchApi.create({ name: batchName.trim(), institutionId: batchInstitutionId });
      toast.success('Batch created! You are automatically assigned as trainer.');
      setBatchName('');
      setBatchInstitutionId('');
      setShowCreateBatch(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create batch');
    } finally {
      setCreatingBatch(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) return <DashboardLayout><LoadingSpinner message="Loading trainer dashboard..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Trainer Dashboard
            </h1>
            <p className="text-dark-400">Manage sessions and track attendance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateBatch(!showCreateBatch)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Batch
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Session
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card">
            <BookOpen className="w-5 h-5 text-primary-400" />
            <div className="metric-value">{sessions.length}</div>
            <div className="metric-label">Total Sessions</div>
          </div>
          <div className="metric-card">
            <Users className="w-5 h-5 text-blue-400" />
            <div className="metric-value">{batches.length}</div>
            <div className="metric-label">Batches</div>
          </div>
          <div className="metric-card">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div className="metric-value text-emerald-400">
              {sessions.reduce((sum, s) => sum + (s.presentCount || 0), 0)}
            </div>
            <div className="metric-label">Total Present</div>
          </div>
          <div className="metric-card">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <div className="metric-value text-amber-400">
              {sessions.length > 0
                ? Math.round(
                    (sessions.reduce((sum, s) => sum + (s.presentCount || 0) + (s.lateCount || 0), 0) /
                      Math.max(sessions.reduce((sum, s) => sum + (s.totalRecords || 1), 0), 1)) * 100
                  )
                : 0}%
            </div>
            <div className="metric-label">Avg Attendance</div>
          </div>
        </div>

        {/* Create Batch Form */}
        {showCreateBatch && (
          <div className="glass-card p-6 animate-slide-up">
            <h2 className="section-title">
              <Plus className="w-5 h-5 text-primary-400" />
              Create New Batch
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Batch Name</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Web Development Batch 1"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Institution</label>
                <select
                  value={batchInstitutionId}
                  onChange={(e) => setBatchInstitutionId(e.target.value)}
                  className="select-field"
                >
                  <option value="">Select institution...</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateBatch} disabled={creatingBatch} className="btn-primary flex items-center gap-2">
                {creatingBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creatingBatch ? 'Creating...' : 'Create Batch'}
              </button>
              <button onClick={() => setShowCreateBatch(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Create Session Form */}
        {showCreateForm && (
          <div className="glass-card p-6 animate-slide-up">
            <h2 className="section-title">
              <Plus className="w-5 h-5 text-primary-400" />
              Create New Session
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Batch</label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  className="select-field"
                >
                  <option value="">Select a batch...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Introduction to React Hooks"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateSession} disabled={creating} className="btn-primary flex items-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating...' : 'Create Session'}
              </button>
              <button onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div>
          <h2 className="section-title">
            <CalendarDays className="w-5 h-5 text-primary-400" />
            My Sessions
          </h2>
          {sessions.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BookOpen className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 font-medium">No sessions yet</p>
              <p className="text-dark-500 text-sm mt-1">Create your first session to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="glass-card-hover p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{session.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {session.batch?.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-emerald-400">{session.presentCount || 0}P</span>
                        <span className="text-dark-600">|</span>
                        <span className="text-amber-400">{session.lateCount || 0}L</span>
                        <span className="text-dark-600">|</span>
                        <span className="text-red-400">{session.absentCount || 0}A</span>
                      </div>
                      <button
                        onClick={() => handleViewAttendance(session.id)}
                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Batches */}
        <div>
          <h2 className="section-title">
            <Users className="w-5 h-5 text-primary-400" />
            My Batches
          </h2>
          {batches.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 font-medium">No batches assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map((batch) => (
                <div key={batch.id} className="glass-card-hover p-5">
                  <h3 className="font-semibold text-white mb-2">{batch.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
                    <span>{batch.studentCount || 0} students</span>
                    <span>{batch.sessionCount || 0} sessions</span>
                  </div>
                  <button
                    onClick={() => handleGenerateInvite(batch.id)}
                    disabled={generatingInvite}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    {generatingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    Generate Invite Link
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Detail Modal */}
        {selectedAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-auto p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedAttendance.sessionTitle}</h2>
                  <p className="text-sm text-dark-400">
                    {new Date(selectedAttendance.date).toLocaleDateString()} • {selectedAttendance.startTime} - {selectedAttendance.endTime}
                  </p>
                </div>
                <button onClick={() => setSelectedAttendance(null)} className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-dark-400" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 rounded-xl bg-dark-800/50">
                  <div className="text-lg font-bold text-white">{selectedAttendance.totalStudents}</div>
                  <div className="text-xs text-dark-400">Total</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                  <div className="text-lg font-bold text-emerald-400">{selectedAttendance.presentCount}</div>
                  <div className="text-xs text-dark-400">Present</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/10">
                  <div className="text-lg font-bold text-amber-400">{selectedAttendance.lateCount}</div>
                  <div className="text-xs text-dark-400">Late</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-500/10">
                  <div className="text-lg font-bold text-red-400">{selectedAttendance.absentCount}</div>
                  <div className="text-xs text-dark-400">Absent</div>
                </div>
              </div>

              {/* Records Table */}
              {selectedAttendance.attendanceRecords.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase px-4 py-3">Student</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase px-4 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {selectedAttendance.attendanceRecords.map((rec) => (
                      <tr key={rec.studentId} className="hover:bg-dark-800/30">
                        <td className="px-4 py-3 text-sm text-white">{rec.studentName}</td>
                        <td className="px-4 py-3">
                          {rec.status === 'present' && <span className="badge-present"><CheckCircle2 className="w-3 h-3" /> Present</span>}
                          {rec.status === 'absent' && <span className="badge-absent"><XCircle className="w-3 h-3" /> Absent</span>}
                          {rec.status === 'late' && <span className="badge-late"><AlertCircle className="w-3 h-3" /> Late</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-400">
                          {new Date(rec.markedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-dark-500 py-8">No attendance records yet</p>
              )}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {inviteModalBatch && inviteUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Invite Link Generated</h2>
                <button onClick={() => { setInviteModalBatch(null); setInviteUrl(''); }} className="p-2 hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5 text-dark-400" />
                </button>
              </div>
              <p className="text-sm text-dark-400 mb-4">Share this link with students to join the batch:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className="input-field flex-1 text-xs"
                />
                <button onClick={() => copyToClipboard(inviteUrl)} className="btn-primary flex items-center gap-1.5">
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

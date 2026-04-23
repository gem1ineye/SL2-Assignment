import { useState, useEffect } from 'react';
import { institutionApi, batchApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import type { InstitutionSummary, BatchSummary } from '../types';
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  Eye,
  X,
} from 'lucide-react';

export default function InstitutionDashboard() {
  const { user, refreshToken } = useAuth();
  const [summary, setSummary] = useState<InstitutionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchSummary | null>(null);
  const [, setLoadingBatch] = useState(false);

  const loadData = async () => {
    try {
      await refreshToken();
      if (user?.institutionId) {
        const data = await institutionApi.getSummary(user.institutionId);
        setSummary(data);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load institution data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleViewBatch = async (batchId: string) => {
    setLoadingBatch(true);
    try {
      await refreshToken();
      const data = await batchApi.getSummary(batchId);
      setSelectedBatch(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to load batch summary');
    } finally {
      setLoadingBatch(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner message="Loading institution data..." /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            <Building2 className="w-7 h-7 inline mr-2 text-purple-400" />
            {summary?.institutionName || 'Institution Dashboard'}
          </h1>
          <p className="text-dark-400">Monitor batches, trainers, and attendance metrics.</p>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card">
            <Users className="w-5 h-5 text-blue-400" />
            <div className="metric-value">{summary?.totalBatches || 0}</div>
            <div className="metric-label">Total Batches</div>
          </div>
          <div className="metric-card">
            <Users className="w-5 h-5 text-emerald-400" />
            <div className="metric-value">{summary?.totalStudents || 0}</div>
            <div className="metric-label">Total Students</div>
          </div>
          <div className="metric-card">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <div className="metric-value">{summary?.totalSessions || 0}</div>
            <div className="metric-label">Total Sessions</div>
          </div>
          <div className="metric-card">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <div className="metric-value text-amber-400">{summary?.averageAttendance || 0}%</div>
            <div className="metric-label">Avg Attendance</div>
          </div>
        </div>

        {/* Batches */}
        <div>
          <h2 className="section-title">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Batch Performance
          </h2>
          {!summary?.batchSummaries?.length ? (
            <div className="glass-card p-12 text-center">
              <BookOpen className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 font-medium">No batches found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.batchSummaries.map((batch) => {
                const attendanceColor = 
                  batch.averageAttendance >= 80 ? 'text-emerald-400' :
                  batch.averageAttendance >= 60 ? 'text-amber-400' : 'text-red-400';
                
                return (
                  <div key={batch.batchId} className="glass-card-hover p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white">{batch.batchName}</h3>
                      <span className={`text-2xl font-bold ${attendanceColor}`}>
                        {batch.averageAttendance}%
                      </span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-dark-700 rounded-full mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          batch.averageAttendance >= 80 ? 'bg-emerald-500' :
                          batch.averageAttendance >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(batch.averageAttendance, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-dark-400">
                        <span>{batch.studentCount} students</span>
                        <span>{batch.sessionCount} sessions</span>
                      </div>
                      <button
                        onClick={() => handleViewBatch(batch.batchId)}
                        className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </div>
                    
                    {batch.trainers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dark-700/50">
                        <p className="text-xs text-dark-500">
                          Trainers: {batch.trainers.map(t => t.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trainers */}
        {summary?.trainers && summary.trainers.length > 0 && (
          <div>
            <h2 className="section-title">
              <Users className="w-5 h-5 text-primary-400" />
              Trainers ({summary.trainers.length})
            </h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Name</th>
                    <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {summary.trainers.map((trainer) => (
                    <tr key={trainer.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">{trainer.name}</td>
                      <td className="px-6 py-4 text-sm text-dark-400">{trainer.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Batch Detail Modal */}
        {selectedBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-3xl max-h-[80vh] overflow-auto p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedBatch.batchName}</h2>
                  <p className="text-sm text-dark-400">
                    {selectedBatch.totalStudents} students • {selectedBatch.totalSessions} sessions • {selectedBatch.averageAttendance}% avg
                  </p>
                </div>
                <button onClick={() => setSelectedBatch(null)} className="p-2 hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5 text-dark-400" />
                </button>
              </div>

              {selectedBatch.studentSummaries.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase px-4 py-3">Student</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase px-4 py-3">Attended</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase px-4 py-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {selectedBatch.studentSummaries.map((student) => (
                      <tr key={student.studentId} className="hover:bg-dark-800/30">
                        <td className="px-4 py-3 text-sm text-white">{student.studentName}</td>
                        <td className="px-4 py-3 text-sm text-dark-300">{student.sessionsAttended}/{student.totalSessions}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${
                            student.attendanceRate >= 80 ? 'text-emerald-400' :
                            student.attendanceRate >= 60 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {student.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-dark-500 py-8">No student data available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

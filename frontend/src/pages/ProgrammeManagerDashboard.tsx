import { useState, useEffect } from 'react';
import { programmeApi, institutionApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import type { ProgrammeSummary, InstitutionSummary } from '../types';
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  Globe,
  Eye,
  X,
  Award,
  AlertTriangle,
} from 'lucide-react';

export default function ProgrammeManagerDashboard() {
  const { refreshToken } = useAuth();
  const [summary, setSummary] = useState<ProgrammeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionSummary | null>(null);
  const [, setLoadingInstitution] = useState(false);

  const loadData = async () => {
    try {
      await refreshToken();
      const data = await programmeApi.getSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load programme data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewInstitution = async (institutionId: string) => {
    setLoadingInstitution(true);
    try {
      await refreshToken();
      const data = await institutionApi.getSummary(institutionId);
      setSelectedInstitution(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to load institution details');
    } finally {
      setLoadingInstitution(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner message="Loading programme data..." /></DashboardLayout>;

  // Sort institutions by attendance for rankings
  const sortedByAttendance = [...(summary?.institutionSummaries || [])].sort(
    (a, b) => b.averageAttendance - a.averageAttendance
  );
  const topPerformers = sortedByAttendance.filter(i => i.averageAttendance >= 80);
  const needsAttention = sortedByAttendance.filter(i => i.averageAttendance < 60);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            <Globe className="w-7 h-7 inline mr-2 text-amber-400" />
            Programme Overview
          </h1>
          <p className="text-dark-400">Cross-institutional performance monitoring.</p>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="metric-card">
            <Building2 className="w-5 h-5 text-purple-400" />
            <div className="metric-value">{summary?.totalInstitutions || 0}</div>
            <div className="metric-label">Institutions</div>
          </div>
          <div className="metric-card">
            <Users className="w-5 h-5 text-blue-400" />
            <div className="metric-value">{summary?.totalBatches || 0}</div>
            <div className="metric-label">Batches</div>
          </div>
          <div className="metric-card">
            <Users className="w-5 h-5 text-emerald-400" />
            <div className="metric-value">{(summary?.totalStudents || 0).toLocaleString()}</div>
            <div className="metric-label">Students</div>
          </div>
          <div className="metric-card">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div className="metric-value">{(summary?.totalSessions || 0).toLocaleString()}</div>
            <div className="metric-label">Sessions</div>
          </div>
          <div className="metric-card col-span-2 lg:col-span-1">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <div className="metric-value text-amber-400">{summary?.averageAttendance || 0}%</div>
            <div className="metric-label">Avg Attendance</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Performers */}
          <div className="glass-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-3">
              <Award className="w-4 h-4" /> Top Performers ({topPerformers.length})
            </h3>
            {topPerformers.length === 0 ? (
              <p className="text-dark-500 text-sm">No institutions above 80% attendance</p>
            ) : (
              <div className="space-y-2">
                {topPerformers.slice(0, 5).map((inst) => (
                  <div key={inst.institutionId} className="flex items-center justify-between text-sm">
                    <span className="text-dark-200">{inst.institutionName}</span>
                    <span className="text-emerald-400 font-semibold">{inst.averageAttendance}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Needs Attention */}
          <div className="glass-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-3">
              <AlertTriangle className="w-4 h-4" /> Needs Attention ({needsAttention.length})
            </h3>
            {needsAttention.length === 0 ? (
              <p className="text-dark-500 text-sm">All institutions above 60% — great!</p>
            ) : (
              <div className="space-y-2">
                {needsAttention.map((inst) => (
                  <div key={inst.institutionId} className="flex items-center justify-between text-sm">
                    <span className="text-dark-200">{inst.institutionName}</span>
                    <span className="text-red-400 font-semibold">{inst.averageAttendance}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Institutions List */}
        <div>
          <h2 className="section-title">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            All Institutions
          </h2>
          {!summary?.institutionSummaries?.length ? (
            <div className="glass-card p-12 text-center">
              <Building2 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 font-medium">No institutions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedByAttendance.map((inst) => {
                const attendanceColor = 
                  inst.averageAttendance >= 80 ? 'text-emerald-400' :
                  inst.averageAttendance >= 60 ? 'text-amber-400' : 'text-red-400';
                const barColor = 
                  inst.averageAttendance >= 80 ? 'bg-emerald-500' :
                  inst.averageAttendance >= 60 ? 'bg-amber-500' : 'bg-red-500';

                return (
                  <div key={inst.institutionId} className="glass-card-hover p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{inst.institutionName}</h3>
                        <p className="text-xs text-dark-500 mt-0.5">{inst.institutionCode}</p>
                      </div>
                      <span className={`text-2xl font-bold ${attendanceColor}`}>
                        {inst.averageAttendance}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-dark-700 rounded-full mb-3">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(inst.averageAttendance, 100)}%` }} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-dark-400 mb-4">
                      <span>{inst.batchCount} batches</span>
                      <span>{inst.studentCount} students</span>
                      <span>{inst.sessionCount} sessions</span>
                    </div>

                    <button
                      onClick={() => handleViewInstitution(inst.institutionId)}
                      className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm font-medium transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Institution Detail Modal */}
        {selectedInstitution && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-3xl max-h-[80vh] overflow-auto p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedInstitution.institutionName}</h2>
                  <p className="text-sm text-dark-400">
                    {selectedInstitution.totalBatches} batches • {selectedInstitution.totalStudents} students • {selectedInstitution.averageAttendance}% avg
                  </p>
                </div>
                <button onClick={() => setSelectedInstitution(null)} className="p-2 hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5 text-dark-400" />
                </button>
              </div>

              <h3 className="text-sm font-semibold text-dark-300 mb-3">Batch Breakdown</h3>
              {selectedInstitution.batchSummaries.length > 0 ? (
                <div className="space-y-3">
                  {selectedInstitution.batchSummaries.map((batch) => (
                    <div key={batch.batchId} className="bg-dark-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{batch.batchName}</span>
                        <span className={`font-bold ${
                          batch.averageAttendance >= 80 ? 'text-emerald-400' :
                          batch.averageAttendance >= 60 ? 'text-amber-400' : 'text-red-400'
                        }`}>{batch.averageAttendance}%</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-dark-400">
                        <span>{batch.studentCount} students</span>
                        <span>{batch.sessionCount} sessions</span>
                        {batch.trainers.length > 0 && (
                          <span>Trainer: {batch.trainers.map(t => t.name).join(', ')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-dark-500 py-4">No batch data available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

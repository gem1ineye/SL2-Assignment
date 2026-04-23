import { useState, useEffect } from 'react';
import { programmeApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import type { ProgrammeSummary } from '../types';
import {
  Building2,
  Users,
  BookOpen,
  TrendingUp,
  Eye,
  Globe,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export default function MonitoringOfficerDashboard() {
  const { refreshToken } = useAuth();
  const [summary, setSummary] = useState<ProgrammeSummary | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <DashboardLayout><LoadingSpinner message="Loading monitoring data..." /></DashboardLayout>;

  const sortedInstitutions = [...(summary?.institutionSummaries || [])].sort(
    (a, b) => b.averageAttendance - a.averageAttendance
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              <Eye className="w-7 h-7 inline mr-2 text-cyan-400" />
              Monitoring Dashboard
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-700 text-dark-400 text-xs font-medium border border-dark-600">
              <Lock className="w-3 h-3" /> Read-Only
            </span>
          </div>
          <p className="text-dark-400">Programme-wide attendance monitoring and oversight.</p>
        </div>

        {/* Read-only notice */}
        <div className="glass-card p-4 border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <p className="text-sm text-dark-300">
              You have <span className="text-cyan-400 font-semibold">read-only access</span> to programme-wide data. 
              No create, edit, or delete actions are available.
            </p>
          </div>
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

        {/* Institutions Table */}
        <div>
          <h2 className="section-title">
            <Globe className="w-5 h-5 text-primary-400" />
            Institution Performance
          </h2>

          {sortedInstitutions.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Building2 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400 font-medium">No data available</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">#</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Institution</th>
                      <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Code</th>
                      <th className="text-center text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Batches</th>
                      <th className="text-center text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Students</th>
                      <th className="text-center text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Sessions</th>
                      <th className="text-right text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {sortedInstitutions.map((inst, idx) => {
                      const attendanceColor = 
                        inst.averageAttendance >= 80 ? 'text-emerald-400' :
                        inst.averageAttendance >= 60 ? 'text-amber-400' : 'text-red-400';

                      return (
                        <tr key={inst.institutionId} className="hover:bg-dark-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-dark-500">{idx + 1}</td>
                          <td className="px-6 py-4 text-sm text-white font-medium">{inst.institutionName}</td>
                          <td className="px-6 py-4 text-sm text-dark-400">{inst.institutionCode}</td>
                          <td className="px-6 py-4 text-sm text-dark-300 text-center">{inst.batchCount}</td>
                          <td className="px-6 py-4 text-sm text-dark-300 text-center">{inst.studentCount}</td>
                          <td className="px-6 py-4 text-sm text-dark-300 text-center">{inst.sessionCount}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="w-20 h-2 bg-dark-700 rounded-full hidden sm:block">
                                <div
                                  className={`h-full rounded-full ${
                                    inst.averageAttendance >= 80 ? 'bg-emerald-500' :
                                    inst.averageAttendance >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(inst.averageAttendance, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold ${attendanceColor}`}>
                                {inst.averageAttendance}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  GraduationCap,
  BookOpen,
  Building2,
  BarChart3,
  Eye,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { UserRole, Institution } from '../types';

const roleOptions: { value: UserRole; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  {
    value: 'student',
    label: 'Student',
    icon: <GraduationCap className="w-6 h-6" />, 
    desc: 'View sessions and mark attendance',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  },
  {
    value: 'trainer',
    label: 'Trainer',
    icon: <BookOpen className="w-6 h-6" />,
    desc: 'Create sessions and manage batches',
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  },
  {
    value: 'institution',
    label: 'Institution Admin',
    icon: <Building2 className="w-6 h-6" />,
    desc: 'Manage trainers and view batch summaries',
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
  },
  {
    value: 'programme_manager',
    label: 'Programme Manager',
    icon: <BarChart3 className="w-6 h-6" />,
    desc: 'Oversee all institutions and performance',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  },
  {
    value: 'monitoring_officer',
    label: 'Monitoring Officer',
    icon: <Eye className="w-6 h-6" />,
    desc: 'Read-only access to programme data',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
  },
];

export default function CompleteRegistration() {
  const navigate = useNavigate();
  const { isSignedIn, isRegistered, user, registerUser, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already registered
  useEffect(() => {
    if (!isLoading && isRegistered && user) {
      const redirectMap: Record<string, string> = {
        student: '/dashboard/student',
        trainer: '/dashboard/trainer',
        institution: '/dashboard/institution',
        programme_manager: '/dashboard/programme-manager',
        monitoring_officer: '/dashboard/monitoring-officer',
      };
      navigate(redirectMap[user.role] || '/');
    }
  }, [isLoading, isRegistered, user, navigate]);

  // Load institutions
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await authApi.getInstitutions();
        setInstitutions(data);
      } catch {
        console.log('Could not load institutions');
      }
    };
    loadInstitutions();
  }, []);

  if (!isSignedIn) {
    navigate('/login');
    return null;
  }

  const needsInstitution = selectedRole === 'trainer' || selectedRole === 'institution';

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    if (needsInstitution && !selectedInstitution) {
      toast.error('Please select an institution');
      return;
    }

    setSubmitting(true);
    try {
      await registerUser(selectedRole, needsInstitution ? selectedInstitution : undefined);
      toast.success('Registration complete! Redirecting...');

      const redirectMap: Record<string, string> = {
        student: '/dashboard/student',
        trainer: '/dashboard/trainer',
        institution: '/dashboard/institution',
        programme_manager: '/dashboard/programme-manager',
        monitoring_officer: '/dashboard/monitoring-officer',
      };
      
      setTimeout(() => navigate(redirectMap[selectedRole]), 1000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="mesh-bg" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">SkillBridge</span>
        </div>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Complete Your Profile</h1>
          <p className="text-dark-400 text-center mb-8">Select your role to continue to your dashboard</p>

          {/* Role Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  selectedRole === role.value
                    ? `${role.color} ring-1 ring-current`
                    : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {role.icon}
                  <span className="font-semibold">{role.label}</span>
                </div>
                <p className="text-xs text-dark-400">{role.desc}</p>
              </button>
            ))}
          </div>

          {/* Institution Selection (if needed) */}
          {needsInstitution && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Select Institution
              </label>
              <select
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="select-field"
              >
                <option value="">Choose an institution...</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!selectedRole || submitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

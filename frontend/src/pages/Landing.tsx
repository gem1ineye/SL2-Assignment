import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ClipboardList,
  GraduationCap,
  BookOpen,
  Building2,
  BarChart3,
  Eye,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: 'Student Self-Service',
    desc: 'Students mark their own attendance with real-time session tracking.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Trainer Management',
    desc: 'Create sessions, generate invite links, and track attendance from one dashboard.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    title: 'Institution Insights',
    desc: 'Monitor all batches, trainers, and attendance metrics at a glance.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Programme Overview',
    desc: 'Cross-institutional performance metrics for programme managers.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Monitoring & Oversight',
    desc: 'Read-only dashboard for monitoring officers to review programme performance.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Role-Based Security',
    desc: 'Five distinct user roles with granular permissions and access control.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
];

const stats = [
  { label: 'User Roles', value: '5' },
  { label: 'Real-time Tracking', value: '✓' },
  { label: 'Invite System', value: '✓' },
  { label: 'Analytics', value: '✓' },
];

export default function Landing() {
  const { isSignedIn, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    const roleMap: Record<string, string> = {
      student: '/dashboard/student',
      trainer: '/dashboard/trainer',
      institution: '/dashboard/institution',
      programme_manager: '/dashboard/programme-manager',
      monitoring_officer: '/dashboard/monitoring-officer',
    };
    return roleMap[user.role] || '/login';
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="mesh-bg" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SkillBridge</span>
        </div>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <Link to={getDashboardLink()} className="btn-primary flex items-center gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary hidden sm:block">
                Sign In
              </Link>
              <Link to="/signup" className="btn-primary flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-16 pt-16 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            State-Level Skilling Programme
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight animate-slide-up">
            Attendance{' '}
            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-dark-300 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Streamline attendance tracking across institutions, trainers, and students 
            with role-based dashboards and real-time analytics.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-6 mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card px-6 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-dark-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Link to="/signup" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              Start Tracking <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 lg:px-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Built for Every Role
          </h2>
          <p className="text-dark-400 text-center mb-12 max-w-2xl mx-auto">
            Five specialized dashboards designed for each stakeholder in the skilling programme.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`glass-card-hover p-6 ${feature.border} animate-slide-up`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-dark-500 text-sm">
            <ClipboardList className="w-4 h-4" />
            SkillBridge &copy; {new Date().getFullYear()}
          </div>
          <p className="text-dark-600 text-sm">
            State-Level Skilling Programme Attendance Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

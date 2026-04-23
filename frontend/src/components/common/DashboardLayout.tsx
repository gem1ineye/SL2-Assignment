import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  BarChart3,
  Eye,
  BookOpen,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const roleConfig: Record<string, {
  label: string;
  color: string;
  icon: React.ReactNode;
  navItems: { path: string; label: string; icon: React.ReactNode }[];
}> = {
  student: {
    label: 'Student',
    color: 'text-emerald-400',
    icon: <GraduationCap className="w-5 h-5" />,
    navItems: [
      { path: '/dashboard/student', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  trainer: {
    label: 'Trainer',
    color: 'text-blue-400',
    icon: <BookOpen className="w-5 h-5" />,
    navItems: [
      { path: '/dashboard/trainer', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  institution: {
    label: 'Institution',
    color: 'text-purple-400',
    icon: <Building2 className="w-5 h-5" />,
    navItems: [
      { path: '/dashboard/institution', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  programme_manager: {
    label: 'Programme Manager',
    color: 'text-amber-400',
    icon: <BarChart3 className="w-5 h-5" />,
    navItems: [
      { path: '/dashboard/programme-manager', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  monitoring_officer: {
    label: 'Monitoring Officer',
    color: 'text-cyan-400',
    icon: <Eye className="w-5 h-5" />,
    navItems: [
      { path: '/dashboard/monitoring-officer', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const config = roleConfig[user?.role || 'student'];

  return (
    <div className="min-h-screen gradient-bg">
      <div className="mesh-bg" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          {/* Left: Logo + Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-dark-400 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white hidden sm:block">SkillBridge</span>
            </Link>
          </div>

          {/* Center: Role badge */}
          <div className="hidden md:flex items-center gap-2">
            <span className={`${config?.color} flex items-center gap-2 text-sm font-medium`}>
              {config?.icon}
              {config?.label}
            </span>
          </div>

          {/* Right: User */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-dark-300 hidden sm:block">{user?.name}</span>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-dark-900/90 backdrop-blur-xl border-r border-dark-700/50 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-1">
            {config?.navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                      : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700/50">
            <div className="glass-card p-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center ${config?.color}`}>
                  {config?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-dark-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

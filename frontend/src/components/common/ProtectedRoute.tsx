import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isLoading, isSignedIn, isRegistered, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Verifying access..." />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isRegistered) {
    return <Navigate to="/complete-registration" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to user's correct dashboard
    const redirectMap: Record<string, string> = {
      student: '/dashboard/student',
      trainer: '/dashboard/trainer',
      institution: '/dashboard/institution',
      programme_manager: '/dashboard/programme-manager',
      monitoring_officer: '/dashboard/monitoring-officer',
    };

    const correctPath = redirectMap[user?.role || ''] || '/login';
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}

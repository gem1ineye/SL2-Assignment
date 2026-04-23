import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import CompleteRegistration from './pages/CompleteRegistration';
import StudentDashboard from './pages/StudentDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import InstitutionDashboard from './pages/InstitutionDashboard';
import ProgrammeManagerDashboard from './pages/ProgrammeManagerDashboard';
import MonitoringOfficerDashboard from './pages/MonitoringOfficerDashboard';
import BatchJoin from './pages/BatchJoin';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AppContent() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
        <Route path="/join/:inviteCode" element={<BatchJoin />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trainer"
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/institution"
          element={
            <ProtectedRoute requiredRole="institution">
              <InstitutionDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/programme-manager"
          element={
            <ProtectedRoute requiredRole="programme_manager">
              <ProgrammeManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/monitoring-officer"
          element={
            <ProtectedRoute requiredRole="monitoring_officer">
              <MonitoringOfficerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="mesh-bg" />
        <div className="glass-card p-8 max-w-lg text-center relative z-10">
          <h1 className="text-2xl font-bold text-white mb-4">⚙️ Configuration Required</h1>
          <p className="text-dark-300 mb-4">
            Please add your Clerk publishable key to the environment variables:
          </p>
          <code className="block bg-dark-900 rounded-lg p-4 text-sm text-primary-400 mb-4">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
          </code>
          <p className="text-dark-500 text-sm">
            Get your key from{' '}
            <a href="https://clerk.com" target="_blank" rel="noreferrer" className="text-primary-400 hover:underline">
              clerk.com
            </a>
              {' '}→ Dashboard → API Keys
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ClerkProvider>
  );
}

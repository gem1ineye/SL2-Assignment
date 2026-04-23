import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { batchApi } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ClipboardList, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function BatchJoin() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { isSignedIn, isRegistered, user, refreshToken, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; batchName?: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      navigate(`/login`);
    }
  }, [authLoading, isSignedIn, navigate]);

  const handleJoin = async () => {
    if (!inviteCode) return;

    setJoining(true);
    try {
      await refreshToken();
      const data = await batchApi.join(inviteCode);
      setResult({ success: true, message: 'Successfully joined!', batchName: data.batchName });
      toast.success(`Joined batch: ${data.batchName}`);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to join batch';
      setResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  };

  if (authLoading) return <LoadingSpinner fullScreen message="Loading..." />;

  if (!isRegistered) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="mesh-bg" />
        <div className="glass-card p-8 max-w-md w-full text-center relative z-10">
          <ClipboardList className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Complete Registration First</h2>
          <p className="text-dark-400 mb-6">Please select your role before joining a batch.</p>
          <button onClick={() => navigate('/complete-registration')} className="btn-primary">
            Complete Registration
          </button>
        </div>
      </div>
    );
  }

  if (user?.role !== 'student') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="mesh-bg" />
        <div className="glass-card p-8 max-w-md w-full text-center relative z-10">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Students Only</h2>
          <p className="text-dark-400 mb-6">Only students can join batches via invite links.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="mesh-bg" />
      <div className="glass-card p-8 max-w-md w-full text-center relative z-10 animate-slide-up">
        <ClipboardList className="w-12 h-12 text-primary-400 mx-auto mb-4" />

        {result ? (
          <>
            {result.success ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            )}
            <h2 className="text-xl font-bold text-white mb-2">
              {result.success ? 'Joined Successfully!' : 'Join Failed'}
            </h2>
            <p className="text-dark-400 mb-2">{result.message}</p>
            {result.batchName && <p className="text-primary-400 font-medium mb-6">{result.batchName}</p>}
            <button onClick={() => navigate('/dashboard/student')} className="btn-primary">
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Join Batch</h2>
            <p className="text-dark-400 mb-2">You've been invited to join a batch.</p>
            <p className="text-sm text-dark-500 mb-6">Invite Code: <code className="text-primary-400">{inviteCode}</code></p>
            <button onClick={handleJoin} disabled={joining} className="btn-primary flex items-center gap-2 mx-auto">
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {joining ? 'Joining...' : 'Join Batch'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

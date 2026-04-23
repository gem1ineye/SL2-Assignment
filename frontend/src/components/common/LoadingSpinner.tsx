import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-dark-300 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-dark-400 font-medium text-sm">{message}</p>
      </div>
    </div>
  );
}

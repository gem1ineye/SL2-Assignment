import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export default function SignUp() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="mesh-bg" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">SkillBridge</span>
        </div>

        {/* Clerk SignUp */}
        <div className="flex justify-center">
          <ClerkSignUp
            routing="hash"
            afterSignUpUrl="/complete-registration"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-dark-800/80 backdrop-blur-xl border border-dark-700/50 shadow-2xl rounded-2xl',
                headerTitle: 'text-white',
                headerSubtitle: 'text-dark-400',
                socialButtonsBlockButton: 'bg-dark-700 border-dark-600 text-dark-200 hover:bg-dark-600',
                socialButtonsBlockButtonText: 'text-dark-200',
                formFieldLabel: 'text-dark-300',
                formFieldInput: 'bg-dark-800 border-dark-600 text-white focus:border-primary-500',
                footerActionLink: 'text-primary-400 hover:text-primary-300',
                formButtonPrimary: 'bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-600/25',
                dividerLine: 'bg-dark-700',
                dividerText: 'text-dark-500',
                footer: 'hidden',
              },
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-dark-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign in
            </Link>
          </p>
          <Link to="/" className="text-dark-600 text-xs hover:text-dark-400 mt-2 inline-block">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

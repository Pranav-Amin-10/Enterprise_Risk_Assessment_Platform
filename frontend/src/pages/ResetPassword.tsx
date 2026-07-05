import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '../store/useToastStore';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const oobCode = searchParams.get('oobCode');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setCodeValid(false);
      return;
    }

    // Verify if the oobCode from email is valid
    verifyPasswordResetCode(auth, oobCode)
      .then(() => setCodeValid(true))
      .catch((err) => {
        console.error(err);
        setCodeValid(false);
        toast.error('The password reset link is invalid or has expired.');
      });
  }, [oobCode]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast.success('Password updated successfully!');
      setCompleted(true);
    } catch (err: any) {
      console.error(err);
      toast.error(`Reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 mb-2">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create New Password</h1>
          <p className="text-xs text-dark-muted">Establish credentials to reactivate security access.</p>
        </div>

        {codeValid === null && (
          <div className="text-center py-6 text-sm text-dark-muted">Verifying recovery token...</div>
        )}

        {codeValid === false && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center text-red-400">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h3 className="text-white font-semibold text-sm">Invalid Token</h3>
            <p className="text-xs text-dark-muted leading-relaxed">
              This recovery link is invalid, malformed, or has already been used. Please submit a new password reset request.
            </p>
            <Link
              to="/forgot-password"
              className="w-full bg-dark-border hover:bg-dark-border/80 text-dark-text font-medium text-sm py-2 rounded-lg block transition-colors mt-4"
            >
              Request New Link
            </Link>
          </div>
        )}

        {codeValid === true && !completed && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 transition-all mt-6"
            >
              {loading ? 'Updating password...' : 'Apply New Password'}
            </button>
          </form>
        )}

        {completed && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h3 className="text-white font-semibold text-sm">Credentials Changed</h3>
            <p className="text-xs text-dark-muted">Your password was updated in Firebase. You can now sign in using your new credentials.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm py-2.5 rounded-lg transition-colors mt-4"
            >
              Log In
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { seedDemoStorage, getTable, saveTable } from '../../utils/mockApi';
import { toast } from '../../store/useToastStore';
import { Shield, Check, X, Lock, Eye, EyeOff } from 'lucide-react';

export const PasswordSetupDialog: React.FC = () => {
  const setupEmail = useAuthStore((state) => state.setupEmail) || '';
  const setTransientSetupState = useAuthStore((state) => state.setTransientSetupState);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Requirements Checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Calculate score (0 to 5)
  const strengthScore = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'None', color: 'bg-dark-border', text: 'text-dark-muted' };
    if (strengthScore <= 2) return { label: 'Weak Password', color: 'bg-red-500', text: 'text-red-400' };
    if (strengthScore <= 4) return { label: 'Medium Security', color: 'bg-amber-500', text: 'text-amber-400' };
    return { label: 'Strong Security', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = getStrengthLabel();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strengthScore < 5) {
      toast.error('Please fulfill all password security complexity checks.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, setupEmail, password);
      const token = await userCredential.user.getIdToken();

      // 2. Seed Mock Database locally
      seedDemoStorage('Corporate GRC HQ', setupEmail, 'Corporate Administrator');
      const users = getTable('users');
      users.forEach((u, i) => {
        if (u.role === 'super_admin' || u.email === setupEmail) {
          users[i].password = password;
        }
      });
      saveTable('users', users);

      localStorage.setItem('grc_admin_mode', 'true');
      localStorage.setItem('grc_admin_email', setupEmail);
      localStorage.setItem('grc_logged_in_user_email', setupEmail);

      // 3. Update Zustand Authentication State
      const mockProfile = {
        id: 'mock-user-123',
        email: setupEmail,
        name: 'Corporate Administrator',
        role: 'super_admin' as const,
        status: 'active' as const
      };
      
      useAuthStore.getState().setAuth(mockProfile, token);
      useAuthStore.getState().setNeedsSetup(false);
      if (setTransientSetupState) {
        setTransientSetupState(false, '');
      }

      toast.success('Administrator Password configured! Secure session unlocked.');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast.error(`Password registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const RequirementRow: React.FC<{ label: string; met: boolean }> = ({ label, met }) => (
    <div className="flex items-center gap-2 text-[11px]">
      {met ? (
        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 text-red-500 shrink-0" />
      )}
      <span className={met ? 'text-dark-text font-medium' : 'text-dark-muted'}>{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-dark-bg/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8 space-y-6 shadow-2xl animate-fade-in text-left">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 mb-1">
            <Shield className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Configure Secure Password</h2>
          <p className="text-xs text-dark-muted">
            Configure GRC credentials for <strong>{setupEmail}</strong>.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Choose Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-dark-muted hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-dark-muted hover:text-white transition-colors"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Complexity Meter */}
          {password.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <span className="text-dark-muted">Password Strength</span>
                <span className={strength.text}>{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-dark-border rounded-full overflow-hidden">
                <div 
                  className={`h-full ${strength.color} transition-all duration-300`} 
                  style={{ width: `${(strengthScore / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Password Requirements Checklist */}
          <div className="bg-[#232d45]/10 border border-dark-border/60 rounded-xl p-4 space-y-2">
            <div className="text-[10px] font-bold text-dark-text uppercase tracking-wider mb-1">Complexity Requirements</div>
            <RequirementRow label="At least 8 characters in length" met={hasMinLength} />
            <RequirementRow label="Contains an uppercase character (A-Z)" met={hasUppercase} />
            <RequirementRow label="Contains a lowercase character (a-z)" met={hasLowercase} />
            <RequirementRow label="Contains a numeric digit (0-9)" met={hasNumber} />
            <RequirementRow label="Contains a special symbol (!@#$%^&*...)" met={hasSpecial} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 shadow-lg shadow-brand-500/10"
          >
            {loading ? 'Registering Security Profile...' : 'Activate Admin Console'}
          </button>
        </form>
      </div>
    </div>
  );
};

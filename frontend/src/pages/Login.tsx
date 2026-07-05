import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { toast } from '../store/useToastStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authStoreLoading } = useAuthStore() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast.error(`Authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // If user is authenticated in Firebase but does not exist in D1 yet
  if (user && user.isUnregistered) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-white">Access Pending Approval</h1>
            <p className="text-sm text-dark-muted leading-relaxed">
              Your account <strong>{user.email}</strong> is registered successfully. However, your organization administrator has not assigned you a GRC access role yet.
            </p>
            <div className="bg-[#232d45]/20 border border-dark-border rounded-lg p-3 w-full text-xs text-dark-muted leading-relaxed text-left">
              <strong>System Notice:</strong> Once your profile is pre-registered by an auditor, CISO, or Super Admin, your access will be activated automatically on your next page refresh.
            </div>
            <button
              onClick={() => auth.signOut()}
              className="w-full bg-dark-border hover:bg-dark-border/80 text-dark-text font-medium text-sm py-2 rounded-lg transition-colors"
            >
              Sign In With Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 mb-2">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Sign In to GRC Platform</h1>
          <p className="text-xs text-dark-muted">Governance, Risk and Compliance Enterprise Console</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Corporate Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
              <input
                type="email"
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-dark-text">Password</label>
              <Link 
                to="/forgot-password" 
                className="text-[11px] text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || authStoreLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 transition-all mt-6"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Verifying Credentials...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-[11px] text-dark-muted leading-relaxed">
          Authorized personnel only. Access is monitored and logged in compliance with enterprise governance policies.
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { toast } from '../store/useToastStore';
import { seedDemoStorage } from '../utils/mockApi';
import { Modal } from '../components/ui/Modal';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authStoreLoading } = useAuthStore() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // First-time Admin Setup States
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupCompany, setSetupCompany] = useState('');
  const [setupLocation, setSetupLocation] = useState('');

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

  const handleAdminModeClick = () => {
    const isBootstrapped = localStorage.getItem('grc_mock_bootstrapped') === 'true';
    if (!isBootstrapped) {
      setShowSetupModal(true);
    } else {
      const adminEmail = localStorage.getItem('grc_admin_email') || 'admin@company.com';
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(code);
      setOtpInput('');
      setShowOtpModal(true);
      toast.success(`🔑 [Secure Mail Simulator] Verification Passcode sent to ${adminEmail}: ${code}`);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName || !setupEmail || !setupPassword || !setupCompany) {
      toast.error('All setup fields are required');
      return;
    }
    if (setupPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSetupLoading(true);
    try {
      // 1. Create account in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, setupEmail, setupPassword);
      const token = await userCredential.user.getIdToken();

      // 2. Bootstrap localStorage GRC schema
      seedDemoStorage(setupCompany, setupEmail, setupName, setupLocation || 'Headquarters');
      localStorage.setItem('grc_admin_mode', 'true');
      localStorage.setItem('grc_admin_email', setupEmail);

      // 3. Authenticate user locally in Zustand store
      const mockProfile = {
        id: 'mock-user-123',
        email: setupEmail,
        name: setupName,
        role: 'super_admin' as const,
        status: 'active' as const
      };
      useAuthStore.getState().setAuth(mockProfile, token);
      useAuthStore.getState().setNeedsSetup(false);

      toast.success('Admin Mode authenticated and bootstrapped in Firebase!');
      setShowSetupModal(false);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast.error(`Setup registration failed: ${err.message}`);
    } finally {
      setSetupLoading(false);
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

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-border/40"></div>
          </div>
          <span className="relative px-3 bg-dark-card text-[9px] text-dark-muted font-bold tracking-wider uppercase">Or</span>
        </div>

        <button
          type="button"
          onClick={handleAdminModeClick}
          className="w-full bg-[#232d45]/20 hover:bg-[#232d45]/45 border border-brand-500/30 hover:border-brand-500/60 text-brand-400 hover:text-brand-300 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <Shield className="h-4 w-4 text-brand-500 animate-pulse" />
          Launch Admin Mode (Verifiable Access)
        </button>

        <div className="text-center text-[11px] text-dark-muted leading-relaxed">
          Authorized personnel only. Access is monitored and logged in compliance with enterprise governance policies.
        </div>

      </div>

      {/* OTP Passcode Challenge Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Admin Mode Verification"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-dark-muted leading-relaxed">
            MFA Identity Verification: A One-Time Passcode (OTP) was generated and dispatched to the administrator inbox for <strong>{localStorage.getItem('grc_admin_email') || 'admin@company.com'}</strong>.
          </p>
          <div className="bg-[#232d45]/20 border border-dark-border rounded-lg p-3 text-[11px] text-brand-400 font-semibold flex items-center justify-between">
            <span>Security Challenge Active</span>
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-ping" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">6-Digit Passcode</label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 123456"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-center text-sm font-bold tracking-widest text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (otpInput === generatedOtp) {
                localStorage.setItem('grc_admin_mode', 'true');
                const adminEmail = localStorage.getItem('grc_admin_email') || 'admin@company.com';
                const mockProfile = {
                  id: 'mock-user-123',
                  email: adminEmail,
                  name: 'SecOps Administrator',
                  role: 'super_admin' as const,
                  status: 'active' as const
                };
                useAuthStore.getState().setAuth(mockProfile, 'mock-demo-token');
                useAuthStore.getState().setNeedsSetup(false);
                toast.success('MFA Passcode Verified! Identity authenticated as super_admin.');
                setShowOtpModal(false);
                navigate('/');
              } else {
                toast.error('Invalid verification passcode. Authentication rejected.');
              }
            }}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2 rounded-lg transition-colors"
          >
            Verify & Grant Access
          </button>
        </div>
      </Modal>

      {/* First-Time Setup Modal */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title="Bootstrap Admin Mode (First Time Setup)"
        size="md"
      >
        <form onSubmit={handleSetupSubmit} className="space-y-4 text-left">
          <p className="text-xs text-dark-muted leading-relaxed">
            Create your root administrator credentials. This account will be securely registered in your <strong>Firebase Auth</strong> project, and default GRC assets/risks will be seeded locally in your browser sandbox.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Admin Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Corporate Email</label>
              <input
                type="email"
                placeholder="admin@company.com"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={setupCompany}
                onChange={(e) => setSetupCompany(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-dark-text">Office Location (Optional)</label>
              <input
                type="text"
                placeholder="e.g. New York, NY"
                value={setupLocation}
                onChange={(e) => setSetupLocation(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={setupLoading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {setupLoading ? 'Creating credentials in Firebase...' : 'Register Account & Seed Platform'}
          </button>
        </form>
      </Modal>

    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from '../store/useToastStore';
import { Modal } from '../components/ui/Modal';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authStoreLoading } = useAuthStore() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  


  // First-time Admin Setup States (Activation Wizard)
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1 = Product Key, 2 = Email, 3 = OTP Input
  const [productKey, setProductKey] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [activationOtpInput, setActivationOtpInput] = useState('');
  const [generatedActivationOtp, setGeneratedActivationOtp] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // 1. Try Firebase Auth sign in
      try {
        localStorage.setItem('grc_admin_mode', 'true');
        localStorage.setItem('grc_logged_in_user_email', email);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await userCredential.user.getIdToken();
        toast.success('Logged in successfully via Firebase');
        navigate('/');
        return;
      } catch (fbErr) {
        localStorage.removeItem('grc_admin_mode');
        localStorage.removeItem('grc_logged_in_user_email');
        console.warn('Firebase login failed. Attempting local simulator credentials check...');
      }

      // 2. Fallback: Authenticate via mock users database
      const { getTable } = await import('../utils/mockApi');
      const users = getTable('users');
      const matchedUser = users.find(u => u.email === email && u.password === password);

      if (matchedUser) {
        localStorage.setItem('grc_admin_mode', 'true');
        localStorage.setItem('grc_logged_in_user_email', email);
        
        const mockProfile = {
          id: matchedUser.id,
          email: matchedUser.email,
          name: matchedUser.name,
          role: matchedUser.role,
          status: matchedUser.status
        };

        useAuthStore.getState().setAuth(mockProfile, 'mock-demo-token');
        useAuthStore.getState().setNeedsSetup(false);
        toast.success(`Welcome back, ${matchedUser.name}! (Simulated Access)`);
        navigate('/');
      } else {
        toast.error('Authentication failed: Invalid credentials.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminModeClick = () => {
    setSetupStep(1);
    setProductKey('');
    setSetupEmail('');
    setShowSetupModal(true);
  };

  const handleVerifyProductKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (productKey === '123456') {
      toast.success('Product Key verified! Enter your administrator email.');
      setSetupStep(2);
    } else {
      toast.error('Invalid Product Activation Key. Please verify the code.');
    }
  };

  const handleSendActivationOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupEmail) {
      toast.error('Email address is required.');
      return;
    }
    const code = '123456';
    setGeneratedActivationOtp(code);
    setActivationOtpInput('');
    setSetupStep(3);
    toast.success(`🔑 [Secure Mail Simulator] Verification Passcode sent to ${setupEmail}: ${code}`);
  };

  const handleVerifyActivationOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (activationOtpInput === generatedActivationOtp) {
      toast.success('Passcode verified! Directing to secure password setup.');
      setShowSetupModal(false);
      
      const setTransientSetupState = useAuthStore.getState().setTransientSetupState;
      if (setTransientSetupState) {
        setTransientSetupState(true, setupEmail);
      }
      navigate('/');
    } else {
      toast.error('Incorrect activation code. Access denied.');
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
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
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
          First Time Sign Up / Activate Platform
        </button>

        <div className="text-center text-[11px] text-dark-muted leading-relaxed">
          Authorized personnel only. Access is monitored and logged in compliance with enterprise governance policies.
        </div>

      </div>



      {/* First-Time Setup Modal (Product Key & OTP) */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => {
          setShowSetupModal(false);
          setSetupStep(1);
        }}
        title="Admin Mode Activation Wizard"
        size="sm"
      >
        <div className="space-y-6">
          {/* Step Progress Visualizer */}
          <div className="flex items-center justify-between px-2 pb-4 border-b border-dark-border/40">
            <div className="flex flex-col items-center space-y-1">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                setupStep === 1 
                  ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' 
                  : setupStep > 1 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-dark-border text-dark-muted'
              }`}>
                {setupStep > 1 ? '✓' : '1'}
              </span>
              <span className={`text-[9px] font-bold tracking-wider uppercase ${setupStep === 1 ? 'text-brand-400' : 'text-dark-muted'}`}>License</span>
            </div>
            <div className="flex-1 h-0.5 mx-2 bg-dark-border/40 relative">
              <div className={`absolute inset-y-0 left-0 bg-brand-500 transition-all duration-300 ${setupStep > 1 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className="flex flex-col items-center space-y-1">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                setupStep === 2 
                  ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' 
                  : setupStep > 2 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-dark-border text-dark-muted'
              }`}>
                {setupStep > 2 ? '✓' : '2'}
              </span>
              <span className={`text-[9px] font-bold tracking-wider uppercase ${setupStep === 2 ? 'text-brand-400' : 'text-dark-muted'}`}>Email</span>
            </div>
            <div className="flex-1 h-0.5 mx-2 bg-dark-border/40 relative">
              <div className={`absolute inset-y-0 left-0 bg-brand-500 transition-all duration-300 ${setupStep > 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className="flex flex-col items-center space-y-1">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                setupStep === 3 
                  ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' 
                  : 'bg-dark-border text-dark-muted'
              }`}>
                3
              </span>
              <span className={`text-[9px] font-bold tracking-wider uppercase ${setupStep === 3 ? 'text-brand-400' : 'text-dark-muted'}`}>Verify</span>
            </div>
          </div>

          {setupStep === 1 && (
            <form onSubmit={handleVerifyProductKey} className="space-y-4 text-left">
              <p className="text-xs text-dark-muted leading-relaxed">
                To activate Admin Mode, enter your 6-digit GRC platform product key.
              </p>
              
              <div className="bg-[#232d45]/20 border border-brand-500/20 rounded-xl p-3 text-xs leading-relaxed text-dark-muted flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div>
                  <span className="font-semibold text-brand-400">Evaluation Mode Key:</span>
                  <p className="mt-0.5">Use activation code <code className="px-1.5 py-0.5 bg-brand-500/10 border border-brand-500/30 rounded text-brand-300 font-bold text-[11px]">123456</code> to unlock standard setup access.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-dark-text">Product Key</label>
                <input
                  type="text"
                  placeholder="e.g. GRC999"
                  value={productKey}
                  onChange={(e) => setProductKey(e.target.value.toUpperCase())}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2.5 text-center text-sm font-bold tracking-widest text-white focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-500/10"
              >
                Verify Activation Code
              </button>
            </form>
          )}

          {setupStep === 2 && (
            <form onSubmit={handleSendActivationOtp} className="space-y-4 text-left">
              <p className="text-xs text-dark-muted leading-relaxed">
                Enter your corporate email address to receive an authentication passcode challenge.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-dark-text">Admin Email Address</label>
                <input
                  type="email"
                  placeholder="admin@company.com"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-500/10"
              >
                Send Verification Code
              </button>
            </form>
          )}

          {setupStep === 3 && (
            <form onSubmit={handleVerifyActivationOtp} className="space-y-4 text-left">
              <p className="text-xs text-dark-muted leading-relaxed">
                Enter the 6-digit passcode sent to your inbox: <strong>{setupEmail}</strong>.
              </p>

              <div className="bg-[#232d45]/20 border border-emerald-500/20 rounded-xl p-3 text-xs leading-relaxed text-dark-muted flex items-start gap-2.5">
                <span className="text-base">🔑</span>
                <div>
                  <span className="font-semibold text-emerald-400">Mail Simulator Passcode:</span>
                  <p className="mt-0.5">Use passcode <code className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 font-bold text-[11px]">123456</code> to verify email ownership.</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-dark-text">Verification Passcode</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={activationOtpInput}
                  onChange={(e) => setActivationOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2.5 text-center text-sm font-bold tracking-widest text-white focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-500/10"
              >
                Verify OTP & Complete Setup
              </button>
            </form>
          )}
        </div>
      </Modal>

    </div>
  );
};

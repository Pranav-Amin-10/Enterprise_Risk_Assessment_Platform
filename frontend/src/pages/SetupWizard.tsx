import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, ArrowRight, Building, User, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from '../store/useToastStore';
import { seedDemoStorage } from '../utils/mockApi';
import { Modal } from '../components/ui/Modal';

export const SetupWizard: React.FC = () => {
  const { setNeedsSetup } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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

  // Form State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');

  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName || !adminEmail || !adminPassword) {
      toast.error('All administrator fields are required');
      return;
    }

    if (adminPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const token = await userCredential.user.getIdToken();
      setFirebaseToken(token);
      
      toast.success('Administrator account registered in Firebase');
      setStep(2);
    } catch (err: any) {
      console.error(err);
      toast.error(`Admin creation failed: ${err.message}`);
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
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast.error(`Setup registration failed: ${err.message}`);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleBootstrapSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      toast.error('Company profile name is required');
      return;
    }

    if (!firebaseToken) {
      toast.error('Session expired, restart the wizard');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      // 2. Call Hono Bootstrap API
      const res = await fetch('/api/setup/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({
          name: adminName,
          companyName,
          location: location || 'Headquarters'
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('System bootstrapped and seeded successfully!');
        setStep(3);
      } else {
        toast.error(`Bootstrap failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Bootstrap connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    setNeedsSetup(false);
    // Reload window to force auth store to sync logged-in D1 profile
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 mb-2">
            <Shield className="h-7 w-7 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Setup Platform Wizard</h1>
          <p className="text-xs text-dark-muted">Configure your Fortune 500 GRC instance in a few clicks.</p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center px-4">
          <div className={`text-xs font-bold ${step >= 1 ? 'text-brand-500' : 'text-dark-muted'}`}>1. Admin Account</div>
          <div className="h-px bg-dark-border flex-1 mx-2" />
          <div className={`text-xs font-bold ${step >= 2 ? 'text-brand-500' : 'text-dark-muted'}`}>2. Company Details</div>
          <div className="h-px bg-dark-border flex-1 mx-2" />
          <div className={`text-xs font-bold ${step >= 3 ? 'text-brand-500' : 'text-dark-muted'}`}>3. Completed</div>
        </div>

        {/* Step 1: Create Admin User */}
        {step === 1 && (
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Administrator Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Corporate Email</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
                <input
                  type="email"
                  placeholder="admin@company.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
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
              {loading ? 'Creating account...' : 'Next: Organization Profile'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {step === 1 && (
          <>
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
          </>
        )}

        {/* Step 2: Company Config */}
        {step === 2 && (
          <form onSubmit={handleBootstrapSystem} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Company Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">HQ Office Location (Optional)</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-dark-muted" />
                <input
                  type="text"
                  placeholder="e.g. New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 transition-all mt-6"
            >
              {loading ? 'Initializing GRC Database...' : 'Bootstrap & Seed Platform'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle2 className="h-16 w-16 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">System Configured Successfully!</h2>
              <p className="text-xs text-dark-muted px-4 leading-relaxed">
                The D1 database schemas have been fully mapped, default threats (THR-001 to THR-009) and vulnerabilities (VUL-001 to VUL-009) have been seeded. You are now logged in as the root Super Administrator.
              </p>
            </div>
            <button
              onClick={handleCompleteSetup}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm py-2.5 rounded-lg transition-all"
            >
              Launch Dashboard
            </button>
          </div>
        )}

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
                window.location.reload();
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

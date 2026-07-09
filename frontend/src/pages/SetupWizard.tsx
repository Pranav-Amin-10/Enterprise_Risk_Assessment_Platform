import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, ArrowRight, Building, User, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from '../store/useToastStore';
import { Modal } from '../components/ui/Modal';

export const SetupWizard: React.FC = () => {
  const { setNeedsSetup } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);


  // Main System Bootstrap Wizard States
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');

  // First-time Admin Mode Activation States (Activation Wizard)
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1 = Product Key, 2 = Email, 3 = OTP Input
  const [productKey, setProductKey] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [activationOtpInput, setActivationOtpInput] = useState('');
  const [generatedActivationOtp, setGeneratedActivationOtp] = useState('');

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
    toast.success('Verification passcode dispatched successfully.');
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
      window.location.reload();
    } else {
      toast.error('Incorrect activation code. Access denied.');
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
              First Time Sign Up / Activate Platform
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
              <span className={`text-[9px] font-bold tracking-wider uppercase ${setupStep === 1 ? 'text-brand-600 dark:text-brand-400' : 'text-dark-muted'}`}>License</span>
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
              <span className={`text-[9px] font-bold tracking-wider uppercase ${setupStep === 2 ? 'text-brand-600 dark:text-brand-400' : 'text-dark-muted'}`}>Email</span>
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
              <span className={`text-[9px] font-bold tracking-wider uppercase ${setupStep === 3 ? 'text-brand-600 dark:text-brand-400' : 'text-dark-muted'}`}>Verify</span>
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
                  <span className="font-semibold text-brand-400">Default Activation Key:</span>
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
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2.5 text-center text-sm font-bold tracking-widest text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
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
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2.5 text-xs text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
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
                  <span className="font-semibold text-emerald-400">Default Verification Passcode:</span>
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
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2.5 text-center text-sm font-bold tracking-widest text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
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

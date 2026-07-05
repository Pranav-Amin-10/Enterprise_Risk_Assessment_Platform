import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ToastContainer } from './components/ui/Toast';

// Pages
import { Dashboard } from './pages/Dashboard';
import { RiskRegister } from './pages/RiskRegister';
import { AssetInventory } from './pages/AssetInventory';
import { ThreatLibrary } from './pages/ThreatLibrary';
import { VulnerabilityLibrary } from './pages/VulnerabilityLibrary';
import { RiskTreatment } from './pages/RiskTreatment';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { SetupWizard } from './pages/SetupWizard';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

export const App: React.FC = () => {
  const { user, loading, needsSetup, initialize } = useAuthStore() as any;
  const location = useLocation();

  // Initialize Auth Sync on component mount
  useEffect(() => {
    const unsubscribe = initialize();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-dark-muted font-medium">Synchronizing Secure Session...</span>
      </div>
    );
  }

  // 1. Database setup wizard redirect
  if (needsSetup && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  // 2. Setup screen route mapping
  if (location.pathname === '/setup') {
    return needsSetup ? <SetupWizard /> : <Navigate to="/" replace />;
  }

  // 3. Authenticated check
  const isAuthenticated = !!user && !user.isUnregistered;

  if (!isAuthenticated) {
    // Permit public password reset URLs
    if (location.pathname === '/forgot-password' || location.pathname === '/reset-password') {
      return (
        <>
          <Routes>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer />
        </>
      );
    }

    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer />
      </>
    );
  }

  // 4. Authorized Main Layout Shell
  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg text-dark-text font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Navbar */}
        <Navbar />

        {/* Dynamic Route Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-dark-bg">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/risks" element={<RiskRegister />} />
            <Route path="/assets" element={<AssetInventory />} />
            <Route path="/threats" element={<ThreatLibrary />} />
            <Route path="/vulnerabilities" element={<VulnerabilityLibrary />} />
            <Route path="/treatments" element={<RiskTreatment />} />
            <Route path="/reports" element={<Reports />} />
            
            {/* CISO & Auditor Audit Logs */}
            {['super_admin', 'ciso', 'auditor'].includes(user.role) && (
              <Route path="/audit-logs" element={<AuditLogs />} />
            )}

            {/* Admin/CISO Settings */}
            {['super_admin', 'ciso'].includes(user.role) && (
              <Route path="/settings" element={<Settings />} />
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Toast Alerts */}
      <ToastContainer />
    </div>
  );
};

export default App;

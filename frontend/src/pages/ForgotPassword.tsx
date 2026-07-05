import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Shield, Mail, ArrowLeft, Send } from 'lucide-react';
import { toast } from '../store/useToastStore';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset link dispatched!');
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
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
          <h1 className="text-xl font-bold text-white tracking-tight">Recover Password</h1>
          <p className="text-xs text-dark-muted">We will send you instructions to reset your password.</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="bg-[#232d45]/20 border border-dark-border p-4 rounded-xl text-sm leading-relaxed text-dark-muted">
              We have dispatched a secure password recovery link to <strong>{email}</strong>. Please check your inbox and click the verification URL to complete the reset.
            </div>
            <Link
              to="/login"
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors mt-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-500/10 transition-all mt-6"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Sending link...' : 'Send Recovery Link'}
            </button>

            <div className="text-center pt-2">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

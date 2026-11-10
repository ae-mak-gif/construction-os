import { useState, type FormEvent } from 'react';
import { Building2, Lock, Mail, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setFormError(error);
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setResetSent(false);
    setSubmitting(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }

    // Supabase intentionally returns the same result whether or not an account
    // exists, to prevent account enumeration.
    setResetSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4 shadow-lg">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BuildFlow</h1>
          <p className="text-navy-300 text-sm mt-1">Construction Operations Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {forgotPassword ? (
            <>
              <button
                type="button"
                onClick={() => { setForgotPassword(false); setFormError(null); setResetSent(false); }}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5"
              >
                <ArrowLeft size={16} /> Back to sign in
              </button>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Reset your password</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your account email and we'll send you a secure password-reset link.</p>

              {formError && (
                <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
              {resetSent ? (
                <div role="status" className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-emerald-800 font-medium">If an account exists for that email, a reset link has been sent.</p>
                  <p className="text-sm text-emerald-700 mt-1">Check your inbox and spam folder. The link will return you to BuildFlow to choose a new password.</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors">
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Sending link...</> : 'Send reset link'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Sign in to your account</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your credentials to access BuildFlow</p>

              {formError && (
                <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" disabled={submitting} />
                  </div>
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="login-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" disabled={submitting} />
                  </div>
                </div>
                <div className="flex justify-end -mt-1">
                  <button type="button" onClick={() => { setForgotPassword(true); setFormError(null); }} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                    Forgot password?
                  </button>
                </div>
                <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors">
                  {submitting ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign in'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-navy-400 text-xs mt-6">
          BuildFlow <span className="text-navy-300">|</span> Powered by Tishande
        </p>
      </div>
    </div>
  );
}

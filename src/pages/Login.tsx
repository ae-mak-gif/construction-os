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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) setFormError(error);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setResetSent(false);
    setSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (error) {
        setFormError(error.message);
        return;
      }
      // Supabase intentionally avoids revealing whether an email is registered.
      setResetSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to request a password reset. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">BuildFlow</h1>
          <p className="mt-1 text-sm text-navy-300">Construction Operations Platform</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {forgotPassword ? (
            <>
              <button type="button" onClick={() => { setForgotPassword(false); setFormError(null); setResetSent(false); }}
                className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
                <ArrowLeft size={16} /> Back to sign in
              </button>
              <h2 className="mb-1 text-lg font-semibold text-gray-800">Reset your password</h2>
              <p className="mb-6 text-sm text-gray-500">Enter your account email and we'll send you a secure password-reset link.</p>

              {formError && <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" /><p className="text-sm text-red-700">{formError}</p>
              </div>}
              {resetSent ? (
                <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-800">If an account exists for that email, a reset link has been sent.</p>
                  <p className="mt-1 text-sm text-emerald-700">Check your inbox and spam folder. The link will return you to BuildFlow to choose a new password.</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="reset-email" type="email" required autoComplete="email" value={email}
                        onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" disabled={submitting}
                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Sending link...</> : 'Send reset link'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-semibold text-gray-800">Sign in to your account</h2>
              <p className="mb-6 text-sm text-gray-500">Enter your credentials to access BuildFlow</p>

              {formError && <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" /><p className="text-sm text-red-700">{formError}</p>
              </div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="login-email" type="email" required autoComplete="email" value={email}
                      onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" disabled={submitting}
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input id="login-password" type="password" required autoComplete="current-password" value={password}
                      onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" disabled={submitting}
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                </div>
                <div className="-mt-1 flex justify-end">
                  <button type="button" onClick={() => { setForgotPassword(true); setFormError(null); }} className="text-sm font-medium text-brand-600 hover:text-brand-700">Forgot password?</button>
                </div>
                <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign in'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-navy-400">BuildFlow <span className="text-navy-300">|</span> Powered by Tishande</p>
      </div>
    </div>
  );
}

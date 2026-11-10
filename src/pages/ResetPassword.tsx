import { useEffect, useState, type FormEvent } from 'react';
import { Link, Lock, Loader2, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(window.location.search);
      const recoveryLink = hashParams.get('type') === 'recovery' || queryParams.get('type') === 'recovery' || queryParams.has('code');
      if (session && recoveryLink) setReady(true);
      setChecking(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUpdated(true);
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4 shadow-lg">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BuildFlow</h1>
          <p className="text-navy-300 text-sm mt-1">Choose a new password</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {checking ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500"><Loader2 size={18} className="animate-spin" /> Verifying your reset link...</div>
          ) : updated ? (
            <div role="status" className="text-center">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-800">Password updated</h2>
              <p className="text-sm text-gray-500 mt-2 mb-5">Your password has been changed. You can now sign in with your new password.</p>
              <a href="/" className="inline-flex justify-center w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg">Return to sign in</a>
            </div>
          ) : !ready ? (
            <div className="text-center">
              <AlertCircle size={32} className="text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-800">This reset link is invalid or expired</h2>
              <p className="text-sm text-gray-500 mt-2 mb-5">Request a new password-reset email from the BuildFlow sign-in page.</p>
              <a href="/" className="inline-flex justify-center w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg">Back to sign in</a>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Set a new password</h2>
              <p className="text-sm text-gray-500 mb-6">Choose a strong password you haven't used elsewhere.</p>
              {error && <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4"><AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-red-700">{error}</p></div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                  <div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" disabled={submitting} /></div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
                  <div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" disabled={submitting} /></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg">{submitting ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : 'Update password'}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

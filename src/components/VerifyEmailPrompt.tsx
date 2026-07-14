import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { sendEmailVerification } from '../lib/firebase';
import { secureSignOut } from '../services/sessionService';
import { userFacingError } from '../lib/userFacingError';
import BrandSpinner from './BrandSpinner';
import Logo from './Logo';

interface VerifyEmailPromptProps {
  user: User;
}

const VerifyEmailPrompt: React.FC<VerifyEmailPromptProps> = ({ user }) => {
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent. Check your inbox and spam folder.');
    } catch (err) {
      setError(userFacingError(err, 'Could not send verification email.'));
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await user.reload();
      if (user.emailVerified) {
        window.location.reload();
        return;
      }
      setError('Email is not verified yet. Open the link from your inbox, then try again.');
    } catch (err) {
      setError(userFacingError(err, 'Could not refresh verification status.'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    await secureSignOut();
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 paper-texture">
      <div className="w-full max-w-md space-y-6 text-center">
        <Logo className="mx-auto h-10 w-auto" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-primary">Verify your email</h1>
          <p className="text-sm text-primary/70 leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-medium text-primary">{user.email ?? 'your email'}</span>. Confirm
            your address before using Regrade.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={sending || refreshing}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <BrandSpinner size={18} /> Sending…
              </span>
            ) : (
              'Resend verification email'
            )}
          </button>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={sending || refreshing}
            className="w-full rounded-xl border border-primary/15 px-4 py-3 text-sm font-medium text-primary disabled:opacity-60"
          >
            {refreshing ? 'Checking…' : 'I verified — refresh'}
          </button>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="text-xs font-medium text-primary/50 hover:text-primary/70"
          >
            Sign out
          </button>
        </div>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
};

export default VerifyEmailPrompt;

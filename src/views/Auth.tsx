import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  loginWithGoogle,
  loginWithApple,
  sendPasswordResetEmail,
  sendEmailVerification,
  auth,
} from '../lib/firebase';
import { ICONS } from '../constants';
import BrandSpinner from '../components/BrandSpinner';
import ContinueWithGoogleButton from '../components/ContinueWithGoogleButton';
import ContinueWithAppleButton from '../components/ContinueWithAppleButton';
import { APP_DELETE_ACCOUNT_URL, APP_MIN_AGE, APP_EULA_URL, APP_PRIVACY_URL, APP_TERMS_URL } from '../version';
import { BRAND_ICON_SRC } from '../branding';
import { userFacingError } from '../lib/userFacingError';
import CoachWhale from '../components/CoachWhale';

type Mode = 'signin' | 'signup' | 'forgot';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const busy = loading || googleLoading || appleLoading;

  const handleProviderLogin = async (provider: 'google' | 'apple') => {
    setError(null);
    if (provider === 'google') setGoogleLoading(true);
    else setAppleLoading(true);
    try {
      const cred = provider === 'google' ? await loginWithGoogle() : await loginWithApple();
      if (!cred) return;
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'auth/popup-closed-by-user' || e.message?.includes('popup-closed-by-user')) return;
      if (e.code === 'auth/unauthorized-domain') {
        setError('Google sign-in is blocked on this address. Open http://localhost:3000 in Chrome, or use Continue with email.');
      } else {
        setError(userFacingError(err, 'Google sign-in could not finish. Try Chrome, or use Continue with email.'));
      }    } finally {
      if (provider === 'google') setGoogleLoading(false);
      else setAppleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setError('Password reset email sent. Check your inbox.');
        setMode('signin');
        setShowEmail(false);
      } else if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        setError('Account created. Check your email to verify, then sign in.');
        setMode('signin');
        return;
      }
    } catch (err: unknown) {
      setError(userFacingError(err, 'Authentication could not be completed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'forgot' ? 'Reset password' : mode === 'signin' ? 'Welcome back' : 'Create your account';
  const subtitle =
    mode === 'forgot'
      ? "We'll email you a link to reset your password."
      : mode === 'signin'
        ? 'Sign in to pick up your appeals right where you left them.'
        : 'A few seconds to sign up, then Mr Whale takes it from there.';

  return (
    <div className="rg-auth-screen">
      <div className="rg-auth-bg" aria-hidden />

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rg-auth-shell"
      >
        <div className="rg-auth-brand">
          <div className="rg-auth-mark" aria-hidden>
            <img src={BRAND_ICON_SRC} alt="" draggable={false} />
          </div>
          <p className="rg-auth-wordmark">Regrade</p>
        </div>

        <div className="rg-auth-whale-guide" aria-hidden>
          <span>Hi, I&apos;m Mr Whale.</span>
          <CoachWhale size={72} />
        </div>

        <div className="rg-auth-heading">
          <AnimatePresence mode="wait">
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="rg-auth-title"
            >
              {title}
            </motion.h1>
          </AnimatePresence>
          <p className="rg-auth-subtitle">{subtitle}</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className={`rg-auth-alert ${
                error.includes('sent') || error.includes('created') ? 'rg-auth-alert-good' : ''
              }`}
              role="status"
            >
              <ICONS.AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {mode !== 'forgot' && (
          <div className="rg-auth-providers">
            <ContinueWithAppleButton onClick={() => void handleProviderLogin('apple')} disabled={busy} loading={appleLoading} />
            <ContinueWithGoogleButton onClick={() => void handleProviderLogin('google')} disabled={busy} loading={googleLoading} />
          </div>
        )}

        {mode !== 'forgot' && !showEmail && (
          <button type="button" className="rg-auth-email-toggle" onClick={() => setShowEmail(true)}>
            <span><strong>Continue with email</strong><small>Email + password</small></span>
            <ICONS.ArrowRight aria-hidden />
          </button>
        )}

        {(mode === 'forgot' || showEmail) && mode !== 'forgot' && (
          <div className="rg-auth-divider">
            <span />
            <em>or with email</em>
            <span />
          </div>
        )}

        {(mode === 'forgot' || showEmail) && <form onSubmit={handleSubmit} className="rg-auth-form">
          <label className="rg-auth-field">
            <span>Email</span>
            <div className="rg-auth-field-input">
              <ICONS.User size={16} strokeWidth={2} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                autoComplete="email"
              />
            </div>
          </label>

          {mode !== 'forgot' && (
            <label className="rg-auth-field">
              <span className="flex items-center justify-between">
                <span>Password</span>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="rg-auth-linkish"
                  >
                    Forgot?
                  </button>
                )}
              </span>
              <div className="rg-auth-field-input">
                <ICONS.Lock size={16} strokeWidth={2} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
            </label>
          )}

          <button type="submit" disabled={busy} className="rg-auth-cta">
            {loading ? (
              <BrandSpinner size={18} />
            ) : mode === 'forgot' ? (
              'Send reset link'
            ) : mode === 'signin' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>}

        <div className="rg-auth-switch">
          <button
            type="button"
            onClick={() => {
              if (mode === 'forgot') setMode('signin');
              else {
                const next = mode === 'signin' ? 'signup' : 'signin';
                setMode(next);
                setShowEmail(next === 'signup');
              }
              setError(null);
            }}
          >
            {mode === 'forgot'
              ? 'Back to sign in'
              : mode === 'signin'
                ? "New here? Create an account"
                : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="rg-auth-fineprint">
          Built for students {APP_MIN_AGE}+. Younger students should use Regrade with a parent, guardian, or teacher. By continuing you agree to our{' '}
          <a href={APP_TERMS_URL} target="_blank" rel="noopener noreferrer">Terms</a>,{' '}
          <a href={APP_PRIVACY_URL} target="_blank" rel="noopener noreferrer">Privacy</a>, and{' '}
          <a href={APP_EULA_URL} target="_blank" rel="noopener noreferrer">EULA</a>.
        </p>
        <p className="rg-auth-fineprint rg-auth-fineprint-tiny">
          <ICONS.Shield size={12} strokeWidth={2} />
          Encrypted sign-in. Delete your account any time in Profile.{' '}
          <a href={APP_DELETE_ACCOUNT_URL} target="_blank" rel="noopener noreferrer">Deletion help</a>
        </p>
      </motion.main>
    </div>
  );
};

export default Auth;

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
import Logo from '../components/Logo';
import BrandSpinner from '../components/BrandSpinner';
import ContinueWithGoogleButton from '../components/ContinueWithGoogleButton';
import ContinueWithAppleButton from '../components/ContinueWithAppleButton';
import { APP_DELETE_ACCOUNT_URL, APP_MIN_AGE, APP_EULA_URL, APP_PRIVACY_URL, APP_TERMS_URL } from '../version';

const Auth: React.FC<{ previewDemo?: boolean }> = ({ previewDemo }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const busy = loading || googleLoading || appleLoading;

  const handleProviderLogin = async (provider: 'google' | 'apple') => {
    if (previewDemo) {
      setError('Preview mode — connect Firebase to use Apple or Google sign-in.');
      return;
    }
    setError(null);
    if (provider === 'google') setGoogleLoading(true);
    else setAppleLoading(true);
    try {
      const cred =
        provider === 'google' ? await loginWithGoogle() : await loginWithApple();
      if (!cred) return;
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'auth/popup-closed-by-user' || e.message?.includes('popup-closed-by-user')) {
        return;
      }
      if (e.code === 'auth/unauthorized-domain') {
        setError(
          'This URL isn’t allowed for sign-in yet. In Firebase → Authentication → Authorized domains, add your hostname (127.0.0.1 is separate from localhost). Or use http://localhost:3000.',
        );
        return;
      }
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      if (provider === 'google') setGoogleLoading(false);
      else setAppleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewDemo) {
      setError('Preview mode — connect Firebase to sign in with email.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (forgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setError('Password reset email sent. Check your inbox.');
        setForgotPassword(false);
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        setError('Account created! Check your email to verify, then sign in.');
        setIsLogin(true);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const title = forgotPassword ? 'Reset password' : isLogin ? 'Welcome back' : 'Create your account';
  const subtitle = forgotPassword
    ? 'We’ll email you a link to reset your password.'
    : isLogin
      ? 'Sign in to start or continue your grade appeal.'
      : 'Join Regrade — your personal grade appeal assistant.';

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 overflow-hidden rg-auth-screen">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[32rem] h-[32rem] rounded-full bg-secondary/[0.08] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%,36rem)] h-64 bg-canvas/40 blur-3xl rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[440px]"
      >
        <div className="text-center mb-8 sm:mb-10">
          <Logo size="hero" showTagline className="mb-8" />
          <h1 className="rg-serif text-2xl sm:text-3xl font-semibold text-primary tracking-tight">{title}</h1>
          <p className="mt-2 text-[15px] text-on-surface-variant/80 leading-relaxed max-w-sm mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="rounded-[1.75rem] rg-auth-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-5 p-4 rounded-xl text-sm font-medium leading-relaxed flex items-start gap-3 ${
                  error.includes('sent') || error.includes('created')
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                    : 'bg-red-50 border border-red-100 text-red-700'
                }`}
              >
                <ICONS.AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!forgotPassword && (
            <div className="mb-6 space-y-3">
              <ContinueWithAppleButton
                onClick={() => void handleProviderLogin('apple')}
                disabled={busy}
                loading={appleLoading}
              />
              <ContinueWithGoogleButton
                onClick={() => void handleProviderLogin('google')}
                disabled={busy}
                loading={googleLoading}
              />
            </div>
          )}

          {!forgotPassword && (
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-primary/10" />
              <span className="text-xs font-medium text-primary/40">or with email</span>
              <div className="h-px flex-1 bg-primary/10" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-primary/70 mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <ICONS.User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/35 pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rg-auth-input w-full rounded-xl pl-11 pr-4 py-3.5 text-[15px] outline-none transition-all"
                    placeholder="you@university.edu"
                    autoComplete="email"
                  />
                </div>
              </div>

              {!forgotPassword && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-primary/70">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setForgotPassword(true)}
                        className="text-xs font-semibold text-primary/50 hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <ICONS.Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/35 pointer-events-none"
                    />
                    <input
                      type="password"
                      required={!forgotPassword}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rg-auth-input w-full rounded-xl pl-11 pr-4 py-3.5 text-[15px] outline-none transition-all"
                      placeholder="••••••••"
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[52px] bg-primary text-white rounded-xl text-[15px] font-semibold shadow-lg shadow-primary/25 hover:bg-primary-focus active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <BrandSpinner size={20} />
              ) : forgotPassword ? (
                'Send reset link'
              ) : isLogin ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-primary/8 text-center">
            <button
              type="button"
              onClick={() => {
                if (forgotPassword) setForgotPassword(false);
                else setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm font-semibold text-primary/60 hover:text-primary transition-colors"
            >
              {forgotPassword
                ? '← Back to sign in'
                : isLogin
                  ? "Don't have an account? Create one"
                  : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-primary/45 leading-relaxed max-w-sm mx-auto">
          For users {APP_MIN_AGE}+. By continuing you agree to our{' '}
          <a href={APP_TERMS_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            Terms
          </a>{' '}
          and{' '}
          <a href={APP_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href={APP_EULA_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            EULA
          </a>
          .
        </p>
        <p className="mt-3 text-center text-xs text-primary/40 flex items-center justify-center gap-2">
          <ICONS.Shield size={14} strokeWidth={2} />
          Encrypted sign-in · delete your account anytime in Profile
        </p>
        <p className="mt-2 text-center text-[11px] text-primary/40"><a href={APP_DELETE_ACCOUNT_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Account deletion help</a></p>
      </motion.div>
    </div>
  );
};

export default Auth;

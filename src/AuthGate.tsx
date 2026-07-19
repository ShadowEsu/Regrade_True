import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, completeAuthRedirectIfNeeded, isNativeApp } from './lib/firebase';
import Auth from './views/Auth';
import BrandSpinner from './components/BrandSpinner';
import BootSplash from './components/BootSplash';
import { userService } from './services/userService';
import { needsEmailVerification } from './lib/authVerification';
import VerifyEmailPrompt from './components/VerifyEmailPrompt';
import WelcomeSurvey from './components/WelcomeSurvey';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * Authentication must never be held hostage by a slow Firestore request.
 * Profile sync is useful after a provider sign-in, but the Firebase auth
 * session is already valid by that point. A short deadline lets the app open
 * while the next live profile refresh reconciles any delayed data.
 */
function withDeadline<T>(promise: Promise<T>, timeoutMs = 5_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Profile sync timed out.')), timeoutMs);
    }),
  ]);
}

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let authResolved = false;

    const startupFallback = window.setTimeout(() => {
      if (cancelled || authResolved) return;
      // Native WebViews can occasionally fail to deliver Firebase's first
      // observer callback (for example after an interrupted OAuth hand-off).
      // Never trap the user on an indefinite splash: render from the SDK's
      // current in-memory state and let the live observer reconcile later.
      const currentUser = auth.currentUser;
      setUser(currentUser);
      setLoading(false);
      setOnboardingLoading(false);
    }, 4_000);

    // Register the auth observer before resolving an OAuth redirect. On an
    // embedded native WebView, getRedirectResult can remain pending while the
    // browser hands control back to the app. Waiting for it here used to leave
    // first launch stuck on the splash screen indefinitely.
    const unsub = onAuthStateChanged(auth, async (u) => {
        if (cancelled) return;
        authResolved = true;
        window.clearTimeout(startupFallback);
        setUser(u);
        setLoading(false);
        if (u) {
          try {
            // Passive boot-time sync: fills missing identity fields on first
            // launch but never overwrites a name the user chose themselves.
            await withDeadline(userService.syncProfile(u.uid, {
              name: u.displayName?.trim() || u.email?.split('@')[0] || 'Student',
              email: u.email || '',
              avatarUrl: u.photoURL || '',
            }, { passive: true }));
          } catch (err) {
            console.error('Institutional profile out of sync:', err);
          } finally {
            try {
              const profile = await withDeadline(userService.getProfile(u.uid));
              setNeedsOnboarding(profile?.onboardingComplete !== true);
            } catch {
              // A temporary Firestore issue should not trap someone at launch.
              setNeedsOnboarding(false);
            }
            setOnboardingLoading(false);
          }
        } else {
          setOnboardingLoading(false);
        }
      });

    // Redirect completion may update the observer above. It is deliberately
    // non-blocking so email sessions and signed-out launches can render now.
    // Native Apple authentication exchanges its credential directly. Running
    // Firebase's web redirect resolver inside WKWebView can trigger a hidden JS
    // dialog before first paint and freeze the native splash indefinitely.
    if (!isNativeApp()) void completeAuthRedirectIfNeeded();

    return () => {
      cancelled = true;
      window.clearTimeout(startupFallback);
      unsub();
    };
  }, []);

  if (loading || (user && onboardingLoading)) {
    return <BootSplash label="Signing you in" />;
  }

  if (!user) {
    return <Auth />;
  }

  if (needsEmailVerification(user)) {
    return <VerifyEmailPrompt user={user} />;
  }

  if (needsOnboarding) {
    return <WelcomeSurvey onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <>{children}</>;
};

export default AuthGate;

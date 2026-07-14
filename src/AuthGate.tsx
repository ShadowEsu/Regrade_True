import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, completeAuthRedirectIfNeeded } from './lib/firebase';
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

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      await completeAuthRedirectIfNeeded();
      if (cancelled) return;
      unsub = onAuthStateChanged(auth, async (u) => {
        if (cancelled) return;
        setUser(u);
        setLoading(false);
        if (u) {
          try {
            await userService.syncProfile(u.uid, {
              name: u.displayName?.trim() || u.email?.split('@')[0] || 'Student',
              email: u.email || '',
              avatarUrl: u.photoURL || '',
            });
          } catch (err) {
            console.error('Institutional profile out of sync:', err);
          } finally {
            try {
              const profile = await userService.getProfile(u.uid);
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
    })();

    return () => {
      cancelled = true;
      unsub?.();
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

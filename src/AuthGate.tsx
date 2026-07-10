import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, completeAuthRedirectIfNeeded } from './lib/firebase';
import { isPreviewMode, isPreviewSignInView } from './lib/previewMode';
import PreviewBanner from './components/PreviewBanner';
import Auth from './views/Auth';
import BrandSpinner from './components/BrandSpinner';
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
    if (isPreviewMode()) {
      const u = auth.currentUser;
      setUser(u);
      setLoading(false);
      if (!u) {
        setOnboardingLoading(false);
        return;
      }
      void (async () => {
        try {
          await userService.syncProfile(u.uid, { email: u.email || '' });
          const profile = await userService.getProfile(u.uid);
          setNeedsOnboarding(profile?.onboardingComplete !== true);
        } catch (err) {
          console.error('Preview profile could not load:', err);
          setNeedsOnboarding(false);
        } finally {
          setOnboardingLoading(false);
        }
      })();
      return;
    }

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
              name: u.displayName || '',
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

  if (isPreviewMode()) {
    if (isPreviewSignInView()) {
      return (
        <>
          <PreviewBanner />
          <Auth previewDemo />
        </>
      );
    }
    if (onboardingLoading) {
      return <BrandSpinner size={48} />;
    }
    if (needsOnboarding) {
      return (
        <>
          <PreviewBanner />
          <WelcomeSurvey onComplete={() => setNeedsOnboarding(false)} />
        </>
      );
    }
    return (
      <>
        <PreviewBanner />
        {children}
      </>
    );
  }

  if (loading || (user && onboardingLoading)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 paper-texture">
        <div className="text-center space-y-4">
          <BrandSpinner size={48} />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/40">Verifying Identity Integrity...</p>
        </div>
      </div>
    );
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

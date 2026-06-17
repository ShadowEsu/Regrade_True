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

interface AuthGateProps {
  children: React.ReactNode;
}

const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPreviewMode()) {
      const u = auth.currentUser;
      setUser(u);
      setLoading(false);
      if (u) {
        void userService.syncProfile(u.uid, {
          email: u.email || '',
        });
      }
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
          }
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
    return (
      <>
        <PreviewBanner />
        {children}
      </>
    );
  }

  if (loading) {
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

  return <>{children}</>;
};

export default AuthGate;

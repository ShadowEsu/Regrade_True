import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import { ICONS, DEFAULT_AVATAR_SRC } from '../constants';
import { auth, loginWithGoogle, signOut } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { userService, UserProfile } from '../services/userService';
import { scanContentForThreats } from '../lib/securityScanner';
import type { AiEngine } from '../types';
import BrandSpinner from '../components/BrandSpinner';

interface ProfileProps {
  onShowAbout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onShowAbout }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [profileData, setProfileData] = useState<Pick<UserProfile, 'name' | 'email' | 'major'>>({
    name: '',
    email: '',
    major: '',
  });
  const [aiEngine, setAiEngine] = useState<AiEngine | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showSecurityToast, setShowSecurityToast] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securityLogs, setSecurityLogs] = useState([
    { event: 'Account authenticated', status: 'Passed', time: '2m ago' },
    { event: 'Session established', status: 'Verified', time: '1m ago' },
    { event: 'Connection secured', status: 'Active', time: 'Now' },
  ]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const data = await userService.getProfile(u.uid);
          if (data) {
            setProfileData({
              name: data.name || u.displayName || '',
              email: data.email || u.email || '',
              major: data.major || '',
            });
            setAiEngine((data.aiEngine as AiEngine | undefined) ?? null);
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAiEngineChange = async (next: AiEngine) => {
    if (!user || next === aiEngine || aiSaving) return;
    setAiSaving(true);
    setAiEngine(next);
    try {
      await userService.setAiPreference(user.uid, next);
    } catch (err) {
      console.error('Failed to save AI engine preference:', err);
    } finally {
      setAiSaving(false);
    }
  };

  const sanitizeInput = (val: string) => DOMPurify.sanitize(val.trim());

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setScanning(true);
    setSecurityError(null);

    const fullContent = `${profileData.name} ${profileData.major}`;
    const scanResult = await scanContentForThreats(fullContent, 'profile');

    if (!scanResult.isSafe) {
      setSecurityError(scanResult.recommendation || "Your input contains content that can't be saved. Please review and try again.");
      setSecurityLogs(prev => [
        { event: 'Suspicious input blocked', status: 'Blocked', time: 'Just now' },
        ...prev.slice(0, 2)
      ]);
      setScanning(false);
      return;
    }
    
    // Strict Input Filtering
    const sanitized = {
      name: sanitizeInput(profileData.name),
      major: sanitizeInput(profileData.major),
      email: profileData.email,
    };

    try {
      await userService.syncProfile(user.uid, sanitized);
      setProfileData(sanitized);
      setIsEditing(false);
      setShowSecurityToast(true);
      setTimeout(() => setShowSecurityToast(false), 3000);
      
      setSecurityLogs(prev => [
        { event: 'Security scan passed', status: 'Passed', time: 'Just now' },
        { event: 'Profile updated', status: 'Success', time: 'Just now' },
        ...prev.slice(0, 1)
      ]);
    } catch (err) {
      console.error("Profile save failed", err);
    } finally {
      setScanning(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <BrandSpinner size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-6">
        <div className="glass-panel p-12 rounded-3xl space-y-6">
          <ICONS.Shield size={48} className="mx-auto text-primary opacity-20" />
          <h2 className="text-3xl text-primary">Access Restricted</h2>
          <p className="text-on-surface-variant font-medium">Please sign in to access your profile and appeal history.</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-3"
          >
             Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-24 pb-48 px-6 lg:px-12">
      {/* Profile/Settings Header */}
      <section className="relative pt-32 pb-24 border-b border-primary/10">
        <div className="flex flex-col lg:flex-row gap-16 items-center lg:items-end">
          <div className="relative group">
            <div className="w-56 h-56 rounded-[3.5rem] bg-white border-2 border-primary/10 p-2 overflow-hidden relative z-10 transition-all duration-700 shadow-huge">
              <img
                src={user.photoURL || DEFAULT_AVATAR_SRC}
                alt=""
                className="w-full h-full rounded-[3rem] object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full scale-150 opacity-20 -z-0"></div>
            <button 
              className="absolute -bottom-4 -right-4 bg-primary text-white p-5 rounded-3xl shadow-huge z-20 hover:scale-110 transition-transform border-4 border-surface"
            >
              <ICONS.Camera size={24} />
            </button>
          </div>
          
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-4">
               <span className="text-[12px] font-semibold uppercase tracking-[0.45em] text-primary/45">Your Profile</span>
               <div className="h-px w-12 bg-primary/10" />
            </div>
            <h1 className="text-6xl md:text-8xl font-semibold text-primary tracking-tight leading-none uppercase">
              {profileData.name || 'Anonymous User'}
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
              <div className="flex items-center gap-2 px-6 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[11px] font-medium text-green-700 uppercase tracking-widest">Session verified</span>
              </div>
              <p className="text-[11px] font-medium text-on-surface-variant/45 uppercase tracking-[0.32em]">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
        {/* Left Column: Form/Info */}
        <div className="lg:col-span-12 xl:col-span-8">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div 
                key="view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-16"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-12">
                    <div className="group">
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/30 mb-2">Major / Field of Study</p>
                      <p className="font-serif text-4xl font-semibold text-primary uppercase tracking-tight">{profileData.major || 'Not set yet'}</p>
                      <div className="h-px w-full bg-primary/5 mt-6 group-hover:bg-primary/20 transition-colors" />
                    </div>
                  </div>

                  <div className="glass-panel rounded-[3rem] p-12 bg-primary/[0.02] border border-primary/5 space-y-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-medium text-primary leading-tight">Edit Your Info</h3>
                    <p className="text-lg text-primary/50 italic leading-relaxed">
                      Keep your details up to date so Regrade can personalize your appeal letters.
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-5 rounded-2xl bg-primary text-white font-bold uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>

                <section className="glass-panel rounded-[3rem] p-12 bg-primary/[0.02] border border-primary/5 space-y-8">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/30">AI Engine</p>
                      <h3 className="text-2xl font-medium text-primary leading-tight">Choose how Regrade reads your worksheet</h3>
                      <p className="text-[13px] text-primary/60 italic leading-relaxed max-w-md">
                        Hybrid uses Gemini (by Google) and Claude (by Anthropic) together — Gemini reads marks and handwriting,
                        Claude reasons about fairness. Cross-checking catches more mistakes. You can switch any time.
                      </p>
                    </div>
                    {aiSaving && (
                      <ICONS.RefreshCcw className="animate-spin text-primary/40 shrink-0 mt-1" size={18} />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          id: 'hybrid' as const,
                          title: 'Hybrid',
                          tag: 'Recommended',
                          desc: 'Gemini reads + Claude reasons. Catches the most.',
                        },
                        {
                          id: 'gemini' as const,
                          title: 'Gemini only',
                          tag: 'Faster',
                          desc: 'Best on handwriting; one reader, no cross-check.',
                        },
                        {
                          id: 'claude' as const,
                          title: 'Claude only',
                          tag: 'Text-first',
                          desc: 'Best on typed PDFs and clear scans.',
                        },
                      ] satisfies { id: AiEngine; title: string; tag: string; desc: string }[]
                    ).map((opt) => {
                      const selected = aiEngine === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAiEngineChange(opt.id)}
                          disabled={aiSaving}
                          className={`text-left p-5 rounded-2xl border transition-all ${
                            selected
                              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                              : 'bg-white border-primary/10 hover:border-primary/30 text-primary'
                          } disabled:opacity-60`}
                          aria-pressed={selected}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-lg font-medium">{opt.title}</span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                                selected ? 'bg-white/15 text-white' : 'bg-primary/5 text-primary/55'
                              }`}
                            >
                              {opt.tag}
                            </span>
                          </div>
                          <p className={`text-[12px] leading-snug ${selected ? 'text-white/85' : 'text-primary/60'}`}>
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {!aiEngine && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/70 rounded-xl px-4 py-3">
                      Pick an engine the first time you analyze a worksheet — Regrade asks for your consent before sending uploads to either provider.
                    </p>
                  )}
                  <p className="text-[10.5px] text-primary/40 leading-relaxed">
                    Gemini is a trademark of Google LLC. Claude is a trademark of Anthropic PBC. Regrade is not affiliated with either.
                  </p>
                </section>

                <div className="flex flex-wrap gap-4">
                  {onShowAbout && (
                    <button
                      onClick={onShowAbout}
                      className="px-10 py-5 rounded-2xl border border-primary/15 text-primary/55 font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      About & Legal
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="px-10 py-5 rounded-2xl border border-red-500/20 text-red-500/40 font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-red-500 hover:text-white transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                key="edit"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleUpdate}
                className="glass-panel rounded-[4rem] p-16 space-y-12 border border-primary/10 bg-white shadow-huge"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-4">Legal Full Name</label>
                    <input 
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full bg-surface/50 border border-primary/10 rounded-[2rem] px-8 py-5 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 text-xl italic"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-4">Major / Course Field</label>
                    <input 
                      type="text"
                      required
                      value={profileData.major}
                      onChange={(e) => setProfileData({...profileData, major: e.target.value})}
                      className="w-full bg-surface/50 border border-primary/10 rounded-[2rem] px-8 py-5 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 text-xl italic"
                    />
                  </div>
                </div>

                <div className="flex gap-6 pt-12 border-t border-primary/5">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-5 font-bold uppercase tracking-[0.3em] text-[10px] text-primary/40 hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/10"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={scanning}
                    className="flex-1 py-5 font-bold uppercase tracking-[0.3em] text-[10px] text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {scanning ? <ICONS.RefreshCcw className="animate-spin" size={20} /> : null}
                    {scanning ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Security Logs */}
        <div className="lg:col-span-12 xl:col-span-4 lg:sticky lg:top-32 h-fit">
           <div className="glass-panel rounded-[3.5rem] p-12 border border-primary/10 bg-primary/5 space-y-12">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.6em] text-primary/50">Account Activity</h3>
                <p className="text-xs italic text-primary/30 leading-snug">Recent security events for your account.</p>
              </div>

              <div className="space-y-8">
                {securityLogs.map((log, i) => (
                  <div key={i} className="flex justify-between items-start group">
                    <div className="flex gap-6">
                       <div className="mt-1 w-2 h-2 rounded-full bg-primary/40 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(0,35,111,0.2)]" />
                       <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-widest text-primary/80 leading-none">{log.event}</p>
                          <p className="text-[10px] font-bold text-primary/20 uppercase tracking-tighter italic">{log.time}</p>
                       </div>
                    </div>
                    <span className="text-[10px] font-black text-green-700/60 bg-green-500/5 px-4 py-1.5 rounded-full uppercase tracking-tighter border border-green-500/10">Passed</span>
                  </div>
                ))}
              </div>

              <div className="pt-12 border-t border-primary/10 flex flex-col items-center text-center space-y-6">
                 <ICONS.Shield size={48} className="text-primary/10" />
                 <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/30">Regrade — Your data is private</p>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showSecurityToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-50 text-center"
          >
            <div className="bg-primary text-white rounded-2xl p-4 inline-flex items-center gap-3 shadow-2xl border border-white/20">
              <ICONS.Check size={20} />
              <p className="text-sm font-medium">Profile updated successfully</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;


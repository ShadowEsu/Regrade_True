import { lazy, Suspense, useEffect, useState } from 'react';
import { PREVIEW_CASE_ID } from './lib/previewFixtures';
import { isPreviewMode } from './lib/previewMode';
import { caseService } from './services/caseService';
import { auth } from './lib/firebase';
import { userService } from './services/userService';
import Layout from './components/Layout';
import ProductTutorial from './components/ProductTutorial';
import type { ProfileSection } from './views/Profile';

// Keep the dashboard fast. PDF rendering, AI reports, and profile tooling load
// only when a student opens them instead of becoming part of the first screen.
const Dashboard = lazy(() => import('./views/Dashboard'));
const Appeals = lazy(() => import('./views/Appeals'));
const UploadCenter = lazy(() => import('./views/UploadCenter'));
const EvidenceSummary = lazy(() => import('./views/EvidenceSummary'));
const VerdictReport = lazy(() => import('./views/VerdictReport'));
const AnnotatedExamReview = lazy(() => import('./views/AnnotatedExamReview'));
const AppealLearningHandoff = lazy(() => import('./views/AppealLearningHandoff'));
const Profile = lazy(() => import('./views/Profile'));
const History = lazy(() => import('./views/History'));
const Advocate = lazy(() => import('./views/Advocate'));
const About = lazy(() => import('./views/About'));
const StudyPrep = lazy(() => import('./views/StudyPrep'));
const PaperView = lazy(() => import('./views/PaperView'));

function ScreenLoader() {
  return <div className="min-h-[45vh] grid place-items-center text-sm text-ink-muted">Loading…</div>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [flowStep, setFlowStep] = useState('none');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [appealFlowActive, setAppealFlowActive] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [profileSection, setProfileSection] = useState<ProfileSection>('you');
  const [paperViewCaseId, setPaperViewCaseId] = useState<string | null>(null);
  const [paperViewMode, setPaperViewMode] = useState<'review' | 'learn'>('review');
  const [tutorialLoading, setTutorialLoading] = useState(true);
  const [needsTutorial, setNeedsTutorial] = useState(false);
  const [tutorialRole, setTutorialRole] = useState<'student' | 'supervisor'>('student');
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    const tourRequested = new URLSearchParams(window.location.search).get('tour') === '1';
    const user = auth.currentUser;
    if (!user) {
      setNeedsTutorial(tourRequested);
      setTutorialLoading(false);
      return;
    }
    void (async () => {
      try {
        const profile = await userService.getProfile(user.uid);
        setTutorialRole(profile?.accountRole === 'supervisor' ? 'supervisor' : 'student');
        setNeedsTutorial(tourRequested || profile?.tutorialComplete !== true);
        setTutorialStep(0);
      } catch {
        // A temporary profile read failure must never block the app.
        setNeedsTutorial(false);
      } finally {
        setTutorialLoading(false);
      }
    })();
  }, []);

  const handleStartAppeal = () => {
    setCurrentCaseId(null);
    setFlowStep('none');
    setAppealFlowActive(true);
    setActiveTab('upload');
  };

  const handleOpenAppeal = async (caseId: string) => {
    setCurrentCaseId(caseId);
    setAppealFlowActive(true);
    setActiveTab('upload');
    try {
      const c = await caseService.getCaseById(caseId);
      if (c?.analysis) {
        setFlowStep(c.progress >= 80 || c.draftEmail ? 'verdict' : 'summary');
      } else {
        setFlowStep('none');
      }
    } catch {
      setFlowStep('none');
    }
  };

  const handleSubmitUpload = (caseId?: string) => {
    if (caseId) setCurrentCaseId(caseId);
    setFlowStep('annotate');
  };

  const handleFinishAnnotation = () => {
    setFlowStep('summary');
  };

  const handleFinalizeVerdict = () => {
    setFlowStep('verdict');
  };

  const handleFinishDraft = () => {
    setFlowStep('learn');
  };

  const exitAppealFlow = () => {
    setAppealFlowActive(false);
    setFlowStep('none');
    setCurrentCaseId(null);
  };

  const openPaperView = (caseId: string, mode: 'review' | 'learn' = 'review') => {
    setPaperViewCaseId(caseId);
    setPaperViewMode(mode);
  };

  const closePaperView = () => setPaperViewCaseId(null);

  const renderContent = () => {
    if (paperViewCaseId) {
      return (
        <PaperView
          caseId={paperViewCaseId}
          mode={paperViewMode}
          onBack={closePaperView}
          onOpenAppeal={() => {
            const id = paperViewCaseId;
            closePaperView();
            void handleOpenAppeal(id);
          }}
        />
      );
    }

    if (showAbout) {
      return <About onBack={() => setShowAbout(false)} />;
    }

    if (activeTab === 'upload') {
      if (!appealFlowActive) {
        return (
          <Appeals onStartNew={handleStartAppeal} onOpenAppeal={handleOpenAppeal} />
        );
      }
      if (flowStep === 'summary') {
        return (
          <EvidenceSummary
            caseId={currentCaseId}
            onFinalize={handleFinalizeVerdict}
            onBack={exitAppealFlow}
          />
        );
      }
      if (flowStep === 'annotate') {
        return (
          <AnnotatedExamReview
            caseId={currentCaseId}
            onContinue={handleFinishAnnotation}
            onBack={exitAppealFlow}
          />
        );
      }
      if (flowStep === 'verdict') {
        return <VerdictReport caseId={currentCaseId} onBack={exitAppealFlow} onFinish={handleFinishDraft} />;
      }
      if (flowStep === 'learn') {
        return (
          <AppealLearningHandoff
            caseId={currentCaseId}
            onBack={() => setFlowStep('verdict')}
            onViewPaper={(id) => openPaperView(id, 'learn')}
            onOpenStudy={() => {
              exitAppealFlow();
              setActiveTab('study');
            }}
          />
        );
      }
      return (
        <UploadCenter
          onSubmit={handleSubmitUpload}
          onBack={exitAppealFlow}
          onOpenChat={() => setActiveTab('chat')}
        />
      );
    }

    if (activeTab === 'history') {
      return (
        <History
          onStartAppeal={handleStartAppeal}
          onOpenAppeal={handleOpenAppeal}
          onViewPaper={(id) => openPaperView(id, 'review')}
        />
      );
    }

    if (activeTab === 'study') {
      return (
        <StudyPrep
          onStartAppeal={handleStartAppeal}
          onViewPaper={(id) => openPaperView(id, 'learn')}
        />
      );
    }

    if (activeTab === 'profile') {
      return (
        <Profile
          section={profileSection}
          onSectionChange={setProfileSection}
          onShowAbout={() => setShowAbout(true)}
          onStartUpload={handleStartAppeal}
          onReplayTutorial={() => {
            setTutorialStep(0);
            setNeedsTutorial(true);
          }}
        />
      );
    }

    if (activeTab === 'chat') {
      return <Advocate caseId={appealFlowActive ? currentCaseId : undefined} />;
    }

    return (
      <Dashboard
        onStartAppeal={handleStartAppeal}
        onOpenChat={() => setActiveTab('chat')}
        onOpenAppeal={handleOpenAppeal}
        onOpenPlatforms={() => {
          setProfileSection('platform');
          setActiveTab('profile');
        }}
        onOpenStudy={() => setActiveTab('study')}
        onOpenSampleVerdict={
          isPreviewMode()
            ? () => {
                setCurrentCaseId(PREVIEW_CASE_ID);
                setAppealFlowActive(true);
                setActiveTab('upload');
                setFlowStep('verdict');
              }
            : undefined
        }
      />
    );
  };

  return (
    <Layout
      activeTab={activeTab}
      profileSection={profileSection}
      onProfileSectionChange={setProfileSection}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setShowAbout(false);
      }}
    >
      <Suspense fallback={<ScreenLoader />}>{renderContent()}</Suspense>
      {!tutorialLoading && needsTutorial && (
        <ProductTutorial
          role={tutorialRole}
          index={tutorialStep}
          onNext={() => setTutorialStep((step) => Math.min(step + 1, 9))}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setShowAbout(false);
          }}
          onProfileSectionChange={setProfileSection}
          onComplete={() => {
            setNeedsTutorial(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('tour');
            window.history.replaceState({}, '', url);
          }}
        />
      )}
    </Layout>
  );
}

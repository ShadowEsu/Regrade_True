import { useState } from 'react';
import { PREVIEW_CASE_ID } from './lib/previewFixtures';
import { isPreviewMode } from './lib/previewMode';
import { caseService } from './services/caseService';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Appeals from './views/Appeals';
import UploadCenter from './views/UploadCenter';
import EvidenceSummary from './views/EvidenceSummary';
import VerdictReport from './views/VerdictReport';
import Profile, { type ProfileSection } from './views/Profile';
import History from './views/History';
import Advocate from './views/Advocate';
import About from './views/About';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [flowStep, setFlowStep] = useState('none');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [appealFlowActive, setAppealFlowActive] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [profileSection, setProfileSection] = useState<ProfileSection>('you');

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
    setFlowStep('summary');
  };

  const handleFinalizeVerdict = () => {
    setFlowStep('verdict');
  };

  const exitAppealFlow = () => {
    setAppealFlowActive(false);
    setFlowStep('none');
    setCurrentCaseId(null);
  };

  const renderContent = () => {
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
      if (flowStep === 'verdict') {
        return <VerdictReport caseId={currentCaseId} onBack={exitAppealFlow} />;
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
      return <History onStartAppeal={handleStartAppeal} onOpenAppeal={handleOpenAppeal} />;
    }

    if (activeTab === 'profile') {
      return (
        <Profile
          section={profileSection}
          onSectionChange={setProfileSection}
          onShowAbout={() => setShowAbout(true)}
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
      {renderContent()}
    </Layout>
  );
}

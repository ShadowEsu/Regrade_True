import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import UploadCenter from './views/UploadCenter';
import EvidenceSummary from './views/EvidenceSummary';
import VerdictReport from './views/VerdictReport';
import Profile from './views/Profile';
import History from './views/History';
import Advocate from './views/Advocate';
import About from './views/About';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [flowStep, setFlowStep] = useState('none');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  const handleStartAppeal = () => {
    setActiveTab('upload');
  };

  const handleSubmitUpload = (caseId?: string) => {
    if (caseId) setCurrentCaseId(caseId);
    setFlowStep('summary');
  };

  const handleFinalizeVerdict = () => {
    setFlowStep('verdict');
  };

  const renderContent = () => {
    if (showAbout) {
      return <About onBack={() => setShowAbout(false)} />;
    }

    if (activeTab === 'upload') {
      if (flowStep === 'summary') {
        return <EvidenceSummary caseId={currentCaseId} onFinalize={handleFinalizeVerdict} />;
      }
      if (flowStep === 'verdict') {
        return <VerdictReport caseId={currentCaseId} />;
      }
      return <UploadCenter onSubmit={handleSubmitUpload} />;
    }

    if (activeTab === 'history') {
      return <History />;
    }

    if (activeTab === 'profile') {
      return <Profile onShowAbout={() => setShowAbout(true)} />;
    }

    if (activeTab === 'chat') {
      return <Advocate onBack={() => setActiveTab('dashboard')} />;
    }

    return (
      <Dashboard onStartAppeal={handleStartAppeal} onOpenChat={() => setActiveTab('chat')} />
    );
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setShowAbout(false);
        if (tab !== 'upload') setFlowStep('none');
      }}
    >
      {renderContent()}
    </Layout>
  );
}

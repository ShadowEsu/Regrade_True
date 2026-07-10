import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import AppealFlowSteps from './AppealFlowSteps';
import MarketingEyebrow from './MarketingEyebrow';
import type { AppealFlowStepId } from '../lib/appealHelpers';

const STEP_EYEBROW: Partial<Record<AppealFlowStepId, string>> = {
  upload: 'one upload',
  analyze: 'live',
  annotate: 'cross-check',
  evidence: 'transparency',
  draft: 'in your voice',
  learn: 'carry it forward',
};

export default function AppealFlowShell({
  step,
  title,
  subtitle,
  onBack,
  children,
  centered = false,
  hideHeader = false,
  wide = false,
}: {
  step: AppealFlowStepId;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  centered?: boolean;
  hideHeader?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-6 ${centered ? 'text-center' : ''}`}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className={`rg-text-link text-sm ${centered ? 'mx-auto' : ''}`}
        >
          <ICONS.ChevronLeft className="w-4 h-4" strokeWidth={2} />
          Back
        </button>
      )}

      <AppealFlowSteps current={step} />

      {!hideHeader && (title || subtitle || STEP_EYEBROW[step]) && (
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 max-w-lg mx-auto"
        >
          {STEP_EYEBROW[step] && (
            <div className={centered ? 'flex justify-center' : ''}>
              <MarketingEyebrow>{STEP_EYEBROW[step]}</MarketingEyebrow>
            </div>
          )}
          {title && (
            <h1 className="rg-serif text-[clamp(26px,6vw,34px)] text-ink font-semibold leading-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="rg-lead text-[15px] md:text-base text-ink-muted max-w-md mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.header>
      )}

      <div className={`${wide ? 'max-w-xl lg:max-w-5xl' : 'max-w-xl'} mx-auto w-full`}>{children}</div>
    </div>
  );
}

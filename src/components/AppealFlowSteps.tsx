import { motion } from 'motion/react';
import { APPEAL_FLOW_STEPS, type AppealFlowStepId } from '../lib/appealHelpers';

export default function AppealFlowSteps({ current }: { current: AppealFlowStepId }) {
  const currentIdx = APPEAL_FLOW_STEPS.findIndex((s) => s.id === current);

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-1 min-w-max px-0.5">
        {APPEAL_FLOW_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.id} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1.5 min-w-[3.25rem]">
                <motion.div
                  layout
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-white'
                      : done
                        ? 'bg-primary/15 text-primary'
                        : 'bg-parchment text-ink-muted'
                  }`}
                >
                  {done ? '✓' : idx + 1}
                </motion.div>
                <span
                  className={`text-[10px] font-medium leading-none ${
                    active ? 'text-primary' : done ? 'text-ink-muted' : 'text-ink-muted/70'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < APPEAL_FLOW_STEPS.length - 1 && (
                <div
                  className={`w-4 h-px mb-4 transition-colors ${
                    done ? 'bg-primary/25' : 'bg-hairline'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

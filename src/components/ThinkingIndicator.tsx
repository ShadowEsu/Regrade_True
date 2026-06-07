import { motion } from 'motion/react';
import SparkleAvatar from './SparkleAvatar';

export default function ThinkingIndicator({ label = 'Thinking' }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 items-start"
    >
      <SparkleAvatar size={36} />
      <div className="flex-1 min-w-0">
        <div className="rounded-[var(--radius-card)] border border-primary/15 bg-gradient-to-br from-primary/[0.08] to-canvas px-4 py-3.5">
          <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-primary mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <span className="rg-think-bar" />
            <span className="rg-think-bar [animation-delay:120ms]" />
            <span className="rg-think-bar [animation-delay:240ms]" />
            <span className="rg-think-bar [animation-delay:360ms]" />
            <span className="rg-think-bar [animation-delay:480ms]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

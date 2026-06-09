import { motion } from 'motion/react';
import { BRAND_ICON_SRC, COACH_NAME } from '../branding';

export default function SparkleAvatar({ size = 36 }: { size?: number }) {
  return (
    <motion.div
      className="relative shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 shadow-sm"
      style={{ width: size, height: size }}
      animate={{ boxShadow: ['0 0 0 0 rgba(0,102,204,0.25)', '0 0 0 6px rgba(0,102,204,0)', '0 0 0 0 rgba(0,102,204,0)'] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
      aria-hidden
    >
      <img
        src={BRAND_ICON_SRC}
        alt=""
        className="w-full h-full object-cover p-1"
        draggable={false}
      />
      <span className="sr-only">{COACH_NAME}</span>
    </motion.div>
  );
}

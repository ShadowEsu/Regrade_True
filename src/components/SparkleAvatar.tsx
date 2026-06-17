import CoachWhale from './CoachWhale';
import { COACH_NAME } from '../branding';

/** Small coach avatar beside AI messages and typing indicator */
export default function SparkleAvatar({
  size = 36,
  animate = false,
}: {
  size?: number;
  animate?: boolean;
}) {
  return (
    <div className="shrink-0" aria-hidden>
      <CoachWhale size={size} animate={animate} />
      <span className="sr-only">{COACH_NAME}</span>
    </div>
  );
}

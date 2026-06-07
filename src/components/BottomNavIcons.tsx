import { BRAND_ICON_SRC } from '../branding';

type IconProps = { active?: boolean; className?: string };

const inactive = '#7a7a7a';
const activeColor = '#0066cc';

export function NavHomeIcon({ active, className = 'w-5 h-5' }: IconProps) {
  const fill = active ? activeColor : inactive;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path
        d="M4 10.2 12 4l8 6.2V19a1.5 1.5 0 0 1-1.5 1.5H14v-5.5H10V20.5H5.5A1.5 1.5 0 0 1 4 19v-8.8Z"
        fill={active ? `${activeColor}18` : 'transparent'}
        stroke={fill}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="1.25" fill={fill} />
    </svg>
  );
}

export function NavAppealIcon({ active, className = 'w-5 h-5' }: IconProps) {
  const stroke = active ? activeColor : inactive;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="2.5"
        fill={active ? `${activeColor}14` : 'transparent'}
        stroke={stroke}
        strokeWidth="1.75"
      />
      <path d="M8.5 8.5h7M8.5 12h5.5M8.5 15.5h4" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="17" r="4.25" fill={active ? activeColor : '#e8e8ed'} stroke={active ? activeColor : inactive} strokeWidth="1.5" />
      <path d="M15.2 17h3.6M17 15.2v3.6" stroke={active ? '#fff' : inactive} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function NavChatIcon({ active, className = 'w-6 h-6' }: IconProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl overflow-hidden ${className} ${
        active ? 'shadow-sm shadow-primary/25' : 'opacity-80'
      }`}
      aria-hidden
    >
      <img
        src={BRAND_ICON_SRC}
        alt=""
        className="w-full h-full object-cover"
        draggable={false}
      />
      {active && (
        <span className="absolute inset-0 rounded-xl ring-2 ring-primary/40 ring-offset-1 ring-offset-parchment" />
      )}
    </div>
  );
}

export function NavHistoryIcon({ active, className = 'w-5 h-5' }: IconProps) {
  const stroke = active ? activeColor : inactive;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <circle
        cx="12"
        cy="12"
        r="8.25"
        fill={active ? `${activeColor}12` : 'transparent'}
        stroke={stroke}
        strokeWidth="1.75"
      />
      <path
        d="M12 7.5v4.75l3.25 2"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 4.5 5 7l2.5 1.2"
        stroke={active ? activeColor : inactive}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.7}
      />
      {active && (
        <circle cx="12" cy="12" r="1.5" fill={activeColor} />
      )}
    </svg>
  );
}

export function NavProfileIcon({ active, className = 'w-5 h-5' }: IconProps) {
  const stroke = active ? activeColor : inactive;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <circle
        cx="12"
        cy="8.25"
        r="3.5"
        fill={active ? `${activeColor}18` : 'transparent'}
        stroke={stroke}
        strokeWidth="1.75"
      />
      <path
        d="M6.5 19.5c0-3 2.46-5.5 5.5-5.5s5.5 2.5 5.5 5.5"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const NAV_TAB_ICONS = {
  dashboard: NavHomeIcon,
  upload: NavAppealIcon,
  chat: NavChatIcon,
  history: NavHistoryIcon,
  profile: NavProfileIcon,
} as const;

import { ICONS } from '../constants';
import { useTheme } from '../context/ThemeContext';

export default function ThemeQuickToggle() {
  const { resolved, setPreference } = useTheme();
  const isDark = resolved === 'dark';

  return (
    <button
      type="button"
      onClick={() => void setPreference(isDark ? 'light' : 'dark')}
      className="rg-header-icon-btn w-9 h-9 shrink-0 text-ink-muted hover:text-primary"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <ICONS.Sun className="w-[18px] h-[18px]" strokeWidth={2} />
      ) : (
        <ICONS.Moon className="w-[18px] h-[18px]" strokeWidth={2} />
      )}
    </button>
  );
}

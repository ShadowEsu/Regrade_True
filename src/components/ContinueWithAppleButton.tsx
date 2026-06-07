import BrandSpinner from './BrandSpinner';

type Props = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export default function ContinueWithAppleButton({
  onClick,
  disabled,
  loading,
  className = '',
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full min-h-[52px] flex items-center justify-center gap-3 rounded-xl border border-ink/10 bg-ink text-white text-[15px] font-semibold hover:bg-ink/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <BrandSpinner size={22} />
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span>Continue with Apple</span>
        </>
      )}
    </button>
  );
}

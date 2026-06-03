import GoogleLogo from './GoogleLogo';
import BrandSpinner from './BrandSpinner';

type Props = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export default function ContinueWithGoogleButton({
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
      className={`w-full min-h-[52px] flex items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white text-[#3c4043] text-[15px] font-semibold shadow-[0_1px_2px_rgba(60,64,67,0.08)] hover:bg-[#f8f9fa] hover:border-[#c6c9cc] hover:shadow-[0_2px_6px_rgba(60,64,67,0.12)] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white ${className}`}
    >
      {loading ? (
        <BrandSpinner size={22} />
      ) : (
        <>
          <GoogleLogo size={22} />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

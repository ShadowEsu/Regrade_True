import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';

export default function DeleteAccountDialog({
  open,
  deleting,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  deleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="bg-canvas rounded-2xl max-w-md w-full p-6 shadow-2xl border border-hairline space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <ICONS.ShieldAlert className="w-5 h-5 text-red-600" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 id="delete-account-title" className="rg-serif text-xl text-ink font-semibold">
                  Delete account?
                </h2>
                <p className="text-[13px] text-muted leading-relaxed">
                  This permanently removes your profile, appeal history, and drafts. It cannot be undone.
                  Active subscriptions must be cancelled in the App Store or Google Play first.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-red-700 bg-red-50 border border-red-200/70 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={onConfirm}
                disabled={deleting}
                className="w-full py-3 rounded-xl bg-red-600 text-white text-[14px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <ICONS.RefreshCcw className="w-4 h-4 animate-spin" /> : null}
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={deleting}
                className="w-full py-3 rounded-xl text-[14px] font-medium text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

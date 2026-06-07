import React from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';
import Logo from '../components/Logo';
import {
  APP_VERSION,
  APP_NAME,
  APP_COPYRIGHT,
  APP_SUPPORT_EMAIL,
  APP_PRIVACY_URL,
  APP_TERMS_URL,
  APP_WEBSITE_URL,
  APP_DISCLAIMER,
  APP_LEGAL_OWNER,
  APP_MIN_AGE,
} from '../version';

interface AboutProps {
  onBack: () => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-6 py-3 border-b border-primary/10 last:border-b-0">
    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/55 shrink-0">
      {label}
    </span>
    <span className="text-sm text-on-surface text-right break-all">{value}</span>
  </div>
);

const LinkRow: React.FC<{ label: string; href: string; external?: boolean }> = ({
  label,
  href,
  external,
}) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-primary/10 bg-white/60 hover:bg-white hover:border-primary/30 transition-colors group"
  >
    <span className="text-sm font-medium text-primary group-hover:text-primary">{label}</span>
    <ICONS.ArrowRight
      className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors"
      strokeWidth={1.75}
    />
  </a>
);

export default function About({ onBack }: AboutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto space-y-10"
    >
      <header className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/55 hover:text-primary transition-colors"
        >
          <ICONS.ChevronLeft className="w-4 h-4" strokeWidth={2} />
          Back
        </button>
        <Logo size="xl" className="!text-left py-0" />
        <h1 className="text-4xl md:text-5xl text-primary font-semibold tracking-tight">
          About {APP_NAME}
        </h1>
        <p className="text-on-surface-variant/85 text-base leading-relaxed max-w-xl">
          {APP_DISCLAIMER}
        </p>
      </header>

      <section className="glass-panel rounded-3xl p-6 md:p-8 bg-white">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/55 mb-2">
          Build
        </h2>
        <div className="divide-y divide-primary/10">
          <Row label="App" value={APP_NAME} />
          <Row label="Version" value={APP_VERSION} />
          <Row label="Owner" value={APP_LEGAL_OWNER} />
          <Row label="Support" value={APP_SUPPORT_EMAIL} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/55 px-1">
          Legal
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <LinkRow label="Privacy Policy" href={APP_PRIVACY_URL} external />
          <LinkRow label="Terms of Service" href={APP_TERMS_URL} external />
          <LinkRow label="Website" href={APP_WEBSITE_URL} external />
          <LinkRow
            label={`Contact: ${APP_SUPPORT_EMAIL}`}
            href={`mailto:${APP_SUPPORT_EMAIL}?subject=Regrade%20support`}
          />
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-6 md:p-8 bg-white space-y-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/55">
          Your data
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {APP_NAME} is for users {APP_MIN_AGE} and older. You can delete your account and all
          associated data from <strong className="font-medium text-primary">Profile → Account → Delete account</strong>,
          or email {APP_SUPPORT_EMAIL}. Deletion removes your profile, appeals, and drafts permanently.
        </p>
      </section>

      <section className="glass-panel rounded-3xl p-6 md:p-8 bg-white space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/55">
          Acknowledgements
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {APP_NAME} is built on open-source software. A list of third-party components
          and their licenses is bundled with the app distribution and reproduced in the{' '}
          <code className="font-mono text-[12px] text-primary/80">NOTICE.md</code> file in
          our source repository.
        </p>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          &ldquo;Canvas&rdquo;, &ldquo;Gradescope&rdquo;, &ldquo;Moodle&rdquo;,
          &ldquo;D2L Brightspace&rdquo;, &ldquo;Schoology&rdquo;,
          &ldquo;Microsoft Teams&rdquo;, &ldquo;Google Classroom&rdquo;,
          &ldquo;Turnitin&rdquo;, and other learning-platform names referenced in the
          app are trademarks of their respective owners. {APP_NAME} is not affiliated
          with, endorsed by, or sponsored by any of these companies.
        </p>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {APP_NAME} integrates with Gemini and supports Claude models via Google and Anthropic services. &ldquo;Gemini&rdquo;
          is a trademark of Google LLC. &ldquo;Claude&rdquo; and &ldquo;Anthropic&rdquo; are trademarks of Anthropic PBC.
          {' '}{APP_NAME} is not affiliated with, endorsed by, or sponsored by either company. Change which reader runs
          from Profile → AI.
        </p>
      </section>

      <footer className="pt-4 pb-12 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/45">
          {APP_COPYRIGHT}
        </p>
      </footer>
    </motion.div>
  );
}

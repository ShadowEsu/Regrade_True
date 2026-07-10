import { useState } from 'react';
import { ICONS } from '../constants';
import MarketingEyebrow from '../components/MarketingEyebrow';
import AnimatedPrimaryButton from '../components/AnimatedPrimaryButton';
import { isPreviewMode } from '../lib/previewMode';

/**
 * This is intentionally a consent-first empty state. A real learner dashboard
 * is only populated after a signed-in learner accepts a server-authorized link.
 */
export default function SupervisorHub() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-7 pb-8">
      <section className="rounded-[24px] rg-glass-hero px-5 py-8 sm:px-7 sm:py-9">
        <MarketingEyebrow>supervised workspace</MarketingEyebrow>
        <h1 className="rg-serif mt-2 text-[clamp(30px,7vw,42px)] text-ink font-semibold leading-[1.05]">Support the learner. Keep them in control.</h1>
        <p className="mt-3 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed text-ink-muted">Invite a learner to connect their Regrade account. Nothing is visible until they accept, and they can remove access at any time.</p>
      </section>

      {!showPreview ? <section className="rg-glass-form-card p-6 text-center space-y-4">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><ICONS.User className="h-6 w-6" strokeWidth={1.8} /></div>
        <div><h2 className="rg-serif text-xl text-ink font-semibold">No learner is connected yet.</h2><p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted">When linking is available, you will send an invitation. The learner signs in, chooses what to share, and accepts before this workspace can show any academic activity.</p></div>
        <AnimatedPrimaryButton disabled className="mx-auto max-w-xs">Invite a learner — coming soon</AnimatedPrimaryButton>
        {isPreviewMode() && <button type="button" onClick={() => setShowPreview(true)} className="text-[13px] font-semibold text-primary hover:underline">View a consent-safe sample workspace</button>}
      </section> : <>
        <p className="rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2 text-[11px] text-primary">Preview sample — fictional learner data. Nothing is connected or shared.</p>
        <section className="rg-glass-form-card p-5 flex items-center justify-between gap-4"><div><MarketingEyebrow>linked learner</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink font-semibold">Jordan Lee</h2><p className="mt-1 text-[12px] text-ink-muted">Sharing: analyzed exams and appeal drafts</p></div><span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-800">Consent active</span></section>
        <section className="grid grid-cols-3 gap-3"><div className="rg-glass-stat p-4"><p className="rg-meta-k">Exams</p><p className="rg-serif mt-1 text-3xl text-ink font-semibold">2</p></div><div className="rg-glass-stat p-4"><p className="rg-meta-k">Study</p><p className="rg-serif mt-1 text-3xl text-ink font-semibold">1/3</p></div><div className="rg-glass-stat p-4"><p className="rg-meta-k">Drafts</p><p className="rg-serif mt-1 text-3xl text-ink font-semibold">1</p></div></section>
        <section className="rg-glass-form-card p-5 space-y-4"><div><MarketingEyebrow>how you can help</MarketingEyebrow><h2 className="rg-serif mt-1 text-xl text-ink font-semibold">Review, suggest, then let the learner decide.</h2></div><div className="grid gap-3 text-[13px] leading-relaxed text-ink-muted"><p><span className="font-semibold text-ink">View shared evidence.</span> See only the exams, feedback, and drafts that the learner approved.</p><p><span className="font-semibold text-ink">Suggest a clarification or re-appeal.</span> Create a draft for the learner to review; Regrade never sends it automatically.</p><p><span className="font-semibold text-ink">Keep boundaries clear.</span> A parent or educator cannot change a grade, read a school account, or alter the learner’s plan.</p></div><button type="button" className="rg-btn-ghost w-full py-3" onClick={() => setShowPreview(false)}>Back to empty workspace</button></section>
      </>}
      <p className="px-1 text-[12px] leading-relaxed text-ink-muted">For educators, this workspace must also follow school policy and applicable privacy rules. Regrade is a review and communication aid—not a grading system.</p>
    </div>
  );
}

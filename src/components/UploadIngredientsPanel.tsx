import React from 'react';
import { ICONS } from '../constants';

type Ingredient = {
  id: string;
  title: string;
  detail: string;
  met: boolean;
  optional?: boolean;
};

export default function UploadIngredientsPanel({
  hasUpload,
  hasRubricPaste,
  platformName,
}: {
  hasUpload: boolean;
  hasRubricPaste: boolean;
  platformName: string;
}) {
  const items: Ingredient[] = [
    {
      id: 'graded',
      title: 'Graded export',
      detail: 'PDF or photo with marks — not your original submission',
      met: hasUpload,
    },
    {
      id: 'scores',
      title: 'Per-question scores',
      detail: 'Each question shows earned / possible (e.g. 3 / 5)',
      met: hasUpload,
    },
    {
      id: 'rubric',
      title: 'Rubric or mark scheme',
      detail: hasRubricPaste
        ? 'You pasted criteria — we will cross-check marks against it'
        : 'Visible on the file, or paste in the rubric field below',
      met: hasRubricPaste,
      optional: !hasRubricPaste,
    },
    {
      id: 'comments',
      title: 'Instructor feedback',
      detail: `${platformName}: bubbles, pins, QuickMarks, or margin notes when available`,
      met: hasUpload,
      optional: true,
    },
    {
      id: 'platform',
      title: 'Platform selected',
      detail: `${platformName} — helps the AI read layout correctly`,
      met: true,
    },
  ];

  const metCount = items.filter((i) => i.met).length;
  const ready = hasUpload && metCount >= 3;

  return (
    <div className="rg-upload-ingredients rounded-[18px] p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-primary font-semibold">
            Upload checklist
          </p>
          <p className="text-[13px] font-medium text-ink/80 mt-1 leading-relaxed">
            {ready
              ? 'Good ingredients — ready to analyze.'
              : 'Add a graded file for the strongest read.'}
          </p>
        </div>
        <span
          className={`shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
            ready
              ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/25 rg-ingredient-ready'
              : 'text-ink-muted bg-parchment border-hairline'
          }`}
        >
          {metCount}/{items.length}
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
              item.met
                ? 'border-emerald-500/20 bg-emerald-500/[0.06] rg-ingredient-item-met'
                : 'border-hairline bg-parchment/50 rg-ingredient-item-pending'
            }`}
          >
            <span
              className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full ${
                item.met ? 'text-emerald-600 bg-emerald-500/15' : 'text-ink-muted bg-hairline/30'
              }`}
              aria-hidden
            >
              {item.met ? (
                <ICONS.Check className="w-3 h-3" strokeWidth={3} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink flex items-center gap-2">
                {item.title}
                {item.optional && !item.met && (
                  <span className="text-[9px] font-mono uppercase tracking-wider text-ink-muted font-normal">
                    optional
                  </span>
                )}
              </p>
              <p className="text-[12px] text-ink-muted leading-relaxed mt-0.5">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

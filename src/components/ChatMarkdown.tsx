import React from 'react';
import katex from 'katex';
import DOMPurify from 'dompurify';
import 'katex/dist/katex.min.css';
import 'katex/contrib/mhchem';

/**
 * Minimal markdown renderer for assistant chat replies. Builds React nodes
 * directly (never innerHTML), covering what Gemini actually emits in chat:
 * **bold**, `inline code`, bullet / numbered lists, and ### headings.
 * Everything else stays plain text.
 */

function MathFormula({ source, display = false }: { source: string; display?: boolean; key?: React.Key }) {
  let html: string;
  try {
    html = katex.renderToString(source, { displayMode: display, throwOnError: false, strict: 'warn', trust: false });
  } catch {
    return <code className="font-mono text-[13px] text-ink">{source}</code>;
  }
  return <span className={display ? 'block overflow-x-auto py-2' : 'inline-block max-w-full overflow-x-auto align-middle'} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\\\([^\n]+?\\\))|(\$(?!\s)[^$\n]+?(?<!\s)\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyBase}-c${i}`}
          className="px-1.5 py-0.5 rounded bg-primary/10 text-ink font-mono text-[13px]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const source = token.startsWith('\\(') ? token.slice(2, -2) : token.slice(1, -1);
      nodes.push(<MathFormula key={`${keyBase}-m${i}`} source={source} />);
    }
    lastIndex = match.index + token.length;
    i += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length ? nodes : [text];
}

type Block =
  | { kind: 'paragraph'; lines: string[] }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'math'; source: string }
  | { kind: 'chart'; source: string };

type ChartSpec = { type: 'bar' | 'line'; title?: string; labels: string[]; values: number[] };

function SimpleChart({ source }: { source: string; key?: React.Key }) {
  let spec: ChartSpec | null = null;
  try {
    const parsed = JSON.parse(source) as Partial<ChartSpec>;
    if ((parsed.type === 'bar' || parsed.type === 'line') && Array.isArray(parsed.labels) && Array.isArray(parsed.values)) {
      const labels = parsed.labels.filter((item): item is string => typeof item === 'string').slice(0, 20);
      const values = parsed.values.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)).slice(0, 20);
      if (labels.length && labels.length === values.length) spec = { type: parsed.type, title: typeof parsed.title === 'string' ? parsed.title.slice(0, 120) : undefined, labels, values };
    }
  } catch { /* Show a safe fallback below. */ }
  if (!spec) return <pre className="overflow-x-auto rounded-lg bg-ink/[0.05] p-3 text-[12px] text-ink">{source}</pre>;
  const max = Math.max(...spec.values.map(Math.abs), 1);
  const points = spec.values.map((value, index) => `${24 + index * (252 / Math.max(1, spec!.values.length - 1))},${106 - (value / max) * 78}`).join(' ');
  return <figure className="rounded-xl border border-hairline bg-canvas p-3" aria-label={spec.title || 'Chart from Mr Whale'}>
    {spec.title && <figcaption className="mb-2 text-[12px] font-semibold text-ink">{spec.title}</figcaption>}
    <svg viewBox="0 0 300 132" className="h-auto w-full" role="img">
      <line x1="18" y1="108" x2="286" y2="108" stroke="var(--color-hairline)" />
      {spec.type === 'line' && <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinejoin="round" />}
      {spec.values.map((value, index) => {
        const x = 24 + index * (252 / Math.max(1, spec!.values.length - 1));
        const height = Math.max(2, Math.abs(value / max) * 78);
        return <g key={`${spec!.labels[index]}-${index}`}>
          {spec!.type === 'bar' ? <rect x={x - 9} y={108 - height} width="18" height={height} rx="3" fill="var(--color-primary)" opacity="0.82" /> : <circle cx={x} cy={106 - (value / max) * 78} r="4" fill="var(--color-primary)" />}
          <text x={x} y="124" textAnchor="middle" fontSize="8" fill="var(--color-ink-muted)">{spec!.labels[index]!.slice(0, 8)}</text>
        </g>;
      })}
    </svg>
  </figure>;
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let chartLines: string[] | null = null;
  let mathLines: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'paragraph', lines: paragraph });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ kind: 'list', ...list });
      list = null;
    }
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd();
    if (chartLines) {
      if (/^```\s*$/.test(line)) { blocks.push({ kind: 'chart', source: chartLines.join('\n') }); chartLines = null; }
      else chartLines.push(rawLine);
      continue;
    }
    if (mathLines) {
      if (/^\s*\$\$\s*$/.test(line)) { blocks.push({ kind: 'math', source: mathLines.join('\n') }); mathLines = null; }
      else mathLines.push(rawLine);
      continue;
    }
    if (/^```chart\s*$/i.test(line)) { flushParagraph(); flushList(); chartLines = []; continue; }
    if (/^\s*\$\$\s*$/.test(line)) { flushParagraph(); flushList(); mathLines = []; continue; }
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^\s*#{1,4}\s+(.*)$/.exec(line);

    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const item = (bullet?.[1] ?? numbered?.[1] ?? '').trim();
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(item);
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', text: heading[1].trim() });
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  if (chartLines) blocks.push({ kind: 'chart', source: chartLines.join('\n') });
  if (mathLines) blocks.push({ kind: 'math', source: mathLines.join('\n') });
  return blocks;
}

export default function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-2.5 text-[15px] leading-[1.65] text-ink">
      {blocks.map((block, i) => {
        if (block.kind === 'math') return <MathFormula key={i} source={block.source} display />;
        if (block.kind === 'chart') return <SimpleChart key={i} source={block.source} />;
        if (block.kind === 'heading') {
          return (
            <p key={i} className="font-semibold text-ink mt-1">
              {renderInline(block.text, `h${i}`)}
            </p>
          );
        }
        if (block.kind === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag
              key={i}
              className={`space-y-1.5 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-primary/60`}
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `l${i}-${j}`)}</li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {block.lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(line, `p${i}-${j}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

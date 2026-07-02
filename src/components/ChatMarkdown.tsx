import React from 'react';

/**
 * Minimal markdown renderer for assistant chat replies. Builds React nodes
 * directly (never innerHTML), covering what Gemini actually emits in chat:
 * **bold**, `inline code`, bullet / numbered lists, and ### headings.
 * Everything else stays plain text.
 */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)/g;
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
    } else {
      nodes.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
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
  | { kind: 'list'; ordered: boolean; items: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

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
  return blocks;
}

export default function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-2.5 text-[15px] leading-[1.65] text-ink">
      {blocks.map((block, i) => {
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

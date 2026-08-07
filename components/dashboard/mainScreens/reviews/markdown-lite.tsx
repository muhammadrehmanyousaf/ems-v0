"use client";

/**
 * WWL-371 — the AI report was written as markdown and rendered into a
 * `whitespace-pre-line` div with no parser at all, despite the card's own header
 * comment claiming it "renders the markdown reply inside a soft card". Counted
 * in the live rendered node: 1 literal `#`, 8 literal `**`, 5 literal `- `
 * bullets, and zero `<strong>`, `<h1>`, `<ul>` or `<li>` elements. The vendor
 * read the syntax instead of the emphasis.
 *
 * A deliberately small renderer rather than a markdown dependency: this parses
 * only what the report actually contains — headings, bold runs, and dash
 * bullets — and it builds React elements, so nothing is ever passed through
 * `dangerouslySetInnerHTML`. Model output is untrusted text; it must not be
 * able to inject markup.
 */

import * as React from "react";

/** Split a line into plain text and **bold** runs. */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <strong key={`${keyPrefix}-b${i++}`} className="font-semibold text-foreground">
        {m[1]}
      </strong>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MarkdownLite({ source }: { source: string }): React.ReactElement {
  const blocks: React.ReactNode[] = [];
  const lines = String(source ?? "").split(/\r?\n/);

  let bullets: string[] = [];
  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key} className="ml-4 list-disc space-y-1">
        {bullets.map((b, i) => (
          <li key={`${key}-${i}`}>{inline(b, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const key = `md-${i}`;

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flushBullets(`${key}-ul`);

    if (!line.trim()) return;

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const cls =
        level === 1
          ? "text-sm font-semibold text-foreground"
          : "text-[13px] font-semibold text-foreground";
      blocks.push(
        <p key={key} className={cls}>
          {inline(heading[2], key)}
        </p>,
      );
      return;
    }

    blocks.push(<p key={key}>{inline(line, key)}</p>);
  });
  flushBullets("md-tail-ul");

  return <div className="space-y-2">{blocks}</div>;
}

export default MarkdownLite;

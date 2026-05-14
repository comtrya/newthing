/**
 * Tiny safe markdown renderer for doc bodies.
 *
 * The seed MDX bodies use a small subset of markdown — headings, paragraphs,
 * fenced code blocks, lists, inline code, bold/italic. This module converts
 * that into safe HTML strings (escapes everything else as text). It is not a
 * conformant parser; it is good enough for ext_docs's first real render
 * surface, and gives us something to upgrade to remark + rehype + shiki later
 * without changing the call site.
 */

interface Block {
  kind: "heading" | "paragraph" | "code" | "list" | "blank";
  level?: number;
  lang?: string;
  text: string;
  items?: string[];
}

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/** Apply inline markdown — code, bold, italic — to already-escaped text. */
function renderInline(escaped: string): string {
  // Code first so backtick contents aren't treated as bold/italic.
  let out = escaped.replace(
    /`([^`]+)`/g,
    (_match, code: string) => `<code>${code}</code>`,
  );
  out = out.replace(
    /\*\*([^*]+)\*\*/g,
    (_match, body: string) => `<strong>${body}</strong>`,
  );
  out = out.replace(
    /(^|[^*])\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?!\*)/g,
    (_match, lead: string, body: string) => `${lead}<em>${body}</em>`,
  );
  return out;
}

function tokenise(body: string): Block[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    // Fenced code block.
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = (fence[1] ?? "").trim();
      i += 1;
      const buf: string[] = [];
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        buf.push(lines[i] ?? "");
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push({ kind: "code", lang, text: buf.join("\n") });
      continue;
    }
    // Heading.
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: Math.min(6, (heading[1] ?? "").length),
        text: heading[2] ?? "",
      });
      i += 1;
      continue;
    }
    // List.
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "list", text: "", items });
      continue;
    }
    // Paragraph — accumulate consecutive non-blank lines.
    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !/^```/.test(lines[i] ?? "") &&
      !/^#{1,6}\s+/.test(lines[i] ?? "") &&
      !/^\s*[-*]\s+/.test(lines[i] ?? "")
    ) {
      para.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push({ kind: "paragraph", text: para.join("\n") });
  }
  return blocks;
}

export function renderMarkdown(body: string): string {
  if (!body) return "";
  const blocks = tokenise(body);
  const out: string[] = [];
  for (const block of blocks) {
    switch (block.kind) {
      case "heading": {
        const level = block.level ?? 1;
        const inline = renderInline(escapeHtml(block.text));
        out.push(`<h${level}>${inline}</h${level}>`);
        break;
      }
      case "paragraph": {
        const inline = renderInline(escapeHtml(block.text));
        out.push(`<p>${inline.replace(/\n/g, "<br />")}</p>`);
        break;
      }
      case "code": {
        const lang = block.lang ? ` data-lang="${escapeHtml(block.lang)}"` : "";
        out.push(`<pre${lang}><code>${escapeHtml(block.text)}</code></pre>`);
        break;
      }
      case "list": {
        const items = (block.items ?? [])
          .map((item) => `  <li>${renderInline(escapeHtml(item))}</li>`)
          .join("\n");
        out.push(`<ul>\n${items}\n</ul>`);
        break;
      }
      default:
        break;
    }
  }
  return out.join("\n");
}

/** Plain-text excerpt, used for collapsed previews. */
export function bodyExcerpt(body: string, limit = 280): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit)}…`;
}

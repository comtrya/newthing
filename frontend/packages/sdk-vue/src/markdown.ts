/**
 * Tiny safe-markdown renderer used across PR / issue / epic / doc
 * bodies. Handles headings, paragraphs, fenced code blocks, ordered
 * and unordered lists, inline code/bold/italic, and bare-URL autolinks.
 * Everything else escapes to text. Output is safe to drop into
 * `v-html` — every character that isn't a recognised token is escaped.
 *
 * Lives in `@comtrya/sdk-vue` so both the shell and customElement-
 * mounted extensions can import a single implementation. Replaces
 * three diverging copies that previously lived in
 * `frontend/src/markdown.ts`, `ext_docs/ui/src/markdown.ts`, and
 * `ext_epics/ui/src/markdown.ts`.
 *
 * A future remark + rehype + shiki upgrade can swap the internals
 * without changing the public `renderMarkdown(body)` / `bodyExcerpt`
 * signatures.
 */

interface Block {
  kind: "heading" | "paragraph" | "code" | "list";
  level?: number;
  lang?: string;
  text: string;
  ordered?: boolean;
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

const URL_PATTERN = /\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)]/g;

// Private-Use Area sentinels — guaranteed not to appear in author-
// written markdown bodies, so we stash rendered <code> spans behind
// them while applying URL / bold / italic transforms, then restore.
// Avoids URL or emphasis rules cutting inside a backticked literal.
const SLOT_OPEN = "CODE";
const SLOT_CLOSE = "END";

function renderInline(escaped: string): string {
  const codeSlots: string[] = [];
  let out = escaped.replace(/`([^`]+)`/g, (_match, code: string) => {
    codeSlots.push("<code>" + code + "</code>");
    return SLOT_OPEN + (codeSlots.length - 1) + SLOT_CLOSE;
  });

  out = out.replace(
    URL_PATTERN,
    (url) => '<a href="' + url + '" rel="noopener noreferrer">' + url + "</a>",
  );
  out = out.replace(
    /\*\*([^*]+)\*\*/g,
    (_match, body: string) => "<strong>" + body + "</strong>",
  );
  out = out.replace(
    /(^|[^*])\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?!\*)/g,
    (_match, lead: string, body: string) => lead + "<em>" + body + "</em>",
  );

  const slotPattern = new RegExp(
    "CODE(\\d+)END",
    "g",
  );
  return out.replace(
    slotPattern,
    (_match, idx: string) => codeSlots[Number(idx)] ?? "",
  );
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
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = (fence[1] ?? "").trim();
      i += 1;
      const buf: string[] = [];
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        buf.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      blocks.push({ kind: "code", lang, text: buf.join("\n") });
      continue;
    }
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
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "list", ordered: false, text: "", items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "list", ordered: true, text: "", items });
      continue;
    }
    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !/^```/.test(lines[i] ?? "") &&
      !/^#{1,6}\s+/.test(lines[i] ?? "") &&
      !/^\s*[-*]\s+/.test(lines[i] ?? "") &&
      !/^\s*\d+\.\s+/.test(lines[i] ?? "")
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
        out.push("<h" + level + ">" + inline + "</h" + level + ">");
        break;
      }
      case "paragraph": {
        const inline = renderInline(escapeHtml(block.text));
        out.push("<p>" + inline.replace(/\n/g, "<br />") + "</p>");
        break;
      }
      case "code": {
        const lang = block.lang
          ? ' data-lang="' + escapeHtml(block.lang) + '"'
          : "";
        out.push(
          "<pre" + lang + "><code>" + escapeHtml(block.text) + "</code></pre>",
        );
        break;
      }
      case "list": {
        const tag = block.ordered ? "ol" : "ul";
        const items = (block.items ?? [])
          .map((item) => "  <li>" + renderInline(escapeHtml(item)) + "</li>")
          .join("\n");
        out.push("<" + tag + ">\n" + items + "\n</" + tag + ">");
        break;
      }
    }
  }
  return out.join("\n");
}

/** Plain-text excerpt — collapses whitespace and truncates with an ellipsis. */
export function bodyExcerpt(body: string, limit = 280): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) return trimmed;
  return trimmed.slice(0, limit) + "…";
}

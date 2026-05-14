/**
 * Tiny markdown renderer for epic body text — same subset as ext_docs:
 * headings, paragraphs, fenced code, lists, inline code/bold/italic.
 * Everything else escaped as text. Safe to v-html.
 */

interface Block {
  kind: "heading" | "paragraph" | "code" | "list";
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

function renderInline(escaped: string): string {
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
      blocks.push({ kind: "list", text: "", items });
      continue;
    }
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
    }
  }
  return out.join("\n");
}

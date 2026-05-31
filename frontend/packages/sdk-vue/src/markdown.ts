/**
 * Safe Markdown renderer used across PR / issue / epic / doc bodies and
 * repository READMEs.
 *
 * Internals use `marked` (CommonMark + GFM) so inline HTML in Markdown
 * is preserved rather than escaped to text. A pure-JS allowlist
 * sanitizer removes dangerous tags, event-handler attributes, and
 * javascript:/data: URLs without requiring a DOM — safe to use in
 * extension web workers, bun unit tests, and SSR contexts.
 *
 * Public API is unchanged:
 *   renderMarkdown(body, opts?) → HTML string safe for v-html
 *   bodyExcerpt(body, limit?)  → plain-text snippet
 */

import { Marked } from "marked";

export interface RenderMarkdownOptions {
  /**
   * When set, bare `#N` references in the body are linked to
   * `/x/issues/<workspaceId>/<N>`. Without it `#N` renders as literal
   * text so unrelated `#` characters in a code-free repo don't grow
   * false-positive links.
   */
  workspaceId?: string;
}

// ---------------------------------------------------------------------------
// Allowlist sanitizer — pure JS, no DOM
// ---------------------------------------------------------------------------

/** Tags that are safe to pass through verbatim. */
const SAFE_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "code",
  "pre",
  "a",
  "img",
  "br",
  "hr",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "dl",
  "dt",
  "dd",
  "details",
  "summary",
  "sup",
  "sub",
  "del",
  "ins",
  "s",
  "mark",
  "abbr",
  "cite",
  "q",
  "figure",
  "figcaption",
  "caption",
  "span",
  "div",
  "section",
  "article",
  "aside",
  "header",
  "footer",
  "nav",
  "main",
]);

/** Attributes safe for ALL tags (value-independent). */
const SAFE_ATTRS_GLOBAL = new Set([
  "class",
  "id",
  "title",
  "lang",
  "dir",
  "tabindex",
  "aria-label",
  "aria-hidden",
  "aria-expanded",
  "aria-controls",
  "role",
  "data-lang",
]);

/** Attributes allowed only for specific tags. */
const SAFE_ATTRS_BY_TAG: Record<string, Set<string>> = {
  a: new Set(["href", "rel", "target"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
};

const DANGEROUS_URL_PATTERN = /^\s*(?:javascript|vbscript|data)\s*:/i;

function isSafeUrl(value: string): boolean {
  return !DANGEROUS_URL_PATTERN.test(value);
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeAttrs(tag: string, attrStr: string): string {
  if (!attrStr.trim()) return "";
  const out: string[] = [];
  const ATTR_RE =
    /\s+([a-zA-Z][a-zA-Z0-9_:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=>]+)))?/g;
  let m: RegExpExecArray | null;
  let hasRel = false;
  const pairs: Array<{ name: string; value: string }> = [];

  while ((m = ATTR_RE.exec(attrStr)) !== null) {
    const name = (m[1] ?? "").toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";

    if (name.startsWith("on")) continue; // strip event handlers

    const tagAttrs = SAFE_ATTRS_BY_TAG[tag];
    const allowed =
      SAFE_ATTRS_GLOBAL.has(name) || (tagAttrs ? tagAttrs.has(name) : false);
    if (!allowed) continue;

    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;

    if (name === "rel") hasRel = true;
    pairs.push({ name, value });
  }

  for (const { name, value } of pairs) {
    out.push(" " + name + '="' + escapeAttr(value) + '"');
  }
  // Ensure external <a> links are safe to open
  if (tag === "a" && !hasRel) {
    out.push(' rel="noopener noreferrer"');
  }
  return out.join("");
}

/** Tags whose entire content (open + body + close) must be removed. */
const STRIP_WITH_CONTENT = [
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "form",
  "select",
  "textarea",
  "svg",
  "math",
];

/** Void/block tags that have no body but must be stripped entirely. */
const STRIP_TAG_ONLY = new Set([
  "input",
  "button",
  "meta",
  "link",
  "base",
  "applet",
]);

/**
 * Strip dangerous tags and attributes from an HTML string without using
 * the DOM. Scans for `<...>` tokens, validates tag names and attributes
 * against the allowlist, and removes anything outside it.
 *
 * Dangerous block-level tags (script, style, iframe, …) have their
 * full content removed, not just the tag wrapper, so JavaScript inside
 * a `<script>` block cannot escape.
 */
export function sanitizeHtml(html: string): string {
  // First pass: strip dangerous block tags AND their content
  let result = html;
  for (const tag of STRIP_WITH_CONTENT) {
    // Case-insensitive, including attributes in the opening tag
    const blockRe = new RegExp(
      "<" + tag + "(\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">",
      "gi",
    );
    result = result.replace(blockRe, "");
    // Also strip unclosed opening tags (e.g. injected via attribute tricks)
    const openRe = new RegExp("<" + tag + "(\\s[^>]*)?>", "gi");
    result = result.replace(openRe, "");
    const closeRe = new RegExp("<\\/" + tag + ">", "gi");
    result = result.replace(closeRe, "");
  }

  // Second pass: strip individual void/block tags that have no body
  result = result.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?(\/?)>/g,
    (_match, slash, rawTag, attrStr, selfClose) => {
      const tag = rawTag.toLowerCase();
      if (STRIP_TAG_ONLY.has(tag)) return "";
      if (!SAFE_TAGS.has(tag)) return "";
      const safeAttrs = sanitizeAttrs(tag, attrStr ?? "");
      const sc = selfClose ? " /" : "";
      return "<" + slash + tag + safeAttrs + sc + ">";
    },
  );

  return result;
}

// ---------------------------------------------------------------------------
// Issue cross-reference tokenizer post-processor
// ---------------------------------------------------------------------------

function applyIssueRefs(html: string, workspaceId: string): string {
  const ws = encodeURIComponent(workspaceId);
  // Only replace outside of tag brackets and code blocks
  // Strategy: split on <code>...</code> spans and only apply to the text
  // portions between them.
  const parts = html.split(/(<code[^>]*>[\s\S]*?<\/code>)/);
  return parts
    .map((part, idx) => {
      if (idx % 2 === 1) return part; // inside <code>, skip
      return part.replace(
        /(^|[^\w&])#(\d+)\b/g,
        (_m, lead: string, num: string) =>
          lead +
          '<a href="/x/issues/' +
          ws +
          "/" +
          num +
          '" class="issue-ref">#' +
          num +
          "</a>",
      );
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Render Markdown to a sanitized HTML string safe for `v-html`.
 *
 * Supports full CommonMark + GFM (tables, task lists, strikethrough,
 * autolinks). Inline HTML in author-written Markdown is preserved after
 * passing through the allowlist sanitizer, so README HTML constructs
 * like `<br>`, `<details>`, `<img>`, and safe table HTML render
 * correctly instead of appearing as escaped text.
 */
export function renderMarkdown(
  body: string,
  opts: RenderMarkdownOptions = {},
): string {
  if (!body) return "";

  const instance = new Marked();
  const raw = instance.parse(body, { async: false }) as string;
  let sanitized = sanitizeHtml(raw);

  if (opts.workspaceId) {
    sanitized = applyIssueRefs(sanitized, opts.workspaceId);
  }

  return sanitized;
}

/** Plain-text excerpt — collapses whitespace and truncates with an ellipsis. */
export function bodyExcerpt(body: string, limit = 280): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) return trimmed;
  return trimmed.slice(0, limit) + "…";
}

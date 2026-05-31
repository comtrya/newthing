import { describe, expect, test } from "bun:test";
import { renderMarkdown, sanitizeHtml, bodyExcerpt } from "./markdown";

// ---------------------------------------------------------------------------
// sanitizeHtml — the allowlist sanitizer
// ---------------------------------------------------------------------------

describe("sanitizeHtml", () => {
  test("passes safe block elements through", () => {
    const html = "<h1>Title</h1><p>Hello <strong>world</strong>.</p>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  test("passes safe inline elements through", () => {
    const html = "<em>italic</em> and <code>code</code>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  test("strips <script> tags and their content markers", () => {
    const result = sanitizeHtml("<p>Safe</p><script>alert(1)</script><p>After</p>");
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert(1)");
    expect(result).toContain("<p>Safe</p>");
  });

  test("strips <style> tags", () => {
    expect(sanitizeHtml("<style>body{color:red}</style>")).not.toContain(
      "<style",
    );
  });

  test("strips <iframe> tags", () => {
    expect(
      sanitizeHtml('<iframe src="https://evil.com"></iframe>'),
    ).not.toContain("<iframe");
  });

  test("strips event-handler attributes", () => {
    const result = sanitizeHtml('<a href="/" onclick="evil()">link</a>');
    expect(result).not.toContain("onclick");
    expect(result).toContain("href");
  });

  test("strips javascript: hrefs", () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">xss</a>');
    expect(result).not.toContain("javascript:");
  });

  test("strips data: hrefs", () => {
    const result = sanitizeHtml('<a href="data:text/html,<h1>XSS</h1>">xss</a>');
    expect(result).not.toContain("data:");
  });

  test("preserves safe <a> href", () => {
    const result = sanitizeHtml('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  test("adds rel=noopener noreferrer to <a> links without rel", () => {
    const result = sanitizeHtml('<a href="https://example.com">link</a>');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  test("preserves <img> with safe src", () => {
    const result = sanitizeHtml('<img src="https://example.com/img.png" alt="pic">');
    expect(result).toContain('src="https://example.com/img.png"');
    expect(result).toContain('alt="pic"');
  });

  test("strips <img> with javascript: src", () => {
    const result = sanitizeHtml('<img src="javascript:evil()">');
    expect(result).not.toContain("javascript:");
  });

  test("passes <details> and <summary> through", () => {
    const html = "<details><summary>Click</summary><p>Content</p></details>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  test("preserves table structure", () => {
    const html =
      "<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Alice</td></tr></tbody></table>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  test("strips unknown tags but keeps inner content", () => {
    const result = sanitizeHtml("<blink>text</blink>");
    expect(result).not.toContain("<blink");
    // Text content itself is not emitted by our regex (it's between tags)
    // The tag wrapper is removed; plain text between tags passes through
    expect(result).toContain("text");
  });

  test("strips onerror attribute from img", () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
  });
});

// ---------------------------------------------------------------------------
// renderMarkdown — full pipeline
// ---------------------------------------------------------------------------

describe("renderMarkdown", () => {
  test("empty body returns empty string", () => {
    expect(renderMarkdown("")).toBe("");
  });

  test("renders headings", () => {
    const result = renderMarkdown("# Hello");
    expect(result).toContain("<h1");
    expect(result).toContain("Hello");
  });

  test("renders paragraphs", () => {
    const result = renderMarkdown("This is a paragraph.");
    expect(result).toContain("<p>");
    expect(result).toContain("This is a paragraph.");
  });

  test("renders fenced code blocks", () => {
    const result = renderMarkdown("```rust\nlet x = 1;\n```");
    expect(result).toContain("<pre>");
    expect(result).toContain("<code");
    expect(result).toContain("let x = 1;");
  });

  test("renders unordered list", () => {
    const result = renderMarkdown("- one\n- two\n- three");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
    expect(result).toContain("one");
  });

  test("renders ordered list", () => {
    const result = renderMarkdown("1. first\n2. second");
    expect(result).toContain("<ol>");
    expect(result).toContain("first");
  });

  test("renders bold and italic", () => {
    const result = renderMarkdown("**bold** and *italic*");
    expect(result).toContain("<strong>");
    expect(result).toContain("<em>");
  });

  test("renders inline code", () => {
    const result = renderMarkdown("Use `cargo build`.");
    expect(result).toContain("<code>");
    expect(result).toContain("cargo build");
  });

  test("renders inline HTML that is safe — <br>", () => {
    const result = renderMarkdown("line one<br>line two");
    expect(result).toContain("<br");
  });

  test("renders inline HTML that is safe — <details>", () => {
    const result = renderMarkdown(
      "<details><summary>Show</summary>hidden</details>",
    );
    expect(result).toContain("<details>");
    expect(result).toContain("<summary>");
  });

  test("sanitizes inline <script> in markdown body", () => {
    const result = renderMarkdown("Hello <script>alert(1)</script> world");
    expect(result).not.toContain("<script");
  });

  test("sanitizes onclick in inline HTML", () => {
    const result = renderMarkdown(
      'Click <a href="/" onclick="evil()">here</a>',
    );
    expect(result).not.toContain("onclick");
    expect(result).toContain("href");
  });

  test("sanitizes javascript: href in inline HTML", () => {
    const result = renderMarkdown('<a href="javascript:alert(1)">xss</a>');
    expect(result).not.toContain("javascript:");
  });

  test("renders GFM table", () => {
    const md = "| Name | Age |\n|------|-----|\n| Alice | 30 |";
    const result = renderMarkdown(md);
    expect(result).toContain("<table>");
    expect(result).toContain("Alice");
  });

  test("renders GFM strikethrough", () => {
    const result = renderMarkdown("~~deleted~~");
    expect(result).toContain("deleted");
    // marked renders as <del> or <s>
    const hasDel = result.includes("<del>") || result.includes("<s>");
    expect(hasDel).toBe(true);
  });

  test("issue refs link when workspaceId is set", () => {
    const result = renderMarkdown("Closes #42 and #7", {
      workspaceId: "ws-123",
    });
    expect(result).toContain("/x/issues/ws-123/42");
    expect(result).toContain("/x/issues/ws-123/7");
    expect(result).toContain("class=\"issue-ref\"");
  });

  test("issue refs remain plain text without workspaceId", () => {
    const result = renderMarkdown("Closes #42");
    expect(result).not.toContain("/x/issues/");
    expect(result).toContain("#42");
  });

  test("issue refs not applied inside code spans", () => {
    const result = renderMarkdown("Use `#42` as literal", {
      workspaceId: "ws-abc",
    });
    // Inside <code>, #42 should NOT become a link
    const codeMatch = result.match(/<code[^>]*>([\s\S]*?)<\/code>/);
    if (codeMatch) {
      expect(codeMatch[1]).not.toContain("/x/issues/");
    }
  });

  test("renders README-style badge HTML", () => {
    const result = renderMarkdown(
      '<a href="https://example.com"><img src="https://img.shields.io/badge/test-passing-green" alt="badge"></a>',
    );
    expect(result).toContain('<img src="https://img.shields.io/badge/');
    expect(result).toContain('alt="badge"');
  });
});

// ---------------------------------------------------------------------------
// bodyExcerpt
// ---------------------------------------------------------------------------

describe("bodyExcerpt", () => {
  test("short text passes through unchanged", () => {
    expect(bodyExcerpt("Hello world")).toBe("Hello world");
  });

  test("long text is truncated with ellipsis", () => {
    const long = "a".repeat(300);
    const result = bodyExcerpt(long, 280);
    expect(result.length).toBeLessThanOrEqual(281);
    expect(result).toEndWith("…");
  });

  test("collapses whitespace", () => {
    expect(bodyExcerpt("one   two\n\nthree")).toBe("one two three");
  });
});

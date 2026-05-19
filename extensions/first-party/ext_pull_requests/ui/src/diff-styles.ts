/**
 * Injects DiffView CSS into the host document head exactly once.
 *
 * Vue's `customElement: true` plugin auto-injects styles for widgets
 * registered through `defineExtensionWidget`, but child components
 * imported into those widgets (e.g. <DiffView> inside <PullsDetail>)
 * have their `<style>` blocks bundled yet never inserted. Calling
 * `ensureDiffStyles()` from the component side-effects the styles into
 * the document so they apply regardless of mount path.
 */

const STYLE_ID = "comtrya-diff-view-styles";

const DIFF_VIEW_CSS = `
.diff-view {
  display: grid;
  gap: 14px;
  font-family: var(--sans, system-ui);
}

.diff-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 1.5px solid var(--ink, #111);
  padding-bottom: 8px;
}

.diff-summary h2 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 18px;
}

.diff-totals {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: baseline;
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.diff-totals .adds { color: var(--accent-teal, #087f6f); }
.diff-totals .dels { color: var(--accent-err, #c9341c); }
.diff-totals .hint { color: var(--ink-fainter, #918b80); }

.diff-totals .hint kbd {
  border: 1px solid currentColor;
  padding: 0 4px;
  font-family: var(--mono, monospace);
  font-size: 10px;
}

.diff-view .muted {
  font-family: var(--mono, monospace);
  font-size: 12px;
  color: var(--ink-faint, #68645c);
}

.diff-view .muted.error { color: var(--accent-err, #c9341c); }

.diff-files {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}

.diff-file {
  border: 1.5px solid var(--ink, #111);
  background: var(--paper, #fffdf8);
}

.diff-file.focused {
  box-shadow: -3px 0 0 0 var(--accent-orange, #e34a20);
}

.diff-file-head {
  display: grid;
  grid-template-columns: 14px auto minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--rule-light, #d8d1c4);
  cursor: pointer;
  background: var(--paper-tint, #f2efe7);
}

.diff-file-head:hover,
.diff-file-head:focus-visible {
  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 80%, var(--ink, #111));
  outline: none;
}

.diff-file-head .caret {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.file-status {
  font-family: var(--mono, monospace);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 1px 6px;
  border: 1px solid currentColor;
}

.status-added { color: var(--accent-teal, #087f6f); }
.status-deleted { color: var(--accent-err, #c9341c); }
.status-modified { color: var(--accent-blue, #1d55a6); }
.status-renamed { color: var(--accent-yellow, #c89300); }

.file-path {
  font-family: var(--mono, monospace);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-rename {
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.file-counts {
  display: inline-flex;
  gap: 8px;
  font-family: var(--mono, monospace);
  font-size: 11px;
}

.file-counts .adds { color: var(--accent-teal, #087f6f); }
.file-counts .dels { color: var(--accent-err, #c9341c); }

.diff-file-body { display: grid; gap: 0; }

.diff-hunk { border-top: 1px solid var(--rule-light, #d8d1c4); }
.diff-hunk:first-child { border-top: 0; }

.diff-hunk-head {
  background: var(--paper-tint, #f2efe7);
  padding: 4px 10px;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #68645c);
}

.diff-hunk table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--mono, monospace);
  font-size: 12px;
  line-height: 1.45;
}

.diff-line.line-add {
  background: color-mix(in srgb, var(--accent-teal, #087f6f) 10%, var(--paper, #fffdf8));
}

.diff-line.line-del {
  background: color-mix(in srgb, var(--accent-err, #c9341c) 10%, var(--paper, #fffdf8));
}

.diff-line.line-meta { color: var(--ink-fainter, #918b80); }

.diff-line td {
  padding: 0;
  vertical-align: top;
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-line .ln {
  width: 48px;
  padding: 0 8px;
  color: var(--ink-fainter, #918b80);
  text-align: right;
  user-select: none;
  background: color-mix(in srgb, var(--paper-tint, #f2efe7) 60%, var(--paper, #fffdf8));
  border-right: 1px solid var(--rule-light, #d8d1c4);
  font-variant-numeric: tabular-nums;
}

.diff-line.line-add .ln.new,
.diff-line.line-del .ln.old {
  color: var(--ink-soft, #2c2b28);
}

.diff-line .marker {
  width: 18px;
  padding: 0 4px;
  text-align: center;
  color: var(--ink-faint, #68645c);
  user-select: none;
}

.diff-line.line-add .marker { color: var(--accent-teal, #087f6f); }
.diff-line.line-del .marker { color: var(--accent-err, #c9341c); }
.diff-line .content { padding: 0 8px; }
`;

export function ensureDiffStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = DIFF_VIEW_CSS;
  document.head.appendChild(style);
}

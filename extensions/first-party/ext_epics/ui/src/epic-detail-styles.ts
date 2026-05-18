const STYLE_ID = "ext-epics-detail-styles";

const CSS = `
.epic-detail {
  max-width: 880px;
  display: grid;
  gap: 24px;
  padding: 24px 0 48px;
  font-family: var(--serif, "iA Writer Quattro", Georgia, serif);
}

.epic-detail .epic-line,
.epic-detail .epic-meta,
.epic-detail .epic-progress,
.epic-detail .epic-issues-list,
.epic-detail .epic-actions,
.epic-detail .epic-actions-heading,
.epic-detail .epic-kbd-hint,
.epic-detail .epic-section-count {
  font-family: var(--mono, ui-monospace, "IBM Plex Mono", monospace);
}

.epic-header { display: grid; gap: 6px; }

.epic-overline {
  margin: 0;
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-faint, #6e6a62);
}

.epic-title {
  margin: 0;
  font-family: var(--display, "iA Writer Quattro", Georgia, serif);
  font-weight: 600;
  font-size: 28px;
  letter-spacing: -0.01em;
  line-height: 1.15;
  color: var(--ink, #1a1a1a);
}

.epic-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 11.5px;
  color: var(--ink-faint, #6e6a62);
}

.epic-pill {
  padding: 1px 8px;
  border: 1px solid currentColor;
  text-transform: lowercase;
}

.epic-state-good { color: var(--ink-go, #087f6f); }
.epic-state-warn { color: var(--ink-warn, #c2410c); }
.epic-state-muted, .muted { color: var(--ink-faint, #888); }
.epic-line.warn { color: var(--ink-warn, #c2410c); }

.epic-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  border-radius: 2px;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

.epic-chip .chip-glyph {
  font-size: 10px;
}

.epic-chip.tone-blue {
  background: var(--chip-blue-bg, #e5edf7);
  color: var(--chip-blue-ink, #1f3b6a);
}
.epic-chip.tone-teal {
  background: var(--chip-teal-bg, #d8f0eb);
  color: var(--chip-teal-ink, #0c5f54);
}
.epic-chip.tone-grey {
  background: var(--chip-grey-bg, #ececea);
  color: var(--chip-grey-ink, #4a4a45);
}
.epic-chip.compact {
  padding: 0 6px;
  font-size: 10.5px;
}

.epic-meta-time {
  margin-left: auto;
  color: var(--ink-faint, #888);
}

.epic-progress {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--ink-rule, #d8d6cf);
  border-radius: 2px;
  background: var(--surface-2, #faf9f5);
}

/* "Routed to" panel — CUE Project ownership surfaced on the
 * detail page. Same paper-card aesthetic as the progress
 * panel above; owner chips carry classifier-glyph borders
 * so the visual vocabulary matches IssueDetail iter 59. */
.epic-routed {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--ink-rule, #d8d6cf);
  background: var(--surface-2, #faf9f5);
}

.epic-routed-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.epic-routed-label {
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-faint, #6e6a62);
}

.epic-routed-project {
  margin-left: auto;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--accent-blue, #1d55a6);
  text-decoration: none;
  letter-spacing: 0.02em;
}

.epic-routed-project:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* iter 69 — inline Project picker on EpicDetail. Mirrors the
 * iter 68 IssueDetail select styling so both detail surfaces
 * read identically. */
.epic-project-select {
  width: 100%;
  border: 1.5px solid var(--ink-rule, #d8d6cf);
  background: var(--paper, #fffdf8);
  color: var(--ink, #111);
  padding: 8px 10px;
  font-family: var(--mono, monospace);
  font-size: 13px;
  outline: none;
  transition: border-color 120ms ease;
}

.epic-project-select:focus {
  border-color: var(--ink, #1a1a1a);
}

.epic-project-select:disabled {
  cursor: wait;
  opacity: 0.55;
}

.epic-routed-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.epic-routed-owner {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid currentColor;
  color: var(--ink, #111);
  font-family: var(--mono, monospace);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.epic-routed-owner .chip-glyph {
  font-family: var(--display, system-ui);
  font-size: 12px;
  line-height: 1;
}

.epic-routed-owner[data-author-kind="team"]       { color: var(--accent-teal, #087f6f); }
.epic-routed-owner[data-author-kind="human"]      { color: var(--ink, #111); }
.epic-routed-owner[data-author-kind="agent"]      { color: #6b3fa0; }
.epic-routed-owner[data-author-kind="bot"]        { color: var(--accent-blue, #1d55a6); }
.epic-routed-owner[data-author-kind="credential"] { color: var(--accent-yellow, #c89300); }

.epic-routed-source {
  margin: 0;
  font-family: var(--mono, monospace);
  font-size: 11px;
  color: var(--ink-faint, #6e6a62);
}

.epic-routed-source code {
  font-family: var(--mono, monospace);
  font-size: 11px;
  padding: 0 4px;
  background: var(--paper-tint, #f2efe7);
  color: var(--ink-soft, #2c2b28);
}

.epic-progress-head {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  font-size: 12px;
  color: var(--ink-faint, #6e6a62);
}

.epic-progress-stat {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.epic-progress-stat strong {
  font-weight: 600;
  color: var(--ink, #1a1a1a);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.epic-progress-stat .stat-of {
  color: var(--ink-faint, #888);
}

.epic-progress-stat .stat-label {
  color: var(--ink-faint, #6e6a62);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.epic-progress-sep {
  color: var(--ink-rule, #c8c6bf);
  padding: 0 2px;
}

.epic-progress-bar {
  height: 4px;
  background: var(--ink-rule-soft, #ebe9e2);
  border-radius: 2px;
  overflow: hidden;
}

.epic-progress-fill {
  height: 100%;
  background: var(--ink-go, #087f6f);
  transition: width 200ms ease;
}

.epic-body {
  margin: 0;
  font-size: 15.5px;
  line-height: 1.6;
  color: var(--ink, #1a1a1a);
}

.epic-body.muted {
  padding: 12px 14px;
  border: 1px dashed var(--ink-rule, #d8d6cf);
  border-radius: 2px;
  color: var(--ink-faint, #888);
  font-size: 12px;
  font-family: var(--mono, ui-monospace, monospace);
}

.epic-body.prose h1,
.epic-body.prose h2,
.epic-body.prose h3,
.epic-body.prose h4 {
  margin: 16px 0 6px;
  font-family: var(--display, "iA Writer Quattro", Georgia, serif);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.005em;
}

.epic-body.prose h1 { font-size: 20px; }
.epic-body.prose h2 { font-size: 17px; }
.epic-body.prose h3 { font-size: 15px; }

.epic-body.prose p {
  margin: 8px 0;
}

.epic-body.prose ul {
  margin: 6px 0 6px 20px;
  padding: 0;
}

.epic-body.prose li {
  margin: 2px 0;
}

.epic-body.prose code {
  font-family: var(--mono, ui-monospace, monospace);
  background: var(--ink-rule-soft, #efeee8);
  padding: 0 4px;
  border-radius: 2px;
  font-size: 0.9em;
}

.epic-body.prose pre {
  background: var(--surface-2, #f7f6f1);
  border: 1px solid var(--ink-rule, #d8d6cf);
  border-radius: 2px;
  padding: 10px 12px;
  overflow-x: auto;
  font-size: 12.5px;
  font-family: var(--mono, ui-monospace, monospace);
}

.epic-body.prose pre code {
  background: transparent;
  padding: 0;
}

.epic-section { display: grid; gap: 8px; }

.epic-section-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);
}

.epic-section h3 {
  margin: 0;
  font-family: var(--display, "iA Writer Quattro", Georgia, serif);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: -0.005em;
}

.epic-section-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-faint, #888);
  font-variant-numeric: tabular-nums;
}

.epic-section-count [data-zero="true"] { color: var(--ink-rule, #c8c6bf); }
.epic-section-count .sep { padding: 0 2px; color: var(--ink-rule, #c8c6bf); }

.epic-issues-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
}

.epic-issue-row {
  display: grid;
  grid-template-columns: 18px 56px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--ink-rule-soft, #ebe9e2);
  font-size: 12.5px;
  cursor: pointer;
  outline: none;
}

.epic-issue-row:last-child { border-bottom: none; }

.epic-issue-row:hover,
.epic-issue-row.focused,
.epic-issue-row:focus {
  background: var(--surface-2, #faf9f5);
}

.epic-issue-row .row-state {
  text-align: center;
  font-size: 11px;
}

.epic-issue-row .row-state[data-state="OPEN"],
.epic-issue-row .row-state[data-state="REOPENED"] {
  color: var(--ink-go, #087f6f);
}
.epic-issue-row .row-state[data-state="CLOSED"] {
  color: var(--ink-faint, #888);
}

.epic-issue-row.state-closed {
  color: var(--ink-faint, #888);
}
.epic-issue-row.state-closed .row-title {
  text-decoration: line-through;
  text-decoration-color: var(--ink-rule, #c8c6bf);
}

.epic-issue-row .row-number {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 11.5px;
  color: var(--ink-faint, #6e6a62);
  font-variant-numeric: tabular-nums;
}

.epic-issue-row .row-title {
  font-family: var(--display, "iA Writer Quattro", Georgia, serif);
  font-size: 13px;
  color: var(--ink, #1a1a1a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.epic-issue-row .row-trailing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.row-author {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 10.5px;
  color: var(--ink-faint, #888);
}

.row-author[data-author-kind="agent"] { color: var(--ink-go, #087f6f); }
.row-author[data-author-kind="credential"],
.row-author[data-author-kind="bot"] { color: var(--ink-warn, #c2410c); }

.epic-kbd-hint {
  margin: 0;
  font-size: 10.5px;
  color: var(--ink-faint, #888);
}

.epic-kbd-hint kbd {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 10px;
  padding: 0 4px;
  border: 1px solid var(--ink-rule, #d8d6cf);
  border-radius: 2px;
  background: var(--surface-2, #faf9f5);
}

.epic-actions-section {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--ink-rule-soft, #ebe9e2);
}

.epic-actions-heading {
  margin: 0;
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-faint, #6e6a62);
  font-weight: 500;
}

.epic-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.epic-actions button {
  padding: 4px 12px;
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 11px;
  border: 1px solid var(--ink-rule, #d8d6cf);
  background: var(--surface-2, #faf9f5);
  color: var(--ink, #1a1a1a);
  cursor: pointer;
  letter-spacing: 0.01em;
}

.epic-actions button:hover:not(:disabled) {
  background: var(--ink, #1a1a1a);
  color: var(--surface, #ffffff);
  border-color: var(--ink, #1a1a1a);
}

.epic-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.epic-comments {
  display: grid;
  gap: 8px;
}

.epic-comments-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1.5px solid var(--ink, #111);
  padding-bottom: 4px;
}

.epic-comments-head h2 {
  margin: 0;
  font-family: var(--display, system-ui);
  font-size: 18px;
}

.epic-comments-count {
  font-family: var(--mono, monospace);
  font-size: 13px;
  color: var(--ink-faint, #68645c);
  font-weight: normal;
}
`;

export function ensureEpicDetailStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

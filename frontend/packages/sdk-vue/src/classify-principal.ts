/**
 * Canonical principal classifier — one source of truth for the
 * URN-to-visual-identity mapping the forge uses across every
 * detail and queue surface. Humans get an initial-letter glyph;
 * agents, bots, credentials, and teams get distinct shape
 * glyphs; unknown URNs fall back to an initial or `·`.
 *
 * URN conventions:
 *   comtrya://user/<name>         human
 *   comtrya://agent/<id>          named AI agent (claude-code, cursor, etc.)
 *   comtrya://bot/<id>            named bot
 *   comtrya://credential/<id>     scoped automation credential (PRN_*)
 *   comtrya://team/<slug>         team URN (CUE Project owners)
 *
 * Previously duplicated across `ext_pull_requests/types.ts`
 * (`classifyAuthor`), `ext_issues/{IssuesList,IssueDetail}.vue`
 * (`authorLabel`), `ext_epics/issue-rows.ts`
 * (`classifyIssueAuthor`), and inline `classifyOwner` helpers on
 * `EpicDetail.vue` + `PullsDetail.vue`. Each variant drifted
 * subtly in glyphs and supported kinds; this module is the
 * canonical replacement.
 */

export type PrincipalKind =
  | "human"
  | "agent"
  | "credential"
  | "bot"
  | "team"
  | "unknown";

export interface PrincipalClassification {
  kind: PrincipalKind;
  /** Short label — `<id>` after the scheme prefix, or `unknown`. */
  label: string;
  /** Single-character glyph. Initial letter for humans, shapes for non-humans. */
  glyph: string;
  /** Tone token. Equals `kind`, except `unknown` -> `"neutral"` for legacy callers. */
  tone: PrincipalKind | "neutral";
}

const UNKNOWN: PrincipalClassification = {
  kind: "unknown",
  label: "unknown",
  glyph: "·",
  tone: "neutral",
};

export function classifyPrincipal(
  value: string | null | undefined,
): PrincipalClassification {
  if (!value) return UNKNOWN;
  const stripped = value.replace(/^comtrya:\/\//, "");
  const [scheme = "", ...rest] = stripped.split("/");
  const id = rest.join("/") || value;
  switch (scheme) {
    case "user":
      return {
        kind: "human",
        label: id,
        glyph: initial(id),
        tone: "human",
      };
    case "agent":
      return { kind: "agent", label: id, glyph: "✦", tone: "agent" };
    case "bot":
      return { kind: "bot", label: id, glyph: "◆", tone: "bot" };
    case "credential":
      return { kind: "credential", label: id, glyph: "⚙", tone: "credential" };
    case "team":
      return { kind: "team", label: id, glyph: "◇", tone: "team" };
    default:
      return {
        kind: "unknown",
        label: id,
        glyph: initial(id) || "·",
        tone: "neutral",
      };
  }
}

function initial(id: string): string {
  return id.slice(0, 1).toUpperCase();
}

/** Short label — equivalent to `classifyPrincipal(value).label`. */
export function principalLabel(value: string | null | undefined): string {
  return classifyPrincipal(value).label;
}

/**
 * Tiny filter-token parser shared across queue search inputs.
 *
 * Splits an input string like `is:open author:comtrya://user/rawkode auth fix`
 * into structured filters plus the free-text remainder. The shape is
 * deliberately neutral so the same parser can power PullsQueue,
 * IssuesList, and EpicsList — each queue declares the tokens it
 * cares about via `knownKeys` and accepts only those.
 *
 * Token grammar:
 *   - Bare word with no colon → free text.
 *   - `key:value` where `key` is in `knownKeys` → captured under that key.
 *   - `key:"quoted value"` → quoted values keep internal whitespace.
 *   - Repeated keys accumulate (`label:bug label:kernel` →
 *     `{ label: ["bug", "kernel"] }`).
 *   - Unknown keys (colon syntax, but `key` not declared) → captured
 *     into `unknown` so the UI can surface a "unknown filter" hint
 *     instead of silently dropping the token.
 *   - Empty values (`is:` with nothing after the colon) are ignored.
 *
 * The parser is single-pass and case-preserving on values; consumers
 * normalise (`is:OPEN` → `OPEN`, `is:open` → `OPEN`) as needed.
 */

export interface ParsedQuery {
  /** Free-text remainder, with extra whitespace collapsed. */
  text: string;
  /** Recognised filters keyed by declared filter name. */
  filters: Record<string, string[]>;
  /** Filter keys present in the input but not in `knownKeys`. */
  unknown: string[];
}

export function parseQueryFilters(
  input: string,
  knownKeys: readonly string[],
): ParsedQuery {
  const filters: Record<string, string[]> = {};
  const unknownSet = new Set<string>();
  const textParts: string[] = [];
  const knownSet = new Set(knownKeys);

  if (!input || !input.trim()) {
    return { text: "", filters, unknown: [] };
  }

  // Single-pass tokeniser. The regex matches one of:
  //   - `key:"quoted value"`  (quoted values keep internal whitespace)
  //   - `key:unquoted-value`  (value runs until the next whitespace)
  //   - bare word              (free text)
  // The `key` must start with a letter and may contain letters, digits,
  // dashes, or underscores — colons or slashes inside the key would be
  // ambiguous (`comtrya://user/...` is a value, not a key).
  const TOKEN = /([A-Za-z][\w-]*):"([^"]*)"|([A-Za-z][\w-]*):(\S*)|(\S+)/g;

  for (const match of input.matchAll(TOKEN)) {
    const [, keyQuoted, valueQuoted, keyBare, valueBare, plain] = match;
    const key = (keyQuoted ?? keyBare ?? "").toLowerCase();
    const value = keyQuoted ? (valueQuoted ?? "") : (valueBare ?? "");
    if (key) {
      if (!value) continue;
      if (knownSet.has(key)) {
        const bucket = filters[key] ?? (filters[key] = []);
        bucket.push(value);
      } else {
        unknownSet.add(key);
      }
    } else if (plain) {
      textParts.push(plain);
    }
  }

  return {
    text: textParts.join(" "),
    filters,
    unknown: Array.from(unknownSet),
  };
}

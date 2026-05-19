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

  // Whitespace-bounded tokenizer. The previous single regex with
  // `(\S+)` alongside narrower alternatives was flagged as polynomial
  // ReDoS — the alternation could backtrack on adversarial input. The
  // two-stage scan below is strictly linear: outer pass walks the
  // string once and emits tokens; the inner key:value split is a
  // single `indexOf` plus per-character validation of the key shape.
  //
  // Quoted values (`key:"with spaces"`) need to keep whitespace, so
  // the outer scanner switches to "in-quotes" mode when it sees `"`
  // immediately after a colon and only ends the token on the closing
  // quote (or end-of-input). This keeps the token boundary unambiguous
  // without any nested regex.
  const tokens = tokenize(input);
  for (const token of tokens) {
    if (token.kind === "plain") {
      textParts.push(token.text);
      continue;
    }
    if (!token.value) continue;
    if (knownSet.has(token.key)) {
      const bucket = filters[token.key] ?? (filters[token.key] = []);
      bucket.push(token.value);
    } else {
      unknownSet.add(token.key);
    }
  }

  return {
    text: textParts.join(" "),
    filters,
    unknown: Array.from(unknownSet),
  };
}

type Token =
  | { kind: "plain"; text: string }
  | { kind: "kv"; key: string; value: string };

function tokenize(input: string): Token[] {
  const out: Token[] = [];
  const n = input.length;
  let i = 0;
  while (i < n) {
    while (i < n && isWhitespace(input.charCodeAt(i))) i += 1;
    if (i >= n) break;
    // Read up to next whitespace OR up to closing quote if the token
    // is a quoted key:value pair. Walk once; no backtracking.
    const start = i;
    let colonAt = -1;
    while (i < n && !isWhitespace(input.charCodeAt(i))) {
      const c = input.charCodeAt(i);
      if (c === 0x3a /* : */ && colonAt === -1) {
        colonAt = i;
        // If the next char is `"`, swallow the quoted run (preserving
        // internal whitespace) and stop at the closing quote.
        if (i + 1 < n && input.charCodeAt(i + 1) === 0x22 /* " */) {
          i += 2; // past `:"`
          while (i < n && input.charCodeAt(i) !== 0x22) i += 1;
          if (i < n) i += 1; // consume closing quote
          break;
        }
      }
      i += 1;
    }
    const raw = input.slice(start, i);
    if (colonAt > start) {
      const rawKey = input.slice(start, colonAt);
      if (isValidKey(rawKey)) {
        const key = rawKey.toLowerCase();
        const valueStart = colonAt + 1;
        let value = input.slice(valueStart, i);
        if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
          value = value.slice(1, -1);
        }
        out.push({ kind: "kv", key, value });
        continue;
      }
    }
    out.push({ kind: "plain", text: raw });
  }
  return out;
}

function isWhitespace(code: number): boolean {
  return (
    code === 0x20 || // space
    code === 0x09 || // tab
    code === 0x0a || // \n
    code === 0x0d    // \r
  );
}

/**
 * Filter keys must start with a letter and contain only letters,
 * digits, `_`, or `-`. Anything else (including a leading digit or a
 * `/`) makes the token a bare word, not a key:value. The character-by-
 * character check is identical to `^[A-Za-z][\w-]*$` but doesn't put
 * the engine on the ReDoS code path.
 */
function isValidKey(s: string): boolean {
  if (s.length === 0) return false;
  const first = s.charCodeAt(0);
  if (!isAsciiLetter(first)) return false;
  for (let i = 1; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (!isAsciiLetter(c) && !isAsciiDigit(c) && c !== 0x5f /* _ */ && c !== 0x2d /* - */) {
      return false;
    }
  }
  return true;
}

function isAsciiLetter(code: number): boolean {
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
}

function isAsciiDigit(code: number): boolean {
  return code >= 0x30 && code <= 0x39;
}

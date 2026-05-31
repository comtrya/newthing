import { describe, expect, test } from "bun:test";
import {
  classifyPrincipal,
  principalLabel,
  type PrincipalClassification,
} from "./classify-principal";

// ---------------------------------------------------------------------------
// classifyPrincipal — known URN schemes
// ---------------------------------------------------------------------------

describe("classifyPrincipal — known URN schemes", () => {
  test("comtrya://user/<name> → human", () => {
    const result = classifyPrincipal("comtrya://user/rawkode");
    expect(result.kind).toBe("human");
    expect(result.label).toBe("rawkode");
    expect(result.tone).toBe("human");
  });

  test("human glyph is first initial uppercase", () => {
    expect(classifyPrincipal("comtrya://user/rawkode").glyph).toBe("R");
    expect(classifyPrincipal("comtrya://user/alice").glyph).toBe("A");
    expect(classifyPrincipal("comtrya://user/DAVID").glyph).toBe("D");
  });

  test("comtrya://agent/<id> → agent", () => {
    const result = classifyPrincipal("comtrya://agent/claude-code");
    expect(result.kind).toBe("agent");
    expect(result.label).toBe("claude-code");
    expect(result.glyph).toBe("✦");
    expect(result.tone).toBe("agent");
  });

  test("comtrya://bot/<id> → bot", () => {
    const result = classifyPrincipal("comtrya://bot/dependabot");
    expect(result.kind).toBe("bot");
    expect(result.label).toBe("dependabot");
    expect(result.glyph).toBe("◆");
    expect(result.tone).toBe("bot");
  });

  test("comtrya://credential/<id> → credential", () => {
    const result = classifyPrincipal("comtrya://credential/ci-deploy");
    expect(result.kind).toBe("credential");
    expect(result.label).toBe("ci-deploy");
    expect(result.glyph).toBe("⚙");
    expect(result.tone).toBe("credential");
  });

  test("comtrya://team/<slug> → team", () => {
    const result = classifyPrincipal("comtrya://team/platform-maintainers");
    expect(result.kind).toBe("team");
    expect(result.label).toBe("platform-maintainers");
    expect(result.glyph).toBe("◇");
    expect(result.tone).toBe("team");
  });
});

// ---------------------------------------------------------------------------
// classifyPrincipal — unknown / fallback
// ---------------------------------------------------------------------------

describe("classifyPrincipal — unknown / fallback", () => {
  test("null returns unknown with dot glyph", () => {
    const result = classifyPrincipal(null);
    expect(result.kind).toBe("unknown");
    expect(result.glyph).toBe("·");
    expect(result.tone).toBe("neutral");
  });

  test("undefined returns unknown", () => {
    expect(classifyPrincipal(undefined).kind).toBe("unknown");
  });

  test("empty string returns unknown", () => {
    expect(classifyPrincipal("").kind).toBe("unknown");
  });

  test("unknown scheme uses first initial as glyph", () => {
    const result = classifyPrincipal("comtrya://org/acme");
    expect(result.kind).toBe("unknown");
    expect(result.tone).toBe("neutral");
    // label is whatever is after the scheme
    expect(result.label).toBeTruthy();
  });

  test("non-comtrya URN is classified as unknown", () => {
    const result = classifyPrincipal("urn:user:rawkode");
    expect(result.kind).toBe("unknown");
  });

  test("plain string (no scheme) is classified as unknown", () => {
    const result = classifyPrincipal("rawkode");
    expect(result.kind).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// PrincipalClassification shape invariants
// ---------------------------------------------------------------------------

describe("classifyPrincipal — shape invariants", () => {
  const CASES = [
    "comtrya://user/alice",
    "comtrya://agent/cursor",
    "comtrya://bot/ci",
    "comtrya://credential/api-key",
    "comtrya://team/admins",
    "comtrya://unknown/x",
    null,
    "",
  ] as const;

  for (const input of CASES) {
    test(`always returns complete PrincipalClassification for: ${JSON.stringify(input)}`, () => {
      const result: PrincipalClassification = classifyPrincipal(input);
      expect(typeof result.kind).toBe("string");
      expect(typeof result.label).toBe("string");
      expect(typeof result.glyph).toBe("string");
      expect(typeof result.tone).toBe("string");
      expect(result.glyph.length).toBeGreaterThan(0);
    });
  }

  test("tone is neutral for unknown (legacy compat)", () => {
    const result = classifyPrincipal(null);
    expect(result.tone).toBe("neutral");
    // Must NOT be "unknown" — tone uses "neutral" for unknown
    expect(result.tone).not.toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// principalLabel helper
// ---------------------------------------------------------------------------

describe("principalLabel", () => {
  test("equivalent to classifyPrincipal(value).label", () => {
    const cases = [
      "comtrya://user/rawkode",
      "comtrya://agent/claude",
      null,
      undefined,
      "",
    ] as const;
    for (const c of cases) {
      expect(principalLabel(c)).toBe(classifyPrincipal(c).label);
    }
  });

  test("returns label string for known URN", () => {
    expect(principalLabel("comtrya://user/rawkode")).toBe("rawkode");
  });

  test("returns string for null", () => {
    expect(typeof principalLabel(null)).toBe("string");
  });
});

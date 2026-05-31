import { describe, expect, test, beforeEach } from "bun:test";
import {
  cardFor,
  registerCard,
  unregisterCard,
  _resetCardsForTesting,
  type CardContribution,
} from "./card-registry";

const card: CardContribution = {
  kind: "issue",
  element: "comtrya-issue-card",
  extensionId: "ext_issues",
};

describe("card-registry", () => {
  beforeEach(() => {
    _resetCardsForTesting();
  });

  test("registerCard makes card available via cardFor", () => {
    registerCard(card);
    expect(cardFor("issue")).toEqual(card);
  });

  test("unregisterCard removes the card", () => {
    registerCard(card);
    unregisterCard("issue");
    expect(cardFor("issue")).toBeUndefined();
  });

  test("unregisterCard is a no-op for unregistered kinds", () => {
    // Should not throw
    unregisterCard("nonexistent");
    expect(cardFor("nonexistent")).toBeUndefined();
  });

  test("cardFor returns undefined for unknown kinds", () => {
    expect(cardFor("epic")).toBeUndefined();
  });

  test("second register overwrites the first (last-wins)", () => {
    registerCard(card);
    const card2: CardContribution = {
      kind: "issue",
      element: "comtrya-issue-card-v2",
      extensionId: "ext_issues_v2",
    };
    registerCard(card2);
    expect(cardFor("issue")?.element).toBe("comtrya-issue-card-v2");
  });
});

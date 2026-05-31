/**
 * Card registry — kind URI → custom element resolver.
 *
 * `<comtrya-resource-card>` consults this registry to decide which
 * element to mount for a given `comtrya://<kind>/<id>` URI.
 */

export interface CardContribution {
  /** Resource kind, e.g. `issue`. */
  kind: string;
  /** Custom element name, e.g. `comtrya-issue-card`. */
  element: string;
  /** Owning extension id. */
  extensionId: string;
}

const CARDS = new Map<string, CardContribution>();

export function registerCard(contribution: CardContribution): void {
  CARDS.set(contribution.kind, contribution);
}

export function cardFor(kind: string): CardContribution | undefined {
  return CARDS.get(kind);
}

/** Remove a card contribution by resource kind. */
export function unregisterCard(kind: string): void {
  CARDS.delete(kind);
}

/** Test-only. */
export function _resetCardsForTesting(): void {
  CARDS.clear();
}

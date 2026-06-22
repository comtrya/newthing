export interface IssueBoardFilterQuery {
  text: string;
  filters: Record<string, string[]>;
}

export interface FilterableIssue {
  number: number;
  title: string;
  bodyMarkdown?: string | null;
  state?: string | null;
  stateReason?: string | null;
  authorRef?: string | null;
  assignees?: string[] | null;
  labels?: string[] | null;
  projectName?: string | null;
}

export interface FilterableIssueBoardCard {
  issue: FilterableIssue;
  priority?: string | null;
  priorityLabel?: string | null;
  milestone?: string | null;
  milestoneLabel?: string | null;
  workflow?: string | null;
  workflowLabel?: string | null;
}

export interface FilterableIssueBoardColumn {
  key: string;
  label: string;
  count: number;
  cards: FilterableIssueBoardCard[];
}

export interface FilterableIssueBoard {
  total: number;
  columns: FilterableIssueBoardColumn[];
}

export function filterIssueBoard<TBoard extends FilterableIssueBoard>(
  board: TBoard,
  query: IssueBoardFilterQuery,
): TBoard {
  if (!hasIssueBoardFilterQuery(query)) return board;
  const columns = board.columns.map((column) => {
    const cards = column.cards.filter((card) => issueBoardCardMatches(card, query));
    return {
      ...column,
      count: cards.length,
      cards,
    };
  });
  return {
    ...board,
    total: columns.reduce((sum, column) => sum + column.cards.length, 0),
    columns,
  };
}

export function hasIssueBoardFilterQuery(query: IssueBoardFilterQuery): boolean {
  return (
    query.text.trim().length > 0 ||
    Object.values(query.filters).some((values) => values.length > 0)
  );
}

function issueBoardCardMatches(
  card: FilterableIssueBoardCard,
  query: IssueBoardFilterQuery,
): boolean {
  if (!matchesIssueNumber(card.issue.number, query.filters.issue ?? [])) return false;
  if (!matchesIssueState(card.issue.state, stateFilters(query))) return false;
  if (!matchesAnyQuery([card.issue.projectName], query.filters.project ?? [])) return false;
  if (!matchesAnyQuery([card.issue.authorRef], query.filters.author ?? [])) return false;
  if (!matchesAnyQuery(card.issue.assignees ?? [], query.filters.assignee ?? [])) {
    return false;
  }
  if (!matchesAllQuery(card.issue.labels ?? [], query.filters.label ?? [])) return false;
  if (!matchesAnyQuery([card.priority, card.priorityLabel], query.filters.priority ?? [])) {
    return false;
  }
  if (!matchesAnyQuery([card.milestone, card.milestoneLabel], query.filters.milestone ?? [])) {
    return false;
  }
  if (!matchesAnyQuery([card.workflow, card.workflowLabel], query.filters.workflow ?? [])) {
    return false;
  }
  return matchesText(issueBoardCardSearchFields(card), query.text);
}

function stateFilters(query: IssueBoardFilterQuery): string[] {
  return [...(query.filters.state ?? []), ...(query.filters.status ?? []), ...(query.filters.is ?? [])];
}

function matchesIssueNumber(value: number, filters: string[]): boolean {
  if (filters.length === 0) return true;
  const normalizedValue = String(value);
  return filters.some((filter) => normalizeSearchValue(filter).replace(/^#/, "") === normalizedValue);
}

function matchesIssueState(value: unknown, filters: string[]): boolean {
  if (filters.length === 0) return true;
  const normalizedValue = normalizeSearchValue(value);
  return filters.some((filter) => {
    const normalizedFilter = normalizeSearchValue(filter);
    const expected = STATE_ALIASES[normalizedFilter] ?? [normalizedFilter];
    return expected.includes(normalizedValue) || normalizedValue.includes(normalizedFilter);
  });
}

function matchesAnyQuery(values: unknown[], filters: string[]): boolean {
  if (filters.length === 0) return true;
  const haystack = values.flatMap(searchableValues).map(normalizeSearchValue).filter(Boolean);
  return filters.some((filter) =>
    haystack.some((value) => value.includes(normalizeSearchValue(filter))),
  );
}

function matchesAllQuery(values: unknown[], filters: string[]): boolean {
  if (filters.length === 0) return true;
  const haystack = values.flatMap(searchableValues).map(normalizeSearchValue).filter(Boolean);
  return filters.every((filter) =>
    haystack.some((value) => value.includes(normalizeSearchValue(filter))),
  );
}

function matchesText(values: unknown[], text: string): boolean {
  const needle = normalizeSearchValue(text);
  if (!needle) return true;
  return values.flatMap(searchableValues).map(normalizeSearchValue).join(" ").includes(needle);
}

function issueBoardCardSearchFields(card: FilterableIssueBoardCard): unknown[] {
  return [
    card.issue.number,
    `#${card.issue.number}`,
    card.issue.title,
    card.issue.bodyMarkdown,
    card.issue.state,
    card.issue.stateReason,
    card.issue.authorRef,
    card.issue.assignees,
    card.issue.labels,
    card.issue.projectName,
    card.priority,
    card.priorityLabel,
    card.milestone,
    card.milestoneLabel,
    card.workflow,
    card.workflowLabel,
  ];
}

function searchableValues(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(searchableValues);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => [
      key,
      ...searchableValues(item),
    ]);
  }
  return [String(value)];
}

function normalizeSearchValue(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

const STATE_ALIASES: Record<string, string[]> = {
  active: ["open", "reopened"],
  closed: ["closed"],
  done: ["closed"],
  open: ["open", "reopened"],
  opened: ["open", "reopened"],
  reopened: ["reopened"],
  resolved: ["closed"],
};

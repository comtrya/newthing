export interface DocsFilterQuery {
  text: string;
  filters: Record<string, string[]>;
}

export interface FilterableDocBoardCard {
  projectName?: string;
  typeName?: string;
  typeLabel?: string;
  path?: string;
  title?: string;
  status?: string | null;
  owner?: string | null;
  tags?: string[];
  feature?: string | null;
  scenarioCount?: number;
  stepCount?: number;
  scenariosWithoutSteps?: number;
  checklistTotal?: number;
  checklistChecked?: number;
  referenceCount?: number;
  implementationReferenceCount?: number;
  docReferenceCount?: number;
  otherReferenceCount?: number;
  decisionCount?: number;
  openQuestionCount?: number;
  riskCount?: number;
}

export interface FilterableDocBoardColumn {
  key: string;
  label: string;
  count: number;
  docs: FilterableDocBoardCard[];
}

export interface FilterableDocBoard {
  totalDocs: number;
  columns: FilterableDocBoardColumn[];
}

export interface FilterableProject {
  name?: string;
  root?: string;
  labels?: string[];
}

export interface FilterableDocType {
  slug?: string;
  label?: string;
  description?: string;
}

export interface FilterableDocFile {
  path: string;
  fileName: string;
  title: string;
  frontMatter: Record<string, unknown>;
  body: string;
  preview: string;
}

export function filterDocBoard<TBoard extends FilterableDocBoard>(
  board: TBoard,
  query: DocsFilterQuery,
): TBoard {
  if (!hasDocsFilterQuery(query)) return board;
  const columns = board.columns.map((column) => {
    const docs = column.docs.filter((doc) => docBoardCardMatches(doc, query));
    return {
      ...column,
      count: docs.length,
      docs,
    };
  });
  return {
    ...board,
    totalDocs: columns.reduce((sum, column) => sum + column.docs.length, 0),
    columns,
  };
}

export function docFileMatches(
  project: FilterableProject,
  typeName: string,
  type: FilterableDocType,
  doc: FilterableDocFile,
  query: DocsFilterQuery,
): boolean {
  if (!hasDocsFilterQuery(query)) return true;
  if (!matchesAnyQuery([typeName, type.label], query.filters.type ?? [])) return false;
  if (!matchesAnyQuery([project.name], query.filters.project ?? [])) return false;
  if (!matchesAnyQuery([doc.frontMatter.owner], query.filters.owner ?? [])) return false;
  if (!matchesStatusQuery(doc.frontMatter.status, statusFilters(query))) return false;
  if (!matchesAllQuery(frontMatterList(doc.frontMatter.tags), query.filters.tag ?? [])) {
    return false;
  }
  if (!matchesAnyQuery([doc.path, doc.fileName], query.filters.path ?? [])) return false;
  if (!matchesAnyQuery([doc.frontMatter.feature], query.filters.feature ?? [])) {
    return false;
  }
  return matchesText(docFileSearchFields(project, typeName, type, doc), query.text);
}

export function hasDocsFilterQuery(query: DocsFilterQuery): boolean {
  return (
    query.text.trim().length > 0 ||
    Object.values(query.filters).some((values) => values.length > 0)
  );
}

function docBoardCardMatches(
  card: FilterableDocBoardCard,
  query: DocsFilterQuery,
): boolean {
  if (!matchesAnyQuery([card.typeName, card.typeLabel], query.filters.type ?? [])) {
    return false;
  }
  if (!matchesAnyQuery([card.projectName], query.filters.project ?? [])) return false;
  if (!matchesAnyQuery([card.owner], query.filters.owner ?? [])) return false;
  if (!matchesStatusQuery(card.status, statusFilters(query))) return false;
  if (!matchesAllQuery(card.tags ?? [], query.filters.tag ?? [])) return false;
  if (!matchesAnyQuery([card.path], query.filters.path ?? [])) return false;
  if (!matchesAnyQuery([card.feature], query.filters.feature ?? [])) return false;
  return matchesText(docBoardCardSearchFields(card), query.text);
}

function statusFilters(query: DocsFilterQuery): string[] {
  return [...(query.filters.status ?? []), ...(query.filters.is ?? [])];
}

function matchesStatusQuery(value: unknown, filters: string[]): boolean {
  if (filters.length === 0) return true;
  const normalizedValue = normalizeSearchValue(value);
  return filters.some((filter) => {
    const normalizedFilter = normalizeSearchValue(filter);
    const expected = STATUS_ALIASES[normalizedFilter] ?? [normalizedFilter];
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

function docBoardCardSearchFields(card: FilterableDocBoardCard): unknown[] {
  return [
    card.projectName,
    card.typeName,
    card.typeLabel,
    card.path,
    card.title,
    card.status,
    card.owner,
    card.tags,
    card.feature,
    card.scenarioCount,
    card.stepCount,
    card.scenariosWithoutSteps,
    card.checklistTotal,
    card.checklistChecked,
    card.referenceCount,
    card.implementationReferenceCount,
    card.docReferenceCount,
    card.otherReferenceCount,
    card.decisionCount,
    card.openQuestionCount,
    card.riskCount,
  ];
}

function docFileSearchFields(
  project: FilterableProject,
  typeName: string,
  type: FilterableDocType,
  doc: FilterableDocFile,
): unknown[] {
  return [
    project.name,
    project.root,
    project.labels,
    typeName,
    type.label,
    type.slug,
    type.description,
    doc.path,
    doc.fileName,
    doc.title,
    doc.frontMatter,
    doc.body,
    doc.preview,
  ];
}

function frontMatterList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
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

const STATUS_ALIASES: Record<string, string[]> = {
  active: ["active"],
  accepted: ["accepted"],
  done: ["accepted", "shipping", "shipped"],
  draft: ["draft", "proposed"],
  implemented: ["implemented", "shipping", "shipped"],
  open: ["active", "draft", "proposed"],
  planned: ["planned", "proposed"],
  proposed: ["proposed", "draft"],
  review: ["review", "in-review"],
  shipping: ["shipping", "shipped"],
  shipped: ["shipping", "shipped"],
};

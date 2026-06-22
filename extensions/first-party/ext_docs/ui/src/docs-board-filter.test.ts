import { describe, expect, test } from "bun:test";
import {
  docFileMatches,
  filterDocBoard,
  type DocsFilterQuery,
  type FilterableDocBoard,
  type FilterableDocFile,
  type FilterableDocType,
  type FilterableProject,
} from "./docs-board-filter";

function query(text = "", filters: Record<string, string[]> = {}): DocsFilterQuery {
  return { text, filters };
}

const board: FilterableDocBoard = {
  totalDocs: 3,
  columns: [
    {
      key: "prd",
      label: "PRDs",
      count: 2,
      docs: [
        {
          projectName: "frontend",
          typeName: "prd",
          typeLabel: "Frontend PRDs",
          path: "frontend/docs/prds/0001-keyboard-first-shell.mdx",
          title: "Keyboard-first shell",
          status: "shipping",
          owner: "frontend-maintainers",
          tags: ["shell", "keyboard"],
        },
        {
          projectName: "backend",
          typeName: "prd",
          typeLabel: "Backend PRDs",
          path: "crates/server/docs/prds/repository-docs-surface.mdx",
          title: "Repository Docs Surface",
          status: "active",
          owner: "platform-maintainers",
          tags: ["docs", "projects"],
        },
      ],
    },
    {
      key: "scenario",
      label: "BDD Scenarios",
      count: 1,
      docs: [
        {
          projectName: "backend",
          typeName: "scenario",
          typeLabel: "BDD Scenarios",
          path: "crates/server/docs/scenarios/repository-docs-surface.mdx",
          title: "Repository docs are discoverable from project context",
          status: "active",
          owner: "platform-maintainers",
          tags: ["docs", "projects", "bdd"],
          feature: "repository docs",
          scenarioCount: 2,
          stepCount: 6,
        },
      ],
    },
  ],
};

const project: FilterableProject = {
  name: "backend",
  root: "crates/server",
  labels: ["rust"],
};

const docType: FilterableDocType = {
  label: "BDD Scenarios",
  slug: "docs/scenarios",
  description: "Executable behavior examples",
};

const docFile: FilterableDocFile = {
  path: "crates/server/docs/scenarios/repository-docs-surface.mdx",
  fileName: "repository-docs-surface.mdx",
  title: "Repository docs are discoverable from project context",
  frontMatter: {
    status: "active",
    owner: "platform-maintainers",
    tags: ["docs", "projects", "bdd"],
    feature: "repository docs",
  },
  body: "Given a repository with Project docs, When I open Specs, Then PRDs and BDD scenarios are visible.",
  preview: "",
};

describe("filterDocBoard", () => {
  test("filters board cards by type, project, status alias, and text", () => {
    const filtered = filterDocBoard(
      board,
      query("project context", {
        type: ["scenario"],
        project: ["backend"],
        is: ["open"],
      }),
    );

    expect(filtered.totalDocs).toBe(1);
    expect(filtered.columns.map((column) => column.count)).toEqual([0, 1]);
    expect(filtered.columns[1]?.docs[0]?.title).toBe(
      "Repository docs are discoverable from project context",
    );
  });

  test("requires all requested tags to match", () => {
    const filtered = filterDocBoard(
      board,
      query("", { tag: ["docs", "bdd"] }),
    );

    expect(filtered.totalDocs).toBe(1);
    expect(filtered.columns[1]?.docs[0]?.typeLabel).toBe("BDD Scenarios");
  });
});

describe("docFileMatches", () => {
  test("matches repo docs by front matter, path, and body text", () => {
    expect(
      docFileMatches(
        project,
        "scenario",
        docType,
        docFile,
        query("repository with project docs", {
          owner: ["platform"],
          path: ["scenarios"],
          feature: ["repository"],
        }),
      ),
    ).toBe(true);
  });

  test("rejects docs outside requested type or status", () => {
    expect(
      docFileMatches(
        project,
        "scenario",
        docType,
        docFile,
        query("", { type: ["prd"], status: ["accepted"] }),
      ),
    ).toBe(false);
  });
});

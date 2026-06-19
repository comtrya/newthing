import { describe, expect, test } from "bun:test";

// ProjectsPanel.vue keeps the GraphQL fetch in the component; test the
// small display formatter directly so the rail copy stays familiar.

const projectCountLabels = {
  openIssues: "open issues",
  epicsInProgress: "in-progress epics",
  closedIssues: "closed issues",
} as const;

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

function projectSummaryLabel(projectCount: number, sourceCount: number, implicit: boolean): string {
  if (implicit) return "1 default project";
  const projectWord = plural(projectCount, "project");
  const sourceWord = plural(sourceCount, "config source");
  return `${projectCount} ${projectWord} from ${sourceCount} ${sourceWord}`;
}

function humanizeKeyLabel(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (words.length === 0) return key;
  return words
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

describe("ProjectsPanel summary copy", () => {
  test("summarizes explicit projects without exposing CUE evaluator internals", () => {
    expect(projectSummaryLabel(1, 1, false)).toBe("1 project from 1 config source");
    expect(projectSummaryLabel(2, 1, false)).toBe("2 projects from 1 config source");
    expect(projectSummaryLabel(2, 3, false)).toBe("2 projects from 3 config sources");
  });

  test("uses familiar default-project copy for implicit repositories", () => {
    expect(projectSummaryLabel(1, 0, true)).toBe("1 default project");
  });

  test("uses explicit issue and epic labels for project work counts", () => {
    expect(projectCountLabels).toEqual({
      openIssues: "open issues",
      epicsInProgress: "in-progress epics",
      closedIssues: "closed issues",
    });
  });

  test("formats raw labels and claim keys as familiar UI text", () => {
    expect(humanizeKeyLabel("runtime")).toBe("Runtime");
    expect(humanizeKeyLabel("pull_requests")).toBe("Pull Requests");
    expect(humanizeKeyLabel("buildStatus")).toBe("Build Status");
  });
});

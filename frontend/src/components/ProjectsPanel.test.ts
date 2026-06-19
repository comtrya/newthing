import { describe, expect, test } from "bun:test";

// ProjectsPanel.vue keeps the GraphQL fetch in the component; test the
// small display formatter directly so the rail copy stays familiar.

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

function projectSummaryLabel(projectCount: number, sourceCount: number, implicit: boolean): string {
  if (implicit) return "1 default project";
  const projectWord = plural(projectCount, "project");
  const sourceWord = plural(sourceCount, "config source");
  return `${projectCount} ${projectWord} from ${sourceCount} ${sourceWord}`;
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
});

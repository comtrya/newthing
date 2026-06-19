import { expect, test } from "bun:test";
import type { ShellGraphQLClient } from "../extension-runtime";
import { CORE_CODE_BROWSER_ELEMENT, defineCoreCodeBrowser } from "./code-browser";

test("core code browser renders familiar branch and commit controls", async () => {
  defineCoreCodeBrowser();
  (window as unknown as { SyntaxError: ErrorConstructor }).SyntaxError = SyntaxError;

  const client: ShellGraphQLClient = {
    query: async <T>() =>
      ({
        workspace: {
          repositoryByPath: {
            id: "repo_1",
            path: "comtrya/dogfood",
            defaultBranch: "main",
            headOid: "1234567890abcdef1234567890abcdef12345678",
            files: [
              { path: "README.md", size: 120, kind: "markdown", preview: "# Readme" },
              { path: "src/main.ts", size: 240, kind: "typescript", preview: "main()" },
            ],
          },
        },
      }) as T,
    mutate: async <T>() => ({}) as T,
  };

  const element = document.createElement(CORE_CODE_BROWSER_ELEMENT) as HTMLElement & {
    comtryaClient?: ShellGraphQLClient;
    repositoryPath?: string;
  };
  element.comtryaClient = client;
  element.repositoryPath = "comtrya/dogfood";

  document.body.append(element);
  await eventually(() => element.querySelector(".repo-code-directory"));

  const refText = Array.from(element.querySelectorAll(".repo-code-ref-pill")).map((node) =>
    node.textContent?.trim(),
  );
  expect(refText).toEqual(["main", "1234567890ab"]);
  expect(element.querySelectorAll(".repo-code-ref-pill svg")).toHaveLength(2);
  expect(element.querySelector(".repo-code-breadcrumb-current")?.textContent).toBe("dogfood");
  expect(element.querySelector(".repo-code-latest-commit")?.textContent?.replace(/\s+/g, " ").trim()).toBe(
    "Latest commit 1234567890ab",
  );
  expect(element.querySelector(".repo-code-directory-counts")?.textContent).toBe(
    "1 directory · 1 file shown · 2 total",
  );

  const filter = element.querySelector<HTMLInputElement>(".repo-code-file-filter");
  expect(filter?.placeholder).toBe("Find file or folder");
  expect(rowNames(element)).toEqual(["src", "README.md"]);

  filter!.value = "read";
  filter!.dispatchEvent(new Event("input", { bubbles: true }));
  expect(rowNames(element)).toEqual(["README.md"]);

  filter!.value = "missing";
  filter!.dispatchEvent(new Event("input", { bubbles: true }));
  expect(rowNames(element)).toEqual([]);
  expect(element.querySelector(".repo-code-empty-row")?.textContent).toBe(
    'No files or folders match "missing".',
  );
});

function rowNames(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll(".repo-code-row-name")).map((node) =>
    node.textContent?.trim() ?? "",
  );
}

async function eventually<T>(read: () => T | null | undefined): Promise<T> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const value = read();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("condition was not met");
}

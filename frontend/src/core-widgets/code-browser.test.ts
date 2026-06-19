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
            commits: [
              {
                oid: "1234567890abcdef1234567890abcdef12345678",
                shortOid: "1234567",
                subject: "Add repository shell",
                author: "Ada",
                time: "2 hours ago",
              },
            ],
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
  const latestCommit = element.querySelector(".repo-code-latest-commit")!;
  expect(latestCommit.querySelector(".repo-code-latest-author")?.textContent).toBe("Ada");
  expect(latestCommit.querySelector(".repo-code-latest-subject")?.textContent).toBe("Add repository shell");
  expect(latestCommit.querySelector(".repo-code-commit-label")?.textContent).toBe("1234567");
  expect(latestCommit.querySelector(".repo-code-latest-time")?.textContent).toBe("2 hours ago");
  expect(latestCommit.getAttribute("aria-label")).toBe(
    "Latest commit Add repository shell by Ada (1234567) 2 hours ago",
  );
  expect(element.querySelector(".repo-code-directory-counts")?.textContent).toBe(
    "1 directory · 1 file shown · 2 total",
  );
  expect(element.querySelector(".repo-code-directory-header")).toBeNull();

  let filter = element.querySelector<HTMLInputElement>(".repo-code-file-filter");
  expect(filter?.placeholder).toBe("Find file or folder");
  expect(rowNames(element)).toEqual(["src", "README.md"]);

  const srcRow = element.querySelector<HTMLButtonElement>('[aria-label="Open directory src"]');
  srcRow!.click();
  await eventually(() =>
    element.querySelector(".repo-code-breadcrumb-current")?.textContent === "src"
      ? element.querySelector(".repo-code-directory")
      : null,
  );
  expect(element.querySelector(".repo-code-row--parent")).toBeNull();
  expect(rowNames(element)).toEqual(["main.ts"]);

  const repoCrumb = element.querySelector<HTMLButtonElement>(".repo-code-breadcrumb");
  repoCrumb!.click();
  await eventually(() => element.querySelector('[aria-label="Open directory src"]'));
  expect(rowNames(element)).toEqual(["src", "README.md"]);
  filter = element.querySelector<HTMLInputElement>(".repo-code-file-filter");

  const slash = keydown("/");
  document.dispatchEvent(slash);
  expect(slash.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(filter);

  const otherInput = document.createElement("input");
  document.body.append(otherInput);
  otherInput.focus();
  const typingSlash = keydown("/");
  otherInput.dispatchEvent(typingSlash);
  expect(typingSlash.defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(otherInput);
  otherInput.remove();

  filter!.value = "read";
  filter!.dispatchEvent(new Event("input", { bubbles: true }));
  expect(rowNames(element)).toEqual(["README.md"]);

  filter!.value = "missing";
  filter!.dispatchEvent(new Event("input", { bubbles: true }));
  expect(rowNames(element)).toEqual([]);
  expect(element.querySelector(".repo-code-empty-row")?.textContent).toBe(
    'No files or folders match "missing".',
  );

  filter!.value = "";
  filter!.dispatchEvent(new Event("input", { bubbles: true }));
  const clipboardWrites: string[] = [];
  const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (text: string): Promise<void> => {
        clipboardWrites.push(text);
      },
    },
  });

  const readmeRow = element.querySelector<HTMLButtonElement>('[aria-label="Open file README.md"]');
  readmeRow!.click();
  await eventually(() => element.querySelector('[data-smoke="repo-code-file-view"]'));
  expect(element.querySelector(".repo-code-back")).toBeNull();
  expect(element.querySelector(".repo-code-breadcrumb-current")?.textContent).toBe("README.md");

  const copyPath = element.querySelector<HTMLButtonElement>(".repo-code-copy-path");
  expect(copyPath?.textContent?.trim()).toBe("Copy path");
  copyPath!.click();
  await eventually(() => (copyPath!.getAttribute("aria-pressed") === "true" ? copyPath : null));
  expect(clipboardWrites).toEqual(["README.md"]);
  expect(copyPath!.textContent?.trim()).toBe("Copied");

  if (clipboardDescriptor) {
    Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  } else {
    delete (navigator as unknown as { clipboard?: unknown }).clipboard;
  }

  const rootCrumb = element.querySelector<HTMLButtonElement>(".repo-code-breadcrumb");
  expect(rootCrumb?.textContent).toBe("dogfood");
  rootCrumb!.click();
  await eventually(() => element.querySelector(".repo-code-directory"));
  expect(rowNames(element)).toEqual(["src", "README.md"]);

  element.remove();
});

function rowNames(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll(".repo-code-row-name")).map((node) =>
    node.textContent?.trim() ?? "",
  );
}

function keydown(key: string): KeyboardEvent {
  const event = new Event("keydown", { bubbles: true, cancelable: true }) as KeyboardEvent;
  Object.defineProperty(event, "key", { value: key });
  return event;
}

async function eventually<T>(read: () => T | null | undefined): Promise<T> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const value = read();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("condition was not met");
}

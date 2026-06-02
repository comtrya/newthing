import { ExpressiveCode } from "expressive-code";
import { toHtml } from "expressive-code/hast";
import type { RepoFile } from "./code-browser-model";

const STYLE_ELEMENT_ID = "comtrya-expressive-code-styles";

let enginePromise: Promise<ExpressiveCode> | null = null;
let globalStylesPromise: Promise<void> | null = null;

export interface HighlightedCode {
  html: string;
  styles: string;
}

export async function highlightRepoFile(file: RepoFile): Promise<HighlightedCode> {
  const engine = await expressiveCodeEngine();
  await ensureGlobalStyles(engine);

  const result = await engine.render({
    code: file.preview ?? "",
    language: expressiveCodeLanguage(file),
  });

  return {
    html: toHtml(result.renderedGroupAst),
    styles: [...result.styles].join("\n"),
  };
}

export function expressiveCodeLanguage(file: Pick<RepoFile, "kind" | "path">): string {
  const extension = file.path.split(".").pop()?.toLowerCase() ?? "";
  const language =
    file.kind === "file"
      ? languageByExtension[extension]
      : languageByKind[file.kind] ?? languageByExtension[extension];
  return language ?? "plaintext";
}

async function expressiveCodeEngine(): Promise<ExpressiveCode> {
  enginePromise ??= Promise.resolve(
    new ExpressiveCode({
      frames: false,
      textMarkers: false,
      shiki: {
        engine: "javascript",
      },
      useDarkModeMediaQuery: false,
      useStyleReset: false,
      themeCssRoot: ".shell-app",
      defaultProps: {
        wrap: true,
      },
      styleOverrides: {
        borderRadius: "0",
        borderWidth: "0",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "12px",
        codeLineHeight: "1.55",
        codePaddingBlock: "14px",
        codePaddingInline: "16px",
      },
    }),
  );
  return enginePromise;
}

async function ensureGlobalStyles(engine: ExpressiveCode): Promise<void> {
  if (typeof document === "undefined") return;

  globalStylesPromise ??= (async () => {
    const style = document.getElementById(STYLE_ELEMENT_ID) ?? document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = `${await engine.getBaseStyles()}\n${await engine.getThemeStyles()}`;
    if (!style.parentElement) document.head.append(style);
  })();

  return globalStylesPromise;
}

const languageByKind: Record<string, string> = {
  cue: "cue",
  file: "plaintext",
  javascript: "js",
  json: "json",
  markdown: "md",
  mdx: "mdx",
  rust: "rust",
  toml: "toml",
  typescript: "ts",
  vue: "vue",
  wit: "wit",
  yaml: "yaml",
};

const languageByExtension: Record<string, string> = {
  cue: "cue",
  js: "js",
  jsx: "jsx",
  json: "json",
  md: "md",
  mdx: "mdx",
  rs: "rust",
  toml: "toml",
  ts: "ts",
  tsx: "tsx",
  vue: "vue",
  wit: "wit",
  yaml: "yaml",
  yml: "yaml",
};

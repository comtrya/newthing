import { el, text } from "./dom";
import { KNOWN_THEMES, persistTheme, type ThemeName } from "./theme";

export interface ChromeContext {
  workspaceName: string;
  repositoryCount: number;
  viewerName: string;
  viewerPermissions: string[];
  readyState: "ready" | "warn" | "err" | "unknown";
  serverURL: string;
  extensionsWithRoutes: Array<{ routePrefix: string; displayName: string }>;
  isOperator: boolean;
}

const PALETTES: Record<ThemeName, string[]> = {
  print:        ["#ffffff", "#f6f4ef", "#0a0a0a", "#f04a1e", "#008873", "#f2c100"],
  catppuccin:   ["#1e1e2e", "#181825", "#cdd6f4", "#cba6f7", "#a6e3a1", "#f9e2af"],
  ayu:          ["#1f2430", "#171c28", "#cccac2", "#ffcc66", "#bae67e", "#5ccfe6"],
  "rose-pine":  ["#191724", "#1f1d2e", "#e0def4", "#ebbcba", "#f6c177", "#eb6f92"],
  "tokyo-night":["#1a1b26", "#16161e", "#c0caf5", "#7aa2f7", "#9ece6a", "#bb9af7"],
  gruvbox:      ["#282828", "#1d2021", "#ebdbb2", "#fe8019", "#b8bb26", "#fabd2f"],
};

export function renderChrome(ctx: ChromeContext, mount: HTMLElement, content: HTMLElement): void {
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  mount.appendChild(buildTopbar(ctx));
  mount.appendChild(el("div", { className: "layout" }, buildSidebar(ctx), content));
}

function buildTopbar(ctx: ChromeContext): HTMLElement {
  return el("header", { className: "topbar", attrs: { role: "banner" } },
    el("div", { className: "brand" },
      el("div", { className: "mark", textContent: "C" }),
      el("div", { className: "name" },
        el("span", { className: "word", textContent: "Comtrya" }),
        el("span", { className: "sub", textContent: "forge · single-tenant" }),
      ),
    ),
    el("label", { className: "cmdk" },
      el("span", { className: "label", textContent: "Cmd" }),
      el("input", { type: "search", attrs: { placeholder: "repository, pull, file, ref…" } }),
      el("kbd", { textContent: "⌘K" }),
    ),
    el("div", { className: "topbar-actions" },
      el("span", { className: `chip ${ctx.readyState === "ready" ? "ok" : ctx.readyState}`, textContent: ctx.readyState }),
      el("code", { attrs: { style: "color: var(--ink-faint);" }, textContent: ctx.serverURL }),
    ),
  );
}

function buildSidebar(ctx: ChromeContext): HTMLElement {
  const workspaceBlock = el("div", { className: "workspace" },
    el("h4", { textContent: "Workspace" }),
    el("strong", { textContent: ctx.workspaceName }),
    el("div", { className: "meta", textContent: `${ctx.repositoryCount} repositories · single-tenant` }),
  );

  const workspaceNav = el("div", {},
    el("h4", { textContent: "Workspace nav" }),
    buildNav([
      { href: "/", num: "01", label: "Home" },
      { href: "/#activity", num: "02", label: "Activity" },
      { href: "/#extensions", num: "03", label: "Extensions" },
      ...(ctx.isOperator ? [{ href: "/instance", num: "04", label: "Instance" }] : []),
    ]),
  );

  const extensionEntries = ctx.extensionsWithRoutes.map((e) => ({
    href: `/x/${e.routePrefix}/`,
    num: "/x",
    label: e.displayName,
  }));
  const extensionNav = el("div", {},
    el("h4", { textContent: "Extension routes" }),
    extensionEntries.length > 0
      ? buildNav(extensionEntries)
      : el("span", { className: "meta", textContent: "none installed" }),
  );

  const viewerBlock = el("div", { attrs: { style: "margin-top: auto;" } },
    el("h4", { textContent: "Viewer" }),
    el("div", { attrs: { style: "font-family: var(--display); font-weight: 700; font-size: 18px;" }, textContent: ctx.viewerName }),
    el("div", { attrs: { style: "font-family: var(--mono); font-size: 11px; color: var(--ink-faint);" }, textContent: ctx.viewerPermissions.join(" · ") }),
    buildThemeSwitcher(),
  );

  return el("aside", { className: "sidebar" }, workspaceBlock, workspaceNav, extensionNav, viewerBlock);
}

function buildNav(entries: Array<{ href: string; num: string; label: string }>): HTMLElement {
  const nav = el("nav", { className: "nav" });
  for (const entry of entries) {
    nav.appendChild(
      el("a", { attrs: { href: entry.href } },
        el("span", { className: "num", textContent: entry.num }),
        el("span", { textContent: entry.label }),
      ),
    );
  }
  return nav;
}

function buildThemeSwitcher(): HTMLElement {
  const mount = el("div", { className: "theme-switch-inline", attrs: { "aria-label": "Color scheme" } });
  for (const theme of KNOWN_THEMES) {
    const swatches = el("span", { className: "ts-swatches" });
    for (const color of PALETTES[theme]) {
      swatches.appendChild(el("span", { attrs: { style: `background: ${color};` } }));
    }
    const btn = el("button", {
      attrs: { type: "button", "data-theme": theme },
      className: document.documentElement.dataset.theme === theme ? "active" : "",
      onClick: () => {
        persistTheme(theme);
        const buttons = mount.querySelectorAll<HTMLButtonElement>("button");
        buttons.forEach((b) => b.classList.toggle("active", b === btn));
      },
    },
      swatches,
      el("span", { className: "ts-name", textContent: theme }),
    );
    mount.appendChild(btn);
  }
  return mount;
}

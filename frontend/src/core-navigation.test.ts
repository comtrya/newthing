import { describe, expect, test } from "bun:test";
import { CORE_NAVIGATION_COMMANDS } from "./core-navigation";

describe("core navigation commands", () => {
  test("covers the familiar workspace work surfaces", () => {
    expect(
      CORE_NAVIGATION_COMMANDS
        .filter((command) => command.category === "Work")
        .map((command) => [command.id, command.title, command.path, command.shortcut]),
    ).toEqual([
      ["core.issues", "Open workspace issues", "/x/issues/", "g i"],
      ["core.pulls", "Open workspace pull requests", "/x/pulls/", "g p"],
      ["core.epics", "Open workspace Epics", "/x/epics/board", "g e"],
      ["core.kanban", "Open Kanban board", "/x/sprints/", "g s"],
      ["core.specs", "Open Specs", "/x/docs/", "g d"],
    ]);
  });

  test("includes delivery shell destinations as command-palette entries", () => {
    expect(
      CORE_NAVIGATION_COMMANDS
        .filter((command) => ["core.actions", "core.releases"].includes(command.id))
        .map((command) => [command.id, command.title, command.path, command.shortcut]),
    ).toEqual([
      ["core.actions", "Open Actions", "/pipelines", "g a"],
      ["core.releases", "Open Releases", "/releases", "g r"],
    ]);
  });

  test("keeps command ids and shortcuts unique", () => {
    const ids = CORE_NAVIGATION_COMMANDS.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);

    const shortcuts = CORE_NAVIGATION_COMMANDS
      .map((command) => command.shortcut)
      .filter((shortcut): shortcut is string => Boolean(shortcut));
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });
});

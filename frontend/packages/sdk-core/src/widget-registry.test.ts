import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  _resetWidgetsForTesting,
  registerWidget,
  setUserLayout,
  subscribeWidgets,
  widgetsForSlot,
} from "./widget-registry";

afterEach(() => _resetWidgetsForTesting());

describe("widget-registry", () => {
  test("renders a widget in its default slot", () => {
    registerWidget({
      id: "ext_issues:issues-list",
      extensionId: "ext_issues",
      element: "comtrya-issues-list",
      defaultSlot: "repository.main",
      defaultPriority: 100,
    });
    const widgets = widgetsForSlot("repository.main");
    expect(widgets).toHaveLength(1);
    expect(widgets[0]!.element).toBe("comtrya-issues-list");
    expect(widgets[0]!.priority).toBe(100);
  });

  test("returns empty when no widget targets a slot", () => {
    expect(widgetsForSlot("repository.sidebar")).toEqual([]);
  });

  test("orders widgets by priority ascending", () => {
    registerWidget({
      id: "a",
      extensionId: "x",
      element: "el-a",
      defaultSlot: "repository.main",
      defaultPriority: 200,
    });
    registerWidget({
      id: "b",
      extensionId: "x",
      element: "el-b",
      defaultSlot: "repository.main",
      defaultPriority: 100,
    });
    const widgets = widgetsForSlot("repository.main");
    expect(widgets.map((w) => w.id)).toEqual(["b", "a"]);
  });

  test("moves a widget to an override slot", () => {
    registerWidget({
      id: "issues",
      extensionId: "ext_issues",
      element: "comtrya-issues-list",
      defaultSlot: "repository.main",
    });
    setUserLayout({ issues: { slot: "repository.sidebar" } });
    expect(widgetsForSlot("repository.main")).toEqual([]);
    expect(widgetsForSlot("repository.sidebar")).toHaveLength(1);
  });

  test("hides a widget when override sets hidden", () => {
    registerWidget({
      id: "issues",
      extensionId: "ext_issues",
      element: "comtrya-issues-list",
      defaultSlot: "repository.main",
    });
    setUserLayout({ issues: { hidden: true } });
    expect(widgetsForSlot("repository.main")).toEqual([]);
  });

  test("override priority overrides default priority", () => {
    registerWidget({
      id: "a",
      extensionId: "x",
      element: "el-a",
      defaultSlot: "repository.main",
      defaultPriority: 100,
    });
    registerWidget({
      id: "b",
      extensionId: "x",
      element: "el-b",
      defaultSlot: "repository.main",
      defaultPriority: 200,
    });
    setUserLayout({ a: { priority: 300 } });
    expect(widgetsForSlot("repository.main").map((w) => w.id)).toEqual(["b", "a"]);
  });

  test("notifies subscribers on register, unregister, and layout changes", () => {
    const spy = mock(() => undefined);
    const dispose = subscribeWidgets(spy);
    registerWidget({
      id: "a",
      extensionId: "x",
      element: "el-a",
      defaultSlot: "repository.main",
    });
    setUserLayout({ a: { slot: "repository.sidebar" } });
    expect(spy).toHaveBeenCalledTimes(2);
    dispose();
  });
});

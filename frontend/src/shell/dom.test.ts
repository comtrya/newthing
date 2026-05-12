import { describe, expect, test } from "bun:test";
import { el, text } from "./dom";

describe("el helper", () => {
  test("creates element with class and text child", () => {
    const node = el("div", { className: "foo" }, text("hello"));
    expect(node.tagName).toBe("DIV");
    expect(node.className).toBe("foo");
    expect(node.textContent).toBe("hello");
  });

  test("nests elements", () => {
    const node = el("ul", {}, el("li", {}, text("a")), el("li", {}, text("b")));
    expect(node.children.length).toBe(2);
    expect(node.children[0]!.textContent).toBe("a");
  });

  test("sets data attributes via dataset", () => {
    const node = el("section", { dataset: { smoke: "x", slot: "home.your-work" } });
    expect(node.dataset.smoke).toBe("x");
    expect(node.dataset.slot).toBe("home.your-work");
  });

  test("ignores nullish children", () => {
    const node = el("p", {}, null, text("kept"), undefined);
    expect(node.children.length).toBe(0);
    expect(node.textContent).toBe("kept");
  });

  test("attaches click listeners", () => {
    let fired = 0;
    const node = el("button", { onClick: () => { fired++; } });
    node.click();
    expect(fired).toBe(1);
  });
});

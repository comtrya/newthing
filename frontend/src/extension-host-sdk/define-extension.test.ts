import { describe, expect, test } from "bun:test";
import { defineExtension } from "./define-extension";

describe("defineExtension", () => {
  test("returns the definition unchanged", () => {
    const setup = () => {};
    const def = defineExtension({ id: "ext_test", setup });
    expect(def.id).toBe("ext_test");
    expect(def.setup).toBe(setup);
  });

  test("rejects empty id at definition time", () => {
    expect(() => defineExtension({ id: "", setup: () => {} })).toThrow(
      "extension id must be a non-empty string"
    );
  });

  test("rejects setup that is not a function", () => {
    // @ts-expect-error testing runtime guard
    expect(() => defineExtension({ id: "ext_test", setup: null })).toThrow(
      "extension setup must be a function"
    );
  });
});

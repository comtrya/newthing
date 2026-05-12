import type { ExtensionDefinition } from "./types";

export function defineExtension(def: ExtensionDefinition): ExtensionDefinition {
  if (typeof def.id !== "string" || def.id.length === 0) {
    throw new Error("extension id must be a non-empty string");
  }
  if (typeof def.setup !== "function") {
    throw new Error("extension setup must be a function");
  }
  return def;
}

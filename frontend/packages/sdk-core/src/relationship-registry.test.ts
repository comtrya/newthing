import { afterEach, expect, test } from "bun:test";

import {
  _resetRelationshipsForTesting,
  registerRelationshipTargetProvider,
  registerRelationshipType,
  relationshipTargetProviderForKind,
  relationshipTypesForSourceKind,
} from "./relationship-registry";

afterEach(() => {
  _resetRelationshipsForTesting();
});

test("relationship types are ordered and matched by either endpoint kind", () => {
  registerRelationshipType({
    id: "ext_epics.issue-part-of-epic",
    extensionId: "ext_epics",
    kind: "comtrya://rel/part-of",
    sourceKinds: ["issue"],
    targetKinds: ["epic"],
    outgoingLabel: "part of epic",
    incomingLabel: "contains issue",
    symmetric: false,
    order: 100,
  });
  registerRelationshipType({
    id: "ext_issues.blocks",
    extensionId: "ext_issues",
    kind: "comtrya://rel/blocks",
    sourceKinds: ["issue"],
    targetKinds: ["issue"],
    outgoingLabel: "blocks",
    incomingLabel: "blocked by",
    symmetric: false,
    order: 10,
  });

  expect(relationshipTypesForSourceKind("issue").map((type) => type.id)).toEqual([
    "ext_issues.blocks",
    "ext_epics.issue-part-of-epic",
  ]);
  expect(relationshipTypesForSourceKind("epic").map((type) => type.id)).toEqual([
    "ext_epics.issue-part-of-epic",
  ]);
});

test("relationship target providers are keyed by resource kind", async () => {
  registerRelationshipTargetProvider({
    id: "ext_epics:relationship-target:epic",
    extensionId: "ext_epics",
    resourceKind: "epic",
    loadTargets: () => [
      {
        ref: "comtrya://epic/epc_1",
        kind: "epic",
        title: "Roadmap",
      },
    ],
  });

  const provider = relationshipTargetProviderForKind("epic");
  if (!provider) throw new Error("epic provider missing");
  expect(provider?.extensionId).toBe("ext_epics");
  const targets = await provider.loadTargets({
    workspaceId: "ws_1",
    currentRef: "comtrya://issue/iss_1",
    currentKind: "issue",
    relationshipType: {
      id: "ext_epics.issue-part-of-epic",
      extensionId: "ext_epics",
      kind: "comtrya://rel/part-of",
      sourceKinds: ["issue"],
      targetKinds: ["epic"],
      outgoingLabel: "part of epic",
      incomingLabel: "contains issue",
      symmetric: false,
      order: 100,
    },
    direction: "outgoing",
    targetKind: "epic",
  });
  expect(targets).toEqual([
    {
      ref: "comtrya://epic/epc_1",
      kind: "epic",
      title: "Roadmap",
    },
  ]);
});

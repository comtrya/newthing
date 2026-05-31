import { widgetsForSlot } from "@comtrya/sdk-core";
import { defineExtensionWidget } from "@comtrya/sdk-vue";

export function assertWorkspaceSdkDepsLinked(): void {
  void widgetsForSlot;
  void defineExtensionWidget;
}

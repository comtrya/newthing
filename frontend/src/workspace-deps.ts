import { widgetsForSlot } from "@comtrya/sdk-core";
import { configurePreactBindings } from "@comtrya/sdk-preact";
import { defineExtensionWidget } from "@comtrya/sdk-vue";

export function assertWorkspaceSdkDepsLinked(): void {
  void widgetsForSlot;
  void configurePreactBindings;
  void defineExtensionWidget;
}

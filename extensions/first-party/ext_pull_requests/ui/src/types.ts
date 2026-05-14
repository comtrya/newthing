export interface ExtensionRouteParams {
  scope?: string;
  routePrefix?: string;
  subPath?: string;
  params?: Record<string, string | undefined>;
}

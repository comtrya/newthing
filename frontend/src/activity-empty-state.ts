export type ActivityStreamStatus = "connecting" | "live" | "idle" | "error";

export interface ActivityEmptyStateInput {
  status: ActivityStreamStatus;
  error: string | null;
  hasSession: boolean;
}

export interface ActivityEmptyStateCopy {
  kind: "error" | "connecting" | "signed-out" | "empty";
  message: string;
}

export function activityEmptyStateCopy(
  input: ActivityEmptyStateInput,
): ActivityEmptyStateCopy {
  if (input.error) {
    return {
      kind: "error",
      message: input.error,
    };
  }
  if (input.status === "connecting") {
    return {
      kind: "connecting",
      message: "Connecting to the live stream...",
    };
  }
  if (input.status === "idle" && !input.hasSession) {
    return {
      kind: "signed-out",
      message:
        "Sign in to see live activity. Recent activity will appear here after events occur.",
    };
  }
  return {
    kind: "empty",
    message: "No activity yet. Open an issue or push a branch to see it appear here.",
  };
}

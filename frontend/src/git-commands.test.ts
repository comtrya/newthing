import { describe, expect, test } from "bun:test";

import {
  buildGitCloneCommand,
  buildGitPushCommand,
  shellQuote,
} from "./git-commands";

describe("git command helpers", () => {
  test("leaves ordinary Git URLs and refspecs readable", () => {
    expect(shellQuote("http://127.0.0.1:4321/git/comtrya/comtrya.git")).toBe(
      "http://127.0.0.1:4321/git/comtrya/comtrya.git",
    );
    expect(buildGitPushCommand("https://example.test/repo.git", "main")).toBe(
      "git push https://example.test/repo.git HEAD:main",
    );
  });

  test("quotes shell-sensitive repository URLs and branch names", () => {
    expect(buildGitCloneCommand("git clone", "https://example.test/a repo.git")).toBe(
      "git clone 'https://example.test/a repo.git'",
    );
    expect(buildGitPushCommand("https://example.test/repo.git", "main; touch pwn")).toBe(
      "git push https://example.test/repo.git 'HEAD:main; touch pwn'",
    );
  });

  test("escapes embedded single quotes", () => {
    expect(shellQuote("feature/rawkode's-branch")).toBe(
      "'feature/rawkode'\\''s-branch'",
    );
  });
});

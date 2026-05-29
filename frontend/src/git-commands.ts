export function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export function buildGitCloneCommand(cloneTool: string, cloneUrl: string): string {
  return cloneUrl ? `${cloneTool} ${shellQuote(cloneUrl)}` : "";
}

export function buildGitPushCommand(cloneUrl: string, branch: string): string {
  return cloneUrl ? `git push ${shellQuote(cloneUrl)} ${shellQuote(`HEAD:${branch}`)}` : "";
}

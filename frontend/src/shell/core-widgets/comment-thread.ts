import type { ComtryaClient } from "../../contracts";
import type { ViewerHandle } from "../../extension-host-sdk/types";

const TAG = "comtrya-comment-thread";

interface CommentRecord {
  id: string;
  target: string;
  parent: string | null;
  authorRef: string;
  bodyMarkdown: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
}

const THREAD_QUERY = `query($target: ResourceURN!) {
  comments.thread(target: $target) {
    id target parent authorRef bodyMarkdown createdAt updatedAt editedAt
  }
}`;

const CREATE_MUTATION = `mutation($input: CreateCommentInput!) {
  comments.create(input: $input) {
    id target parent authorRef bodyMarkdown createdAt updatedAt editedAt
  }
}`;

class ComtryaCommentThread extends HTMLElement {
  /** Resource the thread is attached to, e.g. `comtrya://issue/iss_X`. */
  target?: string;
  comtryaClient?: ComtryaClient;
  viewer?: ViewerHandle;

  private comments: CommentRecord[] = [];

  static get observedAttributes(): string[] {
    return ["target"];
  }

  connectedCallback(): void {
    if (!this.target) {
      const attr = this.getAttribute("target");
      if (attr) this.target = attr;
    }
    void this.refresh();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === "target" && value) {
      this.target = value;
      if (this.isConnected) void this.refresh();
    }
  }

  private async refresh(): Promise<void> {
    if (!this.target) {
      this.replaceChildren(errorBlock("missing target on <comtrya-comment-thread>"));
      return;
    }
    const client = this.comtryaClient ?? findAncestorProperty<ComtryaClient>(this, "comtryaClient");
    if (!client || typeof client.query !== "function") {
      this.replaceChildren(errorBlock("comment thread requires a comtryaClient on an ancestor"));
      return;
    }
    try {
      const data = await client.query<{ comments: { thread: CommentRecord[] } }>(THREAD_QUERY, {
        target: this.target,
      });
      this.comments = (data?.comments?.thread ?? []).slice();
      this.render(client);
    } catch (err) {
      this.replaceChildren(errorBlock(err instanceof Error ? err.message : String(err)));
    }
  }

  private render(client: ComtryaClient): void {
    const target = this.target!;
    const wrap = document.createElement("section");
    wrap.dataset.smoke = "comment-thread";
    wrap.style.cssText = "display: grid; gap: 12px;";

    const header = document.createElement("header");
    header.style.cssText =
      "display: flex; align-items: baseline; justify-content: space-between;";
    const title = document.createElement("h3");
    title.style.cssText = "margin: 0; font-family: var(--display); font-size: 14px;";
    title.textContent = "Discussion";
    const counter = document.createElement("span");
    counter.style.cssText = "font-family: var(--mono, monospace); font-size: 11px; color: var(--ink-faint, #888);";
    counter.textContent = `${this.comments.length} comment${this.comments.length === 1 ? "" : "s"}`;
    header.append(title, counter);
    wrap.append(header);

    const tree = buildTree(this.comments);
    const list = document.createElement("div");
    list.style.cssText = "display: grid; gap: 8px;";
    if (tree.length === 0) {
      const empty = document.createElement("p");
      empty.style.cssText =
        "font-family: var(--mono, monospace); font-size: 12px; color: var(--ink-faint, #888); margin: 0;";
      empty.textContent = "No comments yet.";
      list.append(empty);
    } else {
      for (const node of tree) list.append(renderNode(node, 0, client, target, () => this.refresh()));
    }
    wrap.append(list);

    wrap.append(buildComposer(client, target, null, () => this.refresh(), "Comment"));

    this.replaceChildren(wrap);
  }
}

interface TreeNode {
  comment: CommentRecord;
  children: TreeNode[];
}

function buildTree(comments: CommentRecord[]): TreeNode[] {
  const byRef = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  for (const c of comments) {
    byRef.set(`comtrya://comment/${c.id}`, { comment: c, children: [] });
  }
  for (const c of comments) {
    const node = byRef.get(`comtrya://comment/${c.id}`)!;
    if (c.parent && byRef.has(c.parent)) {
      byRef.get(c.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // children are already in createdAt order because the source list is sorted.
  return roots;
}

function renderNode(
  node: TreeNode,
  depth: number,
  client: ComtryaClient,
  target: string,
  onChange: () => void,
): HTMLElement {
  const wrap = document.createElement("article");
  wrap.dataset.smoke = "comment-node";
  wrap.dataset.commentId = node.comment.id;
  wrap.style.cssText = [
    "padding: 8px 12px",
    "border: 1px solid var(--ink-rule, #d0cfc8)",
    `margin-left: ${depth * 18}px`,
  ].join("; ");

  const meta = document.createElement("div");
  meta.style.cssText =
    "font-family: var(--mono, monospace); font-size: 11px; color: var(--ink-faint, #888); margin-bottom: 4px;";
  const edited = node.comment.editedAt ? " · edited" : "";
  meta.textContent = `${node.comment.authorRef} · ${node.comment.createdAt}${edited}`;

  const body = document.createElement("p");
  body.style.cssText =
    "margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 13px;";
  body.textContent = node.comment.bodyMarkdown;

  wrap.append(meta, body);

  const replyToggle = document.createElement("button");
  replyToggle.type = "button";
  replyToggle.textContent = "Reply";
  replyToggle.style.cssText =
    "margin-top: 6px; padding: 4px 10px; font-family: var(--mono, monospace); font-size: 11px; cursor: pointer;";

  const composerSlot = document.createElement("div");
  composerSlot.style.cssText = "margin-top: 8px;";

  replyToggle.addEventListener("click", () => {
    if (composerSlot.firstChild) {
      composerSlot.replaceChildren();
      return;
    }
    composerSlot.append(
      buildComposer(
        client,
        target,
        `comtrya://comment/${node.comment.id}`,
        () => {
          composerSlot.replaceChildren();
          onChange();
        },
        "Reply",
      ),
    );
  });

  wrap.append(replyToggle, composerSlot);
  for (const child of node.children) {
    wrap.append(renderNode(child, depth + 1, client, target, onChange));
  }
  return wrap;
}

function buildComposer(
  client: ComtryaClient,
  target: string,
  parent: string | null,
  onPosted: () => void,
  label: string,
): HTMLElement {
  const form = document.createElement("form");
  form.dataset.smoke = "comment-composer";
  form.style.cssText = "display: grid; gap: 6px;";

  const input = document.createElement("textarea");
  input.required = true;
  input.rows = parent ? 2 : 3;
  input.placeholder = parent ? "Reply…" : "Add a comment…";
  input.style.cssText =
    "padding: 8px 10px; font-family: var(--mono, monospace); font-size: 12px; border: 1px solid var(--ink-rule, #d0cfc8); background: var(--bg, #fff); color: var(--ink, inherit); resize: vertical;";

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = label;
  submit.style.cssText =
    "padding: 6px 14px; font-family: var(--display); font-weight: 600; cursor: pointer; justify-self: start;";

  const error = document.createElement("p");
  error.setAttribute("role", "alert");
  error.style.cssText =
    "margin: 0; font-family: var(--mono, monospace); font-size: 11px; color: var(--ink-warn, #c2410c); display: none;";

  form.append(input, error, submit);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitComment(input, submit, error, client, target, parent, onPosted);
  });
  return form;
}

async function submitComment(
  input: HTMLTextAreaElement,
  submit: HTMLButtonElement,
  error: HTMLElement,
  client: ComtryaClient,
  target: string,
  parent: string | null,
  onPosted: () => void,
): Promise<void> {
  const body = input.value.trim();
  if (!body) return;
  submit.disabled = true;
  const original = submit.textContent ?? "Comment";
  submit.textContent = "Posting…";
  error.style.display = "none";
  try {
    await client.mutate(CREATE_MUTATION, { input: { target, parent, bodyMarkdown: body } });
    input.value = "";
    onPosted();
  } catch (err) {
    error.textContent = err instanceof Error ? err.message : String(err);
    error.style.display = "block";
  } finally {
    submit.disabled = false;
    submit.textContent = original;
  }
}

function findAncestorProperty<T>(node: HTMLElement, prop: string): T | undefined {
  let cursor: HTMLElement | null = node.parentElement;
  while (cursor) {
    const candidate = (cursor as unknown as Record<string, unknown>)[prop];
    if (candidate !== undefined && candidate !== null) return candidate as T;
    cursor = cursor.parentElement;
  }
  return undefined;
}

function errorBlock(message: string): HTMLElement {
  const wrap = document.createElement("p");
  wrap.setAttribute("role", "alert");
  wrap.style.cssText =
    "padding: 8px 12px; font-family: var(--mono, monospace); font-size: 12px; color: var(--ink-warn, #c2410c);";
  wrap.textContent = `comment thread: ${message}`;
  return wrap;
}

export function defineCommentThread(): void {
  if (!customElements.get(TAG)) {
    customElements.define(TAG, ComtryaCommentThread);
  }
}

export const COMMENT_THREAD_TAG = TAG;

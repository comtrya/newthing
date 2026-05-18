/**
 * `comtrya-comment-thread` custom element — shell-owned.
 *
 * IssueDetail and EpicDetail mount this tag inside their Activity
 * panels but no extension ships a definition for it; until now the
 * element rendered as an empty stub. The element lives in the shell
 * so every detail surface that references it gets a real comment
 * thread without per-extension wiring (iter 50).
 *
 * Reads `target` from an attribute or property (matches the existing
 * call sites). Fetches via the shell's GraphQL client through the
 * existing `comments.thread` and `comments.create` operations. Body
 * markdown is rendered with `@comtrya/sdk-vue::renderMarkdown` —
 * keeps the rendering identical to issue / pull descriptions.
 *
 * No editing or delete UI yet — first-light is "read existing
 * comments + post a new top-level comment". Threads (replies) and
 * edit / delete come in follow-up slices.
 */

import { classifyPrincipal, renderMarkdown } from "@comtrya/sdk-vue";
import { extensionClient } from "../extension-runtime";

export const CORE_COMMENT_THREAD_ELEMENT = "comtrya-comment-thread";

interface Comment {
  id: string;
  target: string;
  parent?: string | null;
  authorRef?: string | null;
  bodyMarkdown?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  editedAt?: string | null;
}

// The shell GraphQL endpoint dispatches by the dotted root field
// (see `extract_root_operation_field` in crates/server). Use the
// flat `comments.thread(...)` / `comments.create(...)` syntax that
// relations.* already uses across the SDK.
const COMMENTS_THREAD_QUERY = `query($target: ResourceURN!) {
  comments.thread(target: $target) { id target parent authorRef bodyMarkdown createdAt }
}`;

const COMMENTS_CREATE_MUTATION = `mutation($input: CommentsCreateInput!) {
  comments.create(input: $input) { id target authorRef bodyMarkdown createdAt }
}`;

const COMMENTS_UPDATE_MUTATION = `mutation($input: CommentsUpdateInput!) {
  comments.update(input: $input) { id target authorRef bodyMarkdown createdAt editedAt }
}`;

const COMMENTS_DELETE_MUTATION = `mutation($input: CommentsDeleteInput!) {
  comments.delete(input: $input)
}`;

function parseInstant(value: string): number {
  // Kernel emits comment timestamps in the `@<seconds>` form (Rust
  // `chrono::DateTime::display` epoch shortcut). Accept that AND
  // regular ISO 8601 so this helper stays useful if/when the kernel
  // switches to ISO across the board.
  if (value.startsWith("@")) {
    const secs = Number.parseFloat(value.slice(1));
    if (Number.isFinite(secs)) return secs * 1000;
  }
  return Date.parse(value);
}

function relativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const then = parseInstant(value);
  if (Number.isNaN(then)) return value;
  const diff = Math.max(0, Date.now() - then);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

// Author rendering reuses the canonical `classifyPrincipal` helper
// the rest of the forge already uses for chip rows (IssueDetail,
// PullsDetail, EpicDetail). That gives every kind — human, agent,
// bot, credential, team — a consistent glyph and tone, so a
// comment from `comtrya://agent/claude-code` reads the same way
// here as it does on issues / pulls.

class ComtryaCommentThread extends HTMLElement {
  /** Set as either an attribute or a JS property — the iter 50 host
   *  call sites stamp both. */
  private _target = "";
  get target(): string {
    return this._target;
  }
  set target(value: string) {
    this._target = value ?? "";
    if (this.isConnected) void this.render();
  }

  static get observedAttributes(): string[] {
    return ["target"];
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === "target") {
      this._target = value ?? "";
      if (this.isConnected) void this.render();
    }
  }

  connectedCallback(): void {
    this.dataset.smoke = "comment-thread";
    void this.render();
  }

  private async render(): Promise<void> {
    const target = this._target || this.getAttribute("target") || "";
    this.replaceChildren();
    if (!target) {
      this.appendChild(emptyState("comment-thread: missing target attribute"));
      return;
    }
    const list = document.createElement("ul");
    list.className = "comment-thread-list";
    this.append(list);

    const status = document.createElement("p");
    status.className = "comment-thread-status muted";
    status.textContent = "Loading comments…";
    this.append(status);

    const host = this;
    this.append(buildComposer(target, async (body) => {
      const created = await host.postComment(target, body);
      if (created) {
        appendCommentRow(list, created, host);
        // Status reverts to empty if the list now has entries
        status.remove();
      }
      return created !== null;
    }));

    const client = extensionClient();
    if (!client) {
      status.textContent = "comment-thread: GraphQL client not available";
      status.classList.add("warn");
      return;
    }
    try {
      const data = await client.query<{
        comments?: { thread?: Comment[] | null } | null;
      }>(COMMENTS_THREAD_QUERY, { target });
      // Server response shape: { data: { comments: { thread: [...] } } }.
      // The client unwraps `data` for us; we still need both nesting
      // levels because the dispatcher emits the same object shape the
      // dotted GraphQL field would have produced.
      const comments = data.comments?.thread ?? [];
      if (comments.length === 0) {
        status.textContent = "No comments yet. Start the thread below.";
        return;
      }
      status.remove();
      for (const comment of comments) appendCommentRow(list, comment, this);
    } catch (err) {
      status.textContent = `Failed to load comments: ${err instanceof Error ? err.message : String(err)}`;
      status.classList.add("warn");
    }
  }

  private async postComment(target: string, bodyMarkdown: string): Promise<Comment | null> {
    const client = extensionClient();
    if (!client) return null;
    try {
      const data = await client.mutate<{
        comments?: { create?: Comment | null } | null;
      }>(COMMENTS_CREATE_MUTATION, {
        input: { target, bodyMarkdown },
      });
      return data.comments?.create ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Server-side edit. Returns the updated comment for in-place
   * row replacement on success, `null` on failure.
   */
  async updateComment(id: string, bodyMarkdown: string): Promise<Comment | null> {
    const client = extensionClient();
    if (!client) return null;
    try {
      const data = await client.mutate<{
        comments?: { update?: Comment | null } | null;
      }>(COMMENTS_UPDATE_MUTATION, {
        input: { id, bodyMarkdown },
      });
      return data.comments?.update ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Idempotent delete — kernel returns `was-absent` on a missing id.
   * We trust the mutation result and remove the row optimistically.
   */
  async deleteComment(id: string): Promise<boolean> {
    const client = extensionClient();
    if (!client) return false;
    try {
      await client.mutate(COMMENTS_DELETE_MUTATION, { input: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

function emptyState(message: string): HTMLElement {
  const p = document.createElement("p");
  p.className = "comment-thread-status muted";
  p.textContent = message;
  return p;
}

function appendCommentRow(
  list: HTMLElement,
  comment: Comment,
  host: ComtryaCommentThread,
): void {
  const li = document.createElement("li");
  li.className = "comment-row";
  li.dataset.commentId = comment.id;

  const classification = classifyPrincipal(comment.authorRef);
  li.dataset.authorKind = classification.kind;

  const meta = document.createElement("header");
  meta.className = "comment-meta";

  const author = document.createElement("span");
  author.className = "comment-author";
  author.dataset.authorKind = classification.kind;
  author.title = comment.authorRef ?? classification.label;
  const glyph = document.createElement("span");
  glyph.className = "comment-author-glyph";
  glyph.setAttribute("aria-hidden", "true");
  glyph.textContent = classification.glyph;
  const name = document.createElement("strong");
  name.textContent = classification.label;
  author.append(glyph, name);
  meta.append(author);

  if (classification.kind !== "human" && classification.kind !== "unknown") {
    const badge = document.createElement("span");
    badge.className = "comment-author-badge";
    badge.textContent = classification.kind;
    meta.append(badge);
  }

  if (comment.createdAt) {
    const time = document.createElement("time");
    time.dateTime = comment.createdAt;
    time.textContent = relativeTime(comment.createdAt);
    time.title = comment.createdAt;
    meta.append(time);
  }
  if (comment.editedAt) {
    const edited = document.createElement("span");
    edited.className = "comment-edited-marker";
    edited.textContent = "edited";
    edited.title = `Edited at ${comment.editedAt}`;
    meta.append(edited);
  }

  const actions = document.createElement("span");
  actions.className = "comment-actions";
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "comment-action";
  editBtn.dataset.smoke = "comment-action-edit";
  editBtn.textContent = "edit";
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "comment-action";
  deleteBtn.dataset.smoke = "comment-action-delete";
  deleteBtn.textContent = "delete";
  actions.append(editBtn, deleteBtn);
  meta.append(actions);
  li.append(meta);

  let currentBody = comment.bodyMarkdown ?? "";
  const body = document.createElement("div");
  body.className = "comment-body prose";
  body.innerHTML = renderMarkdown(currentBody);
  li.append(body);

  editBtn.addEventListener("click", () => {
    enterEditMode(li, body, currentBody, async (next) => {
      const updated = await host.updateComment(comment.id, next);
      if (!updated) return false;
      currentBody = updated.bodyMarkdown ?? next;
      body.innerHTML = renderMarkdown(currentBody);
      if (updated.editedAt && !meta.querySelector(".comment-edited-marker")) {
        const edited = document.createElement("span");
        edited.className = "comment-edited-marker";
        edited.textContent = "edited";
        edited.title = `Edited at ${updated.editedAt}`;
        actions.before(edited);
      }
      return true;
    });
  });

  deleteBtn.addEventListener("click", async () => {
    if (!window.confirm("Delete this comment?")) return;
    const ok = await host.deleteComment(comment.id);
    if (ok) li.remove();
  });

  list.append(li);
}

function enterEditMode(
  li: HTMLElement,
  body: HTMLElement,
  originalMarkdown: string,
  save: (next: string) => Promise<boolean>,
): void {
  if (li.dataset.editing === "true") return;
  li.dataset.editing = "true";
  const textarea = document.createElement("textarea");
  textarea.className = "comment-edit-textarea";
  textarea.rows = Math.max(3, originalMarkdown.split("\n").length);
  textarea.value = originalMarkdown;

  const controls = document.createElement("div");
  controls.className = "comment-edit-controls";
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "Save";
  saveBtn.className = "comment-edit-save";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "comment-edit-cancel";
  controls.append(saveBtn, cancelBtn);

  body.replaceWith(textarea, controls);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  const restoreBody = (markdown: string): void => {
    body.innerHTML = renderMarkdown(markdown);
    controls.replaceWith(body);
    textarea.remove();
    delete li.dataset.editing;
  };

  cancelBtn.addEventListener("click", () => restoreBody(originalMarkdown));

  saveBtn.addEventListener("click", async () => {
    const next = textarea.value.trim();
    if (next.length === 0 || next === originalMarkdown) {
      restoreBody(originalMarkdown);
      return;
    }
    saveBtn.disabled = true;
    const ok = await save(next);
    saveBtn.disabled = false;
    if (!ok) {
      saveBtn.textContent = "Save (retry)";
      return;
    }
    // body's innerHTML was updated by `save`; remove the editor
    controls.replaceWith(body);
    textarea.remove();
    delete li.dataset.editing;
  });

  // Cmd/Ctrl-Enter to save while editing — same chord as the
  // composer. Plain Enter keeps newline behaviour.
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      restoreBody(originalMarkdown);
      return;
    }
    if (event.key !== "Enter") return;
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    saveBtn.click();
  });
}

function buildComposer(
  _target: string,
  submit: (body: string) => Promise<boolean>,
): HTMLElement {
  const form = document.createElement("form");
  form.className = "comment-composer";
  form.setAttribute("data-smoke", "comment-thread-composer");
  const textarea = document.createElement("textarea");
  textarea.placeholder = "Write a comment… (⌘↵ to post)";
  textarea.rows = 3;
  textarea.required = true;
  form.append(textarea);

  const actions = document.createElement("div");
  actions.className = "comment-composer-actions";
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Comment";
  actions.append(button);
  const hint = document.createElement("span");
  hint.className = "comment-composer-hint muted";
  hint.append(kbdNode("⌘"), document.createTextNode("·"), kbdNode("↵"));
  const hintLabel = document.createElement("span");
  hintLabel.textContent = " to post";
  hint.append(hintLabel);
  actions.append(hint);
  const status = document.createElement("span");
  status.className = "comment-composer-status muted";
  actions.append(status);
  form.append(actions);

  const handleSubmit = async (): Promise<void> => {
    const body = textarea.value.trim();
    if (!body) return;
    button.disabled = true;
    status.textContent = "Posting…";
    status.classList.remove("warn");
    const ok = await submit(body);
    button.disabled = false;
    if (ok) {
      textarea.value = "";
      status.textContent = "";
    } else {
      status.textContent = "Failed to post.";
      status.classList.add("warn");
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void handleSubmit();
  });

  // Cmd/Ctrl+Enter submits without reaching for the button — the
  // Linear/GitHub-conventional shortcut for comment composers.
  // Plain Enter keeps newline behaviour so multi-paragraph comments
  // are still ergonomic.
  textarea.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    void handleSubmit();
  });

  return form;
}

function kbdNode(label: string): HTMLElement {
  const kbd = document.createElement("kbd");
  kbd.textContent = label;
  return kbd;
}

export function defineCoreCommentThread(): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(CORE_COMMENT_THREAD_ELEMENT)) return;
  customElements.define(CORE_COMMENT_THREAD_ELEMENT, ComtryaCommentThread);
}

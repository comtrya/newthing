<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";
import {
  type GitPersonalAccessToken,
  createGitPersonalAccessToken,
  listGitPersonalAccessTokens,
  revokeGitPersonalAccessToken,
} from "../account-api";

const tokens = ref<GitPersonalAccessToken[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Create-form state.
const formName = ref("");
const formScopeRead = ref(true);
const formScopeWrite = ref(false);
const formExpiresInDays = ref(90);
const submitting = ref(false);
const formError = ref<string | null>(null);

// One-shot plaintext token to surface to the user after a successful create.
// Cleared when the user dismisses the panel.
const justMinted = ref<{ token: string; record: GitPersonalAccessToken } | null>(null);
const copied = ref(false);

const canSubmit = computed(
  () =>
    !submitting.value &&
    formName.value.trim().length > 0 &&
    formName.value.trim().length <= 80 &&
    (formScopeRead.value || formScopeWrite.value) &&
    formExpiresInDays.value > 0 &&
    formExpiresInDays.value <= 365,
);

async function refresh(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    tokens.value = await listGitPersonalAccessTokens();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    loading.value = false;
  }
}

async function submit(): Promise<void> {
  if (!canSubmit.value) return;
  submitting.value = true;
  formError.value = null;
  try {
    const scopes: string[] = [];
    if (formScopeRead.value) scopes.push("git:read");
    if (formScopeWrite.value) scopes.push("git:write");
    const result = await createGitPersonalAccessToken({
      name: formName.value.trim(),
      scopes,
      expiresInDays: formExpiresInDays.value,
    });
    justMinted.value = { token: result.token, record: result.record };
    // Reset form so the next mint starts clean. The plaintext token
    // stays in `justMinted` until the user dismisses it.
    formName.value = "";
    formScopeRead.value = true;
    formScopeWrite.value = false;
    formExpiresInDays.value = 90;
    await refresh();
  } catch (caught) {
    formError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    submitting.value = false;
  }
}

async function revoke(token: GitPersonalAccessToken): Promise<void> {
  const ok = window.confirm(
    `Revoke "${token.name}"? The token will stop working immediately for every git operation.`,
  );
  if (!ok) return;
  error.value = null;
  try {
    await revokeGitPersonalAccessToken(token.id);
    await refresh();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}

async function copyToken(): Promise<void> {
  if (!justMinted.value) return;
  try {
    await navigator.clipboard.writeText(justMinted.value.token);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    // clipboard API may be unavailable on non-HTTPS or restricted
    // contexts. The user can still select the text manually.
  }
}

function dismissJustMinted(): void {
  justMinted.value = null;
  copied.value = false;
}

function formatUnix(ts: number | null | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString();
  } catch {
    return String(ts);
  }
}

function tokenStatus(token: GitPersonalAccessToken): { label: string; tone: "ok" | "warn" | "err" } {
  if (token.revokedAt) return { label: "revoked", tone: "err" };
  if (token.expiresAt && token.expiresAt < Math.floor(Date.now() / 1000)) {
    return { label: "expired", tone: "err" };
  }
  return { label: "active", tone: "ok" };
}

onMounted(() => {
  void refresh();
});
</script>

<template>
  <div class="admin-screen" data-smoke="account-git-tokens">
    <div class="admin-content no-scrollbar">
      <div class="page-header">
        <div>
          <div class="eyebrow" style="margin-bottom: 6px">Account · Git credentials</div>
          <h1 class="serif">Personal access tokens</h1>
          <div class="subline">
            Mint a token for HTTP git push or git fetch. Tokens are stored
            argon2id-hashed; only the prefix is recoverable after creation. SSH key
            management ships alongside the SSH transport — see issue #219.
          </div>
        </div>
        <div class="spacer" />
        <button class="btn" type="button" :disabled="loading" @click="refresh">
          <Icon name="retry" /><span>{{ loading ? "Refreshing" : "Refresh" }}</span>
        </button>
      </div>

      <div v-if="error" class="glass error-panel">
        <Icon name="x" />
        <span>{{ error }}</span>
      </div>

      <div v-if="justMinted" class="glass just-minted">
        <div class="section-hd">
          <div class="section-hd-title">New token: {{ justMinted.record.name }}</div>
          <div class="section-hd-sub">
            Copy this now. The plaintext will not be shown again.
          </div>
          <div class="spacer" />
          <button class="btn" type="button" @click="copyToken">
            <Icon name="copy" /><span>{{ copied ? "Copied" : "Copy" }}</span>
          </button>
          <button class="btn" type="button" @click="dismissJustMinted">
            <Icon name="x" /><span>Dismiss</span>
          </button>
        </div>
        <pre class="mono token-blob">{{ justMinted.token }}</pre>
        <div class="kv-list">
          <div>
            <span>scopes</span>
            <strong class="mono">{{ justMinted.record.scopes.join(", ") }}</strong>
          </div>
          <div>
            <span>expires</span>
            <strong class="mono">{{ formatUnix(justMinted.record.expiresAt) }}</strong>
          </div>
          <div>
            <span>prefix</span>
            <strong class="mono">{{ justMinted.record.tokenPrefix }}</strong>
          </div>
        </div>
      </div>

      <div class="glass" style="margin-bottom: 16px">
        <div class="section-hd">
          <div class="section-hd-title">Mint a new token</div>
          <div class="section-hd-sub">
            Token name is shown only to you; pick something that identifies the
            machine or CI runner using it.
          </div>
        </div>
        <form class="form-panel" @submit.prevent="submit">
          <label>
            <span>Name</span>
            <input
              v-model="formName"
              type="text"
              maxlength="80"
              placeholder="e.g. laptop-2026 or ci-builder"
              required
            />
          </label>
          <fieldset class="scope-fieldset">
            <legend>Scopes</legend>
            <label class="checkbox">
              <input v-model="formScopeRead" type="checkbox" />
              <span class="mono">git:read</span>
              <span class="hint">git fetch / clone</span>
            </label>
            <label class="checkbox">
              <input v-model="formScopeWrite" type="checkbox" />
              <span class="mono">git:write</span>
              <span class="hint">git push (writes also imply read)</span>
            </label>
          </fieldset>
          <label>
            <span>Expires in (days)</span>
            <input
              v-model.number="formExpiresInDays"
              type="number"
              min="1"
              max="365"
              required
            />
          </label>
          <div v-if="formError" class="error-inline">{{ formError }}</div>
          <button class="btn primary" type="submit" :disabled="!canSubmit">
            <Icon name="plus" /><span>{{ submitting ? "Minting..." : "Mint token" }}</span>
          </button>
        </form>
      </div>

      <div class="glass">
        <div class="section-hd">
          <div class="section-hd-title">Existing tokens</div>
          <div class="section-hd-sub">
            <template v-if="tokens.length">
              {{ tokens.length }} token{{ tokens.length === 1 ? "" : "s" }}
            </template>
            <template v-else-if="loading">Loading…</template>
            <template v-else>No tokens yet.</template>
          </div>
        </div>
        <div v-if="tokens.length" class="token-table">
          <div class="token-row token-row-hd">
            <span>Name</span>
            <span>Scopes</span>
            <span>Status</span>
            <span>Expires</span>
            <span>Last used</span>
            <span>Created</span>
            <span></span>
          </div>
          <div
            v-for="token in tokens"
            :key="token.id"
            class="token-row"
            :data-status="tokenStatus(token).label"
          >
            <div>
              <div class="token-name">{{ token.name }}</div>
              <div class="mono hint">{{ token.tokenPrefix }}…</div>
            </div>
            <div class="scope-chips">
              <Chip
                v-for="scope in token.scopes"
                :key="scope"
                mono
                tone="info"
              >{{ scope }}</Chip>
            </div>
            <div><Chip :tone="tokenStatus(token).tone">{{ tokenStatus(token).label }}</Chip></div>
            <div class="mono">{{ formatUnix(token.expiresAt) }}</div>
            <div class="mono">{{ formatUnix(token.lastUsedAt) }}</div>
            <div class="mono">{{ formatUnix(token.createdAt) }}</div>
            <div>
              <button
                v-if="!token.revokedAt"
                class="btn danger"
                type="button"
                @click="revoke(token)"
              >
                <Icon name="x" /><span>Revoke</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-screen {
  display: grid;
  grid-template-rows: 1fr;
  height: 100%;
}
.admin-content {
  padding: 24px;
  overflow-y: auto;
}
.page-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}
.page-header .subline {
  max-width: 65ch;
  color: var(--fg-muted);
  margin-top: 6px;
}
.spacer {
  flex: 1;
}
.section-hd {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.section-hd-title {
  font-weight: 600;
}
.section-hd-sub {
  color: var(--fg-muted);
}
.error-panel {
  margin-bottom: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--err);
}
.error-inline {
  color: var(--err);
  font-size: 0.9em;
  margin-top: 4px;
}
.form-panel {
  display: grid;
  gap: 12px;
  padding: 16px;
}
.form-panel label {
  display: grid;
  gap: 4px;
}
.form-panel label > span:first-child {
  font-weight: 500;
}
.form-panel input[type="text"],
.form-panel input[type="number"] {
  font: inherit;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
}
.scope-fieldset {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 12px 12px;
  display: grid;
  gap: 6px;
}
.scope-fieldset legend {
  padding: 0 4px;
  font-weight: 500;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}
.checkbox .hint {
  color: var(--fg-muted);
  font-size: 0.9em;
}
.kv-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 16px;
  padding: 12px 16px;
}
.kv-list > div {
  display: contents;
}
.kv-list > div > span {
  color: var(--fg-muted);
}
.just-minted {
  border-left: 4px solid var(--accent);
  margin-bottom: 16px;
}
.token-blob {
  margin: 12px 16px;
  padding: 12px;
  background: var(--bg-2, var(--bg));
  border: 1px solid var(--border);
  border-radius: 6px;
  word-break: break-all;
  white-space: pre-wrap;
  user-select: all;
}
.token-table {
  display: grid;
  gap: 0;
}
.token-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 0.6fr 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.token-row:last-child {
  border-bottom: none;
}
.token-row-hd {
  font-weight: 600;
  background: var(--bg-2, transparent);
  color: var(--fg-muted);
  text-transform: uppercase;
  font-size: 0.8em;
  letter-spacing: 0.05em;
}
.token-row[data-status="revoked"],
.token-row[data-status="expired"] {
  opacity: 0.6;
}
.token-name {
  font-weight: 500;
}
.scope-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.btn.primary {
  background: var(--accent);
  color: var(--bg);
}
.btn.danger {
  color: var(--err);
}
.hint {
  color: var(--fg-muted);
}
</style>

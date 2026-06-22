<script setup lang="ts">
import { onMounted, ref } from "vue";
import AccountNav from "../components/AccountNav.vue";
import Chip from "../components/Chip.vue";
import Icon from "../components/Icon.vue";
import { getSessionToken } from "@comtrya/sdk-core";

async function accountAuthHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getSessionToken();
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
}

interface SshPublicKey {
  id: string;
  ownerPrincipalUri: string;
  name: string;
  publicKey: string;
  keyType: string;
  fingerprint: string;
  createdAt: number;
  lastUsedAt: number | null;
  removedAt: number | null;
}

const keys = ref<SshPublicKey[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const formName = ref("");
const formKey = ref("");
const submitting = ref(false);
const formError = ref<string | null>(null);

const removePrompt = ref<SshPublicKey | null>(null);
const removeBusy = ref(false);

async function refresh(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch("/api/account/ssh-keys", {
      credentials: "include",
      headers: await accountAuthHeaders({ Accept: "application/json" }),
    });
    const body = (await response.json()) as { sshPublicKeys?: SshPublicKey[]; errors?: Array<{ message?: string }> };
    if (!response.ok || body.errors?.length) {
      throw new Error(body.errors?.[0]?.message ?? `request failed (${response.status})`);
    }
    keys.value = body.sshPublicKeys ?? [];
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    loading.value = false;
  }
}

async function submit(): Promise<void> {
  const name = formName.value.trim();
  const publicKey = formKey.value.trim();
  if (!name || !publicKey) return;
  submitting.value = true;
  formError.value = null;
  try {
    const response = await fetch("/api/account/ssh-keys", {
      method: "POST",
      credentials: "include",
      headers: await accountAuthHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
      body: JSON.stringify({ name, publicKey }),
    });
    const body = (await response.json()) as { sshPublicKey?: SshPublicKey; errors?: Array<{ message?: string }> };
    if (!response.ok || body.errors?.length) {
      throw new Error(body.errors?.[0]?.message ?? `request failed (${response.status})`);
    }
    formName.value = "";
    formKey.value = "";
    await refresh();
  } catch (caught) {
    formError.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    submitting.value = false;
  }
}

function askRemove(key: SshPublicKey): void {
  removePrompt.value = key;
}

function cancelRemove(): void {
  removePrompt.value = null;
}

async function confirmRemove(): Promise<void> {
  const target = removePrompt.value;
  if (!target || removeBusy.value) return;
  removeBusy.value = true;
  error.value = null;
  try {
    const response = await fetch(`/api/account/ssh-keys/${encodeURIComponent(target.id)}`, {
      method: "DELETE",
      credentials: "include",
      headers: await accountAuthHeaders({ Accept: "application/json" }),
    });
    const body = (await response.json().catch(() => null)) as { removed?: boolean; errors?: Array<{ message?: string }> } | null;
    if (!response.ok || body?.errors?.length) {
      throw new Error(body?.errors?.[0]?.message ?? `request failed (${response.status})`);
    }
    removePrompt.value = null;
    await refresh();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    removeBusy.value = false;
  }
}

function formatUnix(ts: number | null | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString();
  } catch {
    return String(ts);
  }
}

function formatLastUsed(ts: number | null | undefined): string {
  return ts ? formatUnix(ts) : "Never used";
}

onMounted(() => {
  void refresh();
});
</script>

<template>
  <div class="admin-screen" data-smoke="account-ssh-keys">
    <div class="admin-content no-scrollbar">
      <div class="page-header">
        <div>
          <div class="eyebrow" style="margin-bottom: 6px">Account</div>
          <h1 class="serif">Credentials</h1>
          <div class="subline">
            Manage your personal access tokens for HTTP Git operations and SSH keys for
            Git over SSH.
          </div>
        </div>
        <div class="spacer" />
        <button class="btn" type="button" :disabled="loading" @click="refresh">
          <Icon name="retry" /><span>{{ loading ? "Refreshing" : "Refresh" }}</span>
        </button>
      </div>

      <AccountNav />

      <div v-if="error" class="glass error-panel">
        <Icon name="x" />
        <span>{{ error }}</span>
      </div>

      <div v-if="removePrompt" class="glass revoke-confirm">
        <div class="section-hd">
          <div class="section-hd-title">Delete SSH key "{{ removePrompt.name }}"?</div>
          <div class="section-hd-sub">
            Fingerprint {{ removePrompt.fingerprint }}. This key will no longer be able to
            authenticate Git over SSH.
          </div>
          <div class="spacer" />
          <button class="btn" type="button" :disabled="removeBusy" @click="cancelRemove">
            <span>Cancel</span>
          </button>
          <button class="btn danger" type="button" :disabled="removeBusy" @click="confirmRemove" data-smoke="remove-confirm-yes">
            <Icon name="x" /><span>{{ removeBusy ? "Deleting…" : "Delete SSH key" }}</span>
          </button>
        </div>
      </div>

      <div class="glass" style="margin-bottom: 16px">
        <div class="section-hd">
          <div class="section-hd-title">Add new SSH key</div>
          <div class="section-hd-sub">Paste a public key in OpenSSH format.</div>
        </div>
        <form class="form-panel" @submit.prevent="submit">
          <label>
            <span>Title</span>
            <input v-model="formName" type="text" maxlength="80" placeholder="e.g. laptop-2026" required />
          </label>
          <label>
            <span>Key</span>
            <textarea
              v-model="formKey"
              rows="3"
              class="mono"
              placeholder="ssh-ed25519 AAAA... user@host"
              required
            />
          </label>
          <div v-if="formError" class="error-inline">{{ formError }}</div>
          <button class="btn primary" type="submit" :disabled="submitting || !formName.trim() || !formKey.trim()">
            <Icon name="plus" /><span>{{ submitting ? "Adding…" : "Add SSH key" }}</span>
          </button>
        </form>
      </div>

      <div class="glass">
        <div class="section-hd">
          <div class="section-hd-title">SSH keys</div>
          <div class="section-hd-sub">
            <template v-if="keys.length">{{ keys.length }} SSH key{{ keys.length === 1 ? "" : "s" }}</template>
            <template v-else-if="loading">Loading…</template>
            <template v-else>There are no SSH keys associated with your account.</template>
          </div>
        </div>
        <div v-if="keys.length" class="key-table">
          <div class="key-row key-row-hd">
            <span>Title</span>
            <span>Type</span>
            <span>Fingerprint</span>
            <span>Added</span>
            <span>Last used</span>
            <span></span>
          </div>
          <div v-for="key in keys" :key="key.id" class="key-row">
            <div class="key-name">{{ key.name }}</div>
            <div><Chip mono tone="info">{{ key.keyType }}</Chip></div>
            <div class="mono fingerprint">{{ key.fingerprint }}</div>
            <div class="mono">{{ formatUnix(key.createdAt) }}</div>
            <div class="mono">{{ formatLastUsed(key.lastUsedAt) }}</div>
            <div>
              <button class="btn danger" type="button" @click="askRemove(key)">
                <Icon name="x" /><span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-screen { display: grid; grid-template-rows: 1fr; height: 100%; }
.admin-content { padding: 24px; overflow-y: auto; }
.page-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
.page-header .subline { max-width: 65ch; color: var(--fg-muted); margin-top: 6px; }
.spacer { flex: 1; }
.section-hd { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.section-hd-title { font-weight: 600; }
.section-hd-sub { color: var(--fg-muted); }
.error-panel { margin-bottom: 16px; padding: 12px 16px; display: flex; align-items: center; gap: 8px; color: var(--err); }
.error-inline { color: var(--err); font-size: 0.9em; }
.form-panel { display: grid; gap: 12px; padding: 16px; }
.form-panel label { display: grid; gap: 4px; }
.form-panel label > span:first-child { font-weight: 500; }
.form-panel input, .form-panel textarea {
  font: inherit; padding: 8px 10px; border-radius: 6px;
  border: 1px solid var(--border); background: var(--bg); color: var(--fg);
  resize: vertical;
}
.revoke-confirm { border-left: 4px solid var(--err); margin-bottom: 16px; }
.key-table { display: grid; }
.key-row { display: grid; grid-template-columns: 1.4fr 1fr 2fr 1fr 1fr auto; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.key-row:last-child { border-bottom: none; }
.key-row-hd { font-weight: 600; background: var(--bg-2, transparent); color: var(--fg-muted); text-transform: uppercase; font-size: 0.8em; letter-spacing: 0.05em; }
.key-name { font-weight: 500; }
.fingerprint { font-size: 0.85em; word-break: break-all; }
.btn.primary { background: var(--accent); color: var(--bg); }
.btn.danger { color: var(--err); }
</style>

<script setup lang="ts">
import { computed, ref } from "vue";

interface CreateRepositoryPayload {
  createRepository?: {
    repository?: {
      id: string;
      path: string;
    };
  };
}

const CREATE_REPOSITORY_MUTATION = `mutation ShellCreateRepository($input: CreateRepositoryInput!) {
  createRepository(input: $input) { repository { id path } }
}`;

const path = ref("");
const cloneFromUrl = ref("");
const submitState = ref<"idle" | "submitting">("idle");
const error = ref<string | null>(null);
const isImport = computed(() => cloneFromUrl.value.trim().length > 0);
const pageTitle = computed(() => (isImport.value ? "Import repository" : "Create a new repository"));
const submitLabel = computed(() => {
  if (submitState.value === "submitting") return isImport.value ? "Importing..." : "Creating...";
  return isImport.value ? "Import repository" : "Create repository";
});

async function submit(): Promise<void> {
  const requestedPath = path.value.trim();
  if (!requestedPath) {
    error.value = "path is required";
    return;
  }

  submitState.value = "submitting";
  error.value = null;
  try {
    const input: Record<string, string> = { path: requestedPath };
    const cloneUrl = cloneFromUrl.value.trim();
    if (cloneUrl) input.cloneFromUrl = cloneUrl;
    const response = await fetch("/graphql", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: CREATE_REPOSITORY_MUTATION,
        variables: { input },
      }),
    });
    const envelope = (await response.json()) as {
      data?: CreateRepositoryPayload;
      errors?: Array<{ message?: string }>;
    };
    if (!response.ok || envelope.errors?.length) {
      throw new Error(envelope.errors?.[0]?.message ?? `request failed (${response.status})`);
    }
    const createdPath = envelope.data?.createRepository?.repository?.path ?? requestedPath;
    window.location.assign(`/r/${createdPath}`);
  } catch (caught) {
    submitState.value = "idle";
    error.value = caught instanceof Error ? caught.message : String(caught);
  }
}
</script>

<template>
  <div data-smoke="new-repo-shell">
    <section class="page-header new-repo-header" data-smoke="new-repo-header">
      <div class="title-group">
        <span class="overline new-repo-kicker">Workspace</span>
        <h1 class="new-repo-title">{{ pageTitle }}</h1>
      </div>
      <div class="summary-grid" aria-label="New repository summary">
        <div>
          <span>Path</span>
          <strong>required</strong>
        </div>
        <div>
          <span>Import</span>
          <strong>optional</strong>
        </div>
        <div>
          <span>Groups</span>
          <strong>nested</strong>
        </div>
      </div>
    </section>

    <section class="form-panel">
      <form data-smoke="new-repo-form" @submit.prevent="submit">
        <label>
          <span>Path</span>
          <input
            v-model="path"
            name="path"
            autocomplete="off"
            spellcheck="false"
            required
            placeholder="rawkode/hello/rawkode"
          />
          <small>Slash-separated. Each segment: lowercase a-z, 0-9, dash, underscore, dot.</small>
        </label>

        <label>
          <span>Import from URL</span>
          <input
            v-model="cloneFromUrl"
            name="cloneFromUrl"
            autocomplete="off"
            spellcheck="false"
            type="url"
            placeholder="https://github.com/owner/repo.git (optional)"
          />
          <small>Optional. Accepts http://, https://, git://, file://. Leave blank to start an empty repo.</small>
        </label>

        <p v-if="error" class="form-error" role="alert">{{ error }}</p>

        <div class="form-actions">
          <button type="submit" :disabled="submitState === 'submitting'">{{ submitLabel }}</button>
          <RouterLink to="/">Cancel</RouterLink>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.new-repo-header .new-repo-kicker {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.new-repo-header .new-repo-title {
  font-family: var(--font-sans);
  font-size: 32px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.25;
}
</style>

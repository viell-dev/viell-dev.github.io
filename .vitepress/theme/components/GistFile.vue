<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from "vue";

import { highlightCode, isMarkdownFile, renderMarkdown } from "../gist";

const props = defineProps<{
  /** Gist id, e.g. "403b3a9b6b52156e5d65a13279d7f637". */
  id: string;
  /** Filename within the gist. */
  file: string;
  /** Gist owner; defaults to the site author. */
  user?: string;
}>();

type RenderMode = "plain" | "markdown" | "code";

const user = computed(() => props.user ?? "viell-dev");
const gistUrl = computed(
  () => `https://gist.github.com/${user.value}/${props.id}`,
);
const rawUrl = computed(
  () =>
    `https://gist.githubusercontent.com/${user.value}/${props.id}/raw/${encodeURIComponent(props.file)}`,
);

const collapsedHeight = 480;
const collapsedMaxHeight = `${collapsedHeight}px`;

const loading = ref(true);
const error = ref<string | null>(null);
const fileContent = ref<string | null>(null);
const mode = ref<RenderMode>("plain");
const renderedHtml = ref("");
const expanded = ref(false);
const overflowing = ref(false);

const rootEl = ref<HTMLElement | null>(null);
const contentEl = ref<HTMLElement | null>(null);
const bodyId = useId();

let observer: ResizeObserver | undefined;

onMounted(() => {
  // The content element keeps its natural height even while the body is
  // clipped, so its size tells whether the collapsed view would scroll.
  observer = new ResizeObserver(() => {
    overflowing.value = (contentEl.value?.offsetHeight ?? 0) > collapsedHeight;
  });
  if (contentEl.value) {
    observer.observe(contentEl.value);
  }
});

onUnmounted(() => observer?.disconnect());

async function toggle() {
  expanded.value = !expanded.value;
  if (!expanded.value) {
    // Collapsing shrinks the page; keep the frame in view.
    await nextTick();
    rootEl.value?.scrollIntoView({ block: "nearest" });
  }
}

onMounted(async () => {
  try {
    const response = await fetch(rawUrl.value);
    if (!response.ok) {
      throw new Error(`Raw gist fetch responded with ${response.status}`);
    }
    const content = await response.text();
    fileContent.value = content;
    try {
      if (isMarkdownFile(props.file)) {
        renderedHtml.value = await renderMarkdown(content);
        mode.value = "markdown";
      } else {
        const highlighted = await highlightCode(props.file, content);
        if (highlighted !== null) {
          renderedHtml.value = highlighted;
          mode.value = "code";
        }
      }
    } catch {
      // Rendering is best-effort; the plain view already has the content.
      mode.value = "plain";
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    loading.value = false;
  }
});

function download() {
  if (fileContent.value === null) {
    return;
  }
  const blob = new Blob([fileContent.value], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = props.file;
  anchor.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <figure ref="rootEl" class="gist-file">
    <figcaption class="gist-header">
      <a class="gist-filename" :href="gistUrl" target="_blank" rel="noopener">
        {{ props.file }}
      </a>
      <div class="gist-actions">
        <button
          v-if="fileContent !== null && overflowing"
          class="gist-button"
          type="button"
          :aria-expanded="expanded"
          :aria-controls="bodyId"
          @click="toggle"
        >
          {{ expanded ? "Collapse" : "Expand" }}
        </button>
        <button
          v-if="fileContent !== null"
          class="gist-button"
          type="button"
          @click="download"
        >
          Download
        </button>
      </div>
    </figcaption>
    <div :id="bodyId" class="gist-body" :class="{ expanded }">
      <div ref="contentEl" class="gist-content">
        <p v-if="loading" class="gist-status">Loading gist…</p>
        <p v-else-if="error" class="gist-status gist-error">
          Failed to load gist: {{ error }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html -- markdown-it output with html disabled -->
        <div
          v-else-if="mode === 'markdown'"
          class="vp-doc gist-markdown"
          v-html="renderedHtml"
        ></div>
        <div
          v-else-if="mode === 'code'"
          class="gist-code"
          v-html="renderedHtml"
        ></div>
        <pre v-else-if="fileContent !== null" class="gist-plain"><code>{{
          fileContent
        }}</code></pre>
      </div>
    </div>
  </figure>
</template>

<style scoped>
.gist-file {
  margin: 16px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.gist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
}

.gist-filename {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.gist-filename:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.gist-actions {
  display: flex;
  flex: none;
  gap: 8px;
}

.gist-button {
  padding: 2px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg);
  transition:
    color 0.25s,
    border-color 0.25s;
}

.gist-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.gist-body {
  max-height: v-bind(collapsedMaxHeight);
  overflow: auto;
}

.gist-body.expanded {
  max-height: none;
}

.gist-status {
  margin: 0;
  padding: 16px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.gist-error {
  color: var(--vp-c-danger-1);
}

.gist-markdown {
  padding: 16px 24px;
}

.gist-markdown > :deep(:first-child) {
  margin-top: 0;
}

.gist-markdown > :deep(:last-child) {
  margin-bottom: 0;
}

.gist-markdown :deep(pre) {
  margin: 16px 0;
  padding: 12px 16px;
  border-radius: 6px;
  overflow-x: auto;
  background-color: var(--vp-c-bg-soft);
}

.gist-markdown :deep(pre code) {
  display: block;
  padding: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  background-color: transparent;
}

.gist-markdown :deep(.contains-task-list) {
  padding-left: 4px;
  list-style: none;
}

.gist-markdown :deep(.task-list-item-checkbox) {
  margin-right: 6px;
}

.gist-markdown :deep(.markdown-alert) {
  margin: 16px 0;
  padding: 8px 16px;
  border-left: 0.25em solid var(--gist-alert-color, var(--vp-c-divider));
}

.gist-markdown :deep(.markdown-alert > :first-child) {
  margin-top: 0;
}

.gist-markdown :deep(.markdown-alert > :last-child) {
  margin-bottom: 0;
}

.gist-markdown :deep(.markdown-alert-title) {
  display: flex;
  align-items: center;
  margin: 0 0 8px;
  font-weight: 600;
  line-height: 1;
  color: var(--gist-alert-color, var(--vp-c-text-1));
}

.gist-markdown :deep(.markdown-alert-title .octicon) {
  margin-right: 8px;
  fill: currentColor;
}

.gist-markdown :deep(.markdown-alert-note) {
  --gist-alert-color: var(--vp-c-indigo-1);
}

.gist-markdown :deep(.markdown-alert-tip) {
  --gist-alert-color: var(--vp-c-green-1);
}

.gist-markdown :deep(.markdown-alert-important) {
  --gist-alert-color: var(--vp-c-purple-1);
}

.gist-markdown :deep(.markdown-alert-warning) {
  --gist-alert-color: var(--vp-c-yellow-1);
}

.gist-markdown :deep(.markdown-alert-caution) {
  --gist-alert-color: var(--vp-c-red-1);
}

.gist-code :deep(pre.shiki) {
  margin: 0;
  padding: 16px;
  overflow: visible;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  background-color: transparent !important;
}

.gist-code :deep(.shiki span),
.gist-markdown :deep(.shiki span) {
  color: var(--shiki-light);
}

html.dark .gist-code :deep(.shiki span),
html.dark .gist-markdown :deep(.shiki span) {
  color: var(--shiki-dark);
}

.gist-plain {
  margin: 0;
  padding: 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  background-color: transparent;
}

.gist-plain code {
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background-color: transparent;
}
</style>

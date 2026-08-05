<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from "vue";

import {
  applyTaskStates,
  contentHash,
  highlightCode,
  isMarkdownFile,
  parseTaskList,
  renderMarkdown,
  type TaskListInfo,
} from "../gist";

const props = defineProps<{
  /** Gist id, e.g. "403b3a9b6b52156e5d65a13279d7f637". */
  id: string;
  /** Filename within the gist. */
  file: string;
  /** Gist owner; defaults to the site author. */
  user?: string;
  /** Start expanded instead of collapsed. */
  expanded?: boolean;
  /**
   * Make markdown task-list checkboxes interactive. Each visitor's checks are
   * kept in localStorage and restored on return; Download reflects them.
   */
  checklist?: boolean;
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
const storageKey = computed(
  () => `gist-tasks:${user.value}/${props.id}/${props.file}`,
);

const collapsedHeight = 480;
const collapsedMaxHeight = `${collapsedHeight}px`;

const loading = ref(true);
const error = ref<string | null>(null);
const fileContent = ref<string | null>(null);
const mode = ref<RenderMode>("plain");
const renderedHtml = ref("");
const expanded = ref(props.expanded);
const overflowing = ref(false);
const taskInfo = ref<TaskListInfo | null>(null);
const taskStates = ref<boolean[]>([]);

const tasksModified = computed(() => {
  const info = taskInfo.value;
  return (
    info !== null &&
    taskStates.value.some((state, index) => state !== info.states[index])
  );
});

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
        renderedHtml.value = await renderMarkdown(content, {
          enableTaskCheckboxes: props.checklist,
        });
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
  // Only after loading flips does the markdown (and its checkboxes) enter the
  // DOM, so the checklist must be set up after the states above settle.
  if (props.checklist && mode.value === "markdown" && fileContent.value) {
    try {
      await setUpChecklist(fileContent.value);
    } catch {
      // The checklist stays inert; the rendered markdown is unaffected.
    }
  }
});

function checkboxes(): HTMLInputElement[] {
  return [
    ...(contentEl.value?.querySelectorAll<HTMLInputElement>(
      "input.task-list-item-checkbox",
    ) ?? []),
  ];
}

async function setUpChecklist(content: string): Promise<void> {
  const info = await parseTaskList(content);
  await nextTick();
  const boxes = checkboxes();
  // A count mismatch means the source scan does not map onto the rendered
  // checkboxes (should not happen); leave the checklist inert rather than
  // rewrite the wrong lines.
  if (info.states.length === 0 || boxes.length !== info.states.length) {
    return;
  }
  taskInfo.value = info;
  taskStates.value = restoreTaskStates(info, content);
  boxes.forEach((box, index) => {
    box.checked = taskStates.value[index] ?? false;
  });
}

function restoreTaskStates(info: TaskListInfo, content: string): boolean[] {
  try {
    const raw = localStorage.getItem(storageKey.value);
    if (raw) {
      const saved = JSON.parse(raw) as { hash?: string; states?: unknown };
      if (
        saved.hash === contentHash(content) &&
        Array.isArray(saved.states) &&
        saved.states.length === info.states.length
      ) {
        return saved.states.map(Boolean);
      }
    }
  } catch {
    // Broken or blocked storage; fall through to the source states.
  }
  return [...info.states];
}

function persistTaskStates() {
  try {
    localStorage.setItem(
      storageKey.value,
      JSON.stringify({
        hash: contentHash(fileContent.value ?? ""),
        states: taskStates.value,
      }),
    );
  } catch {
    // Storage may be full or blocked; checks still apply for this visit.
  }
}

function onContentChange(event: Event) {
  const target = event.target;
  if (
    !taskInfo.value ||
    !(target instanceof HTMLInputElement) ||
    !target.classList.contains("task-list-item-checkbox")
  ) {
    return;
  }
  const index = checkboxes().indexOf(target);
  if (index < 0) {
    return;
  }
  taskStates.value[index] = target.checked;
  persistTaskStates();
}

function resetTasks() {
  if (!taskInfo.value) {
    return;
  }
  taskStates.value = [...taskInfo.value.states];
  checkboxes().forEach((box, index) => {
    box.checked = taskStates.value[index] ?? false;
  });
  try {
    localStorage.removeItem(storageKey.value);
  } catch {
    // Ignore; the visible states are already reset.
  }
}

function download() {
  if (fileContent.value === null) {
    return;
  }
  const content = taskInfo.value
    ? applyTaskStates(fileContent.value, taskInfo.value, taskStates.value)
    : fileContent.value;
  const blob = new Blob([content], {
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
          v-if="taskInfo"
          class="gist-button"
          type="button"
          @click="resetTasks"
        >
          Reset
        </button>
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
    <p v-if="tasksModified" class="gist-warning" role="status">
      Your checks are saved only in this browser and will be lost if the gist is
      updated. Use Download to keep your current version.
    </p>
    <div :id="bodyId" class="gist-body" :class="{ expanded }">
      <div ref="contentEl" class="gist-content" @change="onContentChange">
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

.gist-warning {
  margin: 0;
  padding: 6px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-yellow-1);
  background-color: var(--vp-c-yellow-soft);
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

.gist-markdown :deep(.task-list-item.enabled .task-list-item-checkbox) {
  cursor: pointer;
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

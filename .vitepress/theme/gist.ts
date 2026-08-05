import type { MarkdownIt } from "markdown-it";
import type { HighlighterCore, LanguageRegistration } from "shiki/core";

type GrammarImport = () => Promise<{ default: LanguageRegistration[] }>;

/**
 * Curated grammar set so the build only emits these chunks instead of every
 * language Shiki ships. Each grammar is still lazy-loaded on first use. To
 * support another language, add its import here and its extensions below.
 */
const grammars: Record<string, GrammarImport> = {
  bash: () => import("shiki/langs/bash.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  jsonc: () => import("shiki/langs/jsonc.mjs"),
  lua: () => import("shiki/langs/lua.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  vue: () => import("shiki/langs/vue.mjs"),
  xml: () => import("shiki/langs/xml.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

/**
 * Lower-cased file extensions (or whole extension-less filenames, such as
 * "dockerfile") mapped to grammar ids.
 */
const extensionLanguages: Record<string, string> = {
  bash: "bash",
  cjs: "javascript",
  css: "css",
  ct: "xml",
  cts: "typescript",
  htm: "html",
  html: "html",
  js: "javascript",
  json: "jsonc",
  json5: "jsonc",
  jsonc: "jsonc",
  lua: "lua",
  mjs: "javascript",
  mts: "typescript",
  rs: "rust",
  sh: "bash",
  svg: "xml",
  toml: "toml",
  ts: "typescript",
  vue: "vue",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
};

/** Fence info strings that are neither grammar ids nor file extensions. */
const fenceAliases: Record<string, string> = {
  console: "bash",
  shell: "bash",
  "shell-session": "bash",
  shellsession: "bash",
};

function languageFor(filename: string, content: string): string | null {
  const lower = filename.toLowerCase();
  const key = /\.([^.]+)$/.exec(lower)?.[1] ?? lower;
  const language = extensionLanguages[key];
  if (language) {
    return language;
  }
  if (content.trimStart().startsWith("<?xml")) {
    return "xml";
  }
  return null;
}

function grammarIdFor(fenceName: string): string | null {
  const key = fenceName.toLowerCase();
  if (key in grammars) {
    return key;
  }
  return fenceAliases[key] ?? extensionLanguages[key] ?? null;
}

const shikiThemes = { light: "github-light", dark: "github-dark" };

let highlighterPromise: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
      await Promise.all([
        import("shiki/core"),
        import("shiki/engine/javascript"),
      ]);
    return createHighlighterCore({
      themes: [
        import("shiki/themes/github-light.mjs"),
        import("shiki/themes/github-dark.mjs"),
      ],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  })();
  return highlighterPromise;
}

async function ensureLanguage(
  highlighter: HighlighterCore,
  language: string,
): Promise<boolean> {
  const grammar = grammars[language];
  if (!grammar) {
    return false;
  }
  if (!highlighter.getLoadedLanguages().includes(language)) {
    await highlighter.loadLanguage(grammar());
  }
  return true;
}

export function isMarkdownFile(filename: string): boolean {
  return /\.(?:md|markdown|mdown|mkdn?)$/i.test(filename);
}

export interface RenderMarkdownOptions {
  /** Render task-list checkboxes without the disabled attribute. */
  enableTaskCheckboxes?: boolean;
  /**
   * Unique id mixed into footnote anchors so several rendered documents on
   * one page do not link to each other's footnotes.
   */
  docId?: string;
}

export async function renderMarkdown(
  content: string,
  options?: RenderMarkdownOptions,
): Promise<string> {
  const [
    { default: MarkdownIt },
    { default: footnote },
    { default: taskLists },
    { full: emoji },
    { default: githubAlerts },
  ] = await Promise.all([
    import("markdown-it"),
    import("markdown-it-footnote"),
    import("markdown-it-task-lists"),
    import("markdown-it-emoji"),
    // Cast because the plugin's declaration file imports PluginWithOptions,
    // which markdown-it 15's own types no longer export, leaving the default
    // export error-typed (hidden from tsc by skipLibCheck).
    import("markdown-it-github-alerts") as Promise<{
      default: (md: MarkdownIt) => void;
    }>,
  ]);

  // markdown-it's highlight hook is synchronous, so scan the fences with a
  // bare instance and load their grammars up front. This must happen before
  // use() below: markdown-it-task-lists keeps its options in module state, so
  // awaiting between use() and render() would let a concurrently rendering
  // component's options win.
  const fenceLanguages = new Set<string>();
  for (const token of new MarkdownIt().parse(content, {})) {
    if (token.type === "fence") {
      const id = grammarIdFor(token.info.trim().split(/\s+/)[0] ?? "");
      if (id) {
        fenceLanguages.add(id);
      }
    }
  }
  let highlighter: HighlighterCore | undefined;
  if (fenceLanguages.size > 0) {
    highlighter = await getHighlighter();
    const loaded = highlighter;
    await Promise.all(
      [...fenceLanguages].map((language) => ensureLanguage(loaded, language)),
    );
  }

  const markdown = new MarkdownIt({ html: false, linkify: true })
    .use(footnote)
    // Always pass the full options: the plugin's module state keeps whatever
    // the previous caller set.
    .use(taskLists, {
      enabled: options?.enableTaskCheckboxes ?? false,
      label: false,
      labelAfter: false,
    })
    .use(emoji)
    .use(githubAlerts);
  if (highlighter) {
    const loaded = highlighter;
    markdown.set({
      highlight: (code, fenceName) => {
        const id = grammarIdFor(fenceName);
        if (!id || !loaded.getLoadedLanguages().includes(id)) {
          return "";
        }
        return loaded.codeToHtml(code, {
          lang: id,
          themes: shikiThemes,
          defaultColor: false,
        });
      },
    });
  }
  return markdown.render(content, { docId: options?.docId });
}

export interface TaskListInfo {
  /** Source line index of each checkbox, in document order. */
  lines: number[];
  /** Source checked state of each checkbox. */
  states: boolean[];
}

/**
 * Finds task-list items using the same token shape and content checks as
 * markdown-it-task-lists, so the result maps one-to-one onto the rendered
 * checkboxes. The footnote plugin is included because footnote definitions
 * can contain task lists that only tokenize with it present.
 */
export async function parseTaskList(content: string): Promise<TaskListInfo> {
  const [{ default: MarkdownIt }, { default: footnote }] = await Promise.all([
    import("markdown-it"),
    import("markdown-it-footnote"),
  ]);
  const tokens = new MarkdownIt().use(footnote).parse(content, {});
  const info: TaskListInfo = { lines: [], states: [] };
  for (let i = 2; i < tokens.length; i++) {
    const token = tokens[i];
    if (
      token.type === "inline" &&
      tokens[i - 1].type === "paragraph_open" &&
      tokens[i - 2].type === "list_item_open" &&
      /^\[[ xX]\] /.test(token.content)
    ) {
      info.lines.push(token.map?.[0] ?? tokens[i - 1].map?.[0] ?? -1);
      info.states.push(token.content[1] !== " ");
    }
  }
  return info;
}

/** Rewrites the task markers in the markdown source to the given states. */
export function applyTaskStates(
  content: string,
  info: TaskListInfo,
  states: boolean[],
): string {
  const lines = content.split("\n");
  info.lines.forEach((line, index) => {
    const state = states[index];
    if (line < 0 || line >= lines.length || state === undefined) {
      return;
    }
    lines[line] = lines[line].replace(/\[[ xX]\]/, state ? "[x]" : "[ ]");
  });
  return lines.join("\n");
}

/** Cheap stable hash used to invalidate stored states when a gist changes. */
export function contentHash(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/** Returns highlighted HTML, or null when the language is not recognised. */
export async function highlightCode(
  filename: string,
  content: string,
): Promise<string | null> {
  const language = languageFor(filename, content);
  if (!language) {
    return null;
  }
  const highlighter = await getHighlighter();
  if (!(await ensureLanguage(highlighter, language))) {
    return null;
  }
  return highlighter.codeToHtml(content, {
    lang: language,
    themes: shikiThemes,
    defaultColor: false,
  });
}

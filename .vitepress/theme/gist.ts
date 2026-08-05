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
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  csharp: () => import("shiki/langs/csharp.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  docker: () => import("shiki/langs/docker.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsonc: () => import("shiki/langs/jsonc.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  kotlin: () => import("shiki/langs/kotlin.mjs"),
  lua: () => import("shiki/langs/lua.mjs"),
  make: () => import("shiki/langs/make.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  powershell: () => import("shiki/langs/powershell.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  ruby: () => import("shiki/langs/ruby.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  scss: () => import("shiki/langs/scss.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  swift: () => import("shiki/langs/swift.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
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
  c: "c",
  cc: "cpp",
  cfg: "ini",
  cjs: "javascript",
  conf: "ini",
  cpp: "cpp",
  cs: "csharp",
  css: "css",
  ct: "xml",
  cts: "typescript",
  cxx: "cpp",
  diff: "diff",
  dockerfile: "docker",
  go: "go",
  h: "c",
  hpp: "cpp",
  htm: "html",
  html: "html",
  ini: "ini",
  java: "java",
  js: "javascript",
  json: "json",
  json5: "jsonc",
  jsonc: "jsonc",
  jsx: "jsx",
  kt: "kotlin",
  kts: "kotlin",
  lua: "lua",
  makefile: "make",
  mjs: "javascript",
  mts: "typescript",
  patch: "diff",
  php: "php",
  ps1: "powershell",
  psm1: "powershell",
  py: "python",
  rb: "ruby",
  rs: "rust",
  scss: "scss",
  sh: "bash",
  sql: "sql",
  svg: "xml",
  swift: "swift",
  toml: "toml",
  ts: "typescript",
  tsx: "tsx",
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

export async function renderMarkdown(content: string): Promise<string> {
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
  const markdown = new MarkdownIt({ html: false, linkify: true })
    .use(footnote)
    .use(taskLists)
    .use(emoji)
    .use(githubAlerts);

  // markdown-it's highlight hook is synchronous, so collect the fence
  // languages up front and load their grammars before rendering.
  const fenceLanguages = new Set<string>();
  for (const token of markdown.parse(content, {})) {
    if (token.type === "fence") {
      const id = grammarIdFor(token.info.trim().split(/\s+/)[0] ?? "");
      if (id) {
        fenceLanguages.add(id);
      }
    }
  }
  if (fenceLanguages.size > 0) {
    const highlighter = await getHighlighter();
    await Promise.all(
      [...fenceLanguages].map((language) =>
        ensureLanguage(highlighter, language),
      ),
    );
    markdown.set({
      highlight: (code, fenceName) => {
        const id = grammarIdFor(fenceName);
        if (!id || !highlighter.getLoadedLanguages().includes(id)) {
          return "";
        }
        return highlighter.codeToHtml(code, {
          lang: id,
          themes: shikiThemes,
          defaultColor: false,
        });
      },
    });
  }
  return markdown.render(content);
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

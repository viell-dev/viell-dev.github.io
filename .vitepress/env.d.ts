declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}

// These plugins ship no types, and their DefinitelyTyped packages target the
// abandoned @types/markdown-it instead of markdown-it 15's own types.
declare module "markdown-it-footnote" {
  import type { MarkdownIt } from "markdown-it";

  const footnote: (md: MarkdownIt) => void;
  export default footnote;
}

declare module "markdown-it-emoji" {
  import type { MarkdownIt } from "markdown-it";

  interface EmojiOptions {
    defs?: Record<string, string>;
    enabled?: string[];
    shortcuts?: Record<string, string | string[]>;
  }

  type EmojiPlugin = (md: MarkdownIt, options?: EmojiOptions) => void;
  export const bare: EmojiPlugin;
  export const full: EmojiPlugin;
  export const light: EmojiPlugin;
}

declare module "markdown-it-task-lists" {
  import type { MarkdownIt } from "markdown-it";

  interface TaskListsOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }

  const taskLists: (md: MarkdownIt, options?: TaskListsOptions) => void;
  export default taskLists;
}

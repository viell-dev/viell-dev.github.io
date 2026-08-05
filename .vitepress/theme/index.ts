import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";

import Breadcrumbs from "./components/Breadcrumbs.vue";
import GistFile from "./components/GistFile.vue";
import PostList from "./components/PostList.vue";

const theme: Theme = {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "doc-before": () => h(Breadcrumbs),
    });
  },
  enhanceApp({ app }) {
    app.component("GistFile", GistFile);
    app.component("PostList", PostList);
  },
};

export default theme;

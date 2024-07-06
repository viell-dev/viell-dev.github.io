import { defineConfig } from "vitepress";

const config = defineConfig({
  title: "somewhere",
  titleTemplate: ":title @ viell.dev",
  description: "viell's stuff",
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  lang: "en-GB",
  cleanUrls: true,
  srcDir: "./src",
  appearance: "force-dark",
  themeConfig: {
    siteTitle: "viell.dev",
    socialLinks: [
      {
        icon: "discord",
        link: "https://discordapp.com/users/310798899738574849",
      },
      { icon: "x", link: "https://x.com/viell88" },
      { icon: "github", link: "https://github.com/viell-dev" },
    ],
  },
});

export default config;

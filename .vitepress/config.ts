import { defineConfig } from "vitepress";

const config = defineConfig({
  title: "somewhere",
  titleTemplate: ":title @ viell.dev",
  description: "viell's stuff",
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  lang: "en-GB",
  cleanUrls: true,
  srcDir: "./src",
  appearance: "dark",
  themeConfig: {
    siteTitle: "viell.dev",
    nav: [
      { text: "Blog", link: "/blog/" },
      { text: "Portfolio", link: "/portfolio" },
      { text: "Hire Me", link: "/hire-me" },
    ],
    socialLinks: [
      {
        icon: "discord",
        link: "https://discord.com/users/310798899738574849",
      },
      { icon: "github", link: "https://github.com/viell-dev" },
    ],
  },
});

export default config;

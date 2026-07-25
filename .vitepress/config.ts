import { defineConfig } from "vitepress";

const config = defineConfig({
  title: "viell.dev",
  titleTemplate: ":title @ viell.dev",
  description:
    "Personal website of viell, full-stack developer - portfolio, blog and hiring information.",
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
      { icon: "codeberg", link: "https://codeberg.org/viell" },
      { icon: "github", link: "https://github.com/viell-dev" },
    ],
  },
});

export default config;

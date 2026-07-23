# viell-dev.github.io

Source for [viell.dev](https://viell.dev), a personal site built with
[VitePress](https://vitepress.dev) (Vue 3 + TypeScript), deployed to GitHub Pages.

## Setup

Requires [Node.js](https://nodejs.org) 24 (see `.nvmrc`) and [pnpm](https://pnpm.io).

```bash
pnpm install
```

## Commands

```bash
pnpm dev          # Start local dev server with hot reload
pnpm build        # Build static site to .vitepress/dist
pnpm preview      # Preview the built site locally
pnpm lint         # Run ESLint + Prettier with auto-fix
```

## Project layout

- `src/` - site content as markdown: landing page (`index.md`), `hire-me.md`, `portfolio.md`, and
  the blog index (`blog/index.md`)
- `src/blog/posts/` - blog posts, named `YYYY-MM-DD-slug.md`; the filename date is the post date
- `src/public/` - static assets (favicon, avatar, robots.txt)
- `.vitepress/config.ts` - site config: title, nav, social links, dark-default appearance,
  clean URLs
- `.vitepress/theme/` - extends the VitePress default theme:
  - `posts.data.ts` - build-time content loader that turns the post files into the sorted feed
    shown on `/blog/`
  - `components/PostList.vue` - the year-grouped post list
  - `components/Breadcrumbs.vue` - breadcrumb row on blog post pages, injected via the
    `doc-before` theme slot
- `.vitepress/dist/` - build output (not committed)

## Deployment

Pushes to `main` trigger the GitHub Actions workflow in `.github/workflows/deploy.yml`, which
builds the site and deploys it to GitHub Pages.

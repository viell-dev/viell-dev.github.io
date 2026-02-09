# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VitePress-based static site for viell.dev, a personal portfolio website. It uses Vue 3, TypeScript, and deploys to GitHub Pages.

## Commands

```bash
pnpm dev          # Start local dev server with hot reload
pnpm build        # Build static site for production
pnpm preview      # Preview built site locally
pnpm lint         # Run ESLint + Prettier with auto-fix
```

## Architecture

- **Content**: Markdown files in `src/` (VitePress source directory)
- **Static assets**: `src/public/` (favicon, images)
- **VitePress config**: `.vitepress/config.ts` (site title, theme, social links)
- **Build output**: `.vitepress/dist/` (deployed to GitHub Pages)

The site is configured with forced dark mode (`appearance: "force-dark"`) and clean URLs (no `.html` extensions).

## Deployment

Pushes to `main` branch automatically trigger GitHub Actions workflow that builds and deploys to GitHub Pages.

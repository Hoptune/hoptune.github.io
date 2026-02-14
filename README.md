# Personal Academic Website

Astro-based static website for an academic profile.

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Content Sources

- Profile data: `src/data/profile.ts`
- Publications: `cv/sections/papers.bib`
- Home content: `src/content/home/*.md`
- Research: `src/content/research/index.md`

## Deployment

- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Custom domain file: `public/CNAME`
- Configure your real domain in:
  - `astro.config.mjs` (`site`)
  - `public/CNAME`

## Analytics

Set a production environment variable:

- `PUBLIC_GA_ID=G-XXXXXXXXXX`

Analytics script is only injected in production when `PUBLIC_GA_ID` is set.

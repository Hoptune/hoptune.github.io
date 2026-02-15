# AGENTS.md

## Manual Website Update Rule

Use this checklist whenever you manually update the website.

### 1) Update static website files

Update content/assets in:

- `src/content/home/bio.md`
- `src/content/research/index.md`
- `src/content/home/cv.md`
- `src/data/profile.ts`
- `public/` (for example: `public/profile.jpg`, `public/logo.png`)

### 1.1) Profile image optimization check (required)

When `public/profile.jpg` is updated, always regenerate WebP and keep website using WebP:

```bash
cwebp -q 82 public/profile.jpg -o public/profile.webp
```

Then confirm `src/data/profile.ts` points to:

- `photoPath: "/profile.webp"`

### 1.2) Research figure preprocessing check (required for every deploy)

Research project figures are declared in:

- `src/content/researchProjects/*.md` (`figure: "/images/research/..."`)

Figure files live in:

- `public/images/research/`

Rules:

- Keep original files as `*.orig.<ext>` backups (for example: `gab_nsat.orig.png`)
- Do not delete or overwrite `*.orig.*` files manually
- Processed deploy image keeps the original filename (for example: `gab_nsat.png`)
- Always use absolute website path in frontmatter, e.g. `figure: "/images/research/gab_nsat.png"`

Preprocess command:

```bash
npm run preprocess:figures
```

Deploy/build requirement:

- `npm run build` must be used for deploy; it runs preprocessing automatically via `prebuild`
- Do not bypass `prebuild` during deployment

### 2) Update and compile CV (LaTeX)

CV source:

- `cv/cv.tex`
- `cv/sections/*.tex`
- `cv/sections/papers.bib`

Compile:

```bash
cd cv
latexmk -pdf cv.tex
```

If `latexmk` is unavailable:

```bash
pdflatex cv.tex
biber cv
pdflatex cv.tex
pdflatex cv.tex
```

Then sync generated CV PDF to website:

```bash
cp cv/cv.pdf public/cv.pdf
```

### 3) Update publications

Website publications must come from:

- `cv/sections/papers.bib`

Rules:

- Edit publication entries only in `cv/sections/papers.bib`
- Keep key fields consistent (`title`, `author`, `year`, `journal`/`booktitle`, optional `doi`, `adsurl`, `eprint`)
- Use `keywords = {..., mefirst}` for first-author tagging when needed
- Do not create a separate website BibTeX source

### 3.1) Verify publication counts and first-author tags (required)

Before deploy, check both files:

- `cv/sections/publications.tex`
- `cv/sections/papers.bib`

Checklist:

- Confirm `publications.tex` uses automatic counters in the section title (not hardcoded numbers)
- Confirm first-author papers in `papers.bib` include `mefirst` in `keywords`
- Confirm non-first-author papers do not include `mefirst`

### 4) Sync CV page summary with LaTeX updates

When education/experience changes in LaTeX, also update:

- `src/content/home/cv.md`

Keep CV page summary concise: education + experience + PDF link.

### 5) Validate locally before push

```bash
npm run build
```

Optional preview:

```bash
npm run dev
```

Check:

- Home/Research/Publications/CV render correctly
- `public/cv.pdf` is current
- Publication links/format are correct

### 6) Commit and push

```bash
git add -A
git commit -m "Update website content/CV/publications"
git push origin main
```

GitHub Pages should redeploy automatically from `main`.

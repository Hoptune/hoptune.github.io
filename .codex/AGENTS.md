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

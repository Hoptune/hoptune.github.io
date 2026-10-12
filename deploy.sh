#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly COMMIT_MESSAGE="${*:-Update website content/CV/publications}"

cd "$SCRIPT_DIR"

die() {
  printf 'deploy.sh: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

require_command git
require_command npm
require_command cmp

[[ "$(git rev-parse --show-toplevel)" == "$SCRIPT_DIR" ]] || die "script must live at the repository root"
[[ "$(git branch --show-current)" == "main" ]] || die "deployments must run from the main branch"

printf '%s\n' 'Updating from origin/main...'
git fetch origin main
git rebase --autostash origin/main

if [[ -n "$(git status --porcelain -- public/profile.jpg)" ]]; then
  require_command cwebp
  printf '%s\n' 'Regenerating public/profile.webp...'
  cwebp -quiet -q 82 public/profile.jpg -o public/profile.webp
fi

printf '%s\n' 'Building CV...'
pushd cv >/dev/null
readonly CV_BUILD_DIR="$PWD/.deploy-build/work"
mkdir -p "$CV_BUILD_DIR/sections"
cp cv.tex simplecv.sty "$CV_BUILD_DIR/"
cp sections/*.tex sections/papers.bib "$CV_BUILD_DIR/sections/"
pushd "$CV_BUILD_DIR" >/dev/null
if command -v latexmk >/dev/null 2>&1; then
  latexmk -pdf -interaction=nonstopmode -halt-on-error cv.tex
else
  require_command pdflatex
  require_command biber
  pdflatex -interaction=nonstopmode -halt-on-error cv.tex
  biber cv
  pdflatex -interaction=nonstopmode -halt-on-error cv.tex
  pdflatex -interaction=nonstopmode -halt-on-error cv.tex
fi
[[ -s cv.bbl ]] || die "Biber produced an empty isolated-build cv.bbl"
if [[ -f cv.blg ]] && grep -Fq 'ERROR -' cv.blg; then
  die "Biber reported an error in the isolated-build cv.blg"
fi
popd >/dev/null
cp "$CV_BUILD_DIR/cv.pdf" cv.pdf
popd >/dev/null

cp cv/cv.pdf public/cv.pdf
cmp -s cv/cv.pdf public/cv.pdf || die "public/cv.pdf does not match cv/cv.pdf"

grep -Fq '\arabic{pubtotal}' cv/sections/publications.tex \
  || die "CV publication total is not generated automatically"
grep -Fq '\arabic{pubfirstauthor}' cv/sections/publications.tex \
  || die "CV first-author total is not generated automatically"

printf '%s\n' 'Checking research project figures...'
while IFS= read -r -d '' project; do
  figure_path="$(sed -n 's/^figure:[[:space:]]*"\([^"]*\)".*/\1/p' "$project" | head -n 1)"
  [[ -n "$figure_path" ]] || die "missing figure path in $project"
  [[ "$figure_path" == /* ]] || die "figure path must be absolute in $project: $figure_path"
  [[ -f "public${figure_path}" ]] || die "figure file not found for $project: public${figure_path}"
done < <(find src/content/researchProjects -type f -name '*.md' -print0)

if [[ ! -x node_modules/.bin/astro ]]; then
  printf '%s\n' 'Installing website dependencies...'
  npm ci
fi

printf '%s\n' 'Building website...'
npm run build
git diff --check

# Include all tracked edits, plus new files in website source/asset directories.
# Deliberately leave unrelated untracked top-level files and directories alone.
git add -u
git add -- deploy.sh src public cv

if git diff --cached --quiet; then
  printf '%s\n' 'No website changes to commit.'
else
  git commit -m "$COMMIT_MESSAGE"
fi

printf '%s\n' 'Pushing main to trigger GitHub Pages...'
git push origin main

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  commit_sha="$(git rev-parse HEAD)"
  run_id=""
  for _ in {1..10}; do
    run_id="$(gh run list --workflow deploy.yml --commit "$commit_sha" --limit 1 --json databaseId --jq '.[0].databaseId')"
    [[ -n "$run_id" ]] && break
    sleep 2
  done
  if [[ -n "$run_id" ]]; then
    printf 'Watching GitHub Pages workflow %s...\n' "$run_id"
    gh run watch "$run_id" --exit-status
  else
    printf '%s\n' 'Push complete; the new GitHub Pages workflow was not visible yet.'
  fi
else
  printf '%s\n' 'Push complete; GitHub CLI is unavailable or not authenticated, so workflow watching was skipped.'
fi

printf '%s\n' 'Deployment triggered: https://zwshao.com'

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const projectsDir = path.join(root, "src", "content", "researchProjects");
const threshold = Number.parseInt(process.env.FIGURE_WHITE_THRESHOLD ?? "245", 10);
const softRange = Number.parseInt(process.env.FIGURE_SOFT_RANGE ?? "22", 10);
const chromaTolerance = Number.parseInt(process.env.FIGURE_CHROMA_TOLERANCE ?? "20", 10);

const alphaSafeExtensions = new Set([".png", ".webp", ".avif", ".tif", ".tiff"]);

function extractFigurePath(markdown) {
  const match = markdown.match(/(?:^|\n)figure:\s*["']?([^"\n']*)["']?\s*$/m);
  if (!match) return "";
  return match[1].trim();
}

function toPublicPath(figurePath) {
  const trimmed = figurePath.replace(/^\/+/, "");
  if (!trimmed) return "";
  const normalized = trimmed.startsWith("public/") ? trimmed.slice("public/".length) : trimmed;
  return path.join(root, "public", normalized);
}

function originalBackupPath(filePath) {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}.orig${parsed.ext}`);
}

function isNearWhite(r, g, b) {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min >= threshold - softRange && max - min <= chromaTolerance;
}

function fadeAlpha(alpha, r, g, b) {
  const min = Math.min(r, g, b);
  if (min >= threshold) return 0;
  const t = (threshold - min) / softRange;
  const clamped = Math.max(0, Math.min(1, t));
  return Math.round(alpha * clamped);
}

async function collectFigureFiles() {
  const files = await fs.readdir(projectsDir, { withFileTypes: true });
  const figureFiles = new Set();

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".md")) continue;
    const fullPath = path.join(projectsDir, file.name);
    const raw = await fs.readFile(fullPath, "utf8");
    const figurePath = extractFigurePath(raw);
    if (!figurePath) continue;

    const imagePath = toPublicPath(figurePath);
    if (!imagePath) continue;

    try {
      await fs.access(imagePath);
      figureFiles.add(imagePath);
    } catch {
      console.warn(`[preprocess-figures] Missing figure file: ${imagePath}`);
    }
  }

  return [...figureFiles];
}

async function preprocessImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!alphaSafeExtensions.has(ext)) {
    console.warn(`[preprocess-figures] Skip ${path.basename(filePath)} (extension ${ext} has no reliable alpha support).`);
    return;
  }

  const backupPath = originalBackupPath(filePath);
  try {
    await fs.access(backupPath);
  } catch {
    await fs.copyFile(filePath, backupPath);
    console.log(`[preprocess-figures] Saved original as ${path.relative(root, backupPath)}`);
  }

  const { data, info } = await sharp(backupPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);

  for (let i = 0; i < out.length; i += info.channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];

    if (!isNearWhite(r, g, b)) continue;
    out[i + 3] = fadeAlpha(a, r, g, b);
  }

  await sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } }).toFile(filePath);
  console.log(`[preprocess-figures] Processed ${path.relative(root, filePath)}`);
}

async function main() {
  const figureFiles = await collectFigureFiles();
  if (figureFiles.length === 0) {
    console.log("[preprocess-figures] No research figures found in frontmatter.");
    return;
  }

  for (const filePath of figureFiles) {
    await preprocessImage(filePath);
  }
}

main().catch((error) => {
  console.error("[preprocess-figures] Failed:", error);
  process.exitCode = 1;
});

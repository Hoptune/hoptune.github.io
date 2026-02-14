export type Publication = {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  type: string;
  doi?: string;
  arxiv?: string;
  ads?: string;
  url?: string;
  pdf?: string;
  code?: string;
  project?: string;
  tags: string[];
};

const JOURNAL_MACROS: Record<string, string> = {
  "\\apj": "The Astrophysical Journal",
  "\\apjl": "The Astrophysical Journal Letters",
  "\\apjs": "The Astrophysical Journal Supplement Series",
  "\\mnras": "Monthly Notices of the Royal Astronomical Society",
  "\\aap": "Astronomy and Astrophysics",
  "\\aj": "The Astronomical Journal",
  "\\pasp": "Publications of the Astronomical Society of the Pacific",
  "\\pasj": "Publications of the Astronomical Society of Japan",
  "\\araa": "Annual Review of Astronomy and Astrophysics"
};

const ACCENT_GROUPS: Record<string, Record<string, string>> = {
  "'": { a: "á", e: "é", i: "í", o: "ó", u: "ú", y: "ý", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú", Y: "Ý" },
  "`": { a: "à", e: "è", i: "ì", o: "ò", u: "ù", A: "À", E: "È", I: "Ì", O: "Ò", U: "Ù" },
  "^": { a: "â", e: "ê", i: "î", o: "ô", u: "û", A: "Â", E: "Ê", I: "Î", O: "Ô", U: "Û" },
  "\"": { a: "ä", e: "ë", i: "ï", o: "ö", u: "ü", y: "ÿ", A: "Ä", E: "Ë", I: "Ï", O: "Ö", U: "Ü" },
  "~": { a: "ã", n: "ñ", o: "õ", A: "Ã", N: "Ñ", O: "Õ" },
  c: { c: "ç", C: "Ç" }
};

function cleanupValue(raw: string): string {
  let value = raw.trim();

  while (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("\"") && value.endsWith("\""))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value.replace(/\s+/g, " ").trim();
}

function decodeLatex(text: string): string {
  let value = text;

  value = value.replace(/\\myname/g, "Zhiwei Shao");
  value = value.replace(/\\&/g, "&");
  value = value.replace(/~/g, " ");

  const accentRegex = /\\([`'"^~"c])\s*\{?([A-Za-z])\}?/g;
  value = value.replace(accentRegex, (_m, mark: string, letter: string) => {
    const table = ACCENT_GROUPS[mark];
    return table?.[letter] ?? letter;
  });

  value = value.replace(/[{}]/g, "");
  return value.replace(/\s+/g, " ").trim();
}

function formatAuthorName(raw: string): string {
  const cleaned = decodeLatex(cleanupValue(raw));
  if (!cleaned) return cleaned;

  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const family = parts[0];
    const given = parts.slice(1).join(" ");
    return `${given} ${family}`.replace(/\s+/g, " ").trim();
  }

  return cleaned;
}

function splitAuthors(raw: string): string[] {
  return raw
    .split(/\sand\s/i)
    .map((name) => formatAuthorName(name))
    .filter(Boolean);
}

function normalizeVenue(raw: string): string {
  const cleaned = cleanupValue(raw);
  const macroMatch = cleaned.match(/^\\[A-Za-z]+$/);
  if (macroMatch) {
    return JOURNAL_MACROS[macroMatch[0]] ?? decodeLatex(cleaned);
  }
  return decodeLatex(cleaned);
}

function parseFields(block: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  const n = block.length;

  while (i < n) {
    while (i < n && (block[i] === "," || /\s/.test(block[i]))) i++;
    if (i >= n) break;

    const keyStart = i;
    while (i < n && /[A-Za-z0-9_-]/.test(block[i])) i++;
    const key = block.slice(keyStart, i).toLowerCase();
    if (!key) break;

    while (i < n && /\s/.test(block[i])) i++;
    if (block[i] !== "=") {
      while (i < n && block[i] !== "\n") i++;
      continue;
    }
    i++;
    while (i < n && /\s/.test(block[i])) i++;

    let value = "";
    if (block[i] === "{") {
      let depth = 0;
      const start = i;
      while (i < n) {
        if (block[i] === "{") depth++;
        else if (block[i] === "}") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      value = block.slice(start, i);
    } else if (block[i] === "\"") {
      const start = i;
      i++;
      while (i < n) {
        if (block[i] === "\"" && block[i - 1] !== "\\") {
          i++;
          break;
        }
        i++;
      }
      value = block.slice(start, i);
    } else {
      const start = i;
      while (i < n && block[i] !== ",") i++;
      value = block.slice(start, i);
    }

    fields[key] = cleanupValue(value);
    while (i < n && block[i] !== ",") i++;
    if (i < n && block[i] === ",") i++;
  }

  return fields;
}

export function parseBibTeX(raw: string): Publication[] {
  const entryRegex = /@(\w+)\s*\{\s*([^,]+),([\s\S]*?)\n\}/g;
  const publications: Publication[] = [];
  let entry: RegExpExecArray | null = entryRegex.exec(raw);

  while (entry) {
    const type = entry[1].toLowerCase();
    const id = cleanupValue(entry[2]);
    const fields = parseFields(entry[3]);

    if (!fields.title || !fields.author || !fields.year) {
      entry = entryRegex.exec(raw);
      continue;
    }

    const venue = fields.journal ?? fields.booktitle ?? fields.publisher ?? "Preprint";
    const year = Number.parseInt(fields.year, 10);

    if (Number.isNaN(year)) {
      entry = entryRegex.exec(raw);
      continue;
    }

    publications.push({
      id,
      title: decodeLatex(cleanupValue(fields.title)),
      authors: splitAuthors(fields.author),
      venue: normalizeVenue(venue),
      year,
      type,
      doi: fields.doi,
      arxiv:
        fields.eprint && (!fields.archiveprefix || fields.archiveprefix.toLowerCase() === "arxiv")
          ? `https://arxiv.org/abs/${fields.eprint}`
          : undefined,
      ads: fields.adsurl,
      url: fields.url,
      pdf: fields.pdf,
      code: fields.code,
      project: fields.project,
      tags: fields.keywords ? fields.keywords.split(",").map((t) => t.trim()).filter(Boolean) : []
    });

    entry = entryRegex.exec(raw);
  }

  return publications.sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }
    return a.title.localeCompare(b.title);
  });
}

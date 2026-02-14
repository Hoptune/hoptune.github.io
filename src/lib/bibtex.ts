export type Publication = {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  type: string;
  doi?: string;
  url?: string;
  pdf?: string;
  code?: string;
  project?: string;
  tags: string[];
};

function cleanupValue(raw: string): string {
  return raw
    .trim()
    .replace(/^\{/, "")
    .replace(/\}$/, "")
    .replace(/^"/, "")
    .replace(/"$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitAuthors(raw: string): string[] {
  return raw
    .split(/\sand\s/i)
    .map((name) => cleanupValue(name))
    .filter(Boolean);
}

function parseFields(block: string): Record<string, string> {
  const fieldRegex = /(\w+)\s*=\s*(\{[^{}]*\}|"[^"]*"|[^,\n]+)\s*,?/g;
  const fields: Record<string, string> = {};
  let match: RegExpExecArray | null = fieldRegex.exec(block);

  while (match) {
    fields[match[1].toLowerCase()] = cleanupValue(match[2]);
    match = fieldRegex.exec(block);
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
      title: cleanupValue(fields.title),
      authors: splitAuthors(fields.author),
      venue: cleanupValue(venue),
      year,
      type,
      doi: fields.doi,
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

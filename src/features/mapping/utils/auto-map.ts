import type { FieldDef } from "../types";

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

export function autoMapFields(headers: string[], fields: FieldDef[]) {
  const map: Record<string, string | null> = {};
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }));

  for (const field of fields) {
    const candidates = [field.key, field.label, ...(field.synonyms ?? [])].map(
      normalize,
    );

    // Exact normalized match first
    let match = normalizedHeaders.find((h) => candidates.includes(h.norm));
    if (!match) {
      // Partial includes match
      match = normalizedHeaders.find((h) =>
        candidates.some((c) => h.norm.includes(c) || c.includes(h.norm)),
      );
    }

    map[field.key] = match?.raw ?? null;
  }

  return map;
}

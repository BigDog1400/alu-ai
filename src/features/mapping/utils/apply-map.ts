import type { FieldDef } from "../types";
import type { ColumnMap } from "@/features/upload/hooks/use-parsed-upload-storage";

export function applyColumnMap(
  rows: Record<string, unknown>[],
  columnMap: ColumnMap,
  fields: FieldDef[],
) {
  const mapped = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const field of fields) {
      const header = columnMap[field.key];
      if (header && Object.prototype.hasOwnProperty.call(row, header)) {
        const recordRow: Record<string, unknown> = row;
        out[field.key] = recordRow[header] ?? null;
      } else {
        out[field.key] = null; // fallback when unmapped
      }
    }
    return out;
  });
  return mapped;
}

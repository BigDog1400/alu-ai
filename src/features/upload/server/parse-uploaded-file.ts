import * as XLSX from "xlsx";

import type { ParsedUpload } from "@/features/upload/types";
import { generateAiColumnMapping } from "@/features/upload/server/generate-column-mapping";

function buildRowObject(headers: string[], row: unknown[]): Record<string, unknown> {
  return headers.reduce<Record<string, unknown>>((acc, header, index) => {
    const key = header.trim() || `column_${index + 1}`;
    acc[key] = row[index] ?? "";
    return acc;
  }, {});
}

function isEmptyRow(row: Record<string, unknown>): boolean {
  return Object.values(row).every((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    return false;
  });
}

export async function parseUploadedFile(file: File): Promise<ParsedUpload> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

  const [firstSheetName] = workbook.SheetNames;
  if (!firstSheetName) {
    throw new Error("No worksheets found in uploaded file.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  });

  const rawHeaders = (data.shift() ?? []) as (string | number | boolean | null | undefined)[];
  const headers = rawHeaders.map((header, index) => {
    if (typeof header === "string" && header.trim().length > 0) {
      return header.trim();
    }
    if (typeof header === "number") {
      return header.toString();
    }
    return `column_${index + 1}`;
  });

  const rows = data
    .map((row) => buildRowObject(headers, row))
    .filter((row) => !isEmptyRow(row));

  const aiSuggestedMap = await generateAiColumnMapping(headers, rows.slice(0, 5));

  return {
    filename: file.name,
    sheetName: firstSheetName,
    headers,
    rows,
    previewRows: rows.slice(0, 3),
    totalRows: rows.length,
    aiSuggestedMap,
  };
}

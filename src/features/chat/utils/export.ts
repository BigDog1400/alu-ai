'use client';

import * as XLSX from "xlsx";

type ExportOptions = {
  rows: Record<string, unknown>[];
  columns: string[];
  columnLabels?: Record<string, string>;
  fileBaseName: string;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function normalizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function escapeCsvCell(value: string): string {
  if (value.includes("\"") || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getHeaderLabels(columns: string[], columnLabels?: Record<string, string>) {
  return columns.map((column) => columnLabels?.[column] ?? column);
}

export function exportRowsToCsv({
  rows,
  columns,
  columnLabels,
  fileBaseName,
}: ExportOptions) {
  const headers = getHeaderLabels(columns, columnLabels);
  const csvLines = [
    headers.map((header) => escapeCsvCell(header)).join(","),
    ...rows.map((row) =>
      columns
        .map((column) => escapeCsvCell(normalizeCsvValue(row[column])))
        .join(",")
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  downloadBlob(blob, `${fileBaseName}.csv`);
}

function normalizeXlsxValue(
  value: unknown
): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function exportRowsToXlsx({
  rows,
  columns,
  columnLabels,
  fileBaseName,
}: ExportOptions) {
  const headers = getHeaderLabels(columns, columnLabels);
  const worksheetData = [
    headers,
    ...rows.map((row) =>
      columns.map((column) => normalizeXlsxValue(row[column]))
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  const arrayBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, `${fileBaseName}.xlsx`);
}

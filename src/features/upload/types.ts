export type ParsedUpload = {
  filename: string;
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  previewRows: Record<string, unknown>[];
  totalRows: number;
};

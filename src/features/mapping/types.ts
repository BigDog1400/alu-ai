export type FieldDef = {
  key: string;
  label: string;
  description?: string;
  synonyms?: string[];
};

export type ColumnMap = Record<string, string | null>; // key: field key, value: header name or null

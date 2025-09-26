"use client";

import { useCallback } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import type { ParsedUpload } from "../types";

const PARSED_UPLOAD_KEY = "alu.parsedUpload.v1";
const COLUMN_MAP_KEY = "alu.columnMap.v1";
const MAPPED_JSON_KEY = "alu.mappedJson.v1";
const MAPPING_CONFIRMED_KEY = "alu.mappingConfirmed.v1";
const PARSED_UPLOAD_EVENT = "alu:parsedUploadChanged";
const COLUMN_MAP_EVENT = "alu:columnMapChanged";
const MAPPED_JSON_EVENT = "alu:mappedJsonChanged";
const MAPPING_CONFIRMED_EVENT = "alu:mappingConfirmedChanged";

export type ColumnMap = Record<string, string | null>;

const normalizeParsedUpload = (value: ParsedUpload | null): ParsedUpload | null => {
  if (!value) return null;
  return {
    ...value,
    aiSuggestedMap: value.aiSuggestedMap ?? {},
  };
};

const parsedUploadAtom = atom<ParsedUpload | null>(null);
parsedUploadAtom.onMount = (set) => {
  if (typeof window === "undefined") return;

  const load = () => {
    try {
      const raw = localStorage.getItem(PARSED_UPLOAD_KEY);
      const parsed = raw ? (JSON.parse(raw) as ParsedUpload) : null;
      set(normalizeParsedUpload(parsed));
    } catch {
      set(null);
    }
  };

  load();
  window.addEventListener(PARSED_UPLOAD_EVENT, load);
  return () => {
    window.removeEventListener(PARSED_UPLOAD_EVENT, load);
  };
};

const parsedUploadWriteAtom = atom(null, (_get, set, value: ParsedUpload | null) => {
  const normalized = normalizeParsedUpload(value);
  set(parsedUploadAtom, normalized);

  if (typeof window === "undefined") return;

  try {
    if (normalized === null) {
      localStorage.removeItem(PARSED_UPLOAD_KEY);
    } else {
      localStorage.setItem(PARSED_UPLOAD_KEY, JSON.stringify(normalized));
    }
    window.dispatchEvent(new Event(PARSED_UPLOAD_EVENT));
  } catch {}
});

const columnMapAtom = atom<ColumnMap>({});
columnMapAtom.onMount = (set) => {
  if (typeof window === "undefined") return;

  const load = () => {
    try {
      const raw = localStorage.getItem(COLUMN_MAP_KEY);
      set(raw ? JSON.parse(raw) : {});
    } catch {
      set({});
    }
  };

  load();
  window.addEventListener(COLUMN_MAP_EVENT, load);
  return () => {
    window.removeEventListener(COLUMN_MAP_EVENT, load);
  };
};

const columnMapWriteAtom = atom(null, (_get, set, value: ColumnMap) => {
  set(columnMapAtom, value);

  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(COLUMN_MAP_KEY, JSON.stringify(value));
    window.dispatchEvent(new Event(COLUMN_MAP_EVENT));
  } catch {}
});

const mappedJsonAtom = atom<Record<string, unknown>[]>([]);
mappedJsonAtom.onMount = (set) => {
  if (typeof window === "undefined") return;

  const load = () => {
    try {
      const raw = localStorage.getItem(MAPPED_JSON_KEY);
      set(raw ? JSON.parse(raw) : []);
    } catch {
      set([]);
    }
  };

  load();
  window.addEventListener(MAPPED_JSON_EVENT, load);
  return () => {
    window.removeEventListener(MAPPED_JSON_EVENT, load);
  };
};

type MappedJson = Record<string, unknown>[];

const mappedJsonWriteAtom = atom(
  null,
  (
    get,
    set,
    value: MappedJson | ((prev: MappedJson) => MappedJson)
  ) => {
    const nextValue: MappedJson =
      typeof value === "function"
        ? (value as (prev: MappedJson) => MappedJson)(get(mappedJsonAtom))
        : value;

    set(mappedJsonAtom, nextValue);

    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(MAPPED_JSON_KEY, JSON.stringify(nextValue));
      window.dispatchEvent(new Event(MAPPED_JSON_EVENT));
    } catch {}
  }
);

const mappingConfirmedAtom = atom<boolean>(false);
mappingConfirmedAtom.onMount = (set) => {
  if (typeof window === "undefined") return;

  const load = () => {
    try {
      const raw = localStorage.getItem(MAPPING_CONFIRMED_KEY);
      set(raw === "true");
    } catch {
      set(false);
    }
  };

  load();
  window.addEventListener(MAPPING_CONFIRMED_EVENT, load);
  return () => {
    window.removeEventListener(MAPPING_CONFIRMED_EVENT, load);
  };
};

const mappingConfirmedWriteAtom = atom(null, (_get, set, value: boolean) => {
  set(mappingConfirmedAtom, value);

  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(MAPPING_CONFIRMED_KEY, value ? "true" : "false");
    window.dispatchEvent(new Event(MAPPING_CONFIRMED_EVENT));
  } catch {}
});

export function useParsedUploadStorage() {
  const parsedUpload = useAtomValue(parsedUploadAtom);
  const columnMap = useAtomValue(columnMapAtom);
  const mappedJson = useAtomValue(mappedJsonAtom);
  const mappingConfirmed = useAtomValue(mappingConfirmedAtom);

  const writeParsedUpload = useSetAtom(parsedUploadWriteAtom);
  const writeColumnMap = useSetAtom(columnMapWriteAtom);
  const writeMappedJson = useSetAtom(mappedJsonWriteAtom);
  const writeMappingConfirmed = useSetAtom(mappingConfirmedWriteAtom);

  const saveParsedUpload = useCallback(
    (value: ParsedUpload | null) => {
      writeParsedUpload(value);
    },
    [writeParsedUpload],
  );

  const saveColumnMap = useCallback(
    (value: ColumnMap) => {
      writeColumnMap(value);
    },
    [writeColumnMap],
  );

  const saveMappedJson = useCallback(
    (value: MappedJson | ((prev: MappedJson) => MappedJson)) => {
      // Delegate to the write atom which supports functional updates to avoid stale closures
      writeMappedJson(value);
    },
    [writeMappedJson],
  );

  const saveMappingConfirmed = useCallback(
    (value: boolean) => {
      writeMappingConfirmed(value);
    },
    [writeMappingConfirmed],
  );

  const clearAll = useCallback(() => {
    writeParsedUpload(null);
    writeColumnMap({});
    writeMappedJson([]);
    writeMappingConfirmed(false);
  }, [writeParsedUpload, writeColumnMap, writeMappedJson, writeMappingConfirmed]);

  return {
    parsedUpload,
    columnMap,
    mappedJson,
    mappingConfirmed,
    saveParsedUpload,
    saveColumnMap,
    saveMappedJson,
    saveMappingConfirmed,
    clearAll,
  };
}

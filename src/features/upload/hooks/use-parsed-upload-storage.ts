"use client";

import { useEffect, useState, useCallback } from "react";
import type { ParsedUpload } from "../types";

const PARSED_UPLOAD_KEY = "alu.parsedUpload.v1";
const COLUMN_MAP_KEY = "alu.columnMap.v1";
const MAPPED_JSON_KEY = "alu.mappedJson.v1";
const MAPPING_CONFIRMED_KEY = "alu.mappingConfirmed.v1";
const PARSED_UPLOAD_EVENT = "alu:parsedUploadChanged";
const COLUMN_MAP_EVENT = "alu:columnMapChanged";

export type ColumnMap = Record<string, string | null>;

export function useParsedUploadStorage() {
  const [parsedUpload, setParsedUpload] = useState<ParsedUpload | null>(null);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [mappedJson, setMappedJson] = useState<Record<string, unknown>[]>([]);
  const [mappingConfirmed, setMappingConfirmed] = useState<boolean>(false);

  // Load from localStorage on mount and sync across instances via custom events
  useEffect(() => {
    try {
      const parsedRaw = typeof window !== "undefined" ? localStorage.getItem(PARSED_UPLOAD_KEY) : null;
      if (parsedRaw) setParsedUpload(JSON.parse(parsedRaw));

      const mapRaw = typeof window !== "undefined" ? localStorage.getItem(COLUMN_MAP_KEY) : null;
      if (mapRaw) setColumnMap(JSON.parse(mapRaw));

      const mappedRaw = typeof window !== "undefined" ? localStorage.getItem(MAPPED_JSON_KEY) : null;
      if (mappedRaw) setMappedJson(JSON.parse(mappedRaw));

      const confirmedRaw = typeof window !== "undefined" ? localStorage.getItem(MAPPING_CONFIRMED_KEY) : null;
      if (confirmedRaw) setMappingConfirmed(confirmedRaw === "true");
    } catch (e) {
      console.warn("Failed to load upload storage from localStorage", e);
    }

    function onParsedChange() {
      try {
        const parsedRaw = localStorage.getItem(PARSED_UPLOAD_KEY);
        setParsedUpload(parsedRaw ? JSON.parse(parsedRaw) : null);
      } catch {}
    }

    function onMapChange() {
      try {
        const mapRaw = localStorage.getItem(COLUMN_MAP_KEY);
        setColumnMap(mapRaw ? JSON.parse(mapRaw) : {});
      } catch {}
    }

    function onMappedJsonChange() {
      try {
        const mappedRaw = localStorage.getItem(MAPPED_JSON_KEY);
        setMappedJson(mappedRaw ? JSON.parse(mappedRaw) : []);
      } catch {}
    }

    function onMappingConfirmedChange() {
      try {
        const confirmedRaw = localStorage.getItem(MAPPING_CONFIRMED_KEY);
        setMappingConfirmed(confirmedRaw === "true");
      } catch {}
    }

    window.addEventListener(PARSED_UPLOAD_EVENT, onParsedChange);
    window.addEventListener(COLUMN_MAP_EVENT, onMapChange);
    window.addEventListener("alu:mappedJsonChanged", onMappedJsonChange);
    window.addEventListener("alu:mappingConfirmedChanged", onMappingConfirmedChange);
    return () => {
      window.removeEventListener(PARSED_UPLOAD_EVENT, onParsedChange);
      window.removeEventListener(COLUMN_MAP_EVENT, onMapChange);
      window.removeEventListener("alu:mappedJsonChanged", onMappedJsonChange);
      window.removeEventListener("alu:mappingConfirmedChanged", onMappingConfirmedChange);
    };
  }, []);

  const saveParsedUpload = useCallback((value: ParsedUpload | null) => {
    setParsedUpload(value);
    try {
      if (value) localStorage.setItem(PARSED_UPLOAD_KEY, JSON.stringify(value));
      else localStorage.removeItem(PARSED_UPLOAD_KEY);
      window.dispatchEvent(new Event(PARSED_UPLOAD_EVENT));
    } catch {}
  }, []);

  const saveColumnMap = useCallback((value: ColumnMap) => {
    setColumnMap(value);
    try {
      localStorage.setItem(COLUMN_MAP_KEY, JSON.stringify(value));
      window.dispatchEvent(new Event(COLUMN_MAP_EVENT));
    } catch {}
  }, []);

  const saveMappedJson = useCallback((value: Record<string, unknown>[]) => {
    setMappedJson(value);
    try {
      localStorage.setItem(MAPPED_JSON_KEY, JSON.stringify(value));
      window.dispatchEvent(new Event("alu:mappedJsonChanged"));
    } catch {}
  }, []);

  const saveMappingConfirmed = useCallback((value: boolean) => {
    setMappingConfirmed(value);
    try {
      localStorage.setItem(MAPPING_CONFIRMED_KEY, value ? "true" : "false");
      window.dispatchEvent(new Event("alu:mappingConfirmedChanged"));
    } catch {}
  }, []);

  const clearAll = useCallback(() => {
    saveParsedUpload(null);
    saveColumnMap({});
    saveMappedJson([]);
    saveMappingConfirmed(false);
  }, [saveParsedUpload, saveColumnMap, saveMappedJson, saveMappingConfirmed]);

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

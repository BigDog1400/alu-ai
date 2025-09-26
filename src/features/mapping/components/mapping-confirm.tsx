"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { PRODUCT_FIELDS } from "../fields";
import type { FieldDef } from "../types";
import { autoMapFields } from "../utils/auto-map";
import { useParsedUploadStorage } from "@/features/upload/hooks/use-parsed-upload-storage";
import { applyColumnMap } from "../utils/apply-map";

export function MappingConfirm() {
  const { parsedUpload, columnMap, saveColumnMap, clearAll, saveMappedJson, saveMappingConfirmed } =
    useParsedUploadStorage();

  const headers = useMemo(() => parsedUpload?.headers ?? [], [parsedUpload]);

  // Seed an initial map if none exists
  useEffect(() => {
    if (!parsedUpload) return;
    const currentKeys = Object.keys(columnMap);
    const expectedKeys = PRODUCT_FIELDS.map((f) => f.key);
    const needsSeed = expectedKeys.some((k) => !currentKeys.includes(k));
    if (needsSeed) {
      const seeded = autoMapFields(headers, PRODUCT_FIELDS);
      saveColumnMap(seeded);
    }
  }, [parsedUpload, headers, columnMap, saveColumnMap]);

  const mappedSample = useMemo(() => {
    if (!parsedUpload) return [] as Record<string, unknown>[];
    return applyColumnMap(parsedUpload.rows.slice(0, 3), columnMap, PRODUCT_FIELDS);
  }, [parsedUpload, columnMap]);

  if (!parsedUpload) return null;

  const onChangeMap = (field: FieldDef, headerValue: string) => {
    const value = headerValue === "__unknown__" ? null : headerValue;
    saveColumnMap({ ...columnMap, [field.key]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Confirm import</CardTitle>
        <CardDescription>
          We mapped each column to what we believe is correct, but please review the data below to confirm it&apos;s accurate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="hidden gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">CSV Data column</Label>
            <span />
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">App data column</Label>
          </div>

          <div className="space-y-4">
            {PRODUCT_FIELDS.map((field) => {
              const sampleValues = mappedSample
                .map((row) => row[field.key])
                .filter((value) => value !== null && value !== undefined && String(value).trim().length > 0)
                .map((value) => String(value));
              const uniqueSamples = Array.from(new Set(sampleValues)).slice(0, 3);

              return (
                <div key={field.key} className="space-y-3 rounded-md border border-border/90 p-4">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground md:hidden">
                        CSV Data column
                      </Label>
                      <Select
                        value={columnMap[field.key] ?? "__unknown__"}
                        onValueChange={(v) => onChangeMap(field, v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a header" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__unknown__">Unknown</SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="hidden items-center justify-center md:flex">
                      <ArrowRight className="size-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground md:hidden">
                        App data column
                      </Label>
                      <div className="text-sm font-medium">{field.label}</div>
                      {field.description ? (
                        <div className="text-xs text-muted-foreground">{field.description}</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sample values</Label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSamples.length > 0 ? (
                        uniqueSamples.map((value, index) => (
                          <Badge
                            key={`${field.key}-sample-${index}`}
                            variant="secondary"
                            className="text-xs font-medium"
                          >
                            {value}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/70">No sample data</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-4">
            <Button
              type="button"
              className="order-2 sm:order-1"
              onClick={() => {
                if (!parsedUpload) return;
                const full = applyColumnMap(parsedUpload.rows, columnMap, PRODUCT_FIELDS);
                saveMappedJson(full);
                saveMappingConfirmed(true);
              }}
            >
              Confirm mapping
            </Button>
            <div className="order-1 flex items-center justify-between gap-2 sm:order-2">
              <Button type="button" variant="ghost" onClick={clearAll}>
                Choose another file
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  const mappedPairs = useMemo(() => PRODUCT_FIELDS, []);

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
        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">CSV Data column</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">App data column</Label>
            </div>
          </div>

          <div className="space-y-3">
            {mappedPairs.map((field) => (
              <div key={field.key} className="grid items-center gap-4 md:grid-cols-2">
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

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{field.label}</div>
                    {field.description ? (
                      <div className="text-xs text-muted-foreground">{field.description}</div>
                    ) : null}
                  </div>
                  <div className="hidden text-xs text-muted-foreground sm:block">
                    {/* Optional per-field help icon or tooltip could go here */}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Mapped preview (first 3 rows)</Label>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {mappedPairs.map((f) => (
                      <TableHead key={f.key}>{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedSample.map((row, i) => (
                    <TableRow key={i}>
                      {mappedPairs.map((f) => (
                        <TableCell key={f.key} className="max-w-[240px] truncate text-xs">
                          {String(row[f.key] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

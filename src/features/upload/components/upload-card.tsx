"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileSpreadsheet, UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/utils/format-bytes";
import { MAX_FILE_SIZE } from "../constants";
import { useUploadDropzone } from "../hooks/use-upload-dropzone";
import { parseUpload } from "../services/parse-upload";
import { useParsedUploadStorage } from "@/features/upload/hooks/use-parsed-upload-storage";

export function UploadCard() {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    open,
    uploadedFile,
    uploadError,
    clearSelection,
  } = useUploadDropzone();

  const { saveParsedUpload } = useParsedUploadStorage();
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!uploadedFile) return;
      setIsParsing(true);
      setParseError(null);
      try {
        const data = await parseUpload(uploadedFile);
        if (!cancelled) {
          saveParsedUpload(data); // triggers AppFlow to move to MappingConfirm
        }
      } catch (err) {
        if (!cancelled) {
          setParseError(err instanceof Error ? err.message : "Failed to parse file.");
        }
      } finally {
        if (!cancelled) setIsParsing(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [uploadedFile, saveParsedUpload]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload a data file</CardTitle>
        <CardDescription>
          Accepts CSV and Excel files up to {formatBytes(MAX_FILE_SIZE)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps({
            className:
              "group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 px-8 py-16 text-center transition-colors hover:border-primary",
            onClick: () => open(),
          })}
        >
          <input {...getInputProps()} aria-label="Upload Excel or CSV file" />
          <span
            className={`flex size-16 items-center justify-center rounded-full border border-muted-foreground/30 bg-background transition-colors ${
              isDragReject ? "border-destructive text-destructive" : "text-primary"
            }`}
          >
            <UploadCloud className="size-8" />
          </span>
          <h2 className="mt-6 text-xl font-medium">
            {isDragActive ? "Release to upload your file" : "Drag & drop your file"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Supports .csv, .xls, .xlsx up to {formatBytes(MAX_FILE_SIZE)}.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-6"
            onClick={(event) => {
              event.stopPropagation();
              open();
            }}
          >
            Browse files
          </Button>
        </div>

        {uploadError && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{uploadError}</p>
          </div>
        )}

        {parseError && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p>{parseError}</p>
          </div>
        )}

        {uploadedFile ? (
          <div className="flex flex-col gap-4 rounded-md border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-10 items-center justify-center rounded-md border border-primary/20 bg-background text-primary">
                <FileSpreadsheet className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(uploadedFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isParsing ? (
                <span className="inline-flex items-center text-xs uppercase tracking-wide text-primary">
                  <Loader2 className="mr-2 size-4 animate-spin" /> Parsing file...
                </span>
              ) : (
                <span className="text-xs uppercase tracking-wide text-primary">Ready for mapping</span>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={isParsing}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 rounded-md border border-muted bg-muted/50 p-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">What happens next?</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>We extract your headers and rows.</li>
                <li>Smart matching maps columns to our product schema.</li>
                <li>Review and adjust the mapping before chatting with the assistant.</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Tips for best results</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Include header rows with descriptive names.</li>
                <li>Ensure product rows are contiguous—empty rows are ignored.</li>
                <li>Keep file size under {formatBytes(MAX_FILE_SIZE)} for quicker parsing.</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

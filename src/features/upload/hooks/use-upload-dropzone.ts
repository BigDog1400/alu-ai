"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "../constants";
import { getRejectionMessage } from "../utils/get-rejection-message";

export function useUploadDropzone() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejections: FileRejection[]) => {
    if (rejections.length) {
      setUploadError(getRejectionMessage(rejections));
      setUploadedFile(null);
      const message = getRejectionMessage(rejections) ?? "File rejected";
      toast.error(message);
      return;
    }

    const [file] = acceptedFiles;
    if (file) {
      setUploadedFile(file);
      setUploadError(null);
      toast.success("File selected. Parsing now…");
    }
  }, []);

  const dropzone = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const clearSelection = useCallback(() => {
    setUploadedFile(null);
    setUploadError(null);
    toast.info("Upload cleared");
  }, []);

  return {
    ...dropzone,
    uploadedFile,
    uploadError,
    clearSelection,
  };
}

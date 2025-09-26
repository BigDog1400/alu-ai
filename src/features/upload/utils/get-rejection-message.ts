import type { FileRejection } from "react-dropzone";
import { MAX_FILE_SIZE } from "../constants";
import { formatBytes } from "@/utils/format-bytes";

export function getRejectionMessage(rejections: FileRejection[]): string | null {
  const [first] = rejections;
  if (!first) return null;

  const messages = first.errors.map((error) => {
    switch (error.code) {
      case "file-invalid-type":
        return "Only CSV or Excel files are supported.";
      case "file-too-large":
        return `Files must be smaller than ${formatBytes(MAX_FILE_SIZE)}.`;
      default:
        return error.message;
    }
  });

  return messages.join(" ");
}

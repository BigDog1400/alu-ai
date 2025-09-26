"use client";

import { UploadCard } from "@/features/upload/components/upload-card";
import { MappingConfirm } from "@/features/mapping/components/mapping-confirm";
import { ChatPane } from "@/features/chat/components/chat-pane";
import { useParsedUploadStorage } from "@/features/upload/hooks/use-parsed-upload-storage";

export function AppFlow() {
  const { parsedUpload, mappingConfirmed } = useParsedUploadStorage();

  if (mappingConfirmed) {
    return <ChatPane />;
  }

  if (parsedUpload) {
    return <MappingConfirm />;
  }

  return <UploadCard />;
}

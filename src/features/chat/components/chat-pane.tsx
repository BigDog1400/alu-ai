"use client";

import { Fragment, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useParsedUploadStorage } from "@/features/upload/hooks/use-parsed-upload-storage";
import { PRODUCT_FIELDS } from "@/features/mapping/fields";
import { usePagination } from "@/features/chat/hooks/use-pagination";
import { DataPreviewTable } from "@/features/chat/components/data-preview-table";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Actions, Action } from "@/components/ai-elements/actions";
import { Loader } from "@/components/ai-elements/loader";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { useChat } from "@ai-sdk/react";
import { ArrowLeft, ArrowRight, Sparkles, CopyIcon, RefreshCcwIcon } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export function ChatPane() {
  const { mappedJson, saveMappingConfirmed } = useParsedUploadStorage();
  const { messages, sendMessage, regenerate, status } = useChat();
  const [input, setInput] = useState("");
  const { page, totalPages, startIndex, endIndex, pageItems, goPrev, goNext, goTo } = usePagination(
    mappedJson.length,
    PAGE_SIZE,
  );

  const dims = useMemo(() => {
    const rows = mappedJson.length;
    const fieldSet = new Set<string>();
    for (const row of mappedJson) {
      Object.keys(row).forEach((k) => fieldSet.add(k));
    }
    if (fieldSet.size === 0) PRODUCT_FIELDS.forEach((f) => fieldSet.add(f.key));
    return { rows, fields: fieldSet.size };
  }, [mappedJson]);

  const pagedRows = useMemo(() => mappedJson.slice(startIndex, endIndex), [mappedJson, startIndex, endIndex]);

  const suggested = [
    "Remove any empty or null values",
    "Trim whitespace from all fields",
    "Standardize phone number formats",
    "Title-case the product names",
    "Change supplier in row 1 to Acme",
  ];
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasFiles = Boolean(message.files?.length);
    if (!hasText && !hasFiles) return;
    sendMessage({ text: message.text || "", files: message.files });
    setInput("");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Refine Your Data</h2>
          <p className="text-sm text-muted-foreground">
            Chat with AI to clean, validate, and enhance your data.
          </p>
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Data Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base">Current Data</CardTitle>
            </div>
            <Badge variant="secondary">{dims.fields} fields • {dims.rows} rows</Badge>
          </CardHeader>
          <CardContent>
            <DataPreviewTable
              columns={PRODUCT_FIELDS.map((f) => ({ key: f.key, label: f.label }))}
              rows={pagedRows}
            />
            {mappedJson.length > PAGE_SIZE ? (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        goPrev();
                      }}
                      aria-disabled={page === 1}
                      className={page === 1 ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                  {pageItems.map((item, idx) => (
                    <PaginationItem key={typeof item === "number" ? item : `ellipsis-${idx}`}>
                      {item === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={item === page}
                          onClick={(event) => {
                            event.preventDefault();
                            goTo(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        goNext();
                      }}
                      aria-disabled={page === totalPages}
                      className={page === totalPages ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </CardContent>
        </Card>

        {/* Right: Chat Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assistant</CardTitle>
              <CardDescription>Ask for cleaning, validation, and transformations.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-[520px] flex-col">
              <Conversation className="flex-1">
                <ConversationContent>
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.parts.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <Fragment key={`${message.id}-${i}`}>
                              <Message from={message.role}>
                                <MessageContent>
                                  <Response>{part.text}</Response>
                                </MessageContent>
                              </Message>
                              {message.role === "assistant" && message.id === messages.at(-1)?.id && (
                                <Actions className="mt-2">
                                  <Action onClick={() => regenerate()} label="Retry">
                                    <RefreshCcwIcon className="size-3" />
                                  </Action>
                                  <Action
                                    onClick={() => navigator.clipboard.writeText(part.text)}
                                    label="Copy"
                                  >
                                    <CopyIcon className="size-3" />
                                  </Action>
                                </Actions>
                              )}
                            </Fragment>
                          );
                        }
                        if (part.type === "reasoning") {
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={
                                status === "streaming" &&
                                i === message.parts.length - 1 &&
                                message.id === messages.at(-1)?.id
                              }
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ))}
                  {status === "submitted" && <Loader />}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>

              <PromptInput onSubmit={handleSubmit} className="mt-4">
                <PromptInputBody>
                  <PromptInputTextarea
                    onChange={(e) => setInput(e.target.value)}
                    value={input}
                    placeholder="Ask me to clean, validate, or transform your data..."
                  />
                </PromptInputBody>
                <PromptInputToolbar>
                  <PromptInputSubmit disabled={!input && status !== "streaming"} status={status} />
                </PromptInputToolbar>
              </PromptInput>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" onClick={() => saveMappingConfirmed(false)}>
          <ArrowLeft className="mr-2 size-4" /> Back to Mapping
        </Button>
        <Button
          onClick={() => toast.info("Export flow is not implemented in this demo.")}
        >
          Continue to Export <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

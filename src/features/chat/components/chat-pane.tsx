"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ToolPartMessage } from "@/features/chat/components/tool-messages";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Actions, Action } from "@/components/ai-elements/actions";
import { Loader } from "@/components/ai-elements/loader";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { useChat } from "@ai-sdk/react";
import {
  ArrowLeft,
  Sparkles,
  CopyIcon,
  RefreshCcwIcon,
  DownloadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { exportRowsToCsv, exportRowsToXlsx } from "@/features/chat/utils/export";

type FilterInput = {
  field: string;
  condition: "equals" | "not_equals" | "is_empty" | "is_not_empty" | "contains";
  value?: unknown;
};

const PROCESS_CELLS_CONCURRENCY = 10;

// Define the type for our AI-generated suggestions
type AISuggestion = {
  title: string;
  prompt: string;
};

const applyFilter = (
  data: Record<string, unknown>[],
  filter?: FilterInput
) => {
  if (!filter) return data.map((_, index) => index); // All indices if no filter

  return data.reduce((acc, row, index) => {
    const fieldValue = row[filter.field];
    let match = false;
    switch (filter.condition) {
      case "equals":
        match = fieldValue == filter.value;
        break;
      case "not_equals":
        match = fieldValue != filter.value;
        break;
      case "is_empty":
        match =
          fieldValue === null || fieldValue === undefined || fieldValue === "";
        break;
      case "is_not_empty":
        match =
          fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
        break;
      case "contains":
        match = String(fieldValue).includes(filter.value as string);
        break;
    }
    if (match) acc.push(index);
    return acc;
  }, [] as number[]);
};

const PAGE_SIZE = 10;

export function ChatPane() {
  const { mappedJson, parsedUpload, saveMappingConfirmed, saveMappedJson } =
    useParsedUploadStorage();

  const tableSchema = useMemo(() => {
    if (mappedJson.length === 0) return [];
    return Object.keys(mappedJson[0]);
  }, [mappedJson]);
  const sampleData = useMemo(() => {
    return mappedJson.slice(0, 3); // Send only the first 3 rows as samples
  }, [mappedJson]);
  const columnLabels = useMemo(() => {
    return PRODUCT_FIELDS.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = field.label;
      return acc;
    }, {});
  }, []);

  const handleExport = useCallback(
    (format: "csv" | "xlsx") => {
      if (mappedJson.length === 0) {
        toast.info("There's no transformed data to export yet.");
        return;
      }

      const columns =
        tableSchema.length > 0
          ? tableSchema
          : PRODUCT_FIELDS.map((field) => field.key);

      const fileBaseName =
        parsedUpload?.filename?.replace(/\.[^/.]+$/, "") ??
        `alu-export-${new Date().toISOString().slice(0, 10)}`;

      try {
        const options = {
          rows: mappedJson,
          columns,
          columnLabels,
          fileBaseName,
        };

        if (format === "csv") {
          exportRowsToCsv(options);
        } else {
          exportRowsToXlsx(options);
        }

        toast.success(
          `Exported ${mappedJson.length} rows as ${format.toUpperCase()}.`
        );
      } catch (error) {
        console.error("Export failed", error);
        toast.error("We couldn't export the file. Please try again.");
      }
    },
    [columnLabels, mappedJson, parsedUpload?.filename, tableSchema]
  );

  const { messages, sendMessage, regenerate, status, addToolResult } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === "directUpdateTool") {
        const { filter, newValues } = toolCall.input as {
          filter?: FilterInput;
          newValues: Record<string, unknown>;
        };
        // Compute a snapshot-based count for messaging only.
        const indicesToUpdateForMsg = applyFilter(mappedJson, filter);
        // Use functional update to merge onto the latest state and avoid stale snapshots.
        saveMappedJson((prev) => {
          const indicesToUpdate = applyFilter(prev, filter);
          const next = [...prev];
          indicesToUpdate.forEach((index) => {
            next[index] = { ...next[index], ...newValues };
          });
          return next;
        });

        const resultMessage = filter
          ? `Updated ${indicesToUpdateForMsg.length} rows matching the criteria.`
          : `Updated ${indicesToUpdateForMsg.length} rows (all rows).`;

        toast.success(resultMessage);

        // Provide the tool result back to the AI stream so it can continue
        if (!toolCall.dynamic) {
          addToolResult({
            tool: "directUpdateTool",
            toolCallId: toolCall.toolCallId,
            output: {
              updatedRowCount: indicesToUpdateForMsg.length,
              updatedFields: Object.keys(newValues ?? {}),
              filterApplied: Boolean(filter),
            },
          });
        }

        // Per-Cell Processing Tool Logic
      } else if (toolCall.toolName === "processCellsTool") {
        const { filter, fieldToProcess, processingPrompt } = toolCall.input as {
          filter?: FilterInput;
          fieldToProcess: string;
          processingPrompt: string;
        };

        if (!fieldToProcess) {
          toast.error("processCellsTool did not specify a field to process.");
          if (!toolCall.dynamic) {
            addToolResult({
              tool: "processCellsTool",
              toolCallId: toolCall.toolCallId,
              output: { error: "Missing fieldToProcess" },
            });
          }
          return;
        }

        const indicesToProcess = filter
          ? applyFilter(mappedJson, filter)
          : mappedJson.map((_, index) => index);

        if (indicesToProcess.length === 0) {
          toast.info("No rows matched the requested transformation.");
          if (!toolCall.dynamic) {
            addToolResult({
              tool: "processCellsTool",
              toolCallId: toolCall.toolCallId,
              output: { processedCount: 0, field: fieldToProcess, note: "No rows matched the filter." },
            });
          }
          return;
        }

        toast.info(
          `Starting transformation on ${indicesToProcess.length} cells in the '${fieldToProcess}' column...`
        );

        let processedCount = 0;
        const failures: { index: number; message: string }[] = [];
        let workingRows = mappedJson;

        const processIndex = async (index: number) => {
          const currentValue = workingRows[index]?.[fieldToProcess];

          try {
            const res = await fetch("/api/process-cell", {
              method: "POST",
              body: JSON.stringify({
                prompt: processingPrompt,
                value: currentValue,
              }),
            });
            if (!res.ok) {
              throw new Error(`API call failed for row ${index + 1}`);
            }

            const { newValue } = await res.json();

            saveMappedJson((prev) => {
              const next = [...prev];
              const previousRow = prev[index] ?? {};
              next[index] = {
                ...previousRow,
                [fieldToProcess]: newValue,
              };
              workingRows = next;
              return next;
            });

            processedCount += 1;
          } catch (error: unknown) {
            const message = `Row ${index + 1}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;
            failures.push({ index, message });
            console.error("processCellsTool error", error);
          }
        };

        const queue = [...indicesToProcess];
        while (queue.length > 0) {
          const batch = queue.splice(0, PROCESS_CELLS_CONCURRENCY);
          await Promise.all(batch.map((index) => processIndex(index)));
        }

        if (failures.length === 0) {
          toast.success(`Transformation complete! Updated ${processedCount} cells.`);
        } else if (processedCount > 0) {
          toast.error(
            `Transformation finished with ${failures.length} errors. ${processedCount} cells updated.`
          );
        } else {
          toast.error("No cells were updated due to errors.");
        }

        // Provide tool result back so the assistant can continue
        if (!toolCall.dynamic) {
          addToolResult({
            tool: "processCellsTool",
            toolCallId: toolCall.toolCallId,
            output: {
              processedCount,
              field: fieldToProcess,
              errors: failures.map((failure) => failure.message),
            },
          });
        }
      }
    },
  });
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Fetch AI-generated suggestions when mappedJson becomes available
  useEffect(() => {
    if (mappedJson.length > 0 && tableSchema.length > 0) {
      setIsGeneratingSuggestions(true);
      const fetchSuggestions = async () => {
        try {
          const response = await fetch('/api/generate-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              schema: tableSchema, 
              sampleData: mappedJson.slice(0, 5) // Send slightly larger sample
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.suggestions || []);
          }
        } catch (error) {
          console.error("Failed to fetch AI suggestions:", error);
          // Set fallback suggestions if API fails
          setSuggestions([
            { title: "Clean Text Fields", prompt: "Trim whitespace from all text fields" },
            { title: "Fill Empty Values", prompt: "Fill empty cells with appropriate default values" },
            { title: "Standardize Format", prompt: "Standardize the format of all data fields" }
          ]);
        } finally {
          setIsGeneratingSuggestions(false);
        }
      };
      fetchSuggestions();
    }
  }, [mappedJson, tableSchema]);

  const handleSuggestionClick = useCallback((prompt: string) => {
    sendMessage(
      { text: prompt },
      {
        body: {
          metadata: { schema: tableSchema, sampleData },
        }
      }
    );
    setInput("");
  }, [sendMessage, tableSchema, sampleData]);

  const {
    page,
    totalPages,
    startIndex,
    endIndex,
    pageItems,
    goPrev,
    goNext,
    goTo,
  } = usePagination(mappedJson.length, PAGE_SIZE);

  const dims = useMemo(() => {
    const rows = mappedJson.length;
    const fieldSet = new Set<string>();
    for (const row of mappedJson) {
      Object.keys(row).forEach((k) => fieldSet.add(k));
    }
    if (fieldSet.size === 0) PRODUCT_FIELDS.forEach((f) => fieldSet.add(f.key));
    return { rows, fields: fieldSet.size };
  }, [mappedJson]);

  const pagedRows = useMemo(
    () => mappedJson.slice(startIndex, endIndex),
    [mappedJson, startIndex, endIndex]
  );

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasFiles = Boolean(message.files?.length);
    if (!hasText && !hasFiles) return;
    sendMessage(
      {
        text: message.text || "",
        files: message.files,
      },
      {
        body: {
            metadata: { schema: tableSchema, sampleData },
        }
      }
    );
    setInput("");
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Refine Your Data
          </h2>
          <p className="text-sm text-muted-foreground">
            Chat with AI to clean, validate, and enhance your data.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Data Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base">Current Data</CardTitle>
            </div>
            <Badge variant="secondary">
              {dims.fields} fields • {dims.rows} rows
            </Badge>
          </CardHeader>
          <CardContent>
            <DataPreviewTable
              columns={PRODUCT_FIELDS.map((f) => ({
                key: f.key,
                label: f.label,
              }))}
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
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                  {pageItems.map((item, idx) => (
                    <PaginationItem
                      key={typeof item === "number" ? item : `ellipsis-${idx}`}
                    >
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
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
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
              <CardDescription>
                Ask for cleaning, validation, and transformations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex h-[520px] flex-col">
              <Conversation className="flex-1">
                <ConversationContent>
                  {/* Show suggestions when conversation is empty */}
                  {messages.length === 0 && (
                    <div className="space-y-4 p-4">
                      {isGeneratingSuggestions ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-sm text-muted-foreground">Generating smart suggestions...</p>
                          </div>
                        </div>
                      ) : suggestions.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground text-center">
                            Here are some suggested actions to get you started:
                          </p>
                          <div className="grid gap-2">
                            {suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                className="h-auto p-3 text-left justify-start"
                                onClick={() => handleSuggestionClick(suggestion.prompt)}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {index + 1}
                                  </Badge>
                                  <span className="text-sm font-medium">{suggestion.title}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">
                            Start by asking me to clean, validate, or transform your data.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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
                              {message.role === "assistant" &&
                                message.id === messages.at(-1)?.id && (
                                  <Actions className="mt-2">
                                    <Action
                                      onClick={() => regenerate()}
                                      label="Retry"
                                    >
                                      <RefreshCcwIcon className="size-3" />
                                    </Action>
                                    <Action
                                      onClick={() =>
                                        navigator.clipboard.writeText(part.text)
                                      }
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

                        if (
                          part.type === "tool-directUpdateTool" ||
                          part.type === "tool-processCellsTool"
                        ) {
                          return (
                            <ToolPartMessage
                              key={`${message.id}-${part.type}-${i}`}
                              part={part}
                              role={message.role}
                            />
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
                  <PromptInputSubmit
                    disabled={!input && status !== "streaming"}
                    status={status}
                  />
                </PromptInputToolbar>
              </PromptInput>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" onClick={() => saveMappingConfirmed(false)}>
          <ArrowLeft className="mr-2 size-4" /> Back to Mapping
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <DownloadIcon className="mr-2 size-4" /> Export Data
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export as</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                handleExport("csv");
              }}
            >
              CSV (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                handleExport("xlsx");
              }}
            >
              Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <AIDevtools />
      )}
    </div>
  );
}

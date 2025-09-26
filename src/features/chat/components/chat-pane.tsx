"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useParsedUploadStorage } from "@/features/upload/hooks/use-parsed-upload-storage";
import { PRODUCT_FIELDS } from "@/features/mapping/fields";
import { ArrowLeft, ArrowRight, Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ChatMessage = { role: "user" | "assistant"; content: string; updated?: boolean };

function ThreeDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-1">
      <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:-0.3s]" />
      <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:-0.15s]" />
      <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce" />
    </div>
  );
}

export function ChatPane() {
  const { mappedJson, saveMappingConfirmed } = useParsedUploadStorage();
  const [showPreview, setShowPreview] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Mapping confirmed. You can now refine your data using chat.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dims = useMemo(() => {
    const rows = mappedJson.length;
    const fieldSet = new Set<string>();
    for (const row of mappedJson) {
      Object.keys(row).forEach((k) => fieldSet.add(k));
    }
    if (fieldSet.size === 0) PRODUCT_FIELDS.forEach((f) => fieldSet.add(f.key));
    return { rows, fields: fieldSet.size };
  }, [mappedJson]);

  const sampleRows = useMemo(() => mappedJson.slice(0, 3), [mappedJson]);

  const suggested = [
    "Remove any empty or null values",
    "Trim whitespace from all fields",
    "Standardize phone number formats",
    "Title-case the product names",
    "Change supplier in row 1 to Acme",
  ];

  function handleSend(prompt: string) {
    if (!prompt.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setInput("");
    setThinking(true);

    // Simulate an AI response
    const willUpdate = /remove|trim|standardize|change|update/i.test(prompt);
    setTimeout(() => {
      setThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: willUpdate
            ? "Done. I processed your request and updated the data."
            : "Here is my suggestion. You can also try one of the actions on the right.",
          updated: willUpdate,
        },
      ]);
    }, 900);
  }

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
        <Button variant="outline" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? "Hide Data Preview" : "Show Data Preview"}
        </Button>
      </div>

      {/* Data Preview */}
      {showPreview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base">Current Data</CardTitle>
            </div>
            <Badge variant="secondary">{dims.fields} fields • {dims.rows} rows</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {PRODUCT_FIELDS.map((f) => (
                      <TableHead key={f.key} className="whitespace-nowrap">
                        {f.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleRows.map((row, i) => (
                    <TableRow key={i}>
                      {PRODUCT_FIELDS.map((f) => (
                        <TableCell key={f.key} className="max-w-[220px] truncate text-xs">
                          {String(row[f.key] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interaction Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Chat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assistant</CardTitle>
            <CardDescription>Ask for cleaning, validation, and transformations.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[520px] flex-col">
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto rounded-md border bg-muted/40 p-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                    m.role === "assistant"
                      ? "bg-background text-foreground/90 shadow border"
                      : "bg-primary text-primary-foreground ml-auto"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                    {m.role === "assistant" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                    <span>{m.role === "assistant" ? "Assistant" : "You"}</span>
                    {m.updated && (
                      <Badge variant="outline" className="ml-2 h-5 px-1.5 text-[10px]">
                        Data updated
                      </Badge>
                    )}
                  </div>
                  <div>{m.content}</div>
                </div>
              ))}

              {thinking && (
                <div className="max-w-[80%] rounded-md border bg-background px-3 py-2 text-sm shadow">
                  <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                    <Bot className="size-3.5" />
                    <span>Assistant</span>
                  </div>
                  <ThreeDots />
                </div>
              )}
            </div>

            <Separator className="my-3" />

            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to clean, validate, or transform your data..."
              />
              <Button type="submit" className="h-10 w-10 p-0" title="Send">
                <Send className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Suggestions panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suggested Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggested.map((s, idx) => (
                <Button key={idx} variant="outline" className="w-full justify-start" onClick={() => setInput(s)}>
                  {s}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="mt-0.5" />
            <AlertTitle>AI integration not configured</AlertTitle>
            <AlertDescription>
              Responses are simulated for demo purposes. Hook up your API key to enable real actions.
            </AlertDescription>
          </Alert>
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

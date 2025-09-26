"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useParsedUploadStorage } from "@/features/upload/hooks/use-parsed-upload-storage";

export function ChatPane() {
  const { mappedJson, clearAll } = useParsedUploadStorage();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Mapping confirmed. This is a placeholder chat. Next, we will integrate the actual chat to edit your mapped JSON.",
    },
  ]);
  const [input, setInput] = useState("");

  return (
    <div className="grid gap-6 md:grid-cols-3 w-full">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Mapped JSON preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(mappedJson, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex-1 space-y-2 overflow-auto rounded-md border bg-muted/40 p-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "assistant" ? "text-muted-foreground" : ""}>
                <span className="font-medium">{m.role === "assistant" ? "Assistant" : "You"}:</span> {m.content}
              </div>
            ))}
          </div>
          <Separator />
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              setMessages((prev) => [...prev, { role: "user", content: input }]);
              setInput("");
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type an instruction (e.g., change supplier in row 1 to Acme)"
            />
            <Button type="submit">Send</Button>
          </form>
          <Button type="button" variant="ghost" className="mt-2" onClick={clearAll}>
            Start over
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

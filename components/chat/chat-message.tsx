"use client";

import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * Renders a single chat message with appropriate styling for
 * user messages (right-aligned, primary color) and assistant
 * messages (left-aligned, muted background).
 */
export function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  // Don't render system messages in the UI
  if (isSystem) return null;

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}

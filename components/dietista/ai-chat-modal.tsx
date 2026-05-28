"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Send, Check, RefreshCw } from "lucide-react";
import type { ChatMessage } from "@/lib/schemas";
import type { SuggestResult } from "@/lib/openai";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AiChatModalProps {
  open: boolean;
  messages: ChatMessage[];
  pendingSuggestion: SuggestResult | null;
  loading: boolean;
  error: string | null;
  turnCount: number;
  onSubmit: (query: string) => void;
  onAccept: () => void;
  onClose: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CLIENT_TURN_CAP = 10;

// ─── Component ─────────────────────────────────────────────────────────────────

export function AiChatModal({
  open,
  messages,
  pendingSuggestion,
  loading,
  error,
  turnCount,
  onSubmit,
  onAccept,
  onClose,
}: AiChatModalProps) {
  const t = useTranslations("Journal");
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAtTurnCap = turnCount >= CLIENT_TURN_CAP;
  const canSubmit = inputValue.trim().length > 0 && !loading && !isAtTurnCap;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const query = inputValue.trim();
    setInputValue("");
    onSubmit(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Find the index of the last assistant message that has a pending suggestion
  const lastAssistantIndex = messages.reduceRight(
    (found, msg, idx) => (found === -1 && msg.role === "assistant" ? idx : found),
    -1
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("aiModalTitle")}
    >
      <div className="w-full max-w-sm rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-bg)] shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--dietista-border)]">
          <h3 className="text-base font-semibold text-[var(--dietista-text)]">
            {t("aiModalTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[var(--dietista-text-3)] hover:text-[var(--dietista-text)] transition-colors px-2 py-1 rounded"
          >
            {t("cancel")}
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {/* Intro greeting — only when no messages yet */}
          {messages.length === 0 && !loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-[var(--dietista-r-lg)] rounded-tl-sm bg-[var(--dietista-surface)] border border-[var(--dietista-border)] px-3 py-2">
                <p className="text-sm text-[var(--dietista-text-2)]">
                  {t("aiChatIntro")}
                </p>
              </div>
            </div>
          )}

          {/* Chat bubbles */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isLastAssistant = idx === lastAssistantIndex;

            return (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-[var(--dietista-r-lg)] px-3 py-2 ${
                    isUser
                      ? "bg-[var(--brand-500)] text-white rounded-tr-sm"
                      : "bg-[var(--dietista-surface)] border border-[var(--dietista-border)] text-[var(--dietista-text)] rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                  {/* Macro summary on assistant messages (only when it's the last one with a suggestion) */}
                  {!isUser && isLastAssistant && pendingSuggestion && (
                    <div className="mt-2 pt-2 border-t border-[var(--dietista-border)]">
                      <p className="text-xs font-semibold text-[var(--dietista-text)]">
                        {pendingSuggestion.foodName} — {pendingSuggestion.quantity}{pendingSuggestion.unit}
                      </p>
                      <p className="text-xs text-[var(--dietista-text-3)] tnum mt-0.5">
                        {Math.round(pendingSuggestion.calories)} kcal •{" "}
                        {Math.round(pendingSuggestion.protein)}g P •{" "}
                        {Math.round(pendingSuggestion.carbs)}g C •{" "}
                        {Math.round(pendingSuggestion.fat)}g F
                      </p>

                      {/* Action chips */}
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={onAccept}
                          className="flex items-center gap-1 rounded-full bg-[var(--brand-500)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)]"
                        >
                          <Check className="h-3 w-3" />
                          {t("aiAccept")}
                        </button>
                        <button
                          type="button"
                          onClick={() => inputRef.current?.focus()}
                          className="flex items-center gap-1 rounded-full border border-[var(--dietista-border)] px-3 py-1 text-xs font-semibold text-[var(--dietista-text-2)] transition-colors hover:bg-[var(--dietista-surface)]"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {t("aiKeepTrying")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-[var(--dietista-r-lg)] rounded-tl-sm bg-[var(--dietista-surface)] border border-[var(--dietista-border)] px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-500)]" />
                <span className="text-xs text-[var(--dietista-text-3)]">{t("aiLoading")}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Turn cap reached */}
          {isAtTurnCap && (
            <p className="text-xs text-amber-600 text-center">{t("aiTurnLimitError")}</p>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--dietista-border)] p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              className="flex-1 resize-none rounded-lg border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] disabled:opacity-50"
              rows={2}
              placeholder={isAtTurnCap ? t("aiTurnLimitError") : t("aiChatPlaceholder")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || isAtTurnCap}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-label={t("aiChatSend")}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-500)] text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

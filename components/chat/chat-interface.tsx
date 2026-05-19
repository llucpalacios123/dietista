"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatMessage } from "@/components/chat/chat-message";
import { FileUploadButton } from "@/components/chat/file-upload-button";
import { useChatConversation } from "@/hooks/use-chat-conversation";
import { uploadFileForChat } from "@/actions/pdf-upload";
import { chatMealPlan } from "@/actions/chat";
import {
  isGenerationTriggered,
  resetGenerationTrigger,
  setToolSessionId,
} from "@/lib/chat-tools";
import { Send, Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface PdfUploadState {
  uploading: boolean;
  error: string | null;
}

interface GenerationResult {
  mealPlanId?: string;
  mealCount?: number;
  error?: string;
}

// ─── Step Labels ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  collect_preferences: "Your Goals",
  collect_dietary_restrictions: "Dietary Info",
  collect_pdf_input: "Nutrition Report",
  confirm_generation: "Review & Confirm",
  generating: "Creating Plan",
  complete: "Done!",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Extract text content from a message's parts array. */
function getMessageText(parts: unknown[]): string {
  return parts
    .filter(
      (p): p is { type: string; text?: string } =>
        typeof p === "object" && p !== null
    )
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * Main chat interface for the AI-powered meal plan generation flow.
 *
 * Integrates:
 * - Vercel AI SDK `useChat` for streaming conversation (v6 API)
 * - `useChatConversation` state machine for the multi-step flow
 * - PDF upload action for nutrition report processing
 * - Meal plan generation trigger via `chatMealPlan` server action
 */
export function ChatInterface({ userId }: { userId: string }) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [pdfState, setPdfState] = useState<PdfUploadState>({
    uploading: false,
    error: null,
  });
  const [generationResult, setGenerationResult] =
    useState<GenerationResult | null>(null);

  // Set the tool session ID for the chat-tools module
  useEffect(() => {
    setToolSessionId(userId);
    return () => {
      resetGenerationTrigger(userId);
    };
  }, [userId]);

  // Conversation state machine
  const {
    step,
    stepIndex,
    totalSteps,
    advanceStep,
    collectedData,
    setPdfData,
    setGenerating,
    setComplete,
  } = useChatConversation();

  // AI SDK chat hook (v6 API)
  const {
    messages,
    sendMessage,
    status,
    error: chatError,
  } = useChat({
    id: userId,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // ─── Auto-scroll to bottom ─────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Check for generation trigger after AI response completes ─────────

  const prevMessageCount = useRef(messages.length);
  useEffect(() => {
    if (
      !isLoading &&
      messages.length > prevMessageCount.current &&
      isGenerationTriggered(userId)
    ) {
      if (step !== "generating" && step !== "complete") {
        advanceStep("generating");
        setGenerating();
        handleGenerate();
      }
    }
    prevMessageCount.current = messages.length;
  }, [isLoading, messages]);

  // ─── Handle Meal Plan Generation ───────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setGenerating();

    try {
      const formData = new FormData();
      formData.set("action", "generate");

      const result = await chatMealPlan(null, formData);

      if (result.success && result.mealPlanId) {
        setGenerationResult({
          mealPlanId: result.mealPlanId,
          mealCount: result.mealCount,
        });
        advanceStep("complete");
        setComplete();
      } else {
        setGenerationResult({
          error: result.error ?? "Unknown error during generation",
        });
      }
    } catch (error) {
      setGenerationResult({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate meal plan",
      });
    }
  }, [setGenerating, setComplete, advanceStep]);

  // ─── Handle PDF Upload ─────────────────────────────────────────────────

  const handleFileSelected = useCallback(
    async (file: File) => {
      setPdfState({ uploading: true, error: null });

      try {
        const formData = new FormData();
        formData.set("file", file);

        const result = await uploadFileForChat(null, formData);

        if (result.success && result.rawText) {
          setPdfData({
            rawText: result.rawText,
            extractedAt: new Date().toISOString(),
          });
          setPdfState({ uploading: false, error: null });
        } else {
          setPdfState({
            uploading: false,
            error: result.error ?? "Failed to process file",
          });
        }
      } catch {
        setPdfState({
          uploading: false,
          error: "Network error. Please try again.",
        });
      }
    },
    [setPdfData]
  );

  // ─── Send Message Handler ──────────────────────────────────────────────

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      sendMessage({ text: input });
      setInput("");
    },
    [input, isLoading, sendMessage]
  );

  // ─── Navigate to generated plan ────────────────────────────────────────

  const viewMealPlan = useCallback(() => {
    router.push("/meal-plans");
  }, [router]);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
          <span>
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <span>{STEP_LABELS[step] ?? step}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${Math.round(((stepIndex + 1) / totalSteps) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-lg">AI Nutritionist Chat</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">
                  Let&apos;s create your meal plan!
                </p>
                <p className="text-sm">
                  Tell me about your health goals and I&apos;ll create a
                  personalized weekly meal plan for you.
                </p>
              </div>
            )}

            {messages.map((message) => {
              const text = getMessageText(message.parts as unknown[]);
              if (!text && message.role !== "user") return null;

              return (
                <ChatMessage
                  key={message.id}
                  message={{
                    id: message.id,
                    role: message.role as "user" | "assistant",
                    content: text,
                  }}
                />
              );
            })}

            {/* Data Confirmation Card */}
            {step === "confirm_generation" && (
              <Card className="border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Review Your Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Goal */}
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium min-w-[100px]">Goal:</span>
                    <span className="text-sm">
                      {collectedData.preferences?.goal ? (
                        <span className="capitalize">{collectedData.preferences.goal}</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Not specified
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Activity Level */}
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium min-w-[100px]">Activity:</span>
                    <span className="text-sm">
                      {collectedData.preferences?.activityLevel ? (
                        <span className="capitalize">{collectedData.preferences.activityLevel}</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Not specified
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Allergies */}
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium min-w-[100px]">Allergies:</span>
                    <span className="text-sm">
                      {collectedData.preferences?.allergies && collectedData.preferences.allergies.length > 0 ? (
                        <span>{collectedData.preferences.allergies.join(", ")}</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </span>
                  </div>

                  {/* Forbidden Foods */}
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium min-w-[100px]">Avoid:</span>
                    <span className="text-sm">
                      {collectedData.preferences?.forbiddenFoods && collectedData.preferences.forbiddenFoods.length > 0 ? (
                        <span>{collectedData.preferences.forbiddenFoods.join(", ")}</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </span>
                  </div>

                  {/* File Upload Indicator */}
                  {collectedData.pdfData && (
                    <div className="flex items-start gap-2 pt-1 border-t">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        Nutrition report uploaded
                      </span>
                    </div>
                  )}

                  {/* Confirm Button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      onClick={() => {
                        advanceStep("generating");
                        setGenerating();
                        handleGenerate();
                      }}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Confirm & Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generation Status */}
            {step === "generating" && (
              <div className="flex items-center justify-center gap-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating your personalized meal plan...</span>
              </div>
            )}

            {/* Generation Result */}
            {generationResult?.mealPlanId && (
              <Alert>
                <AlertDescription className="flex items-center justify-between gap-4">
                  <span>
                    Meal plan created with{" "}
                    {generationResult.mealCount ?? 28} meals!
                  </span>
                  <Button size="sm" onClick={viewMealPlan}>
                    View Meal Plan
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {generationResult?.error && (
              <Alert variant="destructive">
                <AlertDescription>{generationResult.error}</AlertDescription>
              </Alert>
            )}

            {chatError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {chatError.message ?? "An error occurred with the chat."}
                </AlertDescription>
              </Alert>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area — hide when complete */}
          {step !== "complete" && (
            <div className="border-t px-4 py-3 space-y-2">
              {/* File Upload Button (only in collect_pdf_input step) */}
              {step === "collect_pdf_input" && (
                <FileUploadButton
                  onFileSelected={handleFileSelected}
                  uploading={pdfState.uploading}
                  error={pdfState.error}
                  onClearError={() =>
                    setPdfState((prev) => ({ ...prev, error: null }))
                  }
                />
              )}

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isLoading
                      ? "Waiting for response..."
                      : "Type your message..."
                  }
                  disabled={isLoading || step === "generating"}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Chat message input"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={
                    isLoading || step === "generating" || !input.trim()
                  }
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>

              {/* Skip file upload button */}
              {step === "collect_pdf_input" && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      advanceStep("confirm_generation");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Skip — I don&apos;t have a nutrition report
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset button after completion */}
      {step === "complete" && (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetGenerationTrigger(userId);
              setGenerationResult(null);
              window.location.reload();
            }}
          >
            Start New Chat
          </Button>
        </div>
      )}
    </div>
  );
}

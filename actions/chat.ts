"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  chatTools,
  setToolSessionId,
  setGenerationTriggered,
} from "@/lib/chat-tools";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateMealPlan } from "@/lib/diet-service";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ChatMealPlanResult {
  success: boolean;
  error?: string;
  mealPlanId?: string;
  mealCount?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────

const MODEL = openai("gpt-4o-mini");

const SYSTEM_PROMPT = `You are a nutritionist AI assistant for Dietista, a meal planning app.
Your job is to collect information from the user to generate a personalized weekly meal plan.

You MUST use the available tools to collect data:
1. **extractPreferences** — when the user mentions their goal (lose/maintain/gain), activity level, or food allergies, call this tool to save the information.
2. **extractPdfData** — when the server tells you PDF data was extracted, call this tool to process the summarized findings.
3. **confirmGeneration** — when you have gathered ALL of the following, call this tool to trigger meal plan generation:
   - User's goal (lose, maintain, or gain)
   - User's activity level (sedentary, light, moderate, active, or veryActive)
   - Any food allergies or forbidden foods (can be empty)

Conversation flow:
1. Start by greeting the user warmly and asking about their health/fitness goal.
2. Ask about their activity level.
3. Ask about any food allergies or dietary restrictions.
4. Optionally, ask if they have a nutrition report (PDF) to upload.
5. Once all data is collected, announce you're ready and call confirmGeneration.

Be friendly, encouraging, and concise. Speak in the user's language when possible.
Never make up nutritional data — always extract it from the user's input or uploaded files.

IMPORTANT: Always respond in the same language the user is writing in.`;

/**
 * Chat Meal Plan Server Action
 *
 * Handles non-streaming concerns: auth check, rate limiting, profile validation,
 * and triggering meal plan generation. The actual AI chat streaming is handled
 * by the API route via {@link createChatStream}.
 */
export async function chatMealPlan(
  _prevState: ChatMealPlanResult | null,
  formData: FormData
): Promise<ChatMealPlanResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "You must be logged in to use the chat." };
  }

  // Rate limiting — 10 messages per minute per user
  const rateLimitKey = `chat:${session.userId}`;
  const rateCheck = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error:
        "Rate limit exceeded. Please wait a moment before sending another message.",
    };
  }

  // Check profile exists
  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });
  if (!profile) {
    return {
      success: false,
      error:
        "Please complete your profile before generating a meal plan.",
    };
  }

  // Handle generation trigger from form data
  const action = formData.get("action") as string | null;
  if (action === "generate") {
    try {
      const result = await generateMealPlan(session.userId);
      return {
        success: true,
        mealPlanId: result.mealPlanId,
        mealCount: result.mealCount,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate meal plan";
      return { success: false, error: message };
    }
  }

  return { success: true };
}

/**
 * Create a streamText response for the chat conversation.
 * Called from the API route (not as a direct Server Action).
 */
export async function createChatStream(
  messages: UIMessage[],
  userId: string
) {
  // Set the tool session ID so tools write to the correct store
  setToolSessionId(userId);

  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: chatTools,
    onFinish: ({ toolResults }) => {
      // After the AI finishes, check if confirmGeneration was called
      const generationConfirmed = toolResults?.some(
        (t) =>
          t.toolName === "confirmGeneration" &&
          typeof t.output === "object" &&
          t.output !== null &&
          (t.output as Record<string, unknown>).confirmed === true
      );

      if (generationConfirmed) {
        setGenerationTriggered(userId, true);
      }
    },
  });

  return result;
}

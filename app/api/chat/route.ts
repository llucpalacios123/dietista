import { auth } from "@/lib/auth-config";
import { createChatStream } from "@/actions/chat";
import { NextRequest, NextResponse } from "next/server";
import type { UIMessage } from "ai";

export const maxDuration = 30;

/**
 * POST /api/chat
 *
 * Streams an AI-powered nutritionist chat conversation.
 * The AI uses tools to collect user preferences and trigger meal plan generation.
 *
 * Request body: { messages: UIMessage[] }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { messages: UIMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "Missing or invalid messages array" },
      { status: 400 }
    );
  }

  try {
    const result = await createChatStream(body.messages, session.userId);
    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

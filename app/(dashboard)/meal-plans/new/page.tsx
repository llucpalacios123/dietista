import { auth } from "@/lib/auth-config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatInterface } from "@/components/chat/chat-interface";

/**
 * Chat-based meal plan generation page.
 *
 * Requires authentication and a completed profile.
 * Renders the AI-powered chat interface for collecting user preferences
 * and generating a personalized weekly meal plan.
 */
export default async function NewMealPlanPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  // Verify profile exists
  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  if (!profile) {
    redirect("/profile?error=profile_required");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">New Meal Plan</h1>
        <p className="mt-1 text-muted-foreground">
          Chat with our AI nutritionist to create a personalized meal plan
        </p>
      </div>

      <ChatInterface userId={session.userId} />
    </div>
  );
}

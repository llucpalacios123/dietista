// ─── In-Memory Job Queue for Meal Plan Generation ─────────────────────────

export interface GenerationJob {
  id: string;
  userId: string;
  status: "pending" | "processing" | "completed" | "failed";
  mealPlanId?: string;
  error?: string;
  createdAt: number;
}

export const jobStore = new Map<string, GenerationJob>();

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ─── Response types ───────────────────────────────────────────────────────────

type ModelMetric = {
  model: string | null;
  count: number;
  avgDurationMs: number | null;
};

type FeatureMetrics = {
  total: number;
  regenerated: number;
  acceptanceRate: number; // (total - regenerated) / total, 0 if total=0
  byModel: ModelMetric[];
};

type AiMetricsResponse = {
  diet: FeatureMetrics;
  workout: FeatureMetrics;
  generatedAt: string; // ISO 8601
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: Request): Promise<Response> {
  // Authentication: validate x-admin-secret header
  const secret = req.headers.get("x-admin-secret");
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Diet metrics
  const [dietGroupBy, dietTotal, dietRegenerated] = await Promise.all([
    prisma.mealPlan.groupBy({
      by: ["aiModel"],
      _count: { _all: true },
      _avg: { generationDurationMs: true },
    }),
    prisma.mealPlan.count(),
    prisma.mealPlan.count({ where: { wasRegenerated: true } }),
  ]);

  // Workout metrics
  const [workoutGroupBy, workoutTotal, workoutRegenerated] = await Promise.all([
    prisma.workoutPlan.groupBy({
      by: ["aiModel"],
      _count: { _all: true },
      _avg: { generationDurationMs: true },
    }),
    prisma.workoutPlan.count(),
    prisma.workoutPlan.count({ where: { wasRegenerated: true } }),
  ]);

  const dietMetrics: FeatureMetrics = {
    total: dietTotal,
    regenerated: dietRegenerated,
    acceptanceRate: dietTotal === 0 ? 0 : (dietTotal - dietRegenerated) / dietTotal,
    byModel: dietGroupBy.map((row) => ({
      model: row.aiModel,
      count: row._count._all,
      avgDurationMs: row._avg.generationDurationMs ?? null,
    })),
  };

  const workoutMetrics: FeatureMetrics = {
    total: workoutTotal,
    regenerated: workoutRegenerated,
    acceptanceRate: workoutTotal === 0 ? 0 : (workoutTotal - workoutRegenerated) / workoutTotal,
    byModel: workoutGroupBy.map((row) => ({
      model: row.aiModel,
      count: row._count._all,
      avgDurationMs: row._avg.generationDurationMs ?? null,
    })),
  };

  const response: AiMetricsResponse = {
    diet: dietMetrics,
    workout: workoutMetrics,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}

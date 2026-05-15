import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-error";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/meal-logs
 * Returns the user's meal logs filtered by optional date range.
 * Query params: startDate (ISO), endDate (ISO)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return apiError("Unauthorized", 401);
  }

  const userId = session.userId;
  const searchParams = req.nextUrl.searchParams;

  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Prisma.MealLogWhereInput = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      (where.date as Record<string, unknown>).gte = new Date(startDate);
    }
    if (endDate) {
      (where.date as Record<string, unknown>).lte = new Date(endDate);
    }
  }

  const logs = await prisma.mealLog.findMany({
    where,
    orderBy: { date: "desc" },
  });

  if (logs.length === 0) {
    return apiError("No meal logs found", 404);
  }

  return apiSuccess(logs);
}

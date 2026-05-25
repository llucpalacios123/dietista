import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const cursorParam = searchParams.get("cursor");
  const rawLimit = searchParams.get("limit");

  let limit = DEFAULT_LIMIT;
  if (rawLimit) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_LIMIT);
    }
  }

  // Resolve ISO timestamp cursor to a Prisma-compatible id cursor.
  // Prisma findMany cursor requires a unique field; createdAt is not unique.
  let cursorId: string | undefined;
  if (cursorParam) {
    const cursorRecord = await prisma.shoppingList.findFirst({
      where: { userId: session.userId, createdAt: new Date(cursorParam) },
      select: { id: true },
    });
    cursorId = cursorRecord?.id;
  }

  const lists = await prisma.shoppingList.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      mealPlanId: true,
      status: true,
      budget: true,
      totalEstimate: true,
      imageUrl: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  const hasMore = lists.length > limit;
  const result = lists.slice(0, limit);

  return NextResponse.json({
    lists: result.map((l) => ({
      id: l.id,
      mealPlanId: l.mealPlanId ?? undefined,
      status: l.status,
      budget: l.budget ?? undefined,
      totalEstimate: l.totalEstimate ?? undefined,
      imageUrl: l.imageUrl ?? undefined,
      itemCount: l._count.items,
      createdAt: l.createdAt.toISOString(),
    })),
    hasMore,
    nextCursor: hasMore ? result[result.length - 1].createdAt.toISOString() : null,
  });
}

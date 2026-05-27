import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Normalize to UTC midnight for day-based lookup
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const existing = await prisma.workoutSession.findFirst({
    where: {
      userId: session.userId,
      date: {
        gte: todayStart,
        lt: tomorrowStart,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  const created = await prisma.workoutSession.create({
    data: {
      userId: session.userId,
      date: todayStart,
    },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}

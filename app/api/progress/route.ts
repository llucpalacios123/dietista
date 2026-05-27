import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { weightEntrySchema } from "@/lib/schemas";

export async function GET(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const [weightLogs, snapshots] = await Promise.all([
    prisma.weightLog.findMany({
      where: {
        userId: session.userId,
        date: { gte: cutoffDate },
      },
      orderBy: { date: "asc" },
    }),
    prisma.progressSnapshot.findMany({
      where: {
        userId: session.userId,
        date: { gte: cutoffDate },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  return NextResponse.json({
    weights: weightLogs.map((w) => ({
      id: w.id,
      date: w.date.toISOString(),
      weight: w.weight,
      notes: w.notes,
    })),
    snapshots: snapshots.map((s) => ({
      date: s.date.toISOString(),
      totalCalories: s.totalCalories,
      totalProtein: s.totalProtein,
      totalCarbs: s.totalCarbs,
      totalFat: s.totalFat,
      adherenceScore: s.adherenceScore,
      mealsLogged: s.mealsLogged,
    })),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = weightEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  // Normalize to UTC midnight to satisfy @@unique([userId, date]) constraint
  const rawDate = parsed.data.date ? new Date(parsed.data.date) : new Date();
  const weightDate = new Date(rawDate.setUTCHours(0, 0, 0, 0));

  try {
    const entry = await prisma.weightLog.upsert({
      where: {
        userId_date: {
          userId: session.userId,
          date: weightDate,
        },
      },
      create: {
        userId: session.userId,
        weight: parsed.data.weight,
        date: weightDate,
        notes: parsed.data.notes,
      },
      update: {
        weight: parsed.data.weight,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json({
      id: entry.id,
      date: entry.date.toISOString(),
      weight: entry.weight,
    });
  } catch {
    return NextResponse.json({ error: "Error al guardar el peso" }, { status: 500 });
  }
}

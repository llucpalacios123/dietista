import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { workoutSetSchema } from "@/lib/schemas";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = workoutSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sessionId, exerciseName, muscleGroup, reps, weightKg, notes } = parsed.data;

  // Verify session exists and belongs to the current user
  const workoutSession = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: session.userId },
  });

  if (!workoutSession) {
    return NextResponse.json(
      { error: "Sesión no encontrada o acceso denegado" },
      { status: 403 }
    );
  }

  // Compute setNumber: count of existing sets with same exerciseName in session + 1
  const existingCount = await prisma.workoutSet.count({
    where: { sessionId, exerciseName },
  });

  const workoutSet = await prisma.workoutSet.create({
    data: {
      sessionId,
      exerciseName,
      muscleGroup,
      setNumber: existingCount + 1,
      reps,
      weightKg,
      notes,
    },
  });

  return NextResponse.json(workoutSet, { status: 201 });
}

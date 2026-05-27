import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { bulkWorkoutSetSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let parsed: ReturnType<typeof bulkWorkoutSetSchema.parse>;
  try {
    parsed = bulkWorkoutSetSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify session ownership
  const workoutSession = await prisma.workoutSession.findFirst({
    where: { id: parsed.sessionId, userId: session.userId },
  });
  if (!workoutSession) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // Create all sets atomically
  const createdSets = await prisma.$transaction(
    parsed.sets.map((s) =>
      prisma.workoutSet.create({
        data: {
          sessionId: parsed.sessionId,
          exerciseName: parsed.exerciseName,
          muscleGroup: parsed.muscleGroup,
          setNumber: s.setNumber,
          plannedReps: s.plannedReps,
          plannedWeightKg: s.plannedWeightKg ?? null,
          reps: null,
        },
      }),
    ),
  );

  return NextResponse.json(
    { sets: createdSets.map((s) => ({ id: s.id, setNumber: s.setNumber })) },
    { status: 201 },
  );
}

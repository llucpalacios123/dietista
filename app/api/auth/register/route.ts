import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/schemas";
import { hashPassword, getUserByEmail, createUser } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Entrada no válida", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;

    // Check for duplicate email
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email ya registrado" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    await createUser(email, passwordHash);

    return NextResponse.json(
      { message: "Usuario creado correctamente" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

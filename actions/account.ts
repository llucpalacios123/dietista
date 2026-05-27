"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { accountNameSchema, changePasswordSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────

export interface AccountActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// ─── updateName ───────────────────────────────────────────────────────────

export async function updateName(
  _prevState: AccountActionResult | null,
  formData: FormData
): Promise<AccountActionResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "Debes iniciar sesión para actualizar tu nombre" };
  }

  const raw = { name: formData.get("name") as string };
  const parsed = accountNameSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const nameValue = parsed.data.name.trim() === "" ? null : parsed.data.name.trim();

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { name: nameValue },
    });
  } catch (error) {
    console.error("[updateName] Database error for user", session.userId, error);
    return {
      success: false,
      error: "No se ha podido actualizar el nombre. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/perfil");

  return { success: true, data: { message: "Nombre actualizado correctamente" } };
}

// ─── changePassword ───────────────────────────────────────────────────────

export async function changePassword(
  _prevState: AccountActionResult | null,
  formData: FormData
): Promise<AccountActionResult> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "Debes iniciar sesión para cambiar tu contraseña" };
  }

  const raw = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const isCurrentPasswordValid = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash
  );

  if (!isCurrentPasswordValid) {
    return {
      success: false,
      error: "La contraseña actual no es correcta",
    };
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newHash },
    });
  } catch (error) {
    console.error("[changePassword] Database error for user", session.userId, error);
    return {
      success: false,
      error: "No se ha podido actualizar la contraseña. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/perfil");

  return { success: true, data: { message: "Contraseña actualizada correctamente" } };
}

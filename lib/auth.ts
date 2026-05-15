import { prisma } from "./prisma";
import type { User } from "@prisma/client";

export async function hashPassword(password: string): Promise<string> {
  const { hash } = await import("bcryptjs");
  return hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const { compare } = await import("bcryptjs");
  return compare(password, hash);
}

export async function getUserByEmail(email: string): Promise<User & { profile: {
  id: string;
  userId: string;
  weight: number;
  height: number;
  age: number;
  sex: string;
  goal: string;
  activityLevel: string;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  allergies: string[];
  forbiddenFoods: string[];
  createdAt: Date;
  updatedAt: Date;
} | null } | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { profile: true },
  });
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
    },
  });
}

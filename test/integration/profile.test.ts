import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDB, teardownTestDB, cleanDatabase } from "../test-db";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { profileSchema } from "@/lib/schemas";

let prisma: PrismaClient;

beforeAll(async () => {
  const db = await setupTestDB();
  prisma = db.prisma;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await cleanDatabase(prisma);
});

describe("Profile schema validation", () => {
  it("accepts valid profile data", () => {
    const result = profileSchema.safeParse({
      weight: 70,
      height: 175,
      age: 30,
      sex: "male",
      goal: "lose",
      activityLevel: "moderate",
      allergies: [],
      forbiddenFoods: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative weight", () => {
    const result = profileSchema.safeParse({
      weight: -5,
      height: 175,
      age: 30,
      sex: "male",
      goal: "lose",
      activityLevel: "moderate",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message.includes("positive"))).toBe(true);
    }
  });

  it("rejects missing required fields", () => {
    const result = profileSchema.safeParse({
      weight: 70,
      // missing height, age, sex, goal, activityLevel
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid enum values", () => {
    const result = profileSchema.safeParse({
      weight: 70,
      height: 175,
      age: 30,
      sex: "invalid",
      goal: "lose",
      activityLevel: "moderate",
    });
    expect(result.success).toBe(false);
  });
});

describe("Profile CRUD operations", () => {
  async function createTestUser() {
    return prisma.user.create({
      data: {
        email: "profile-test@example.com",
        passwordHash: await hashPassword("Password1"),
      },
    });
  }

  describe("create profile", () => {
    it("creates a profile for a user", async () => {
      const user = await createTestUser();

      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          weight: 70,
          height: 175,
          age: 30,
          sex: "male",
          goal: "lose",
          activityLevel: "moderate",
        },
      });

      expect(profile.userId).toBe(user.id);
      expect(profile.weight).toBe(70);
      expect(profile.height).toBe(175);
      expect(profile.age).toBe(30);
      expect(profile.sex).toBe("male");
      expect(profile.goal).toBe("lose");
      expect(profile.activityLevel).toBe("moderate");
    });

    it("rejects duplicate profile (unique constraint on userId)", async () => {
      const user = await createTestUser();

      await prisma.profile.create({
        data: {
          userId: user.id,
          weight: 70,
          height: 175,
          age: 30,
          sex: "male",
          goal: "maintain",
          activityLevel: "moderate",
        },
      });

      await expect(
        prisma.profile.create({
          data: {
            userId: user.id,
            weight: 75,
            height: 180,
            age: 31,
            sex: "female",
            goal: "gain",
            activityLevel: "active",
          },
        })
      ).rejects.toThrow();
    });

    it("rejects profile creation for non-existent user (FK constraint)", async () => {
      await expect(
        prisma.profile.create({
          data: {
            userId: "non-existent-user-id",
            weight: 70,
            height: 175,
            age: 30,
            sex: "male",
            goal: "lose",
            activityLevel: "moderate",
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("update profile", () => {
    it("updates an existing profile", async () => {
      const user = await createTestUser();
      await prisma.profile.create({
        data: {
          userId: user.id,
          weight: 70,
          height: 175,
          age: 30,
          sex: "male",
          goal: "maintain",
          activityLevel: "moderate",
        },
      });

      const updated = await prisma.profile.update({
        where: { userId: user.id },
        data: {
          weight: 75,
          height: 180,
          age: 31,
          goal: "lose",
          activityLevel: "active",
        },
      });

      expect(updated.weight).toBe(75);
      expect(updated.height).toBe(180);
      expect(updated.age).toBe(31);
      expect(updated.goal).toBe("lose");
      expect(updated.activityLevel).toBe("active");
    });

    it("fails when profile does not exist", async () => {
      await expect(
        prisma.profile.update({
          where: { userId: "non-existent" },
          data: { weight: 75 },
        })
      ).rejects.toThrow();
    });
  });

  describe("get profile", () => {
    it("returns the user's profile", async () => {
      const user = await createTestUser();
      await prisma.profile.create({
        data: {
          userId: user.id,
          weight: 70,
          height: 175,
          age: 30,
          sex: "female",
          goal: "gain",
          activityLevel: "light",
        },
      });

      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      expect(profile).toBeDefined();
      expect(profile?.weight).toBe(70);
      expect(profile?.sex).toBe("female");
      expect(profile?.goal).toBe("gain");
    });

    it("returns null when user has no profile", async () => {
      const user = await createTestUser();

      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      expect(profile).toBeNull();
    });
  });

  describe("delete profile", () => {
    it("deletes an existing profile", async () => {
      const user = await createTestUser();
      await prisma.profile.create({
        data: {
          userId: user.id,
          weight: 70,
          height: 175,
          age: 30,
          sex: "male",
          goal: "maintain",
          activityLevel: "moderate",
        },
      });

      await prisma.profile.delete({
        where: { userId: user.id },
      });

      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });
      expect(profile).toBeNull();
    });
  });
});

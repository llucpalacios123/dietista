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

  describe("new profile fields", () => {
    it("accepts valid dietType enum values", () => {
      for (const dietType of ["omnivore", "vegetarian", "vegan", "pescatarian"]) {
        const result = profileSchema.safeParse({
          weight: 70,
          height: 175,
          age: 30,
          sex: "male",
          goal: "lose",
          activityLevel: "moderate",
          dietType,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid dietType values", () => {
      const result = profileSchema.safeParse({
        weight: 70,
        height: 175,
        age: 30,
        sex: "male",
        goal: "lose",
        activityLevel: "moderate",
        dietType: "carnivore",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid eatingOutFrequency values", () => {
      for (const freq of ["never", "rarely", "sometimes", "often"]) {
        const result = profileSchema.safeParse({
          weight: 70,
          height: 175,
          age: 30,
          sex: "male",
          goal: "lose",
          activityLevel: "moderate",
          eatingOutFrequency: freq,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts valid mealComplexity values", () => {
      for (const complexity of ["simple", "moderate", "advanced"]) {
        const result = profileSchema.safeParse({
          weight: 70,
          height: 175,
          age: 30,
          sex: "male",
          goal: "lose",
          activityLevel: "moderate",
          mealComplexity: complexity,
        });
        expect(result.success).toBe(true);
      }
    });

    it("accepts valid varietyPreference values", () => {
      for (const variety of ["low", "medium", "high"]) {
        const result = profileSchema.safeParse({
          weight: 70,
          height: 175,
          age: 30,
          sex: "male",
          goal: "lose",
          activityLevel: "moderate",
          varietyPreference: variety,
        });
        expect(result.success).toBe(true);
      }
    });

    it("applies defaults for boolean and array fields when not provided", () => {
      const result = profileSchema.safeParse({
        weight: 70,
        height: 175,
        age: 30,
        sex: "male",
        goal: "lose",
        activityLevel: "moderate",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeSnacks).toBe(false);
        expect(result.data.budgetFriendly).toBe(false);
        expect(result.data.mealsPerDay).toBe(3);
        expect(result.data.allergies).toEqual([]);
        expect(result.data.forbiddenFoods).toEqual([]);
        expect(result.data.favoriteFoods).toEqual([]);
      }
    });

    it("accepts full profile with all new fields", () => {
      const result = profileSchema.safeParse({
        weight: 70,
        height: 175,
        age: 30,
        sex: "male",
        goal: "lose",
        activityLevel: "moderate",
        dietType: "omnivore",
        cookingTimeAvailable: 45,
        eatingOutFrequency: "sometimes",
        includeSnacks: true,
        mealComplexity: "moderate",
        mealsPerDay: 4,
        varietyPreference: "high",
        budgetFriendly: true,
        weeklyBudget: 80,
        trainingRoutine: "strength 3x/week",
        favoriteFoods: ["chicken", "salmon"],
        allergies: ["peanuts"],
        forbiddenFoods: ["pork"],
      });
      expect(result.success).toBe(true);
    });
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
    it("creates a profile with all 23 fields", async () => {
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
          targetCalories: 2000,
          targetProtein: 150,
          targetCarbs: 250,
          targetFat: 65,
          allergies: ["peanuts", "shellfish"],
          forbiddenFoods: ["pork"],
          dietType: "omnivore",
          cookingTimeAvailable: 45,
          eatingOutFrequency: "sometimes",
          includeSnacks: true,
          mealComplexity: "moderate",
          mealsPerDay: 4,
          varietyPreference: "high",
          budgetFriendly: true,
          weeklyBudget: 80,
          trainingRoutine: "strength 3x/week, cardio 2x/week",
          favoriteFoods: ["chicken", "salmon", "avocado"],
        },
      });

      expect(profile.userId).toBe(user.id);
      expect(profile.weight).toBe(70);
      expect(profile.targetCalories).toBe(2000);
      expect(profile.dietType).toBe("omnivore");
      expect(profile.cookingTimeAvailable).toBe(45);
      expect(profile.eatingOutFrequency).toBe("sometimes");
      expect(profile.includeSnacks).toBe(true);
      expect(profile.mealComplexity).toBe("moderate");
      expect(profile.mealsPerDay).toBe(4);
      expect(profile.varietyPreference).toBe("high");
      expect(profile.budgetFriendly).toBe(true);
      expect(profile.weeklyBudget).toBe(80);
      expect(profile.trainingRoutine).toBe("strength 3x/week, cardio 2x/week");
      expect(profile.favoriteFoods).toEqual(["chicken", "salmon", "avocado"]);
      expect(profile.allergies).toEqual(["peanuts", "shellfish"]);
    });

    it("sets defaults for new boolean and numeric fields when not provided", async () => {
      const user = await createTestUser();

      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          weight: 70,
          height: 175,
          age: 30,
          sex: "female",
          goal: "maintain",
          activityLevel: "light",
        },
      });

      expect(profile.includeSnacks).toBe(false);
      expect(profile.budgetFriendly).toBe(false);
      expect(profile.mealsPerDay).toBe(3);
      expect(profile.favoriteFoods).toEqual([]);
      expect(profile.dietType).toBeNull();
      expect(profile.cookingTimeAvailable).toBeNull();
      expect(profile.eatingOutFrequency).toBeNull();
      expect(profile.mealComplexity).toBeNull();
      expect(profile.varietyPreference).toBeNull();
      expect(profile.weeklyBudget).toBeNull();
      expect(profile.trainingRoutine).toBeNull();
    });

    it("handles empty arrays for allergies, forbiddenFoods, and favoriteFoods", async () => {
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
          allergies: [],
          forbiddenFoods: [],
          favoriteFoods: [],
        },
      });

      expect(profile.allergies).toEqual([]);
      expect(profile.forbiddenFoods).toEqual([]);
      expect(profile.favoriteFoods).toEqual([]);
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
    it("updates an existing profile with partial new fields preserving existing values", async () => {
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
          dietType: "vegetarian",
          cookingTimeAvailable: 30,
          mealsPerDay: 3,
          includeSnacks: false,
        },
      });

      // Update only weight, goal, and dietType
      const updated = await prisma.profile.update({
        where: { userId: user.id },
        data: {
          weight: 75,
          goal: "lose",
          dietType: "vegan",
          mealsPerDay: 4,
          includeSnacks: true,
        },
      });

      // Updated fields
      expect(updated.weight).toBe(75);
      expect(updated.goal).toBe("lose");
      expect(updated.dietType).toBe("vegan");
      expect(updated.mealsPerDay).toBe(4);
      expect(updated.includeSnacks).toBe(true);

      // Preserved fields
      expect(updated.height).toBe(175);
      expect(updated.age).toBe(30);
      expect(updated.sex).toBe("male");
      expect(updated.activityLevel).toBe("moderate");
      expect(updated.cookingTimeAvailable).toBe(30);
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

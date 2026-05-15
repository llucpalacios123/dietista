import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { setupTestDB, teardownTestDB, cleanDatabase } from "../../test-db";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";

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

// Mock NextAuth's auth() to simulate authenticated sessions
function mockAuth(userId: string | null) {
  vi.doMock("@/lib/auth-config", () => ({
    auth: async () => (userId ? { userId, email: "test@example.com" } : null),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  }));
}

function unmockAuth() {
  vi.doUnmock("@/lib/auth-config");
}

describe("Profile Server Actions", () => {
  async function createTestUser() {
    return prisma.user.create({
      data: {
        email: "profile-test@example.com",
        passwordHash: await hashPassword("Password1"),
      },
    });
  }

  describe("createProfile", () => {
    it("creates a profile for authenticated user", async () => {
      const user = await createTestUser();
      mockAuth(user.id);

      // Clear module cache so it picks up the mock
      vi.resetModules();

      const { createProfile } = await import("@/actions/profile");

      const formData = new FormData();
      formData.append("weight", "70");
      formData.append("height", "175");
      formData.append("age", "30");
      formData.append("sex", "male");
      formData.append("goal", "lose");
      formData.append("activityLevel", "moderate");

      // createProfile calls redirect() on success, which throws in test env
      // We catch the redirect error
      try {
        await createProfile(null, formData);
      } catch (e: unknown) {
        // redirect() throws a special NEXT_REDIRECT error — this is expected
        const err = e as { digest?: string };
        if (err.digest?.includes("NEXT_REDIRECT")) {
          // Success — redirect was called
          const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
          });
          expect(profile).toBeDefined();
          expect(profile?.weight).toBe(70);
          expect(profile?.height).toBe(175);
          expect(profile?.age).toBe(30);
          expect(profile?.sex).toBe("male");
          expect(profile?.goal).toBe("lose");
          expect(profile?.activityLevel).toBe("moderate");
        } else {
          throw e;
        }
      }

      unmockAuth();
    });

    it("rejects unauthenticated user", async () => {
      mockAuth(null);
      vi.resetModules();

      const { createProfile } = await import("@/actions/profile");

      const formData = new FormData();
      formData.append("weight", "70");

      const result = await createProfile(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("logged in");

      unmockAuth();
    });

    it("rejects if profile already exists", async () => {
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

      mockAuth(user.id);
      vi.resetModules();

      const { createProfile } = await import("@/actions/profile");

      const formData = new FormData();
      formData.append("weight", "75");

      const result = await createProfile(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");

      unmockAuth();
    });

    it("rejects invalid profile data", async () => {
      const user = await createTestUser();
      mockAuth(user.id);
      vi.resetModules();

      const { createProfile } = await import("@/actions/profile");

      const formData = new FormData();
      formData.append("weight", "-5"); // invalid: negative
      formData.append("height", "175");
      formData.append("age", "30");
      formData.append("sex", "male");
      formData.append("goal", "lose");
      formData.append("activityLevel", "moderate");

      const result = await createProfile(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("positive");

      unmockAuth();
    });

    it("rejects missing required fields", async () => {
      const user = await createTestUser();
      mockAuth(user.id);
      vi.resetModules();

      const { createProfile } = await import("@/actions/profile");

      const formData = new FormData();
      formData.append("weight", "70");
      // missing height, age, sex, goal, activityLevel

      const result = await createProfile(null, formData);
      expect(result.success).toBe(false);

      unmockAuth();
    });
  });

  describe("updateProfile", () => {
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

      mockAuth(user.id);
      vi.resetModules();

      const { updateProfile } = await import("@/actions/profile");

      const formData = new FormData();
      formData.append("weight", "75");
      formData.append("height", "180");
      formData.append("age", "31");
      formData.append("sex", "male");
      formData.append("goal", "lose");
      formData.append("activityLevel", "active");

      const result = await updateProfile(null, formData);
      expect(result.success).toBe(true);

      const updated = await prisma.profile.findUnique({
        where: { userId: user.id },
      });
      expect(updated?.weight).toBe(75);
      expect(updated?.height).toBe(180);
      expect(updated?.age).toBe(31);
      expect(updated?.goal).toBe("lose");
      expect(updated?.activityLevel).toBe("active");

      unmockAuth();
    });

    it("rejects unauthenticated update", async () => {
      mockAuth(null);
      vi.resetModules();

      const { updateProfile } = await import("@/actions/profile");

      const formData = new FormData();
      formData.append("weight", "75");

      const result = await updateProfile(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("logged in");

      unmockAuth();
    });
  });

  describe("getProfile", () => {
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

      mockAuth(user.id);
      vi.resetModules();

      const { getProfile } = await import("@/actions/profile");

      // getProfile calls redirect if not authenticated, but we are authenticated
      // It doesn't redirect when profile exists, just returns it
      try {
        const result = await getProfile();
        expect(result.profile).toBeDefined();
        expect(result.profile?.weight).toBe(70);
        expect(result.profile?.sex).toBe("female");
      } catch (e: unknown) {
        const err = e as { digest?: string };
        if (err.digest?.includes("NEXT_REDIRECT")) {
          // Unexpected redirect — test should fail
          expect.fail("getProfile should not redirect for authenticated user with profile");
        } else {
          throw e;
        }
      }

      unmockAuth();
    });

    it("returns null profile when user has no profile", async () => {
      const user = await createTestUser();

      mockAuth(user.id);
      vi.resetModules();

      const { getProfile } = await import("@/actions/profile");

      try {
        const result = await getProfile();
        expect(result.profile).toBeNull();
      } catch (e: unknown) {
        const err = e as { digest?: string };
        if (err.digest?.includes("NEXT_REDIRECT")) {
          expect.fail("getProfile should not redirect for authenticated user without profile");
        } else {
          throw e;
        }
      }

      unmockAuth();
    });
  });
});

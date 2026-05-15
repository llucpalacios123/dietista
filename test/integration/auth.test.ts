import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDB, teardownTestDB, cleanDatabase } from "../../test-db";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";

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

describe("POST /api/auth/register", () => {
  async function callRegister(body: Record<string, unknown>) {
    // Import the route handler dynamically so it uses the test DB
    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const response = await POST(request);
    const data = await response.json();
    return { status: response.status, data };
  }

  it("registers a new user with valid credentials", async () => {
    const { status, data } = await callRegister({
      email: "newuser@example.com",
      password: "SecurePass1",
    });

    expect(status).toBe(201);
    expect(data).toHaveProperty("message", "User created successfully");

    // Verify user was created in DB
    const user = await prisma.user.findUnique({
      where: { email: "newuser@example.com" },
    });
    expect(user).toBeDefined();
    expect(user?.email).toBe("newuser@example.com");
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe("SecurePass1"); // Should be hashed
  });

  it("rejects duplicate email", async () => {
    // Create a user first
    await prisma.user.create({
      data: {
        email: "duplicate@example.com",
        passwordHash: await hashPassword("Password1"),
      },
    });

    const { status, data } = await callRegister({
      email: "duplicate@example.com",
      password: "AnotherPass1",
    });

    expect(status).toBe(409);
    expect(data).toHaveProperty("error", "Email already registered");
  });

  it("rejects weak password", async () => {
    const { status, data } = await callRegister({
      email: "weak@example.com",
      password: "short",
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty("error", "Invalid input");
    expect(data).toHaveProperty("details");
  });

  it("rejects invalid email", async () => {
    const { status, data } = await callRegister({
      email: "not-an-email",
      password: "SecurePass1",
    });

    expect(status).toBe(400);
    expect(data).toHaveProperty("error", "Invalid input");
  });

  it("normalizes email to lowercase", async () => {
    const { status } = await callRegister({
      email: "UPPERCASE@Example.COM",
      password: "SecurePass1",
    });

    expect(status).toBe(201);

    const user = await prisma.user.findUnique({
      where: { email: "uppercase@example.com" },
    });
    expect(user).toBeDefined();
  });

  it("rejects missing fields", async () => {
    const { status } = await callRegister({
      email: "test@example.com",
      // missing password
    });

    expect(status).toBe(400);
  });
});

describe("Login (authorize function)", () => {
  it("authenticates with valid credentials", async () => {
    const password = "MyPassword1";
    await prisma.user.create({
      data: {
        email: "login-test@example.com",
        passwordHash: await hashPassword(password),
      },
    });

    // Test the authorize logic directly
    const { handlers, signIn, signOut, auth } = await import("@/lib/auth-config");
    // The authorize function is internal to NextAuth config, so we test via signIn
    // For integration, we verify the user can be looked up and password verified
    const { getUserByEmail, verifyPassword } = await import("@/lib/auth");

    const user = await getUserByEmail("login-test@example.com");
    expect(user).toBeDefined();

    const isValid = await verifyPassword(password, user!.passwordHash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("wrongpassword", user!.passwordHash);
    expect(isInvalid).toBe(false);
  });

  it("returns null for non-existent user", async () => {
    const { getUserByEmail } = await import("@/lib/auth");
    const user = await getUserByEmail("nonexistent@example.com");
    expect(user).toBeNull();
  });
});

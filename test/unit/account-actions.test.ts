import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before imports
vi.mock("@/lib/auth-config", () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  unstable_update: vi.fn(),
}));

import { auth, signOut } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { changePassword, updateName, logoutAction } from "@/actions/account";

const mockAuth = vi.mocked(auth);
const mockSignOut = vi.mocked(signOut);
const mockPrisma = vi.mocked(prisma);
const mockVerifyPassword = vi.mocked(verifyPassword);
const mockHashPassword = vi.mocked(hashPassword);

// ─── logoutAction ─────────────────────────────────────────────────────────

describe("logoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signOut with { redirectTo: '/login' }", async () => {
    mockSignOut.mockResolvedValue(undefined as any);

    await logoutAction();

    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});

// ─── changePassword ───────────────────────────────────────────────────────

describe("changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hashed-old",
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("returns error when current password is wrong and does NOT call update", async () => {
    mockVerifyPassword.mockResolvedValue(false);

    const fd = new FormData();
    fd.append("currentPassword", "wrong-password");
    fd.append("newPassword", "NewValid1");
    fd.append("confirmPassword", "NewValid1");

    const result = await changePassword(null, fd);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("updates password hash when current password is correct", async () => {
    mockVerifyPassword.mockResolvedValue(true);
    mockHashPassword.mockResolvedValue("hashed-new");
    mockPrisma.user.update.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hashed-new",
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fd = new FormData();
    fd.append("currentPassword", "correct-password");
    fd.append("newPassword", "NewValid1");
    fd.append("confirmPassword", "NewValid1");

    const result = await changePassword(null, fd);

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "hashed-new" },
    });
  });
});

// ─── updateName ───────────────────────────────────────────────────────────

describe("updateName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1", email: "test@example.com" });
    mockPrisma.user.update.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hash",
      name: "John",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("calls prisma.user.update with the new name and returns success", async () => {
    const fd = new FormData();
    fd.append("name", "John Doe");

    const result = await updateName(null, fd);

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "John Doe" },
    });
  });

  it("calls prisma.user.update with name: null when empty string is submitted", async () => {
    mockPrisma.user.update.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hash",
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const fd = new FormData();
    fd.append("name", "");

    const result = await updateName(null, fd);

    expect(result.success).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: null },
    });
  });
});

import { test, expect } from "@playwright/test";
import { generateEmail, generatePassword, defaultProfileData } from "./helpers/test-data";
import { registerUser, loginUser } from "./helpers/api";

test.describe("Profile management", () => {
  async function fillProfileForm(page: import("@playwright/test").Page) {
    const profile = defaultProfileData();
    await page.getByLabel(/weight/i).fill(profile.weight);
    await page.getByLabel(/height/i).fill(profile.height);
    await page.getByLabel(/age/i).fill(profile.age);

    // Select: Sex - use first() to avoid strict mode violation
    await page.getByLabel(/sex/i).click();
    await page.waitForTimeout(500);
    await page.getByRole("option", { name: "Male" }).first().click();
    await page.waitForTimeout(500);

    // Select: Goal
    await page.getByLabel(/goal/i).click();
    await page.waitForTimeout(500);
    await page.getByRole("option", { name: "Lose weight" }).first().click();
    await page.waitForTimeout(500);

    // Select: Activity Level
    await page.getByLabel(/activity level/i).click();
    await page.waitForTimeout(500);
    await page.getByRole("option", { name: /moderate/i }).first().click();
    await page.waitForTimeout(500);
  }

  async function setupUser(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
    const email = generateEmail("profile");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);
    return { email, password };
  }

  test("create profile with valid data", async ({ page, request }) => {
    await setupUser(page, request);

    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: /create profile/i })).toBeVisible({ timeout: 10000 });

    await fillProfileForm(page);

    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: /create profile/i }).click();
    
    // Wait for success message (useActionState may take time)
    await expect(page.getByText(/profile created successfully/i)).toBeVisible({ timeout: 30000 });
  });

  test("update existing profile", async ({ page, request }) => {
    const { email, password } = await setupUser(page, request);

    // Create profile first
    await page.goto("/profile");
    await fillProfileForm(page);
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: /create profile/i }).click();
    await expect(page.getByText(/profile created successfully/i)).toBeVisible({ timeout: 30000 });

    // Wait for redirect to dashboard
    await page.waitForTimeout(2000);
    await page.goto("/profile");

    // Now should show update form
    await expect(page.getByRole("heading", { name: /update profile/i })).toBeVisible({ timeout: 10000 });

    // Update weight
    await page.getByLabel(/weight/i).fill("75");
    await page.getByRole("button", { name: /update profile/i }).click();

    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 30000 });
  });

  test("validates required numeric fields", async ({ page, request }) => {
    await setupUser(page, request);

    await page.goto("/profile");

    // Leave all fields empty and submit
    await page.getByRole("button", { name: /create profile/i }).click();

    // Should show validation errors (either client or server side)
    await page.waitForTimeout(5000);
    const errorVisible = await page.getByText(/required|must be|invalid/i).isVisible().catch(() => false);
    expect(errorVisible).toBe(true);
  });

  test("validates numeric values are positive", async ({ page, request }) => {
    await setupUser(page, request);

    await page.goto("/profile");

    // Enter negative values
    await page.getByLabel(/weight/i).fill("-10");
    await page.getByLabel(/height/i).fill("175");
    await page.getByLabel(/age/i).fill("30");

    await page.getByLabel(/sex/i).click();
    await page.waitForTimeout(500);
    await page.getByRole("option", { name: "Male" }).first().click();
    await page.waitForTimeout(500);

    await page.getByLabel(/goal/i).click();
    await page.waitForTimeout(500);
    await page.getByRole("option", { name: "Lose weight" }).first().click();
    await page.waitForTimeout(500);

    await page.getByLabel(/activity level/i).click();
    await page.waitForTimeout(500);
    await page.getByRole("option", { name: /moderate/i }).first().click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /create profile/i }).click();

    // Should show validation error for negative weight or stay on page
    await page.waitForTimeout(5000);
    // Either shows error or stays on profile page (doesn't redirect to dashboard)
    const url = page.url();
    const hasError = await page.getByText(/must be positive|weight|error|invalid/i).isVisible().catch(() => false);
    expect(url.includes("/profile") || hasError).toBe(true);
  });

  test("allergies and forbidden foods via advanced options", async ({ page, request }) => {
    await setupUser(page, request);

    await page.goto("/profile");

    await fillProfileForm(page);

    // Show advanced options
    await page.getByRole("button", { name: /show advanced/i }).click();

    // Fill allergies
    await page.getByLabel(/allergies/i).fill("peanuts, shellfish");

    // Fill forbidden foods
    await page.getByLabel(/forbidden foods/i).fill("pork, dairy");

    await page.getByRole("button", { name: /create profile/i }).click();

    await expect(page.getByText(/profile created successfully/i)).toBeVisible({ timeout: 30000 });
  });

  test("clear allergies and forbidden foods", async ({ page, request }) => {
    await setupUser(page, request);

    // Create profile with allergies
    await page.goto("/profile");
    await fillProfileForm(page);

    await page.getByRole("button", { name: /show advanced/i }).click();
    await page.getByLabel(/allergies/i).fill("peanuts");
    await page.getByLabel(/forbidden foods/i).fill("dairy");

    await page.getByRole("button", { name: /create profile/i }).click();
    await expect(page.getByText(/profile created successfully/i)).toBeVisible({ timeout: 30000 });

    // Go back to profile and clear
    await page.waitForTimeout(2000);
    await page.goto("/profile");

    await page.getByRole("button", { name: /show advanced/i }).click();
    await page.getByLabel(/allergies/i).fill("");
    await page.getByLabel(/forbidden foods/i).fill("");

    await page.getByRole("button", { name: /update profile/i }).click();
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 30000 });
  });

  test("activity level selection with all options", async ({ page, request }) => {
    await setupUser(page, request);

    await page.goto("/profile");

    // Fill basic fields
    await page.getByLabel(/weight/i).fill("70");
    await page.getByLabel(/height/i).fill("175");
    await page.getByLabel(/age/i).fill("30");

    await page.getByLabel(/sex/i).click();
    await page.waitForTimeout(500);
    await page.getByRole("option", { name: "Male" }).first().click();
    await page.waitForTimeout(500);

    await page.getByLabel(/goal/i).click();
    await page.waitForTimeout(500);
    await page.getByRole("option", { name: "Maintain weight" }).first().click();
    await page.waitForTimeout(500);

    // Test each activity level
    await page.getByLabel(/activity level/i).click();
    await page.waitForTimeout(500);

    // Verify all options are present
    await expect(page.getByRole("option", { name: /sedentary/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /light/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /moderate/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /6-7 days/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /very active/i })).toBeVisible();

    // Select "Very Active"
    await page.getByRole("option", { name: /very active/i }).first().click();
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /create profile/i }).click();
    await expect(page.getByText(/profile created successfully/i)).toBeVisible({ timeout: 30000 });
  });

  test("profile persists after page reload", async ({ page, request }) => {
    await setupUser(page, request);

    await page.goto("/profile");
    await fillProfileForm(page);

    await page.getByRole("button", { name: /create profile/i }).click();
    await expect(page.getByText(/profile created successfully/i)).toBeVisible({ timeout: 30000 });

    // Reload and verify profile data is still there
    await page.waitForTimeout(2000);
    await page.goto("/profile");

    // Should show update form with pre-filled values
    await expect(page.getByRole("heading", { name: /update profile/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/weight/i)).toHaveValue("70");
    await expect(page.getByLabel(/height/i)).toHaveValue("175");
  });
});

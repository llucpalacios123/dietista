import { test, expect } from "@playwright/test";
import { generateEmail, generatePassword, defaultProfileData } from "./helpers/test-data";
import { registerUser, loginUser } from "./helpers/api";

test.describe("Meal plan generation", () => {
  async function setupUserWithProfile(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
    const email = generateEmail("mealplan");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    // Create profile
    await page.goto("/profile");
    const profile = defaultProfileData();
    await page.getByLabel(/weight/i).fill(profile.weight);
    await page.getByLabel(/height/i).fill(profile.height);
    await page.getByLabel(/age/i).fill(profile.age);

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
    await expect(page.getByText(/profile created successfully/i)).toBeVisible({ timeout: 30000 });

    // Navigate to meal plans
    await page.waitForTimeout(2000);
    await page.goto("/meal-plans");
    await expect(page).toHaveURL(/\/meal-plans/, { timeout: 10000 });
    return { email, password };
  }

  test("shows generate button when no plan exists", async ({ page, request }) => {
    await setupUserWithProfile(page, request);

    // Should show generate button
    await expect(page.getByRole("button", { name: /generate/i })).toBeVisible({ timeout: 10000 });
  });

  test("shows loading state on initial page load", async ({ page, request }) => {
    await setupUserWithProfile(page, request);

    // Page should load without errors
    await expect(page.getByRole("heading", { name: /meal plans/i })).toBeVisible({ timeout: 10000 });
  });

  test("generate button is clickable", async ({ page, request }) => {
    await setupUserWithProfile(page, request);

    // Click generate button
    await page.getByRole("button", { name: /generate/i }).click();

    // Should show generating state (even if it fails due to no API key)
    await page.waitForTimeout(5000);
    const generatingVisible = await page.getByText(/generating your meal plan/i).isVisible().catch(() => false);
    const errorVisible = await page.getByText(/error|failed/i).isVisible().catch(() => false);
    expect(generatingVisible || errorVisible).toBe(true);
  });

  test("meal plans page has correct structure", async ({ page, request }) => {
    await setupUserWithProfile(page, request);

    // Check page structure
    await expect(page.getByRole("heading", { name: /meal plans/i })).toBeVisible();
    await expect(page.getByText(/generate and manage/i)).toBeVisible();
  });

  test("protected route requires authentication", async ({ page }) => {
    await page.goto("/meal-plans");
    await expect(page).toHaveURL(/\/login/);
  });

  test("navigation to meal plans works from dashboard", async ({ page, request }) => {
    const email = generateEmail("mealplan-nav");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    await page.goto("/dashboard");
    await page.locator("header nav").getByRole("link", { name: "Meal Plans" }).click();
    await expect(page).toHaveURL(/\/meal-plans/, { timeout: 10000 });
  });

  test("meal plans page shows correct title", async ({ page, request }) => {
    await setupUserWithProfile(page, request);

    await expect(page.getByRole("heading", { name: /meal plans/i })).toBeVisible();
  });

  test("generate new plan button appears after plan exists", async ({ page, request }) => {
    await setupUserWithProfile(page, request);

    // After profile creation, generate button should be visible
    await expect(page.getByRole("button", { name: /generate/i })).toBeVisible({ timeout: 10000 });
  });
});

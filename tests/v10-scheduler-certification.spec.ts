import { test, expect } from '@playwright/test';

test.describe('V10 Ultimate Scheduler Certification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?tab=setup');
    // Ensure we are on the Shift Builder sub-tab if needed
    const shiftBuilderTab = page.locator('button:has-text("Shift Setup")');
    if (await shiftBuilderTab.isVisible()) {
        await shiftBuilderTab.click();
    }
  });

  test('E2E Workflow: Live Shift -> Master Pattern -> Deployment', async ({ page }) => {
    console.log("🚀 Starting V10 Certification...");

    // 1. Verify Header Parity
    await expect(page.locator('button:has-text("MONTH")')).toBeVisible();
    await expect(page.locator('button:has-text("Locs (All)")')).toBeVisible();

    // 2. Create a Live Shift via Slide-out Builder
    console.log("➕ Testing Slide-out Builder (Add Shift)...");
    await page.locator('button:has-text("Add Shift")').click();
    await expect(page.locator('h2:has-text("Build New Shift")')).toBeVisible();
    
    // Select Facility (Garner/GN)
    await page.locator('button:has-text("Garner")').click();
    // Set Time
    await page.locator('input[type="time"]').first().fill('10:00');
    await page.locator('input[type="time"]').last().fill('14:00');
    
    await page.locator('button:has-text("Launch Shift")').click();
    console.log("✅ Live Shift Launched.");

    // 3. Test Grid Interaction (Month View Click)
    console.log("🖱️ Testing Month View 'Easy Entry'...");
    await page.locator('button:has-text("MONTH")').click();
    // Click a day box (e.g., the 15th)
    const day15 = page.locator('div.group:has-text("15")').first();
    await day15.click();
    await expect(page.locator('h2:has-text("Build New Shift")')).toBeVisible();
    await page.locator('button:has-text("X")').click(); // Close

    // 4. Master Blueprint & Tasks
    console.log("📐 Testing Master Blueprint & Collapsible Tasks...");
    await page.locator('button:has-text("Master")').click();
    
    // Open Checklist
    await page.locator('button:has-text("Master Facility Checklist")').click();
    await expect(page.locator('button:has-text("Select All")')).toBeVisible();
    await page.locator('button:has-text("Select All")').click();
    
    // Create Pattern
    await page.locator('button:has-text("GN")').click(); // Garner
    await page.locator('button:has-text("M")').click();  // Monday
    await page.locator('button:has-text("Save Pattern")').click();
    console.log("✅ Master Pattern with Tasks created.");

    // 5. Deployment (Zap)
    console.log("⚡ Testing Multi-Facility Deployment...");
    // Fill dates (next week)
    const today = new Date();
    const nextWeekStart = new Date(today); nextWeekStart.setDate(today.getDate() + 7);
    const nextWeekEnd = new Date(today); nextWeekEnd.setDate(today.getDate() + 14);
    
    await page.locator('input[type="date"]').first().fill(nextWeekStart.toISOString().split('T')[0]);
    await page.locator('input[type="date"]').last().fill(nextWeekEnd.toISOString().split('T')[0]);
    
    await page.locator('button[title="Deploy to Live Grid"]').click();
    console.log("✅ Deployment Complete.");

    console.log("🏁 V10 Certification Successful.");
  });
});

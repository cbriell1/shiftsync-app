import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as manager', async ({ page }) => {
  // Ensure we are in desktop view so the sidebar isn't hidden in a hamburger menu
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // 1. Go to login page
  await page.goto('/');

  // 2. Click "Use Emergency Login"
  await page.getByText('Lost Device or Changed Domains? Use Emergency Login').click();

  // 3. Fill in manager credentials
  await page.locator('input[type="email"]').fill('cbriell1@yahoo.com');
  
  const password = process.env.EMERGENCY_PASSWORD;
  if (!password) {
    throw new Error('EMERGENCY_PASSWORD environment variable is not set in your .env or shell.');
  }
  await page.locator('input[type="password"]').fill(password);

  // 4. Click Force Login
  await page.getByRole('button', { name: /Force Login|Authenticating/i }).click();

  // 5. Wait for the dashboard to load
  // We wait for the "Logout" button because "Manager Tools" text might be hidden if the sidebar is collapsed
  await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible({ timeout: 60000 });

  // 6. Save state
  const authFile = 'playwright/.auth/user.json';
  await page.context().storageState({ path: authFile });
});

import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function generateV11TrainingAssets() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  const imagesDir = path.join(process.cwd(), 'public', 'Images', 'Training');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  console.log('🚀 Starting Precision V11 Asset Sync...');

  try {
    // 1. Login
    await page.goto('http://localhost:3000');
    await page.getByText('Lost Device or Changed Domains? Use Emergency Login').click();
    await page.locator('input[type="email"]').fill('manager@test.com');
    await page.locator('input[type="password"]').fill(process.env.EMERGENCY_PASSWORD || 'SS-2026-TEST');
    await page.getByRole('button', { name: /Force Login/i }).click();
    await page.waitForTimeout(10000); // Wait for dashboard

    // 2. Navigate directly to Shift Setup
    await page.goto('http://localhost:3000/?tab=setup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(10000); // Massive wait for data hydration

    // ASSET 1: MASTERY (Header)
    await page.screenshot({ path: path.join(imagesDir, 'v11-mastery.png'), clip: { x: 0, y: 0, width: 1440, height: 450 } });
    console.log('📸 Captured: v11-mastery.png');

    // ASSET 2: BUILDER (Sidebar)
    // Click a day box to open builder
    const dayBox = page.locator('div.group:has-text("15")').first();
    if (await dayBox.isVisible()) {
        await dayBox.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: path.join(imagesDir, 'v11-builder.png') });
        console.log('📸 Captured: v11-builder.png');
        await page.keyboard.press('Escape');
    }

    // ASSET 3: PLANNER (Week View)
    await page.locator('[data-testid="week-view-btn"]').click();
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(imagesDir, 'v11-planner.png') });
    console.log('📸 Captured: v11-planner.png');

    // ASSET 4: CLEANUP (Trash Can Detail)
    await page.screenshot({ 
        path: path.join(imagesDir, 'v11-cleanup.png'),
        clip: { x: 0, y: 400, width: 800, height: 500 }
    });
    console.log('📸 Captured: v11-cleanup.png');

    console.log('✅ V11 Training Assets perfectly synchronized.');
  } catch (err) {
    console.error('❌ Sync Failed:', err);
  } finally {
    await browser.close();
  }
}

generateV11TrainingAssets().catch(console.error);

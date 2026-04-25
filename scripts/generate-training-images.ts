import { chromium, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function generateGranularScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  const imagesDir = path.join(process.cwd(), 'public', 'Images', 'Training');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  console.log('🚀 Starting Precision Training Asset Capture...');

  try {
    // 1. Login
    await page.goto('http://localhost:3000');
    await page.getByText('Lost Device or Changed Domains? Use Emergency Login').click();
    await page.locator('input[type="email"]').fill('manager@test.com');
    await page.locator('input[type="password"]').fill(process.env.EMERGENCY_PASSWORD || '');
    await page.getByRole('button', { name: /Force Login/i }).click();
    await page.waitForTimeout(5000);

    // MOVE 1: MASTER TEMPLATES (Show Filters active)
    await page.getByRole('button', { name: 'Shift Setup' }).click();
    await page.getByRole('button', { name: 'Templates' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(imagesDir, 'template-mgmt.png') });
    console.log('📸 Captured: Move 1 (Templates)');

    // MOVE 2: QUICK-ASSIGN POPOVER (Capture active search)
    await page.getByRole('button', { name: 'Builder' }).click();
    await page.waitForTimeout(3000);
    const openShift = page.locator('div[draggable="true"]', { hasText: 'OPEN' }).first();
    if (await openShift.isVisible()) {
        await openShift.click();
        await page.waitForTimeout(800);
        await page.locator('input[placeholder*="Search"]').fill('Staff');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(imagesDir, 'assign-popover.png') });
        console.log('📸 Captured: Move 2 (Popover Active)');
        await page.keyboard.press('Escape');
    }

    // MOVE 3: QUICK-PAINT (Capture active row highlight)
    const staffRow = page.getByTestId('staff-name-cell').first();
    await staffRow.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(imagesDir, 'assign-paint.png') });
    console.log('📸 Captured: Move 3 (Paint Highlight)');
    await page.getByRole('button', { name: /Stop/i }).click();

    // MOVE 4: CLEANUP (Capture the Clear button focus)
    await page.screenshot({ path: path.join(imagesDir, 'cleanup-tools.png') });
    console.log('📸 Captured: Move 4 (Cleanup Tools)');

    // STAFF MOVE 1: TIME CLOCK (Capture Stadium Scoreboard)
    await page.getByRole('button', { name: 'Time Clock' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(imagesDir, 'time-clock.png') });
    console.log('📸 Captured: Staff Move 1 (Time Clock)');

    // STAFF MOVE 2: GUEST LOG (Capture Search + History)
    await page.getByRole('button', { name: 'Guest Passes' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(imagesDir, 'privileges.png') });
    console.log('📸 Captured: Staff Move 2 (Guest Log)');

    // STAFF MOVE 3: GIFT CARDS (Capture Ticket Grid)
    await page.getByRole('button', { name: 'Gift Cards' }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(imagesDir, 'gift-cards.png') });
    console.log('📸 Captured: Staff Move 3 (Gift Cards)');

    console.log('✅ All clean, unique training assets saved to /public/Images/Training');
  } catch (err) {
    console.error('❌ Capture Failed:', err);
  } finally {
    await browser.close();
  }
}

generateGranularScreenshots().catch(console.error);

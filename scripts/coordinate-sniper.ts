import { chromium } from '@playwright/test';
import 'dotenv/config';

async function sniper() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto('http://localhost:3000');
  await page.getByText('Use Emergency Login').click();
  await page.locator('input[type="email"]').fill('manager@test.com');
  await page.locator('input[type="password"]').fill(process.env.EMERGENCY_PASSWORD || '');
  await page.getByRole('button', { name: /Force Login/i }).click();
  await page.waitForTimeout(3000);

  const getCoords = async (selector: string, name: string) => {
    const el = page.locator(selector).first();
    if (await el.isVisible()) {
        const box = await el.boundingBox();
        if (box) {
            const x = ((box.x + box.width / 2) / 1280 * 100).toFixed(1) + '%';
            const y = ((box.y + box.height / 2) / 800 * 100).toFixed(1) + '%';
            console.log(`🎯 ${name}: { x: '${x}', y: '${y}' }`);
        }
    }
  };

  console.log('--- 1. Template Management ---');
  await page.getByRole('button', { name: 'Shift Setup' }).click();
  await page.getByRole('button', { name: 'Shift Templates' }).click();
  await page.waitForTimeout(1000);
  await getCoords('.lucide-filter', 'FILTER ICON');
  await getCoords('.lucide-arrow-up-down', 'SORT ICON');

  console.log('\n--- 2. Schedule Builder / Cleanup ---');
  await page.getByRole('button', { name: 'Schedule Builder' }).click();
  await page.waitForTimeout(1000);
  await getCoords('button:has-text("Clear")', 'CLEAR BUTTON');
  await getCoords('select', 'FACILITY DROPDOWN');

  await browser.close();
}

sniper().catch(console.error);

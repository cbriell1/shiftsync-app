import { chromium } from '@playwright/test';
import 'dotenv/config';

async function runBenchmark() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('⏱️  Starting Performance Benchmark...');
  
  const startTime = Date.now();

  // 1. Initial Page Load
  await page.goto('http://localhost:3000');
  const ttfb = Date.now() - startTime;
  console.log(` - Time to First Byte (TTFB): ${ttfb}ms`);

  // 2. Auth Handshake
  await page.getByText('Lost Device or Changed Domains? Use Emergency Login').click();
  await page.locator('input[type="email"]').fill('manager@test.com');
  await page.locator('input[type="password"]').fill(process.env.EMERGENCY_PASSWORD || '');
  
  const authStart = Date.now();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.getByRole('button', { name: /Force Login/i }).click()
  ]);
  const authDuration = Date.now() - authStart;
  console.log(` - Auth Round-trip: ${authDuration}ms`);

  // 3. Dashboard Hydration (Wait for the data batches we optimized)
  const dashboardStart = Date.now();
  await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible({ timeout: 15000 });
  const hydrationDuration = Date.now() - dashboardStart;
  console.log(` - Dashboard Hydration: ${hydrationDuration}ms`);

  const totalTime = Date.now() - startTime;
  console.log('------------------------------------');
  console.log(`🚀 TOTAL LOAD TIME: ${totalTime}ms`);
  console.log('------------------------------------');

  await browser.close();
}

import { expect } from '@playwright/test';
runBenchmark().catch(console.error);

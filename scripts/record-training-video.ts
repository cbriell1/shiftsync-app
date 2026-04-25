import { chromium, expect } from '@playwright/test';
import * as path from 'path';
import 'dotenv/config';

async function recordWalkthrough(mode: 'manager' | 'staff') {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: path.join(process.cwd(), 'Images', 'Training', 'videos'),
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  const showCaption = async (text: string, duration: number = 2500) => {
    try {
      await page.evaluate((msg) => {
        let coach = document.getElementById('digital-coach');
        if (!coach) {
          coach = document.createElement('div');
          coach.id = 'digital-coach';
          Object.assign(coach.style, {
            position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: '#facc15', color: '#0f172a', padding: '15px 30px', borderRadius: '20px',
            fontFamily: 'Arial, sans-serif', fontWeight: '900', fontSize: '20px', textTransform: 'uppercase',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)', border: '4px solid #0f172a', zIndex: '9999',
            pointerEvents: 'none', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', textAlign: 'center', minWidth: '450px', opacity: '0'
          });
          document.body.appendChild(coach);
        }
        coach.innerText = msg;
        coach.style.opacity = '1'; coach.style.bottom = '50px';
      }, text);
      await page.waitForTimeout(duration);
      await page.evaluate(() => {
        const coach = document.getElementById('digital-coach');
        if (coach) { coach.style.opacity = '0'; coach.style.bottom = '20px'; }
      }).catch(() => {});
    } catch (e) {}
  };

  try {
    console.log(`📽️  Generating FINAL ${mode.toUpperCase()} Walkthrough...`);

    // 1. Login
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.getByText(/Emergency Login/i).click();
    await page.locator('input[type="email"]').fill(mode === 'manager' ? 'manager@test.com' : 'staff@test.com');
    await page.locator('input[type="password"]').fill(process.env.EMERGENCY_PASSWORD || '');
    await page.getByRole('button', { name: /Force Login/i }).click();
    await page.waitForTimeout(4000);

    if (mode === 'manager') {
       await showCaption("Welcome to the Manager Pro Course", 2000);
       await page.getByRole('button', { name: /Shift Setup/i }).click();
       await page.getByRole('button', { name: /Templates/i }).click();
       await showCaption("Move 1: Mastering Blueprints", 2000);
       
       await page.getByRole('button', { name: /Builder/i }).click();
       await page.waitForTimeout(2000);
       const openShift = page.locator('div[draggable="true"]', { hasText: 'OPEN' }).first();
       if (await openShift.isVisible()) {
          await openShift.click();
          await page.waitForTimeout(500);
          await page.keyboard.type('Staff');
          await showCaption("Move 2: Rapid Assign (Search Popover)", 2500);
          await page.keyboard.press('Escape');
       }

       await page.getByTestId('staff-name-cell').first().click();
       await showCaption("Move 3: The Bulk Fill (Quick-Paint)", 2500);
       await page.getByRole('button', { name: /Stop/i }).click();

       await showCaption("Move 4: Surgical Cleanup (Safe-Nuke)", 2500);
    } else {
       await showCaption("Staff Course: Digital Gatekeeper", 2000);
       await page.getByRole('button', { name: /Time Clock/i }).click();
       await showCaption("Move 1: The Stadium Clock", 2500);

       await page.getByRole('button', { name: /Guest Passes/i }).click();
       await showCaption("Move 2: The Guest Log", 2500);

       await page.getByRole('button', { name: /Gift Cards/i }).click();
       await showCaption("Move 3: The Ticket Grid", 2500);
    }
    
    await showCaption("Certification Complete.", 2000);
    console.log(`✅ ${mode} walkthrough finished.`);
  } catch (err) {
    console.error(`❌ ${mode} Recording Failed:`, err);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  await recordWalkthrough('manager');
  await recordWalkthrough('staff');
}

main().catch(console.error);

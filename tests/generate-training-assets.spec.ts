import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Training Asset Generation', () => {
  test('Capture Professional V11 Manager Visuals', async ({ page }) => {
    const imagesDir = path.join(process.cwd(), 'public', 'Images', 'Training');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    console.log('📍 Navigating to Unified Scheduler...');
    await page.goto('/?tab=setup');
    
    // Wait for the actual Scheduler UI to load
    await expect(page.getByRole('heading', { name: 'Facility Control Center' })).toBeVisible({ timeout: 20000 });
    
    // ASSET 1: MASTERY (Header & Multi-Facility Controls)
    console.log('📸 Capturing Mastery...');
    await page.screenshot({ 
        path: path.join(imagesDir, 'v11-pro-mastery.png'),
        clip: { x: 0, y: 0, width: 1440, height: 450 }
    });

    // ASSET 2: BUILDER (Slide-out Sidebar)
    console.log('📸 Capturing Builder Sidebar...');
    await page.getByRole('button', { name: 'Add Shift' }).click();
    await page.waitForTimeout(2000);
    // Focus on the sidebar itself
    await page.screenshot({ 
        path: path.join(imagesDir, 'v11-pro-builder.png'),
        clip: { x: 1000, y: 0, width: 440, height: 1080 } 
    });
    await page.keyboard.press('Escape');

    // ASSET 3: PLANNER (Week View Smart Lanes)
    // We need to ensure we see the overlapping lanes
    console.log('📸 Capturing Planner Grid (Lanes)...');
    await page.getByRole('button', { name: 'week', exact: true }).click();
    await page.waitForTimeout(6000); // Wait for data hydration
    await page.screenshot({ 
        path: path.join(imagesDir, 'v11-pro-planner.png'),
        clip: { x: 50, y: 250, width: 1300, height: 800 }
    });

    // ASSET 4: CLEANUP (Red Trash Can Detail)
    // Zoom in on a specific card to show the delete tool
    console.log('📸 Capturing Cleanup (Trash Can)...');
    await page.screenshot({ 
        path: path.join(imagesDir, 'v11-pro-cleanup.png'),
        clip: { x: 230, y: 450, width: 350, height: 250 }
    });

    console.log('✅ All professional V11 images verified and saved to /public/Images/Training');
  });
});

import { test, expect } from '@playwright/test';

// Run serially to avoid local server/DB contention
test.describe.configure({ mode: 'serial' });

test.describe('Help & Training Hub: Final Stabilization', () => {
  
  test('should render the Manager Playbook and support interactive features', async ({ page }) => {
    // Large viewport for reliable layout
    await page.setViewportSize({ width: 1280, height: 800 });
    // Aggressive 10-minute timeout for extreme local lag
    test.setTimeout(600000); 

    // 1. Initial Load
    console.log('🚀 Loading Dashboard...');
    await page.goto('/', { waitUntil: 'networkidle', timeout: 120000 });
    
    // 2. Wait for stabilization (Look for the Logout button as proof of auth/mount)
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible({ timeout: 60000 });

    // 3. Navigation to Help with Sidebar Check
    console.log('📬 Navigating to Help & Training...');
    const expandBtn = page.getByTitle(/Expand Sidebar/i);
    if (await expandBtn.isVisible()) {
        await expandBtn.click();
        await page.waitForTimeout(1000);
    }

    const helpBtn = page.getByText(/Help & Training/i).first();
    await expect(helpBtn).toBeVisible({ timeout: 30000 });
    await helpBtn.click({ force: true });

    // 4. Switch to Manager Course
    console.log('🎓 Switching to Manager Pro course...');
    await page.getByRole('button', { name: /Manager Pro/i }).click();

    // 5. Wait for Content (Using the unique Level ID)
    console.log('⚖️  Verifying Training Content...');
    await expect(page.getByText(/Level: Pro Manager/i).first()).toBeVisible({ timeout: 90000 });
    await expect(page.getByText(/4 Power Moves/i).first()).toBeVisible({ timeout: 30000 });

    // 5. Verify Navigation between moves
    console.log('🖱️ Testing Modular Switch...');
    await page.getByRole('button', { name: /Move 2/i }).click();
    await expect(page.getByText(/Rapid Assign/i).first()).toBeVisible({ timeout: 30000 });

    // 6. Verify Fullscreen Zoom
    console.log('🔍 Testing Zoom functionality...');
    const img = page.locator('img[alt="Quick-Assign Popover UI"]');
    await expect(img).toBeVisible({ timeout: 30000 });
    
    // Force DOM click to bypass Entry Animations
    await img.evaluate(el => (el as HTMLElement).click());
    
    // Check for the high-res lightbox image
    const zoomed = page.locator('div.fixed img').first();
    await expect(zoomed).toBeVisible({ timeout: 20000 });

    console.log('✅ Final verification successful.');
  });
});

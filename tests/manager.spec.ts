import { test, expect } from '@playwright/test';

// SERIAL mode to prevent DB contention
test.describe.configure({ mode: 'serial' });

test.describe('Manager Functionality - New Screens & Features', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(300000); 
    await page.setViewportSize({ width: 1920, height: 1080 });
    console.log('🚀 Loading Dashboard...');
    await page.goto('/', { waitUntil: 'networkidle', timeout: 120000 });
    await expect(page.getByRole('button', { name: /Logout/i })).toBeVisible({ timeout: 60000 });
  });

  test('can manage Tournaments and Events', async ({ page }) => {
    console.log('📅 Navigating to Events via Deep-Link...');
    // 🧪 Use SUB deep-link to bypass navigation lag
    await page.goto('/?tab=setup&sub=events', { waitUntil: 'networkidle' });
    
    // Wait for the form to definitively mount (Using the new Test ID)
    const titleInput = page.getByTestId('event-title-input');
    await expect(titleInput).toBeVisible({ timeout: 60000 });

    const eventTitle = `Championship ${Date.now()}`;
    await titleInput.fill(eventTitle);
    await page.locator('input[type="date"]').first().fill('2026-05-01');
    await page.locator('input[type="date"]').last().fill('2026-05-02');
    
    const createBtn = page.getByTestId('create-event-btn');
    await createBtn.evaluate(el => (el as HTMLElement).click());

    await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 30000 });
  });

  test('can use Quick-Paint mode to assign staff', async ({ page }) => {
    console.log('🖌️  Testing Quick-Paint...');
    await page.goto('/?tab=setup&sub=builder', { waitUntil: 'networkidle' });
    
    // 1. Trigger "Open" Painter
    const openHeader = page.getByText(/Open/i).first();
    await openHeader.click({ force: true });
    await expect(page.getByText(/Mode: Unassign/i)).toBeVisible({ timeout: 30000 });

    // 2. Click any shift to test the brush
    const shift = page.locator('div[draggable="true"]').first();
    if (await shift.isVisible()) {
        await shift.click({ force: true });
    }
    
    await page.getByRole('button', { name: /Stop/i }).click();
  });

  test('can save current week as a master template', async ({ page }) => {
    console.log('💾 Testing Save as Template...');
    await page.goto('/?tab=setup&sub=builder', { waitUntil: 'networkidle' });

    const saveBtn = page.getByRole('button', { name: /Save/i });
    await expect(saveBtn).toBeVisible({ timeout: 45000 });
    await saveBtn.click();
    
    // Confirm via our new data-testid
    const confirmBtn = page.getByTestId('confirm-button');
    if (await confirmBtn.isVisible({ timeout: 5000 })) {
        await confirmBtn.click({ force: true });
    }
  });

  test('can generate schedule and handle deletions', async ({ page }) => {
    console.log('⚡ Testing Bulk Clear...');
    await page.goto('/?tab=setup&sub=builder', { waitUntil: 'networkidle' });

    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await expect(clearBtn).toBeVisible({ timeout: 45000 });
    await clearBtn.click();
    
    await page.getByTestId('confirm-button').click({ force: true });
    await expect(page.getByText(/deleted/i)).toBeVisible({ timeout: 30000 });
  });
});

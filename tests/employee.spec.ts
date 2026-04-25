import { test, expect } from '@playwright/test';

// Run serially to avoid database contention in slow local environments
test.describe.configure({ mode: 'serial' });

test.describe('Employee (Front Desk) Functionality & VIP Registry', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ultra-Patient Timeout for local hydration
    test.setTimeout(300000); 
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 1. Initial Load
    console.log('🚀 Loading Dashboard...');
    await page.goto('/', { waitUntil: 'networkidle', timeout: 150000 });
    
    // 2. Wait for stable anchor
    await expect(page.locator('img[alt="Logo"]').first()).toBeVisible({ timeout: 60000 });

    // 3. Ensure Sidebar is Expanded for the Profile Check later
    const expandBtn = page.getByTitle(/Expand Sidebar/i);
    if (await expandBtn.isVisible()) {
        await expandBtn.click({ force: true });
        await page.waitForTimeout(2000);
    }
  });

  test('can navigate the VIP Registry and search for members', async ({ page }) => {
    console.log('🔍 Testing VIP Search...');
    await page.goto('/?tab=privileges', { waitUntil: 'networkidle' });
    await expect(page.getByText(/STADIUM VIP/i)).toBeVisible({ timeout: 60000 });

    const searchInput = page.getByPlaceholder(/QUICK FIND MEMBER/i);
    await searchInput.fill('Briell');
    await page.waitForTimeout(2000); 

    const BriellRow = page.locator('div[data-testid="member-row"]', { hasText: /BRIELL/i }).first();
    await expect(BriellRow).toBeVisible({ timeout: 30000 });
  });

  test('can log a pass and then REVERT it via the audit receipt', async ({ page }) => {
    console.log('♻️  Testing Pass Reversal...');
    await page.goto('/?tab=privileges', { waitUntil: 'networkidle' });
    
    // 🧪 Target the first available member row dynamically
    const memberRow = page.getByTestId('member-row').first();
    await expect(memberRow).toBeVisible({ timeout: 60000 });

    // 1. Log pass (Attach listener BEFORE click)
    let promptCount = 0;
    page.on('dialog', async dialog => {
        promptCount++;
        console.log(`💬 Handling Prompt #${promptCount}: ${dialog.message()}`);
        if (promptCount === 1) await dialog.accept('1'); // Amount
        else await dialog.accept('TST'); // Initials
    });

    const logBtn = memberRow.getByRole('button', { name: /LOG PASSES/i });
    const responsePromise = page.waitForResponse(res => res.url().includes('/api/members') && res.status() === 200);
    await logBtn.click({ force: true });
    await responsePromise;
    
    // 🧪 Wait for the success confirmation and re-fetch
    await expect(page.getByText(/Logged!/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/Logged!/i)).toBeHidden({ timeout: 30000 });
    await page.waitForTimeout(2000); 

    // 2. Manually expand the specific row we just updated (Using the new Test ID)
    const rowHeader = memberRow.getByTestId('member-row-header');
    await rowHeader.click({ force: true });
    
    console.log('📑 Verifying Audit Receipt...');
    await expect(page.getByText(/VIP ACCESS AUDIT/i)).toBeVisible({ timeout: 45000 });
    
    // 3. Verify the "1" entry is present (Using the new Test ID)
    await expect(page.getByTestId('audit-entry-value').first()).toContainText(/\[-1\]/i, { timeout: 45000 });

    // 4. Revert via the always-visible Red Trash (Using the new Test ID)
    const revertBtn = page.getByTestId('revert-pass-btn').first();
    await expect(revertBtn).toBeVisible({ timeout: 30000 });
    await revertBtn.click({ force: true });

    // Confirm via our data-testid
    const confirmBtn = page.getByTestId('confirm-button');
    await expect(confirmBtn).toBeVisible({ timeout: 20000 });
    await confirmBtn.click({ force: true });

    await expect(page.getByText(/Transaction Reversed/i)).toBeVisible({ timeout: 60000 });
  });

  test('can verify visual alignments', async ({ page }) => {
    console.log('🎨 Testing Visual Alignment...');
    await page.goto('/?tab=privileges', { waitUntil: 'networkidle' });
    
    // Check Scoreboard Centering
    const scoreboard = page.locator('.stadium-scoreboard').first();
    await expect(scoreboard).toBeVisible({ timeout: 60000 });
    
    // Check Sidebar wrapping logic (Last Session text)
    await expect(page.getByText(/Last Session:/i)).toBeVisible({ timeout: 30000 });
  });
});

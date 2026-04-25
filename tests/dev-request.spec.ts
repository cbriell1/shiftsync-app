import { test, expect } from '@playwright/test';

// Run tests in series to avoid DB contention on slow local environments
test.describe.configure({ mode: 'serial' });

test.describe('Dev Request (Feedback) Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    // Increase individual timeout for slow navigation
    test.setTimeout(150000); 

    await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Expand sidebar if needed
    const expandBtn = page.getByTitle('Expand Sidebar');
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
    }

    // Navigate to Dev Request tab
    const navBtn = page.getByRole('button', { name: 'Dev Request' });
    await expect(navBtn).toBeVisible({ timeout: 20000 });
    await navBtn.click();
    
    // Wait for the Kanban to load (looking for the Hub title)
    await expect(page.getByText(/Feedback Hub/i)).toBeVisible({ timeout: 30000 });
  });

  test('can submit a new Bug and a new Suggestion', async ({ page }) => {
    const bugTitle = `BUG: UI Glitch ${Date.now()}`;
    const suggestionTitle = `IDEA: New Report ${Date.now()}`;

    // 1. Submit a Bug
    await page.getByRole('button', { name: /New Ticket/i }).click();
    await page.getByRole('button', { name: '🐞 BUG' }).click();
    await page.locator('textarea').fill(bugTitle);
    
    const bugPromise = page.waitForResponse(resp => resp.url().includes('/api/feedback') && resp.request().method() === 'POST', { timeout: 45000 });
    await page.getByRole('button', { name: /Send to Developers/i }).click();
    await bugPromise;

    // 2. Submit a Suggestion
    await page.getByRole('button', { name: /New Ticket/i }).click();
    await page.getByRole('button', { name: '💡 IDEA' }).click();
    await page.locator('textarea').fill(suggestionTitle);
    
    const ideaPromise = page.waitForResponse(resp => resp.url().includes('/api/feedback') && resp.request().method() === 'POST', { timeout: 45000 });
    await page.getByRole('button', { name: /Send to Developers/i }).click();
    await ideaPromise;

    // 3. Verify both are visible (Allow time for re-fetch)
    await expect(page.getByText(bugTitle)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(suggestionTitle)).toBeVisible({ timeout: 20000 });
  });

  test('can filter requests by type', async ({ page }) => {
    // Click 'BUG' filter
    const bugFilter = page.getByRole('button', { name: 'BUG', exact: true });
    await expect(bugFilter).toBeVisible({ timeout: 15000 });
    await bugFilter.click();
    
    // Wait for filter to apply
    await page.waitForTimeout(2000);

    // Only check ticket cards
    const cards = page.locator('.group.relative').filter({ hasNot: page.getByRole('button') }); 
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
        await expect(cards.nth(i).getByText(/BUG/i)).toBeVisible();
    }

    // Reset to ALL
    await page.getByRole('button', { name: 'ALL', exact: true }).click();
  });

  test('can add a comment to a ticket', async ({ page }) => {
    const commentText = `Automation comment ${Date.now()}`;
    
    // Find first ticket and click 'Discuss'
    const discussBtn = page.getByRole('button', { name: /Discuss/i }).first();
    await expect(discussBtn).toBeVisible({ timeout: 15000 });
    await discussBtn.click();

    // 1. Setup network interception
    const commentPromise = page.waitForResponse(resp => resp.url().includes('/api/feedback') && resp.request().method() === 'PUT', { timeout: 45000 });

    // 2. Wait for input to be ready and fill it
    const input = page.getByPlaceholder(/Add to discussion/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill(commentText);
    await page.keyboard.press('Enter');
    
    // 3. Wait for backend
    await commentPromise;

    // Verify comment appears in the thread
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 20000 });
  });

  test('can resolve a ticket as a manager', async ({ page }) => {
    const resolutionNote = `Fixed in build 2.0 - ${Date.now()}`;
    
    // Find an OPEN ticket
    const resolveBtn = page.getByRole('button', { name: /Resolve/i }).first();
    await expect(resolveBtn).toBeVisible({ timeout: 20000 });
    await resolveBtn.click();

    // Setup network interception
    const resolvePromise = page.waitForResponse(resp => resp.url().includes('/api/feedback') && resp.request().method() === 'PUT', { timeout: 45000 });

    // Change status to COMPLETED and add notes
    await page.locator('select').last().selectOption('COMPLETED');
    await page.locator('textarea').fill(resolutionNote);
    await page.getByRole('button', { name: /Apply/i }).click();
    
    // Wait for backend
    await resolvePromise;

    // Verify resolution note exists
    await expect(page.getByText(resolutionNote)).toBeVisible({ timeout: 20000 });
  });

  test('verify kanban columns are scrollable', async ({ page }) => {
    // Target the specific column containers
    const columns = page.locator('.overflow-y-auto.shadow-inner');
    const count = await columns.count();
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      await expect(columns.nth(i)).toHaveCSS('overflow-y', 'auto');
    }
  });
});

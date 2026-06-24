import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: 'C:/Users/SerP/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const p = await ctx.newPage();

p.on('console', msg => console.log('BROWSER:', msg.text()));
p.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await p.goto('http://localhost:3000/login');
await p.waitForTimeout(2000);
await p.fill('input[placeholder="admin"]', 'admin');
await p.fill('input[type="password"]', 'admin123');
await p.click('button.btn-primary');
await p.waitForTimeout(2000);

await p.click('a[href="/users"]');
await p.waitForTimeout(2000);

// Check how many user rows exist
const rows = await p.locator('tbody tr').count();
console.log(`Users before: ${rows}`);

// Click delete on last user
p.on('dialog', async dialog => {
  console.log('Dialog:', dialog.message());
  await dialog.accept();
});

const deleteBtn = p.locator('tbody tr:last-child button[title="Удалить"]');
await deleteBtn.click();
await p.waitForTimeout(2000);

const rowsAfter = await p.locator('tbody tr').count();
console.log(`Users after: ${rowsAfter}`);

if (rowsAfter < rows) {
  console.log('DELETE: SUCCESS');
} else {
  console.log('DELETE: FAILED - user not removed');
}

await browser.close();

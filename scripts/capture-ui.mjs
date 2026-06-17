import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:3002/app';
const OUT = path.resolve('tmp-ui-screenshots');

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log('saved', name);
}

async function clickNav(page, label) {
  const btn = page.locator('nav button, nav a').filter({ hasText: label }).first();
  await btn.click({ timeout: 8000 });
  await page.waitForTimeout(600);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  await shot(page, '01-dashboard');

  await clickNav(page, 'Coach');
  await page.waitForTimeout(800);
  await shot(page, '02-coach-empty');

  const input = page.locator('textarea').first();
  await input.fill('Help me draft a polite appeal');
  await page.locator('button[aria-label="Send"]').click();
  await page.waitForTimeout(400);
  await shot(page, '03-coach-typing');
  await page.waitForTimeout(2500);
  await shot(page, '04-coach-reply');

  await clickNav(page, 'Home');
  await page.waitForTimeout(500);
  const sample = page.getByRole('button', { name: /sample analysis/i }).first();
  if (await sample.count()) {
    await sample.click();
    await page.waitForTimeout(2500);
    await shot(page, '05-draft-screen');
  } else {
    await clickNav(page, 'Appeal');
    await page.waitForTimeout(800);
    await shot(page, '05-upload-hub');
  }

  await browser.close();
  console.log('OUT_DIR', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const failures = [];
const requireMatch = (condition, message) => { if (!condition) failures.push(message); };

const layout = read('src/components/Layout.tsx');
const profile = read('src/views/Profile.tsx');
const theme = read('src/lib/theme.ts');
const context = read('src/context/ThemeContext.tsx');
const catalog = JSON.parse(read('shared/planCatalog.json'));

requireMatch(!layout.includes('ThemeQuickToggle'), 'Header must not expose a theme toggle.');
requireMatch(!profile.includes('ThemePicker'), 'Profile must not expose Light/Dark/System choices.');
requireMatch(theme.includes("return 'light'"), 'Theme resolver must fail closed to light mode.');
requireMatch(context.includes("preference: 'light', resolved: 'light'"), 'Theme context must publish light mode only.');
requireMatch(/dashboard[\s\S]*study[\s\S]*chat[\s\S]*upload[\s\S]*profile/.test(layout), 'Bottom navigation order must be Home, Review, Mr Whale, Appeal, Profile.');
requireMatch(catalog.trialMonths === 2, 'Intro Plus trial must be two months.');
requireMatch(catalog.plans.student.monthlyPriceUsd === 6.99, 'Plus must be USD 6.99/month.');
requireMatch(catalog.plans.pro.monthlyPriceUsd === 11.99, 'Pro must be USD 11.99/month.');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log('Release contracts verified.');

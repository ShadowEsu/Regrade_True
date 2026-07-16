import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root, 'server/dist/planCatalog.json');
mkdirSync(dirname(destination), { recursive: true });
copyFileSync(resolve(root, 'shared/planCatalog.json'), destination);

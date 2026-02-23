import { spawnSync } from 'node:child_process';

const result = spawnSync('npm audit --omit=dev --audit-level=high', {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    CI: 'true',
  },
});

if (result.error) {
  // Sortie explicite pour faciliter le diagnostic en CI.
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

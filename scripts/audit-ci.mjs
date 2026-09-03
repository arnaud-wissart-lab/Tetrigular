import { spawnSync } from 'node:child_process';

const npmExecPath = process.env.npm_execpath;
const command = npmExecPath === undefined ? 'npm' : process.execPath;
const args =
  npmExecPath === undefined
    ? ['audit', '--audit-level=high']
    : [npmExecPath, 'audit', '--audit-level=high'];

const result = spawnSync(command, args, {
  stdio: 'inherit',
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

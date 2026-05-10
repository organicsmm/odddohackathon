#!/usr/bin/env node
/**
 * Runs `tsc --noEmit` and writes a JSON summary to public/build-status.json
 * so the in-app BuildStatusBadge can surface results in the dev header.
 *
 * Usage:
 *   node scripts/typecheck-status.mjs           # one-shot
 *   node scripts/typecheck-status.mjs --watch   # rerun every 5s
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const OUT = resolve(process.cwd(), 'public/build-status.json');
mkdirSync(dirname(OUT), { recursive: true });

// Matches: "src/foo/bar.tsx(12,5): error TS2322: ..."
const LINE_RE = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/;

function run() {
  const res = spawnSync('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
    encoding: 'utf8',
    shell: false,
  });
  const output = `${res.stdout || ''}\n${res.stderr || ''}`;
  const errors = [];
  const byFile = new Map();
  for (const raw of output.split('\n')) {
    const m = raw.match(LINE_RE);
    if (!m) continue;
    const [, file, line, col, code, message] = m;
    const entry = { file, line: Number(line), col: Number(col), code, message };
    errors.push(entry);
    const list = byFile.get(file) ?? [];
    list.push(entry);
    byFile.set(file, list);
  }
  const status = errors.length === 0 && (res.status ?? 0) === 0 ? 'ok' : 'error';
  const payload = {
    status,
    ranAt: new Date().toISOString(),
    errorCount: errors.length,
    fileCount: byFile.size,
    files: [...byFile.entries()].map(([file, errs]) => ({ file, count: errs.length })),
    errors: errors.slice(0, 200),
  };
  writeFileSync(OUT, JSON.stringify(payload, null, 2));
  // eslint-disable-next-line no-console
  console.log(`[typecheck-status] ${status} · ${errors.length} error(s) in ${byFile.size} file(s) → ${OUT}`);
  return status;
}

if (process.argv.includes('--watch')) {
  run();
  setInterval(run, 5000);
} else {
  const status = run();
  process.exit(status === 'ok' ? 0 : 1);
}

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const rootDir = process.cwd();
const distDir = join(rootDir, 'dist');
const assetsDir = join(distDir, 'assets');
const indexHtmlPath = join(distDir, 'index.html');
const envExamplePath = join(rootDir, '.env.example');
const hasBuildOutput = existsSync(indexHtmlPath) && existsSync(assetsDir);

test('env example only exposes client-safe variables', () => {
  const envExample = readFileSync(envExamplePath, 'utf8');

  assert.match(envExample, /^VITE_SUPABASE_URL=/m);
  assert.match(envExample, /^VITE_SUPABASE_ANON_KEY=/m);
  assert.doesNotMatch(envExample, /SERVICE_ROLE/i);
  assert.doesNotMatch(envExample, /SUPABASE_ACCESS_TOKEN/i);
  assert.doesNotMatch(envExample, /GEMINI/i);
});

test(
  'production build emits the app shell entrypoints',
  { skip: !hasBuildOutput },
  () => {
    const indexHtml = readFileSync(indexHtmlPath, 'utf8');

    assert.match(indexHtml, /assets\/index-[^"]+\.js/);
    assert.match(indexHtml, /assets\/index-[^"]+\.css/);
  },
);

test(
  'production build emits route chunks for critical flows',
  { skip: !hasBuildOutput },
  () => {
    const assetFiles = readdirSync(assetsDir);

    assert.ok(
      assetFiles.some((file) => /^AuthPage-.*\.js$/.test(file)),
      'expected AuthPage chunk to exist',
    );
    assert.ok(
      assetFiles.some((file) => /^RemindersPage-.*\.js$/.test(file)),
      'expected RemindersPage chunk to exist',
    );
    assert.ok(
      assetFiles.some((file) => /^SettingsPage-.*\.js$/.test(file)),
      'expected SettingsPage chunk to exist',
    );
  },
);

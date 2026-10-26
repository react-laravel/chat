import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const root = await fs.realpath(process.cwd());
const required = JSON.parse(await fs.readFile('.next/required-server-files.json', 'utf8'));
if (Object.keys(required.config.env || {}).some(k => !k.startsWith('NEXT_PUBLIC_'))) throw Error('Private inline build settings are forbidden');
const out = path.join(root, '.next/standalone');
const req = createRequire(path.join(root, 'package.json'));
if (!(await fs.access(path.join(out, 'server.js')).then(() => true, () => false))) {
  const { copyTracedFiles } = req('next/dist/build/utils');
  const middleware = JSON.parse(await fs.readFile('.next/server/middleware-manifest.json', 'utf8'));
  const pages = JSON.parse(await fs.readFile('.next/server/pages-manifest.json', 'utf8'));
  const apps = JSON.parse(await fs.readFile('.next/server/app-paths-manifest.json', 'utf8'));
  const exists = p => fs.access(p).then(() => true, () => false);
  await copyTracedFiles(root, path.join(root, '.next'), Object.keys(pages), Object.values(apps).map(p => p.replace(/^app\//, '').replace(/\.js$/, '')), root, { ...required.config, output: 'standalone', outputFileTracingRoot: root }, middleware, await exists('.next/server/middleware.js.nft.json'), await exists('.next/server/instrumentation.js.nft.json'), new Set());
}
for (const name of required.files) {
  const src = path.resolve(root, name); if (!src.startsWith(root + '/')) throw Error('Required path escaped the checkout');
  await fs.mkdir(path.dirname(path.join(out, name)), { recursive: true }); await fs.copyFile(src, path.join(out, name));
}
for (const name of ['.next/server', '.next/static', 'public']) {
  if (await fs.access(name).then(() => true, () => false)) await fs.cp(name, path.join(out, name), { recursive: true, dereference: true });
}
// The existing production NFT lacks part of the dynamic server bootstrap.
// Use the installed, locked Next tracer to include those actual runtime files.
const { nodeFileTrace } = req('next/dist/compiled/@vercel/nft');
const traced = await nodeFileTrace(['next/dist/server/next.js', 'next/dist/server/lib/start-server.js'].map(p => req.resolve(p)), { base: root, processCwd: root, mixedModules: true });
for (const name of traced.fileList) {
  if (name.endsWith('.map')) continue;
  const src = path.resolve(root, name); if (!src.startsWith(root + '/') || !name.startsWith('node_modules/')) throw Error('Bootstrap trace escaped runtime dependencies');
  if (!(await fs.stat(src)).isFile()) continue;
  const dest = path.join(out, name); await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.copyFile(src, dest);
}
await fs.rm(path.join(out, '.next/cache'), { recursive: true, force: true });
async function sanitize(folder) {
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const p = path.join(folder, entry.name);
    if (entry.name.startsWith('.env') || (entry.name.endsWith('.js.map') || entry.name.endsWith('.css.map'))) { await fs.rm(p, { recursive: true, force: true }); continue; }
    if (entry.isSymbolicLink()) {
      const real = await fs.realpath(p); if (!real.startsWith(root + '/')) throw Error('Runtime symlink escapes checkout');
      const temp = p + '.flatten'; await fs.cp(real, temp, { recursive: true, dereference: true }); await fs.unlink(p); await fs.rename(temp, p);
    }
    if ((await fs.stat(p)).isDirectory()) await sanitize(p);
  }
}
await sanitize(out);
const rewrites = JSON.parse(await fs.readFile(path.join(out, '.next/routes-manifest.json'), 'utf8')).rewrites;
const list = Array.isArray(rewrites) ? rewrites : Object.values(rewrites).flat();
if (!['/api/:path*', '/sanctum/:path*'].every(source => list.some(r => r.source === source && r.destination.startsWith('http://127.0.0.1:8013/')))) throw Error('Required B loopback API rewrite is missing');
console.log('Locked standalone runtime prepared without development dependencies, credentials or source maps.');

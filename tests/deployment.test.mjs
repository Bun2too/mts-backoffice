import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deploymentTarget, validateArtifact, parseDeployResult, probeRevision } from '../scripts/netlify-deploy.mjs';

test('develop and qa deploy only to their respective aliases', () => {
  for (const branch of ['develop', 'qa']) {
    const target = deploymentTarget(`refs/heads/${branch}`);
    assert.equal(target.environment, branch === 'develop' ? 'dev' : 'qa');
    const alias = branch === "develop" ? "dev-ci" : "qa";
    assert.equal(target.url, `https://${alias}--mts-backoffice.netlify.app`);
    assert.ok(target.flags.includes(`--alias=${alias}`));
    assert.ok(!target.flags.includes('--prod'));
  }
});
test('main alone publishes the production URL', () => {
  const target = deploymentTarget('refs/heads/main');
  assert.equal(target.environment, 'production');
  assert.equal(target.url, 'https://mts-backoffice.netlify.app');
  assert.ok(target.flags.includes('--prod'));
  assert.ok(!target.flags.some(flag => flag.startsWith('--alias')));
});
test('PR refs, tags and unrelated branches cannot deploy', () => {
  for (const ref of [undefined, 'main', 'refs/pull/1/merge', 'refs/tags/main', 'refs/heads/feature', '__proto__']) {
    assert.throws(() => deploymentTarget(ref), /Deployment requires/);
  }
});
test('deployment rejects an artifact from another commit or branch', () => {
  const manifest = { sha: 'abc123', branch: 'main' };
  assert.doesNotThrow(() => validateArtifact(manifest, 'abc123', 'main'));
  assert.throws(() => validateArtifact(manifest, 'other', 'main'));
  assert.throws(() => validateArtifact(manifest, 'abc123', 'qa'));
});

test('prebuilt deployments do not pass the build-only context flag', () => {
  for (const branch of ['develop', 'qa', 'main']) {
    assert.ok(deploymentTarget(`refs/heads/${branch}`).flags.every(flag => !flag.startsWith('--context')));
  }
});

test('dev CLI alias is distinct from the develop branch', () => {
  assert.ok(!deploymentTarget('refs/heads/develop').flags.includes('--alias=develop'));
});
test('CLI deploy ID identifies the immutable URL, not its potentially broken alias', () => {
  const id = '6acd15da9d45656c3694af31';
  assert.equal(parseDeployResult(JSON.stringify({ site_name: 'mts-backoffice', deploy_id: id, deploy_url: 'https://dev-ci--mts-backoffice.netlify.app' })).url, `https://${id}--mts-backoffice.netlify.app`);
  assert.throws(() => parseDeployResult('not json'), /valid deployment JSON/);
  assert.throws(() => parseDeployResult(JSON.stringify({ site_name: 'other-site', deploy_id: id })), /unexpected site/);
});
test('verification distinguishes broken alias, stale manifest, access page and network failure', async () => {
  const sha = 'abcdef1234';
  const url = 'https://dev-ci--mts-backoffice.netlify.app';
  const check = (response) => probeRevision(url, sha, 'develop', async (_url, init) => {
    assert.equal(init.redirect, 'manual'); assert.equal(init.cache, 'no-store');
    return response;
  });
  assert.deepEqual(await check(new Response('Missing', { status: 404 })), { ok: false, detail: 'HTTP 404' });
  assert.equal((await check(new Response(null, { status: 302 }))).detail, 'HTTP 302');
  assert.match((await check(new Response('<html>Sign in</html>'))).detail, /non-JSON/);
  assert.match((await check(Response.json({ sha: 'deadbeef', branch: 'develop' }))).detail, /revision mismatch/);
  assert.equal((await check(Response.json({ sha, branch: 'main' }))).detail, 'branch mismatch');
  assert.equal((await check(Response.json({ sha, branch: 'develop' }))).ok, true);
  assert.equal((await probeRevision(url, sha, 'develop', async () => { throw new Error('private diagnostic'); })).detail, 'network/TLS error or request timeout');
});

const { configureIisProxy } = await import('../scripts/configure-iis-proxy.mjs');
const { readFile } = await import('node:fs/promises');

test('IIS proxy targets a separate host and port while retaining static configuration', async () => {
  const original = await readFile(new URL('../public/web.config', import.meta.url), 'utf8');
  const configured = configureIisProxy(original, 'http://regulus.internal:8089');
  assert.ok(configured.includes('url="http://regulus.internal:8089/api/{R:1}" appendQueryString="true"'));
  assert.ok(configured.includes('<match url="^api/(.*)$" />'));
  assert.ok(configured.includes('<defaultDocument enabled="true">'));
  assert.ok(configured.includes('name="X-Content-Type-Options" value="nosniff"'));
  const updated = configureIisProxy(configured, 'https://other.internal:9443/');
  assert.equal((updated.match(/<rewrite>/g) || []).length, 1);
  assert.ok(!updated.includes('regulus.internal'));
  assert.ok(updated.includes('https://other.internal:9443/api/{R:1}'));
});

test('IIS configuration rejects credentials, malformed targets and custom rewrite replacement', () => {
  const xml = '<configuration><system.webServer></system.webServer></configuration>';
  for (const target of ['', undefined, 'file:///tmp/api', 'http://user:secret@host', 'http://host/api', 'http://host?x=1', 'http://host/#fragment']) {
    assert.throws(() => configureIisProxy(xml, target), /HTTP\(S\) origin/);
  }
  assert.throws(() => configureIisProxy('<system.webServer><rewrite><rules /></rewrite></system.webServer>', 'http://host:8089'), /custom rewrite/);
});

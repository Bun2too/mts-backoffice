import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { proxyOrigin } from '../netlify/functions/regulus.mjs';
import { proxyDeploymentSecret } from '../scripts/netlify-deploy.mjs';
const secret = 'http://private-upstream.invalid:8089';
test('deployment target stays out of public configuration and other environments', () => {
  assert.equal(proxyDeploymentSecret('develop', secret), secret);
  assert.equal(proxyDeploymentSecret('qa', secret), 'DISABLED');
  assert.equal(proxyDeploymentSecret('main', secret), 'DISABLED');
  assert.throws(() => proxyDeploymentSecret('develop', ''), /Missing REGULUS_PROXY_TARGET/);
  for (const value of ['file:///tmp/private', 'https://user:password@example.test', `${secret}/api`, `${secret}?target=other`]) {
    assert.throws(() => proxyOrigin(value), /must be an HTTP/);
  }
});
test('proxy forwards allowed JSON operations without cookies, redirects or target overrides', async () => {
  const oldFetch = globalThis.fetch; const oldTarget = process.env.REGULUS_PROXY_TARGET;
  process.env.REGULUS_PROXY_TARGET = secret;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), `${secret}/api/account/edit?firmId=1&accountId=A%26B`);
      assert.equal(init.method, 'PATCH'); assert.equal(init.redirect, 'manual');
      assert.equal(init.headers.Cookie, undefined); assert.equal(init.headers.Authorization, undefined);
      assert.equal(init.body, '{"accountName":"Updated"}');
      return Response.json({ accountName: 'Updated' }, { headers: { Server: 'secret-server', Location: secret } });
    };
    const response = await handler(new Request('https://site.test/api/account/edit?firmId=1&accountId=A%26B&target=http://evil.test', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: 'session=private' }, body: '{"accountName":"Updated"}',
    }));
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { accountName: 'Updated' });
    assert.equal(response.headers.get('server'), null); assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { globalThis.fetch = oldFetch; if (oldTarget === undefined) delete process.env.REGULUS_PROXY_TARGET; else process.env.REGULUS_PROXY_TARGET = oldTarget; }
});
test('upstream errors and redirects cannot expose the server; no retry occurs', async () => {
  const oldFetch = globalThis.fetch; const oldTarget = process.env.REGULUS_PROXY_TARGET;
  process.env.REGULUS_PROXY_TARGET = secret;
  try {
    for (const status of [301, 400, 401, 404, 409, 500]) {
      let calls = 0;
      globalThis.fetch = async () => { calls++; return new Response(`Backend at ${secret}`, { status, headers: { Location: secret } }); };
      const response = await handler(new Request('https://site.test/api/accounts?firmId=1'));
      assert.equal(response.status, status === 301 ? 502 : status);
      assert.ok(!(await response.text()).includes('private-upstream')); assert.equal(calls, 1);
    }
    globalThis.fetch = async () => { throw new Error(`Failed to connect to ${secret}`); };
    assert.ok(!(await (await handler(new Request('https://site.test/api/accounts'))).text()).includes('private-upstream'));
    globalThis.fetch = async () => Response.json({ reflected: secret });
    assert.ok(!(await (await handler(new Request('https://site.test/api/accounts'))).text()).includes('private-upstream'));
    globalThis.fetch = async () => { assert.fail('Unknown routes and disabled proxies must not call upstream'); };
    assert.equal((await handler(new Request('https://site.test/api/database'))).status, 404);
    assert.equal((await handler(new Request('https://site.test/api/accounts', { method: 'DELETE' }))).status, 405);
    delete process.env.REGULUS_PROXY_TARGET;
    assert.equal((await handler(new Request('https://site.test/api/accounts'))).status, 503);
  } finally { globalThis.fetch = oldFetch; if (oldTarget === undefined) delete process.env.REGULUS_PROXY_TARGET; else process.env.REGULUS_PROXY_TARGET = oldTarget; }
});

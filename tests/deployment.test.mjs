import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deploymentTarget, validateArtifact } from '../scripts/netlify-deploy.mjs';

test('develop and qa deploy only to their respective aliases', () => {
  for (const branch of ['develop', 'qa']) {
    const target = deploymentTarget(`refs/heads/${branch}`);
    assert.equal(target.environment, branch === 'develop' ? 'dev' : 'qa');
    assert.equal(target.url, `https://${branch}--mts-backoffice.netlify.app`);
    assert.ok(target.flags.includes(`--alias=${branch}`));
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

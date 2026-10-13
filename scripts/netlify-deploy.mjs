import { readFile, appendFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { proxyOrigin } from '../netlify/functions/regulus.mjs';

export const NETLIFY_CLI_VERSION = '27.5.2';
const SITE = 'mts-backoffice';
export function deploymentTarget(ref) {
  const targets = {
    'refs/heads/develop': { environment: 'dev', branch: 'develop', url: `https://dev-ci--${SITE}.netlify.app`, flags: ['--alias=dev-ci'] },
    'refs/heads/qa': { environment: 'qa', branch: 'qa', url: `https://qa--${SITE}.netlify.app`, flags: ['--alias=qa'] },
    'refs/heads/main': { environment: 'production', branch: 'main', url: `https://${SITE}.netlify.app`, flags: ['--prod'] },
  };
  const target = Object.hasOwn(targets, ref) ? targets[ref] : undefined;
  if (!target) throw new Error('Deployment requires the develop, qa or main branch.');
  return target;
}

export function validateArtifact(manifest, sha, branch) {
  if (!sha || manifest.sha !== sha || manifest.branch !== branch) {
    throw new Error('The downloaded build does not match this workflow revision.');
  }
}

export function proxyDeploymentSecret(branch, value) {
  // Demo deployments must not inherit a site-wide target from another environment.
  if (branch !== 'develop') return 'DISABLED';
  if (!value) throw new Error('Missing REGULUS_PROXY_TARGET. Add it to the GitHub dev environment secrets.');
  return proxyOrigin(value);
}

export function parseDeployResult(stdout) {
  let result;
  try { result = JSON.parse(stdout); } catch { throw new Error('Netlify uploaded the site but did not return valid deployment JSON. Check the Netlify deploy list.'); }
  if (result?.site_name !== SITE || !/^[a-f0-9]{24}$/.test(result?.deploy_id || '')) {
    throw new Error('Netlify returned an unexpected site or deployment ID.');
  }
  return { id: result.deploy_id, url: `https://${result.deploy_id}--${SITE}.netlify.app` };
}

export async function probeRevision(url, sha, branch, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`${url}/deployment.json?revision=${encodeURIComponent(sha)}&check=${Date.now()}`, {
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { ok: false, detail: `HTTP ${response.status}` };
    let manifest;
    try { manifest = await response.json(); } catch { return { ok: false, detail: 'HTTP 200 with a non-JSON body (check site access protection or routing)' }; }
    if (manifest?.sha !== sha) {
      const observed = /^[a-f0-9]{7,64}$/.test(manifest?.sha || '') ? manifest.sha : 'missing/invalid';
      return { ok: false, detail: `revision mismatch (observed ${observed})` };
    }
    if (manifest.branch !== branch) return { ok: false, detail: 'branch mismatch' };
    return { ok: true, detail: 'expected revision and branch served' };
  } catch { return { ok: false, detail: 'network/TLS error or request timeout' }; }
}

async function deploy() {
  const target = deploymentTarget(process.env.GITHUB_REF);
  for (const key of ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID', 'GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'GITHUB_SHA']) {
    if (!process.env[key]) throw new Error(`Missing ${key}. See docs/cicd.md for environment setup.`);
  }
  validateArtifact(JSON.parse(await readFile('dist/deployment.json', 'utf8')), process.env.GITHUB_SHA, target.branch);
  // This also prevents rerunning an old workflow from rolling back newer code.
  const ref = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/git/ref/heads/${target.branch}`, {
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!ref.ok) throw new Error(`Unable to verify the current branch revision (${ref.status}).`);
  if ((await ref.json()).object.sha !== process.env.GITHUB_SHA) throw new Error('This run is stale. Deploy the latest branch workflow instead.');

  const site = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(process.env.NETLIFY_SITE_ID)}`, {
    headers: { Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!site.ok) throw new Error(`Unable to access the configured Netlify site (${site.status}).`);
  if ((await site.json()).name !== SITE) throw new Error(`NETLIFY_SITE_ID must identify ${SITE}. Deployment stopped.`);

  const proxyTarget = proxyDeploymentSecret(target.branch, process.env.REGULUS_PROXY_TARGET);

  // Never rebuild here: deploy exactly the artifact that passed verification.
  // Deploy-scoped secret values go only to Netlify function runtime, not the static artifact.
  // Use an argument array (no shell interpolation); capture and redact CLI output.
  const result = spawnSync('npx', [
    '--yes', `--package=netlify-cli@${NETLIFY_CLI_VERSION}`, 'netlify', 'deploy',
    '--json', '--no-build', '--dir=dist', '--functions=netlify/functions', '--timeout=300',
    '--secret-env', `REGULUS_PROXY_TARGET=${proxyTarget}`,
    `--message=${target.environment} ${process.env.GITHUB_SHA}`,
    ...target.flags,
  ], { encoding: 'utf8', env: process.env, maxBuffer: 10 * 1024 * 1024 });
  let output = (result.stdout || '') + (result.stderr || '');
  if (proxyTarget !== 'DISABLED') {
    for (const value of [process.env.REGULUS_PROXY_TARGET, proxyTarget, new URL(proxyTarget).host, new URL(proxyTarget).hostname]) {
      if (value) output = output.split(value).join('[redacted upstream]');
    }
  }
  process.stdout.write(output);
  if (result.error) throw new Error('Unable to run Netlify deploy. No command arguments were logged.');
  if (result.status !== 0) throw new Error(`Netlify deployment failed (${result.status}).`);

  const uploaded = parseDeployResult(result.stdout);
  const sha = process.env.GITHUB_SHA;
  const uploadSummary = `Uploaded **${target.environment}** revision \`${sha}\`.\n\nImmutable deploy: ${uploaded.url}\n\nEnvironment URL: ${target.url}\n`;
  console.log(uploadSummary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, uploadSummary);

  // An uploaded deploy alone is not enough: the stable environment must serve it.
  let lastCheck;
  for (let attempt = 0; attempt < 12; attempt++) {
    lastCheck = await probeRevision(target.url, sha, target.branch);
    if (lastCheck.ok) {
      const summary = `Verified **${target.environment}**: ${target.url}\n`;
      console.log(summary);
      if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
      return;
    }
    console.log(`Environment verification ${attempt + 1}/12: ${lastCheck.detail}`);
    if (attempt < 11) await new Promise(resolve => setTimeout(resolve, 5000));
  }
  const immutableCheck = await probeRevision(uploaded.url, sha, target.branch);
  const diagnostic = `Environment verification failed: ${lastCheck.detail}. Immutable deploy: ${immutableCheck.detail}. ` +
    (immutableCheck.ok ? 'The artifact is available; check Netlify alias/branch-subdomain conflicts and site access settings. ' : 'Check the uploaded artifact, site access settings and network availability. ') +
    `Uploaded URL: ${uploaded.url}. Environment URL: ${target.url}. No automatic rollback was performed.`;
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n${diagnostic}\n`);
  throw new Error(diagnostic);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  deploy().catch(error => { console.error(error.message); process.exitCode = 1; });
}

import { readFile, appendFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const NETLIFY_CLI_VERSION = '27.5.2';
const SITE = 'mts-backoffice';
export function deploymentTarget(ref) {
  const targets = {
    'refs/heads/develop': { environment: 'dev', branch: 'develop', url: `https://develop--${SITE}.netlify.app`, flags: ['--alias=develop', '--context=branch:develop'] },
    'refs/heads/qa': { environment: 'qa', branch: 'qa', url: `https://qa--${SITE}.netlify.app`, flags: ['--alias=qa', '--context=branch:qa'] },
    'refs/heads/main': { environment: 'production', branch: 'main', url: `https://${SITE}.netlify.app`, flags: ['--prod', '--context=production'] },
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

  // Never rebuild here: deploy exactly the artifact that passed verification.
  // Secrets are passed through the environment, never command arguments.
  const result = spawnSync('npx', [
    '--yes', `--package=netlify-cli@${NETLIFY_CLI_VERSION}`, 'netlify', 'deploy',
    '--no-build', '--dir=dist', '--timeout=300',
    `--message=${target.environment} ${process.env.GITHUB_SHA}`,
    ...target.flags,
  ], { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Netlify deployment failed (${result.status}).`);

  // Check the stable environment URL, not merely the CLI exit status.
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const response = await fetch(`${target.url}/deployment.json?revision=${process.env.GITHUB_SHA}`, {
        cache: 'no-store', signal: AbortSignal.timeout(10000),
      });
      if (response.ok && (await response.json()).sha === process.env.GITHUB_SHA) {
        const summary = `Deployed **${target.environment}**: ${target.url}\n\nRevision: \`${process.env.GITHUB_SHA}\`\n`;
        console.log(summary);
        if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
        return;
      }
    } catch { /* Allow time for the alias/CDN to update. */ }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error(`Deployment was uploaded, but ${target.url} did not serve the expected revision. Check Netlify before retrying; no automatic rollback was performed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  deploy().catch(error => { console.error(error.message); process.exitCode = 1; });
}

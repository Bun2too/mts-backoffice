import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function configureIisProxy(xml, target) {
  let origin;
  try {
    const url = new URL(target);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    if (/[{}]/.test(url.origin)) throw new Error();
    origin = url.origin.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  } catch {
    throw new Error('REGULUS_PROXY_TARGET must be an HTTP(S) origin including any port, without credentials, path, query or fragment.');
  }
  const block = `<!-- BEGIN REGULUS PROXY -->
    <rewrite>
      <rules>
        <rule name="Regulus API" stopProcessing="true">
          <match url="^api/(.*)$" />
          <action type="Rewrite" url="${origin}/api/{R:1}" appendQueryString="true" />
        </rule>
      </rules>
    </rewrite>
    <!-- END REGULUS PROXY -->`;
  const marker = /<!-- BEGIN REGULUS PROXY -->[\s\S]*?<!-- END REGULUS PROXY -->/;
  if (marker.test(xml)) return xml.replace(marker, () => block);
  if (/<rewrite[\s>]/.test(xml)) throw new Error('Existing custom rewrite configuration found; merge the Regulus proxy rule manually.');
  if (!xml.includes('</system.webServer>')) throw new Error('Missing system.webServer in web.config.');
  return xml.replace('</system.webServer>', `${block}\n  </system.webServer>`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [site, target = process.env.REGULUS_PROXY_TARGET] = process.argv.slice(2);
    if (!site || !target) throw new Error('Usage: node configure-iis-proxy.mjs <site-directory> <http(s)://regulus-host:port>');
    const file = resolve(site, 'web.config');
    await writeFile(file, configureIisProxy(await readFile(file, 'utf8'), target));
    console.log(`Configured ${file}. IIS requires URL Rewrite and ARR with proxy enabled.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

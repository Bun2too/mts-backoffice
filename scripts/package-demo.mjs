import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises"
import { loadEnv } from "vite"
import { configureIisProxy } from "./configure-iis-proxy.mjs"
const settings = JSON.parse(await readFile(new URL('../dist/build-settings.json', import.meta.url), 'utf8'))
const env = { ...loadEnv(settings.mode, process.cwd(), ''), ...process.env }
const apiMode = settings.dataMode === 'api'
// Resolve/validate before replacing any previous package.
const iisConfig = apiMode
  ? configureIisProxy(await readFile(new URL('../dist/web.config', import.meta.url), 'utf8'), env.REGULUS_PROXY_TARGET || 'http://127.0.0.1:8080')
  : null
const root = new URL("../", import.meta.url)
for (const target of ["netlify", "windows-iis"]) {
  const folder = new URL(`release/${target}/`, root)
  await rm(folder, { recursive: true, force: true })
  await mkdir(folder, { recursive: true })
  await cp(new URL("dist/", root), folder, { recursive: true })
  if (target === "windows-iis" && iisConfig)
    await writeFile(new URL("web.config", folder), iisConfig)
  if (target === "netlify")
    await rm(new URL("web.config", folder), { force: true })
}
await cp(new URL("scripts/configure-iis-proxy.mjs", root), new URL("release/configure-iis-proxy.mjs", root))
await cp(new URL("README.md", root), new URL("release/README.md", root))
await writeFile(
  new URL("release/BUILD.txt", root),
  `Backoffice ${apiMode ? "API" : "demo"} frontend built ${new Date().toISOString()}\nDeploy netlify/ to Netlify or windows-iis/ to an IIS site root.\n`,
)
await cp(new URL('docs/', root), new URL('release/docs/', root), { recursive: true });
console.log(
  "Created release/netlify and release/windows-iis. Deployment instructions: release/README.md",
)

if (apiMode) console.log("IIS API proxy configured in windows-iis/web.config. Install URL Rewrite + ARR and enable proxy on IIS. See release/README.md.")

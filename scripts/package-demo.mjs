import { cp, mkdir, rm, writeFile } from "node:fs/promises"
const root = new URL("../", import.meta.url)
for (const target of ["netlify", "windows-iis"]) {
  const folder = new URL(`release/${target}/`, root)
  await rm(folder, { recursive: true, force: true })
  await mkdir(folder, { recursive: true })
  await cp(new URL("dist/", root), folder, { recursive: true })
  if (target === "netlify")
    await rm(new URL("web.config", folder), { force: true })
}
await cp(new URL("README.md", root), new URL("release/README.md", root))
await writeFile(
  new URL("release/BUILD.txt", root),
  `Backoffice static demo built ${new Date().toISOString()}\nDeploy netlify/ to Netlify or windows-iis/ to an IIS site root.\n`,
)
await cp(new URL('docs/', root), new URL('release/docs/', root), { recursive: true });
console.log(
  "Created release/netlify and release/windows-iis. Deployment instructions: release/README.md",
)

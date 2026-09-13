import { readFile, writeFile } from "node:fs/promises"
import { validateSnapshot } from "../src/data/snapshot.ts"
const path = process.argv[2]
if (!path)
  throw new Error(
    "Usage: pnpm seed:demo /path/to/backoffice-demo.json (or --clear)",
  )
const data =
  path === "--clear"
    ? null
    : validateSnapshot(JSON.parse(await readFile(path, "utf8")))
await writeFile(
  new URL("../src/data/demoSeed.json", import.meta.url),
  JSON.stringify(data, null, 2) + "\n",
)
console.log(
  "Updated src/data/demoSeed.json. Rebuild, then reset existing browser demo data to load the new seed.",
)

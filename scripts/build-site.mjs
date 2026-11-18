import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "_site");

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "src"), { recursive: true });
await mkdir(resolve(output, "examples"), { recursive: true });
await mkdir(resolve(output, "assets"), { recursive: true });

for (const file of [
  "index.html",
  "styles.css",
  "app.mjs",
  "LICENSE",
  "hosts.html",
  "hosts.css",
  "hosts.mjs",
]) {
  await copyFile(resolve(root, file), resolve(output, file));
}
for (const file of ["index.mjs", "protocol.mjs", "issuer.mjs", "element.mjs"]) {
  await copyFile(resolve(root, "src", file), resolve(output, "src", file));
}
for (const file of ["ad.json", "still-ad.mjs"]) {
  await copyFile(
    resolve(root, "examples", file),
    resolve(output, "examples", file),
  );
}
for (const file of ["mark.svg", "underwrite-og.png", "underwrite-poster.svg"]) {
  await copyFile(
    resolve(root, "assets", file),
    resolve(output, "assets", file),
  );
}

const html = await readFile(resolve(output, "index.html"), "utf8");
if (!html.includes("connect-src 'none'"))
  throw new Error("The built page lost its no-network policy.");
await writeFile(resolve(output, ".nojekyll"), "");

process.stdout.write(
  "Static site built in _site/. Only local modules and assets were copied.\n",
);

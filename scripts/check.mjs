import { readFile, stat } from "node:fs/promises";

const required = [
  "index.html",
  "styles.css",
  "app.mjs",
  "src/index.mjs",
  "src/protocol.mjs",
  "src/issuer.mjs",
  "src/element.mjs",
  "examples/ad.json",
  "examples/still-ad.mjs",
  "assets/mark.svg",
  "assets/ad-harness-og.png",
];

const failures = [];

for (const file of required) {
  try {
    await stat(file);
  } catch {
    failures.push(`Missing required file: ${file}`);
  }
}

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
if (Object.keys(packageJson.dependencies ?? {}).length > 0)
  failures.push("The package must not have runtime dependencies.");

const sources = [
  "app.mjs",
  "src/protocol.mjs",
  "src/issuer.mjs",
  "src/element.mjs",
];
const networkPrimitives = [
  ["fetch(", "fetch"],
  ["XMLHttpRequest", "XMLHttpRequest"],
  ["sendBeacon", "sendBeacon"],
  ["WebSocket", "WebSocket"],
  ["EventSource", "EventSource"],
];
for (const file of sources) {
  const body = await readFile(file, "utf8");
  for (const [needle, name] of networkPrimitives) {
    if (body.includes(needle))
      failures.push(`${file} contains a network primitive: ${name}`);
  }
  if (body.includes("document.cookie"))
    failures.push(`${file} reads or writes cookies.`);
  if (body.includes("localStorage") || body.includes("sessionStorage"))
    failures.push(`${file} persists local state.`);
  if (body.includes("eval(") || body.includes("new Function("))
    failures.push(`${file} evaluates dynamic code.`);
}

const html = await readFile("index.html", "utf8");
if (!html.includes("<ad-harness"))
  failures.push("index.html does not mount <ad-harness>.");
if (!html.includes("connect-src 'none'"))
  failures.push("index.html must keep connect-src 'none' in its CSP.");
if (!html.includes("Content-Security-Policy"))
  failures.push("index.html must declare a Content Security Policy.");
if (!html.includes('lang="en"'))
  failures.push("index.html must declare its language.");

const css = await readFile("styles.css", "utf8");
if (!css.includes(".ah-device"))
  failures.push("styles.css is missing the demo layout.");
if (!css.includes(".ah-film-sun"))
  failures.push("styles.css is missing the sponsor film.");

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `Static checks passed: ${required.length} required files, no runtime dependencies, no network primitives, CSP intact.\n`,
);

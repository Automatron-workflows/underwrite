import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const types = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

/**
 * @param {{ root?: string, port?: number }} [options]
 * @returns {Promise<{ url: string, close: () => Promise<void> }>}
 */
export async function startServer(options = {}) {
  const root = resolve(options.root ?? ".");
  const server = createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(
        new URL(request.url, "http://127.0.0.1").pathname,
      );
      if (pathname.endsWith("/")) pathname += "index.html";
      const target = resolve(root, `.${pathname}`);
      if (target !== root && !target.startsWith(root + sep)) {
        response.writeHead(403).end("forbidden");
        return;
      }
      const body = await readFile(target);
      response.writeHead(200, {
        "content-type": types[extname(target)] ?? "application/octet-stream",
        "cache-control": "no-store",
        "content-security-policy":
          "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
  });
  await new Promise((resolveListen) =>
    server.listen(options.port ?? 0, "127.0.0.1", resolveListen),
  );
  const address = server.address();
  const port =
    typeof address === "object" && address ? address.port : options.port;
  return {
    url: `http://127.0.0.1:${port}/`,
    close: () =>
      new Promise((resolveClose, rejectClose) =>
        server.close((error) => (error ? rejectClose(error) : resolveClose())),
      ),
  };
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  const server = await startServer({
    root: ".",
    port: Number(process.env.PORT ?? 4173),
  });
  process.stdout.write(`Underwrite demo: ${server.url}\n`);
  process.stdout.write("Press Ctrl+C to stop.\n");
}

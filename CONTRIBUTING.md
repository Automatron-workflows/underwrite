# Development

Underwrite is MIT licensed. These instructions describe development; the same
licence covers contributions unless a file says otherwise.

Use Node 22.12 or newer (`.nvmrc` pins 24.16). The component, protocol, issuer,
CLI and demo are portable JavaScript. There is no bundler and no runtime
dependency.

```sh
npm ci --ignore-scripts
npm run check
```

`npm run check` runs the Node tests and the static audit. `npm run test:browser`
builds `_site/`, serves it locally and runs the complete flow in Google Chrome.
Set `CHROME_PATH` if Chrome is not in its default location.

## What to change

- **Protocol.** Update `src/protocol.mjs`, its tests, [docs/PROTOCOL.md](docs/PROTOCOL.md)
  and the demo together.
- **Component.** Update `src/element.mjs`. Run the browser check. A source test
  is not browser verification.
- **Demo.** Update `index.html`, `app.mjs` or `styles.css`. Check the inline
  placement inside the conversation, the model scoped credit chip, the absence
  of a side rail, desktop and 390 pixel layouts, keyboard focus, pause and
  resume, offscreen pause, completion, receipt replay and reset. The card must
  stay between turns and must not use the assistant bubble or voice.
- **Host previews.** Update `hosts.html`, `hosts.css` or `hosts.mjs`. Keep the
  page labelled illustrative, disclose the host trademarks, use no official
  logos and run the browser check at desktop and 390 pixels. The working
  component and reward flow stay on the demo.
- **Site.** Keep `scripts/build-site.mjs` as an explicit allowlist. The built
  site must contain only local modules and assets.

See [MAINTAINING.md](MAINTAINING.md) for the browser check, publication and
rollback loop.

## Rules

- Do not add runtime dependencies.
- Do not add `fetch`, `XMLHttpRequest`, cookies or local storage to the demo.
  The CSP keeps `connect-src 'none'`.
- Do not move verification into the client in a way that suggests it is secure.
  The demo issuer is public on purpose and must stay labelled.
- Do not weaken the visibility, viewport or duplicate receipt rules.
- Keep the sponsor fictional and the ledger visible.
- Add a regression test for a real defect.
- Report a reproducible bug with the Node version, command, expected and actual
  output, and the smallest sanitized sample. Never paste credentials or private
  customer data.

## First contribution

Start with an open issue that has a concrete scope and a verification command.
Good first tasks include a server verifier example, a model scoped wallet, a
session store contract, a package build, a reduced motion audit, a placement
format fixture or a comprehension test plan.

Use [Discussions](https://github.com/Automatron-workflows/underwrite/discussions)
for questions and [Issues](https://github.com/Automatron-workflows/underwrite/issues)
for a reproducible defect. Follow the [community guidelines](CODE_OF_CONDUCT.md)
and [security policy](SECURITY.md).

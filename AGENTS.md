# Working on Ad Harness

Read [README.md](README.md) for the product and [docs/PROTOCOL.md](docs/PROTOCOL.md)
before changing the claim or ledger rules. The repository is self contained. No
account, ad network, paid model, API key or hosted backend is needed.

## Scope and evidence

Ad Harness is a working reference for sponsored inference. The component owns a
visible, pausable watch and produces a completion claim. The host owns
verification, receipts and the credit ledger. The demo is one host.

Do not add a real ad network, targeting, telemetry, payments, authentication or
a hosted service as incidental cleanup. Use [the roadmap](docs/ROADMAP.md) to
choose the next bounded improvement. Keep measured evidence separate from claims:
the demo issuer is public, the sponsor is fictional and credits are not money.

## Work loop

1. Inspect `git status`, the current branch and recent commits. Preserve
   unrelated work.
2. Reproduce the problem and state the intended result before editing. Prefer
   one issue and one reviewable change.
3. Use Node 22.12 or newer. Install with `npm ci --ignore-scripts`. Do not add
   runtime dependencies.
4. Run `npm test` while editing. Run `npm run check` before merge. It adds the
   static audit for network primitives, CSP, required files and runtime
   dependencies.
5. Run `npm run test:browser` for changes to the element, the demo or the
   layout. It builds `_site/`, serves it locally, and checks the real flow in
   Chrome. A source test is not browser verification.
6. Update the docs when behavior changes. Leave the next concrete task.

## Architecture rules

- `src/protocol.mjs` is portable and side effect free. It may not import the
  element, the demo, Node built ins or the DOM.
- `src/issuer.mjs` is the demo issuer. It uses Web Crypto only. It must stay
  clearly labelled as a demo, never as a production security boundary.
- `src/element.mjs` is the only browser component. It owns the watch clock, not
  the balance. It must never read a credit balance or call the issuer.
- A custom element constructor must not add host attributes or children. Attach
  the shadow root, then set attributes in `connectedCallback`. This bug was
  found in the first browser run and must not return.
- The player must pause on `visibilitychange`, when it leaves the viewport, and
  when disabled. It must not auto resume.
- Use a timer driven by `performance.now()` with a bounded delta. Do not tie the
  watch to `requestAnimationFrame`, which stops in an occluded tab.
- Claims are single use through the host ledger. The ledger functions are pure
  and return a new state. Duplicate receipts, short watches, stale claims,
  tampered signatures and session caps are never credited.
- Keep the demo free of `fetch`, `XMLHttpRequest`, cookies and local storage.
  The CSP must keep `connect-src 'none'`.

## Design rules

Preserve the dark Automatron composition: a plain wordmark, one headline, one
primary action at each stage, and the ledger beside the conversation. The
sponsor film is typographic, not a fake product demo. Keep it honest, labelled
and readable. The Still sponsor is fictional.

The component should remain themeable through CSS custom properties, including
`--ah-accent`, `--ah-stage-ratio` and `--ah-chrome-right`. Do not bake the demo
page's layout into the shadow DOM beyond the component frame.

Use no dash punctuation in prose. Preserve syntax in commands, identifiers and
URLs. Keep labels, values, consequences, errors and recovery visible. Motion
must survive reduced motion and a static frame.

For UI changes, run `npm run dev` and inspect desktop and 390 pixel layouts,
keyboard focus, pause and resume, hidden or offscreen pause, completion,
receipt replay, reset, the transcript and the developer panel. State explicitly
when a browser check was unavailable.

## Publication

Use a branch and passing CI. The package is `private: true` until the owner
chooses a distribution route. Never publish real ad claims, user data, keys or
private captures. The GitHub Pages workflow is included; publishing the
repository and enabling Pages is an owner action.

Build the deployable site with `npm run build:site`. It copies only the explicit
static module graph in `scripts/build-site.mjs`. Keep that allowlist current.

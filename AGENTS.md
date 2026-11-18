# Working on Underwrite

Read [README.md](README.md) for the product and [docs/PROTOCOL.md](docs/PROTOCOL.md)
before changing the claim or ledger rules. The repository is self contained. No
account, ad network, paid model, API key or hosted backend is needed.

## Scope and evidence

Underwrite is a working reference for inline sponsored credits in LLM chat. A
labelled card sits between turns. The component owns a visible, pausable watch
and produces a completion claim. The host owns the conversation, the model
scope, verification, receipts and the credit ledger. The demo is one host.

The card is a placement, not a model answer. It must never copy the assistant
bubble, avatar or voice, and the model must never be presented as endorsing the
sponsor. Read [the placement rules](docs/PLACEMENTS.md).

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
  the balance, the model scope or the placement decision. It must never read a
  credit balance or call the issuer.
- The host inserts the element between turns. Do not move or recreate it while
  it is playing; that resets the watch and the observer. Keep the card stable
  while the conversation appends.
- The card must stay visibly labelled and must not use the assistant bubble,
  avatar or voice. Do not imply a model endorsement.
- Keep the credit chip in the host bar and name the model scope. A production
  wallet must not silently mix credits across models.
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

The demo follows the Functional Minimalism harness. Lead with the usable object,
keep one headline and one task line, and reveal optional detail in context. Do
not reintroduce introductory prose, feature pills, numbered contract sections or
duplicated verification status above the demo. Read
[the review](docs/FUNCTIONAL-MINIMALISM.md) before changing the composition.

Preserve the dark Automatron composition: a plain wordmark, one headline, one
task line, one primary action at each stage, the credit chip in the host bar and
the sponsored card inside the conversation. Do not reintroduce a side rail.
Put the exchange, placement rules and boundary behind **How it works**. Put the
receipt, event trace, inline placement snippet and host verification behind
**Developer**. Opening either control pauses a playing sponsor message.

The sponsor film is typographic, not a fake product demo. Keep it honest,
labelled and readable. The Still sponsor is fictional. The demo uses an 8 second
explicit watch; do not add autoplay with credits.

The component should remain themeable through CSS custom properties, including
`--uw-accent`, `--uw-stage-ratio` and `--uw-chrome-right`. Do not bake the demo
page's layout into the shadow DOM beyond the component frame.

Use no dash punctuation in prose. Preserve syntax in commands, identifiers and
URLs. Keep labels, values, consequences, errors and recovery visible. Motion
must survive reduced motion and a static frame.

For UI changes, run `npm run dev` and inspect desktop and 390 pixel layouts,
the inline placement, the model scoped credit chip, keyboard focus, pause and
resume, hidden or offscreen pause, completion, receipt replay, reset, the
transcript, How it works, the Developer dialog and the host previews. State
explicitly when a browser check was unavailable.

## Host previews

`hosts.html`, `hosts.css` and `hosts.mjs` are an authored illustration, not the
working component. The working component and reward flow stay on `index.html`.

- Keep the page labelled **Illustrative** and keep the trademark disclosure.
- Do not add official host logos or imply an integration, partnership or
  endorsement.
- Keep the host rail, the Before and After comparison and the card states
  keyboard reachable.
- The Before card is the full media card. The After card is a compact host-native
  card. Do not let the comparison turn into a product claim the working demo
  cannot support.
- The browser check covers the host rail, the comparison and the 390 pixel
  layout. Keep those assertions.

## Publication

Use a branch and passing CI. The source and GitHub Pages site are public by
owner decision. The package remains `private: true`; do not publish an npm
package or a GitHub release asset without a new owner decision. Never publish
real ad claims, user data, keys or private captures.

Build the deployable site with `npm run build:site`. It copies only the explicit
static module graph in `scripts/build-site.mjs`. Keep that allowlist current.

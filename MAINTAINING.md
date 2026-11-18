# Maintaining Ad Harness

## Every change

1. Inspect `git status` and the current branch. Preserve unrelated work.
2. Make one reviewable change. Add a regression test for a real defect.
3. Run `npm test` while editing.
4. Run `npm run check` before merge. It adds the static audit for network
   primitives, CSP, required files and runtime dependencies.
5. Run `npm run test:browser` for the element, demo, layout or copy. It builds
   `_site/`, serves it locally and runs the real flow in Chrome.
6. Update the protocol, integration or design docs with the behavior.
7. Record the result and any verification limit in the pull request.

A passing source test is not browser verification. A browser check is not a
comprehension study. Keep the evidence labels accurate.

## Browser check

```sh
npm run test:browser
```

It checks the starting balance, the inline sponsored card, the model scoped
credit chip, scripted reply, pause and resume, completion, single credit, receipt
replay rejection, reset, the Developer and How it works dialogs, the skip link,
dialog focus return, the visible control target floor, offscreen pause and the
390 pixel layout. Screenshots and `summary.json` are written to
`output/browser/`.

The check needs Google Chrome. Set `CHROME_PATH` when Chrome is not in its
default location. Do not replace it with a mocked DOM test.

## Static site

```sh
npm run build:site
```

`scripts/build-site.mjs` is an explicit allowlist. The site contains only
`index.html`, `styles.css`, `app.mjs`, `src/`, `examples/` and `assets/`. It
does not copy the tests, docs, node modules or private data. Keep the allowlist
current when adding a runtime module.

The page CSP keeps `connect-src 'none'`. The static check fails if a network
primitive enters the demo or the CSP disappears.

## Publication

The package is `private: true` until the owner intentionally chooses a
distribution route. Do not publish a package name, a GitHub release or a Pages
site without that decision.

When the owner approves a public release:

1. Confirm `main` is green on the test and browser workflows.
2. Bump the version in `package.json` and `CHANGELOG.md`.
3. Run `npm ci --ignore-scripts`, `npm run check`, `npm run test:browser` and
   `npm run build:site` from a clean checkout.
4. Tag the commit without moving an existing tag.
5. Create the GitHub release with the source and the built site notes. If a
   package tarball is attached, include the matching lock file and license.
6. Enable Pages for the repository. The workflow deploys `_site/`.
7. Open the deployed page. Check the CSP, the ad component, the receipt, the
   replay rejection and the mobile layout.
8. Record the deployment result separately from the package release.

Never attach a real ad network key, advertiser contract, user data or private
capture to a release. The demo issuer is public by design.

## Rollback

Do not replace a published tag or release asset. Publish a patch release with
the correction. If the site breaks, revert the site workflow or the last site
commit and redeploy. Keep the public protocol immutable; a breaking claim or
receipt shape needs a new `AD_HARNESS_VERSION`.

## Open verification gaps

- No real ad network proof.
- No server store or transactional cap.
- No independent security review.
- No comprehension study.
- No screen reader or 200 percent zoom review.
- The demo browser check is Chrome only.

Leave these visible in the README, the roadmap and the pull request until they
are closed.

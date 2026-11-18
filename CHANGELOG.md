# Changelog

## 0.2.0

- Renamed the project to **Underwrite**, with the line **Attention,
  underwritten.** The name describes the model: a sponsor underwrites the
  inference and the person chooses whether to accept the placement.
- Renamed the package to `@automatron/underwrite`, the CLI to `underwrite`, the
  custom element to `<underwrite-card>`, the events to `underwrite:*`, the
  public exports to `Underwrite*`, the CSS prefix to `--uw-*` and `.uw-*`, and the
  demo issuer secret to the Underwrite namespace.
- Added the [host previews](hosts.html): the same placement in Claude, ChatGPT
  and Gemini style shells, with a Before media card and an After host-native
  card. The page is an authored illustration, not an integration, and discloses
  the host trademarks.
- Added the host previews to the browser check, the static site build, the
  placement rules and the Functional Minimalism review.
- Refreshed the demo screenshot, the social image and the poster for the new
  name. Added the host previews screenshot to the README.
- Updated the repository links, Pages URLs, profile entry and release notes for
  the new name.

## 0.1.0

- Recomposed the demo as an inline sponsored card inside the conversation, with
  a model scoped credit chip in the host bar and no side rail. An authored sample
  exchange shows a question and a labelled answer; the 8 second card follows the
  answer and the thread continues below.
- Reworked the demo around Functional Minimalism: one headline and one task
  line, the inline card and credit chip lead, optional explanation is behind
  **How it works**, and the receipt, trace, placement snippet and host
  verification are behind **Developer**.
- Removed the visible contract section, side rail, duplicated verification card
  and implementation status lines. Named **Sage Mini** wherever the credit scope
  matters.
- Added native modal dialogs. Opening either pauses a playing sponsor message.
- The browser check covers the inline card, the model scoped chip, both dialogs,
  the skip link, focus return, the 32 pixel control floor, offscreen pause and
  the 390 pixel layout.
- Added the [inline placement rules](docs/PLACEMENTS.md) and recorded the
  [Functional Minimalism review](docs/FUNCTIONAL-MINIMALISM.md) with the open
  evidence limits.
- Added the portable `<underwrite-card>` custom element with a pausable 15 second
  watch, hidden and offscreen pause, progress events and a completion claim.
- Added pure claim validation and a single use credit ledger with a session cap.
- Added the demo HMAC issuer and verifier, clearly labelled as a demo boundary.
- Added a working host demo with a chat, model scoped credit chip, transcript,
  event trace, receipt inspection, receipt replay and reset.
- Added a skip link, a dedicated live announcer and a hidden decorative film so
  the sponsor copy reaches assistive technology through the transcript.
- Added a CLI for `sample`, `verify`, `credit` and `demo`.
- Added Node tests, a static audit and a real Chrome browser check.
- Added a static site build and a GitHub Pages workflow.
- Added the protocol, integration, security, design and roadmap documents.

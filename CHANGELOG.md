# Changelog

## Unreleased

- Reworked the demo around Functional Minimalism: the working chat and credit
  rail lead, the headline is one line plus one task line, optional explanation
  is behind **How it works**, and the receipt, trace, embed and host
  verification are behind **Inspect**.
- Removed the visible contract section, duplicated verification card and
  implementation status lines. The state pill, chat result and ledger carry the
  outcome.
- Added native modal dialogs. Opening either pauses a playing sponsor message.
- The browser check now covers the object-led first view, both dialogs, the skip
  link, focus return, the 32 pixel control floor, offscreen pause and the 390
  pixel layout.
- Recorded the [Functional Minimalism review](docs/FUNCTIONAL-MINIMALISM.md) and
  the open evidence limits.

## 0.1.0

- Added the portable `<ad-harness>` custom element with a pausable 15 second
  watch, hidden and offscreen pause, progress events and a completion claim.
- Added pure claim validation and a single use credit ledger with a session cap.
- Added the demo HMAC issuer and verifier, clearly labelled as a demo boundary.
- Added a working host demo with a chat, credit rail, transcript, event trace,
  receipt inspection, receipt replay and reset.
- Added a skip link, a dedicated live announcer and a hidden decorative film so
  the sponsor copy reaches assistive technology through the transcript.
- Added a CLI for `sample`, `verify`, `credit` and `demo`.
- Added Node tests, a static audit and a real Chrome browser check.
- Added a static site build and a GitHub Pages workflow.
- Added the protocol, integration, security, design and roadmap documents.

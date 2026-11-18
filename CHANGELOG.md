# Changelog

## Unreleased

- Recomposed the demo as an inline sponsored card inside the conversation, with
  a model scoped credit chip in the host bar and no side rail. The 8 second card
  sits between the assistant intro and the thread; the transcript is inline; the
  credit chip, chat receipt and Developer trace carry the accounting.
- Reworked the demo around Functional Minimalism: one headline and one task
  line, the inline card and credit chip lead, optional explanation is behind
  **How it works**, and the receipt, trace, placement snippet and host
  verification are behind **Developer**.
- Removed the visible contract section, side rail, duplicated verification card
  and implementation status lines. Named **Sage Mini** wherever the credit scope
  matters.
- Added native modal dialogs. Opening either pauses a playing sponsor message.
- The browser check now covers the inline card, the model scoped chip, both
  dialogs, the skip link, focus return, the 32 pixel control floor, offscreen
  pause and the 390 pixel layout.
- Added the [inline placement rules](docs/PLACEMENTS.md) and recorded the
  [Functional Minimalism review](docs/FUNCTIONAL-MINIMALISM.md) with the open
  evidence limits.

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

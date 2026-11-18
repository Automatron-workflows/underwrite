# Roadmap

## v0.1, shipped as a reference

- Portable `<ad-harness>` custom element with a pausable watch, visibility and
  offscreen pause, progress events and a completion claim.
- Inline placement inside the conversation with an 8 second demo watch, a model
  scoped credit chip and a transcript.
- Pure claim validation and a single use credit ledger.
- Demo HMAC issuer and verifier.
- Working host demo with chat, credits, transcript, event trace and receipt.
- Inline placement rules for logo, image, video and text creatives.
- CLI for sample, verify, credit and demo.
- Node tests, static checks and a real Chrome browser check.
- Static site build and a GitHub Pages workflow.

## Next, in order

1. **Server verifier example.** Add a small Node HTTP verifier that owns the
   secret, checks a session and credits a ledger transactionally. Keep it
   separate from the demo.
2. **Model scoped wallet.** Define a wallet that stores credits against a model
   or tier and refuses a spend against another model. Add tests for switching.
3. **Session store contract.** Define the minimum server state for used
   receipts, nonces, caps and expiry. Add tests for concurrent redemption.
4. **Ad network proof adapter.** Define one narrow interface for a signed
   completion proof. Build a synthetic adapter, not a real network.
5. **Viewability policy.** Decide the minimum visible area and duration for an
   inline card. Keep the explicit start. Do not credit passive scrolling.
6. **Placement policy.** Decide the frequency, dismissal and recovery rules. Add
   an explicit remaining count when a cap applies.
7. **Creative formats.** Add tested fixtures for a logo card, an image card and
   a text placement. Keep the video sample. Do not allow remote HTML injection.
8. **Package build.** Produce a versioned ESM bundle and a single file component
   build for hosts that do not use a bundler. Keep the package private until
   the owner chooses a distribution route.
9. **Consent record.** Define what the person agreed to, when, and how to
   withdraw. Do not infer consent from a watch.
10. **Comprehension study.** Test whether a first time visitor can explain the
    placement, the model scope, the exchange and the receipt without opening How
    it works.
11. **Accessibility review.** Test with VoiceOver, keyboard only, reduced motion
    and a 200 percent zoom. Record the findings.

## Explicitly not planned

- Targeting or behavioural profiles.
- Real advertising inventory.
- Real money, payouts or financial claims.
- A hosted service.
- Automatic play or background earning.
- A separate side rail.
- Obscuring the sponsor or the credit scope.

## Open questions

- Should the host or the ad network own the completion timer?
- Can a receipt be transferred between sessions? The current answer is no.
- What is the right cap for a free tier? The demo uses three watches, not a
  researched policy.
- Should a paused watch keep its partial progress after a reload? The demo does
  not persist it.
- Should a brand suggestion have a destination, or is the creative enough?
- How does a model-scoped wallet behave when the person switches models?
- What placement frequency is useful rather than noisy?

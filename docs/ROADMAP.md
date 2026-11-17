# Roadmap

## v0.1, shipped as a reference

- Portable `<ad-harness>` custom element with a pausable watch, visibility and
  viewport pause, progress events and a completion claim.
- Pure claim validation and a single use credit ledger.
- Demo HMAC issuer and verifier.
- Working host demo with chat, credits, transcript, event trace and receipt.
- CLI for sample, verify, credit and demo.
- Node tests, static checks and a real Chrome browser check.
- Static site build and a GitHub Pages workflow.

## Next, in order

1. **Server verifier example.** Add a small Node HTTP verifier that owns the
   secret, checks a session and credits a ledger transactionally. Keep it
   separate from the demo.
2. **Session store contract.** Define the minimum server state for used
   receipts, nonces, caps and expiry. Add tests for concurrent redemption.
3. **Ad network proof adapter.** Define one narrow interface for a signed
   completion proof. Build a synthetic adapter, not a real network.
4. **Package build.** Produce a versioned ESM bundle and a single file component
   build for hosts that do not use a bundler. Keep the package private until
   the owner chooses a distribution route.
5. **Frequency policy.** Add a server side daily and weekly cap, with an
   explicit user visible remaining count.
6. **Consent record.** Define what the person agreed to, when, and how to
   withdraw. Do not infer consent from a watch.
7. **Comprehension study.** Test whether a first time visitor can explain the
   exchange, find the receipt and recognise the sponsor without opening the
   inspection panel.
8. **Accessibility review.** Test with VoiceOver, keyboard only, reduced motion
   and a 200 percent zoom. Record the findings.

## Explicitly not planned

- Targeting or behavioural profiles.
- Real advertising inventory.
- Real money, payouts or financial claims.
- A hosted service.
- Automatic play or background earning.
- Obscuring the sponsor or the ledger.

## Open questions

- Should the host or the ad network own the completion timer?
- Can a receipt be transferred between sessions? The current answer is no.
- What is the right cap for a free tier? The demo uses three watches, not a
  researched policy.
- Should a paused watch keep its partial progress after a reload? The demo does
  not persist it.

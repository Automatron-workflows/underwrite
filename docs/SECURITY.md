# Security

Underwrite is an experimental reference with no production support or
independent security audit. The current maintained code is the default branch.
This document describes the trust boundaries and the gaps a host must close.

## Trust boundaries

| Asset                   | Trusted?  | Notes                                                                 |
| ----------------------- | --------- | --------------------------------------------------------------------- |
| Published ad definition | Host      | The server must own the id, duration and reward.                      |
| Completion claim        | Untrusted | Produced by the client. Validate on the server.                       |
| Demo issuer key         | Public    | It is printed in the source on purpose.                               |
| Receipt signature       | Demo only | HMAC in the browser is integrity theatre, not production security.    |
| Ledger                  | Host      | The demo ledger is in memory. Production needs a transactional store. |
| Ad network proof        | Missing   | A real deployment must add one.                                       |

## What Underwrite checks

- The claim belongs to the published ad and reward.
- The session id and nonce have a bounded shape.
- The active watch covers the duration.
- The timestamps are monotonic enough to contain the watch.
- The claim is fresh and not from the future.
- The receipt id matches the claim digest.
- The receipt signature verifies with the demo key.
- A receipt is credited once.
- The session cap is local and visible.
- A rejection is recorded with amount zero.

## Threats

### A forged claim

Anyone can call `issueReceipt` with a fabricated claim because the demo key is
public. The ledger still checks the ad, reward, duration, timestamps, nonce and
freshness. It cannot prove a person watched. Production must require an ad
network proof and a server side session.

### A replayed receipt

`usedReceipts` refuses a second credit. In production the check and the balance
change must happen in one transaction, with the receipt id as a unique key.

### A tampered client

The component and claim run on the user's machine. A determined user can emit a
custom claim. That is why the server verifier and the ad network proof exist.
The demo models the shape of the proof, not its authority.

### A watch in a background tab

The player pauses on `visibilitychange`, when the card leaves the conversation
view and when disabled. It does not auto resume. Do not remove those rules to
improve completion rates. A background tab must not earn credits.

### A placement that looks like a model answer

The host inserts the card between turns. It uses its own chrome, sponsor label
and creative, not the assistant bubble or avatar. Do not place it inside a model
response or phrase it as a model recommendation. A production host must separate
the placement from generated content in its own templates and tests.

### An unnamed model scope

The demo names **Sage Mini** in the host bar, the task line, the transcript and
How it works. A production wallet must not silently mix sponsored credits across
models. The server should store the scope with the receipt and refuse a spend
against a different model.

### Passive exposure or autoplay

The demo requires an explicit watch. A card that credits on passive scrolling or
autoplay would reward exposure the person did not choose and is easier to game.
Do not add it without a viewability proof, consent and a separate product review.

### Context targeting

The demo makes no ad request and uses no conversation content. A production
placement that sends context to an advertiser creates a privacy boundary that
needs explicit consent and a published data policy. Prefer contextual placement
rules that do not require the message body.

### A cap bypass

The demo cap lives in memory. A reload starts a new session. Production caps
must be keyed to an account or device on the server, with a frequency policy
across sessions.

### A misleading creative

The host supplies the creative. A real ad network must review it. The component
labels the surface as sponsored and keeps the sponsor visible. Do not use the
component to disguise an ad as a message from the model.

### An injected creative

The host should supply a logo, image, video or text through the normal slot. Do
not build a path that injects arbitrary remote HTML, script or untrusted iframes
into the card.

### Privacy

The demo makes no network requests, sets no cookies and stores no local state.
The page CSP sets `connect-src 'none'`. A production integration must publish its
data policy, keep targeting optional and avoid placing sensitive conversation
content in an ad request.

## Production checklist

1. Move issuance and verification to a server.
2. Replace the demo HMAC key with a server secret and the network proof.
3. Bind each claim to an authenticated account, a server session and a model
   scope.
4. Store used receipts and nonces transactionally.
5. Enforce caps and frequency on the server.
6. Add expiry and revocation to receipts.
7. Keep the placement clearly labelled and outside generated model content.
8. Require an explicit watch or a reviewed viewability proof. Do not credit
   passive autoplay or a background tab.
9. Publish the placement, context and data policy before using conversation
   content.
10. Log only what is needed for fraud review.
11. Commission a security review before accepting money or personal data.

## Reporting

If GitHub's **Security → Report a vulnerability** option is available, use it
for sensitive details. Otherwise open a minimal issue asking for a private
channel without publishing exploit details or secrets. Do not test against
accounts, sites or ad networks without permission.

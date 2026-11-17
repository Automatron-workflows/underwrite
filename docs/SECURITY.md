# Security

Ad Harness is an experimental reference with no production support or
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

## What the harness checks

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

### A watch in a background tab

The player pauses on `visibilitychange`, when it leaves the viewport and when
disabled. It does not auto resume. Do not remove those rules to improve
completion rates. A background tab must not earn credits.

### A tampered client

The component and claim run on the user's machine. A determined user can emit a
custom claim. That is why the server verifier and the ad network proof exist.
The demo models the shape of the proof, not its authority.

### A cap bypass

The demo cap lives in memory. A reload starts a new session. Production caps
must be keyed to an account or device on the server, with a frequency policy
across sessions.

### A misleading creative

The host supplies the creative. A real ad network must review it. The component
labels the surface as sponsored and keeps the sponsor visible. Do not use the
harness to disguise an ad as a message from the model.

### Privacy

The demo makes no network requests, sets no cookies and stores no local state.
The page CSP sets `connect-src 'none'`. A production integration must publish its
data policy, keep targeting optional and avoid placing sensitive conversation
content in an ad request.

## Production checklist

1. Move issuance and verification to a server.
2. Replace the demo HMAC key with a server secret and the network proof.
3. Bind each claim to an authenticated account and a server session.
4. Store used receipts and nonces transactionally.
5. Enforce caps and frequency on the server.
6. Add expiry and revocation to receipts.
7. Log only what is needed for fraud review.
8. Commission a security review before accepting money or personal data.

## Reporting

If GitHub's **Security → Report a vulnerability** option is available, use it
for sensitive details. Otherwise open a minimal issue asking for a private
channel without publishing exploit details or secrets. Do not test against
accounts, sites or ad networks without permission.

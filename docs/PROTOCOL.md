# Protocol

The protocol has four roles. They are deliberately separate.

| Role      | Owns                                                  | In this repository           |
| --------- | ----------------------------------------------------- | ---------------------------- |
| Component | Attention, visibility, elapsed time, completion claim | `src/element.mjs`            |
| Host      | User, balance, UI, session cap                        | `app.mjs`                    |
| Issuer    | Validation, receipt identity, signature               | `src/issuer.mjs` (demo only) |
| Ledger    | Single use credit movement                            | `src/protocol.mjs`           |

The component never knows a balance. The host never trusts a balance supplied
by the component. The issuer signs a proof. The ledger refuses to use it twice.

## Sequence

```text
host                component                 host verifier              ledger
 |  start()             |                          |                       |
 |--------------------->|                          |                       |
 |  started             |                          |                       |
 |<---------------------|                          |                       |
 |  progress, pause, resume (visible time only)    |                       |
 |<---------------------|                          |                       |
 |  completed { claim } |                          |                       |
 |<---------------------|                          |                       |
 |  verify(claim) --------------------------------->|                       |
 |  receipt { id, issuedAt, signature } <----------|                       |
 |  credit(receipt) ------------------------------------------------------>|
 |  new ledger <-----------------------------------------------------------|
```

The host must keep the claim out of the balance until verification returns.

## Completion claim

```json
{
  "version": 1,
  "adId": "still-launch",
  "sessionId": "ses_example",
  "startedAt": 1794926880661,
  "completedAt": 1794926895688,
  "elapsedMs": 15000,
  "reward": 40,
  "nonce": "80sDPOch2cgTN0d5c_uYfRZq"
}
```

Validation rejects:

| Rule                                       | Error             |
| ------------------------------------------ | ----------------- |
| Unknown version                            | `claim_invalid`   |
| Different ad                               | `ad_mismatch`     |
| Different reward                           | `reward_mismatch` |
| Session id or nonce shape                  | `claim_invalid`   |
| Elapsed time below duration minus 250ms    | `claim_invalid`   |
| Elapsed time above duration plus 60s       | `claim_invalid`   |
| Wall clock window shorter than active time | `claim_invalid`   |
| Completion more than 60s in the future     | `claim_invalid`   |
| Completion older than 5 minutes            | `claim_invalid`   |

The 250ms tolerance covers a timer boundary. It is not a licence to shorten the
ad. The demo player sets elapsed time to the exact duration.

## Receipt

```json
{
  "version": 1,
  "adId": "still-launch",
  "sessionId": "ses_example",
  "startedAt": 1794926880661,
  "completedAt": 1794926895688,
  "elapsedMs": 15000,
  "reward": 40,
  "nonce": "80sDPOch2cgTN0d5c_uYfRZq",
  "receiptId": "rcpt_mjzrBuiNBWzJlBOQizjLs3",
  "issuedAt": 1794926895689,
  "signature": "..."
}
```

The demo issuer derives `receiptId` from a SHA-256 digest of the claim and signs
the full receipt body with HMAC-SHA-256. Verification recomputes the id and
checks the signature.

This proves integrity through the demo code path. It does not prove that an ad
network served the message. See [SECURITY.md](SECURITY.md).

## Ledger

`creditReceipt` returns a new ledger. It does not mutate the input.

| Refusal                | Meaning                                         |
| ---------------------- | ----------------------------------------------- |
| `receipt_used`         | The receipt id is already in `usedReceipts`.    |
| `session_cap`          | `adsWatched` has reached the host cap.          |
| `reward_mismatch`      | The claim reward differs from the ad reward.    |
| `ad_mismatch`          | The claim belongs to another ad.                |
| `claim_invalid`        | The watch, freshness or timestamp rules failed. |
| `signature_invalid`    | The host verifier refused the receipt.          |
| `insufficient_credits` | A spend would go below zero.                    |

The demo host uses:

```text
starting balance  10
reply cost        10
watch reward      40
session cap       3 watches
```

A rejection is recorded with amount `0`. It never changes the balance.

## Time

The player uses a 100ms timer and `performance.now()`. It adds at most 1000ms per
tick, so an occluded but visible tab tracks real time without a large jump. It
pauses on `visibilitychange`, on leaving the viewport and when disabled. It does
not auto resume.

A background tab must not earn credits. The visibility rule is therefore part of
the contract, not a visual nicety.

## Versioning

`UNDERWRITE_VERSION` is `1`. A breaking claim or receipt shape requires a new
version and an explicit migration. Do not silently accept an older shape.

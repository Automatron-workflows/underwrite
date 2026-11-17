# Security

Ad Harness is experimental and has no production support or independent security
audit. The current maintained code is the default branch. Its implemented
boundaries and known gaps are in [docs/SECURITY.md](docs/SECURITY.md).

If GitHub's **Security → Report a vulnerability** option is available on this
repository, use it for sensitive details. Otherwise, open a minimal issue asking
for a private reporting channel without publishing exploit details or secrets.
For ordinary non-sensitive defects, include a sanitized reproducer in an issue.

Do not test against sites, accounts or ad networks without permission. Do not
attach real passwords, tokens, private captures or personal data.

The demo issuer key is public by design. It is not a secret and it does not
authorise a real credit. Do not report its presence as a vulnerability. Report a
way to make the demo ledger accept a second credit for the same receipt, a short
watch, or a claim the protocol should refuse.

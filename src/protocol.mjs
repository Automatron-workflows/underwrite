/**
 * Underwrite protocol.
 *
 * Portable and side effect free. The browser component, the demo host, the CLI
 * and the tests share these rules. The component produces a completion claim.
 * A host verifies that claim, turns it into a single use receipt and only then
 * moves the credit ledger. Nothing here trusts a balance supplied by a client.
 */

export const UNDERWRITE_VERSION = 1;

/**
 * @typedef {Object} AdDefinition
 * @property {string} id
 * @property {string} sponsor
 * @property {string} title
 * @property {number} durationMs
 * @property {number} reward
 * @property {readonly string[]} transcript
 */

/**
 * @typedef {Object} CompletionClaim
 * @property {1} version
 * @property {string} adId
 * @property {string} sessionId
 * @property {number} startedAt
 * @property {number} completedAt
 * @property {number} elapsedMs
 * @property {number} reward
 * @property {string} nonce
 */

/**
 * @typedef {CompletionClaim & {
 *   receiptId: string,
 *   issuedAt: number,
 *   signature: string
 * }} CreditReceipt
 */

/**
 * @typedef {"grant" | "spend" | "reject"} LedgerEntryKind
 */

/**
 * @typedef {Object} LedgerEntry
 * @property {string} id
 * @property {LedgerEntryKind} kind
 * @property {number} amount
 * @property {number} at
 * @property {string} label
 * @property {string} [receiptId]
 */

/**
 * @typedef {Object} LedgerState
 * @property {number} balance
 * @property {number} adsWatched
 * @property {readonly LedgerEntry[]} entries
 * @property {readonly string[]} usedReceipts
 */

/**
 * @typedef {"claim_invalid" | "signature_invalid" | "receipt_invalid" |
 *   "receipt_used" | "session_cap" | "reward_mismatch" | "ad_mismatch" |
 *   "insufficient_credits" | "invalid_amount"} UnderwriteErrorCode
 */

export class UnderwriteError extends Error {
  /**
   * @param {UnderwriteErrorCode} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "UnderwriteError";
    this.code = code;
  }
}

/**
 * @param {UnderwriteErrorCode} code
 * @param {string} message
 * @returns {never}
 */
function fail(code, message) {
  throw new UnderwriteError(code, message);
}

const CLAIM_FRESHNESS_MS = 5 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;
const SESSION_ID = /^[a-zA-Z0-9_-]{8,64}$/;
const NONCE = /^[a-zA-Z0-9_-]{16,64}$/;

/**
 * @param {unknown} error
 * @returns {error is UnderwriteError}
 */
export function isUnderwriteError(error) {
  return error instanceof UnderwriteError;
}

/**
 * Validate a completion claim against the published ad definition.
 *
 * @param {CompletionClaim} claim
 * @param {AdDefinition} definition
 * @param {number} [now]
 * @returns {void}
 */
export function assertValidClaim(claim, definition, now = Date.now()) {
  if (!claim || typeof claim !== "object")
    fail("claim_invalid", "A completion claim must be an object.");
  if (claim.version !== UNDERWRITE_VERSION)
    fail("claim_invalid", "The completion claim version is not supported.");
  if (claim.adId !== definition.id)
    fail("ad_mismatch", "The claim belongs to a different sponsored message.");
  if (claim.reward !== definition.reward)
    fail(
      "reward_mismatch",
      "The claim reward does not match the published reward.",
    );
  if (!SESSION_ID.test(String(claim.sessionId)))
    fail("claim_invalid", "The session id is missing or malformed.");
  if (!NONCE.test(String(claim.nonce)))
    fail("claim_invalid", "The completion nonce is missing or malformed.");
  if (!Number.isFinite(claim.startedAt) || claim.startedAt <= 0)
    fail("claim_invalid", "The claim start time is invalid.");
  if (
    !Number.isFinite(claim.completedAt) ||
    claim.completedAt < claim.startedAt
  )
    fail("claim_invalid", "The claim completed before it started.");
  if (
    !Number.isFinite(claim.elapsedMs) ||
    claim.elapsedMs < definition.durationMs - 250
  )
    fail(
      "claim_invalid",
      "The sponsored message was not watched for its full duration.",
    );
  if (claim.elapsedMs > definition.durationMs + 60_000)
    fail(
      "claim_invalid",
      "The claim duration does not match the sponsored message.",
    );
  // Active watch time cannot exceed the wall clock window that contains it.
  if (claim.completedAt - claim.startedAt < claim.elapsedMs - 5_000)
    fail("claim_invalid", "The claim timestamps do not cover the watch.");
  // Wall clock drift is possible, but a claim from the future is not.
  if (claim.completedAt - now > CLOCK_SKEW_MS)
    fail("claim_invalid", "The claim completion time is in the future.");
  if (now - claim.completedAt > CLAIM_FRESHNESS_MS)
    fail(
      "claim_invalid",
      "The completion claim has expired. Watch the message again.",
    );
}

/**
 * @param {number} startBalance
 * @returns {LedgerState}
 */
export function createLedger(startBalance) {
  if (!Number.isInteger(startBalance) || startBalance < 0)
    fail(
      "invalid_amount",
      "The starting balance must be a non negative integer.",
    );
  return {
    balance: startBalance,
    adsWatched: 0,
    entries: [],
    usedReceipts: [],
  };
}

/**
 * @param {LedgerState} state
 * @param {number} cost
 * @param {string} label
 * @param {number} [at]
 * @returns {{ state: LedgerState, entry: LedgerEntry }}
 */
export function spendCredits(state, cost, label, at = Date.now()) {
  if (!Number.isInteger(cost) || cost <= 0)
    fail("invalid_amount", "A spend must be a positive integer.");
  if (state.balance < cost)
    fail(
      "insufficient_credits",
      "There are not enough credits for this action.",
    );
  /** @type {LedgerEntry} */
  const entry = {
    id: `spend_${at}_${state.entries.length}`,
    kind: "spend",
    amount: -cost,
    at,
    label,
  };
  return {
    state: {
      ...state,
      balance: state.balance - cost,
      entries: [entry, ...state.entries],
    },
    entry,
  };
}

/**
 * Credit a verified receipt exactly once.
 *
 * @param {LedgerState} state
 * @param {CreditReceipt} receipt
 * @param {AdDefinition} definition
 * @param {{ maxAds: number, now?: number }} options
 * @returns {{ state: LedgerState, entry: LedgerEntry }}
 */
export function creditReceipt(state, receipt, definition, options) {
  const now = options.now ?? Date.now();
  assertValidClaim(receipt, definition, now);
  if (state.usedReceipts.includes(receipt.receiptId))
    fail("receipt_used", "This receipt has already been credited.");
  if (state.adsWatched >= options.maxAds)
    fail(
      "session_cap",
      "This session has reached its sponsored message limit.",
    );
  if (receipt.issuedAt - now > CLOCK_SKEW_MS)
    fail("claim_invalid", "The receipt was issued in the future.");
  /** @type {LedgerEntry} */
  const entry = {
    id: receipt.receiptId,
    kind: "grant",
    amount: receipt.reward,
    at: now,
    label: `Sponsor watch · ${definition.sponsor}`,
    receiptId: receipt.receiptId,
  };
  return {
    state: {
      ...state,
      balance: state.balance + receipt.reward,
      adsWatched: state.adsWatched + 1,
      entries: [entry, ...state.entries],
      usedReceipts: [receipt.receiptId, ...state.usedReceipts],
    },
    entry,
  };
}

/**
 * Record a rejection without changing the balance.
 *
 * @param {LedgerState} state
 * @param {unknown} error
 * @param {number} [at]
 * @returns {LedgerState}
 */
export function rejectReceipt(state, error, at = Date.now()) {
  const code = isUnderwriteError(error) ? error.code : "claim_invalid";
  /** @type {LedgerEntry} */
  const entry = {
    id: `reject_${at}_${state.entries.length}`,
    kind: "reject",
    amount: 0,
    at,
    label: `Rejected · ${code}`,
  };
  return { ...state, entries: [entry, ...state.entries] };
}

/**
 * @param {LedgerState} state
 * @param {number} maxAds
 * @returns {number}
 */
export function remainingAds(state, maxAds) {
  return Math.max(0, maxAds - state.adsWatched);
}

/**
 * @param {LedgerState} state
 * @param {number} cost
 * @returns {boolean}
 */
export function canSpend(state, cost) {
  return state.balance >= cost;
}

/**
 * @param {number} value
 * @returns {string}
 */
export function formatCredits(value) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(
    value,
  );
}

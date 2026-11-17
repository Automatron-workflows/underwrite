import { AD_HARNESS_VERSION, AdHarnessError } from "./protocol.mjs";

/**
 * The demo issuer runs in the browser so the whole contract can be inspected
 * without a backend. It is deliberately public. A production issuer belongs on
 * a server, keys never reach the client, and the ad network signs the proof.
 * See docs/SECURITY.md.
 */
export const DEMO_ISSUER_SECRET = "ad-harness-demo-issuer-v1-public";

const encoder = new TextEncoder();
const subtle = globalThis.crypto?.subtle;

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * @param {string} value
 * @returns {Uint8Array}
 */
function fromBase64url(value) {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * @param {import("./protocol.mjs").CompletionClaim} claim
 * @returns {string}
 */
function claimBody(claim) {
  return JSON.stringify([
    claim.version,
    claim.adId,
    claim.sessionId,
    claim.startedAt,
    claim.completedAt,
    claim.elapsedMs,
    claim.reward,
    claim.nonce,
  ]);
}

/**
 * @param {import("./protocol.mjs").CreditReceipt} receipt
 * @returns {string}
 */
function receiptBody(receipt) {
  return JSON.stringify([
    receipt.version,
    receipt.adId,
    receipt.sessionId,
    receipt.startedAt,
    receipt.completedAt,
    receipt.elapsedMs,
    receipt.reward,
    receipt.nonce,
    receipt.receiptId,
    receipt.issuedAt,
  ]);
}

/**
 * @param {string} secret
 * @returns {Promise<CryptoKey>}
 */
async function key(secret) {
  if (!subtle)
    throw new AdHarnessError("signature_invalid", "Web Crypto is unavailable.");
  return subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * @param {import("./protocol.mjs").CompletionClaim} claim
 * @returns {void}
 */
function assertClaimShape(claim) {
  if (!claim || typeof claim !== "object")
    throw new AdHarnessError(
      "claim_invalid",
      "A completion claim must be an object.",
    );
  if (claim.version !== AD_HARNESS_VERSION)
    throw new AdHarnessError(
      "claim_invalid",
      "The completion claim version is not supported.",
    );
  if (!claim.adId || !claim.sessionId || !claim.nonce)
    throw new AdHarnessError(
      "claim_invalid",
      "The completion claim is incomplete.",
    );
  if (
    !Number.isFinite(claim.startedAt) ||
    !Number.isFinite(claim.completedAt) ||
    !Number.isFinite(claim.elapsedMs) ||
    !Number.isInteger(claim.reward) ||
    claim.reward <= 0
  )
    throw new AdHarnessError(
      "claim_invalid",
      "The completion claim contains an invalid number.",
    );
}

/**
 * Turn a completion claim into a signed, single use receipt.
 *
 * @param {import("./protocol.mjs").CompletionClaim} claim
 * @param {string} [secret]
 * @param {number} [now]
 * @returns {Promise<import("./protocol.mjs").CreditReceipt>}
 */
export async function issueReceipt(
  claim,
  secret = DEMO_ISSUER_SECRET,
  now = Date.now(),
) {
  assertClaimShape(claim);
  if (!subtle)
    throw new AdHarnessError("signature_invalid", "Web Crypto is unavailable.");
  const digest = await subtle.digest(
    "SHA-256",
    encoder.encode(claimBody(claim)),
  );
  const receiptId = `rcpt_${base64url(new Uint8Array(digest)).slice(0, 22)}`;
  /** @type {import("./protocol.mjs").CreditReceipt} */
  const receipt = { ...claim, receiptId, issuedAt: now, signature: "" };
  const signature = await subtle.sign(
    "HMAC",
    await key(secret),
    encoder.encode(receiptBody(receipt)),
  );
  return { ...receipt, signature: base64url(new Uint8Array(signature)) };
}

/**
 * Verify the demo issuer signature and the receipt identity.
 *
 * @param {import("./protocol.mjs").CreditReceipt} receipt
 * @param {string} [secret]
 * @returns {Promise<true>}
 */
export async function verifyReceipt(receipt, secret = DEMO_ISSUER_SECRET) {
  assertClaimShape(receipt);
  if (
    !receipt.receiptId ||
    !receipt.signature ||
    !Number.isFinite(receipt.issuedAt)
  )
    throw new AdHarnessError("receipt_invalid", "The receipt is incomplete.");
  if (!subtle)
    throw new AdHarnessError("signature_invalid", "Web Crypto is unavailable.");
  const digest = await subtle.digest(
    "SHA-256",
    encoder.encode(claimBody(receipt)),
  );
  const expectedId = `rcpt_${base64url(new Uint8Array(digest)).slice(0, 22)}`;
  if (receipt.receiptId !== expectedId)
    throw new AdHarnessError(
      "signature_invalid",
      "The receipt id does not match the claim.",
    );
  let valid = false;
  try {
    valid = await subtle.verify(
      "HMAC",
      await key(secret),
      fromBase64url(receipt.signature),
      encoder.encode(receiptBody(receipt)),
    );
  } catch {
    valid = false;
  }
  if (!valid)
    throw new AdHarnessError(
      "signature_invalid",
      "The receipt signature is not valid.",
    );
  return true;
}

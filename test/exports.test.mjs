import test from "node:test";
import assert from "node:assert/strict";

test("the package exports the protocol and a browser safe element", async () => {
  const module = await import("../src/index.mjs");
  assert.equal(module.AD_HARNESS_VERSION, 1);
  assert.equal(typeof module.assertValidClaim, "function");
  assert.equal(typeof module.issueReceipt, "function");
  assert.equal(typeof module.AdHarnessElement, "function");
  assert.equal(typeof module.registerAdHarness, "function");
  assert.doesNotThrow(() => module.registerAdHarness());
});

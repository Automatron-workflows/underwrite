import test from "node:test";
import assert from "node:assert/strict";

test("the package exports the protocol and a browser safe element", async () => {
  const module = await import("../src/index.mjs");
  assert.equal(module.UNDERWRITE_VERSION, 1);
  assert.equal(typeof module.assertValidClaim, "function");
  assert.equal(typeof module.issueReceipt, "function");
  assert.equal(typeof module.UnderwriteElement, "function");
  assert.equal(typeof module.registerUnderwrite, "function");
  assert.doesNotThrow(() => module.registerUnderwrite());
});

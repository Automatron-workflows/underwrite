import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const bin = fileURLToPath(new URL("../bin/ad-harness.mjs", import.meta.url));

async function cli(args, cwd) {
  return run(process.execPath, [bin, ...args], { cwd, timeout: 20_000 });
}

test("the CLI samples, verifies and credits a fresh claim", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ad-harness-cli-"));
  try {
    await cli(["sample", "--out", "claim.json"], directory);
    const claim = JSON.parse(
      await readFile(join(directory, "claim.json"), "utf8"),
    );
    assert.equal(claim.adId, "still-launch");
    assert.equal(claim.elapsedMs, 15_000);

    const verified = JSON.parse(
      (await cli(["verify", "--json", "claim.json"], directory)).stdout,
    );
    assert.deepEqual(verified, {
      ok: true,
      adId: "still-launch",
      elapsedMs: 15_000,
      reward: 40,
    });

    const credited = JSON.parse(
      (await cli(["credit", "claim.json", "--json"], directory)).stdout,
    );
    assert.equal(credited.ok, true);
    assert.match(credited.receipt.receiptId, /^rcpt_/);
    assert.equal(credited.ledger.balance, 50);
    assert.equal(credited.ledger.adsWatched, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the CLI refuses a short watch with a machine readable code", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ad-harness-cli-"));
  try {
    const now = Date.now();
    await writeFile(
      join(directory, "short.json"),
      JSON.stringify({
        version: 1,
        adId: "still-launch",
        sessionId: "ses_test_session_01",
        startedAt: now - 1_000,
        completedAt: now,
        elapsedMs: 1_000,
        reward: 40,
        nonce: "nonce_abcdefghijklmnop",
      }),
    );
    await assert.rejects(
      () => cli(["verify", "short.json", "--json"], directory),
      (error) => {
        assert.equal(error.code, 1);
        assert.equal(JSON.parse(error.stdout).ok, false);
        assert.equal(JSON.parse(error.stdout).code, "claim_invalid");
        return true;
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the CLI prints help and version", async () => {
  const version = await cli(["--version"], process.cwd());
  assert.equal(version.stdout.trim(), "0.1.0");
  const help = await cli(["--help"], process.cwd());
  assert.match(help.stdout, /Usage:/);
});

test("the CLI demo prints the complete local exchange", async () => {
  const { stdout } = await cli(["demo"], process.cwd());
  assert.match(stdout, /Ad\s+still-launch/);
  assert.match(stdout, /Claim\s+valid/);
  assert.match(stdout, /Receipt\s+rcpt_/);
  assert.match(stdout, /Ledger\s+\+40 · balance 50/);
  assert.match(stdout, /demo issuer only/);
});

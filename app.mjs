import { stillAd } from "./examples/still-ad.mjs";
import { registerAdHarness } from "./src/element.mjs";
import {
  assertValidClaim,
  createLedger,
  creditReceipt,
  formatCredits,
  rejectReceipt,
  remainingAds,
  spendCredits,
} from "./src/protocol.mjs";
import {
  DEMO_ISSUER_SECRET,
  issueReceipt,
  verifyReceipt,
} from "./src/issuer.mjs";

registerAdHarness();

const START_BALANCE = 10;
const MESSAGE_COST = 10;
const MAX_ADS = 3;

const AD = {
  ...stillAd,
  id: "still-inline",
  durationMs: 8_000,
};

const COPY = {
  scripted: "Demo response",
  placeholder: "Ask a question",
  placeholderLocked: "Watch the sponsored card to keep going",
  earn: "Earn 40",
  replies: {
    cost: "A reply costs 10 credits. One sponsored message earns 40, so a single watch covers four replies. This demo has no subscription and no payment.",
    why: "Inference has a real cost. A sponsor can cover it when the person chooses to watch. The exchange stays visible: sponsor, duration, reward, and every movement in the ledger.",
    verify:
      "The player emits a completion claim with the ad, session, elapsed time and a nonce. The host verifies it, issues a single use receipt, then credits the ledger. Short watches, stale claims, tampered signatures and duplicates are rejected before the balance moves.",
    fallback:
      "This demo answers from a fixed script. It can explain the harness, but it is not a live model. The point is the contract around the ad, not the language model.",
  },
  credited: "Receipt verified. Forty credits added.",
  cap: "Session limit reached. The player is closed for this demo.",
};

const $ = (selector) => document.querySelector(selector);

const el = {
  messages: $("#messages"),
  thread: $("#thread"),
  announcer: $("#announcer"),
  composer: $("#composer"),
  message: $("#message"),
  send: $("#send"),
  balance: $("#balance"),
  player: $("#player"),
  film: $("#film"),
  trace: $("#trace"),
  receipt: $("#receipt"),
  replay: $("#replay"),
  reset: $("#reset"),
  copy: $("#copy"),
  replayNote: $("#replay-note"),
  how: $("#how"),
  developer: $("#developer"),
  developerDialog: $("#developer-dialog"),
  howDialog: $("#how-dialog"),
};

let ledger = createLedger(START_BALANCE);
let messages = [];
let trace = [];
let receipt = null;
let replayNote = "";
let busy = false;
let generation = 0;
let copied = false;
let copyTimer;
let traceId = 0;
let messageId = 0;
let startedAtEpoch = Date.now();
let startedAtMono = performance.now();
let milestone = -1;

const formatOffset = (value) => `+${(Math.max(0, value) / 1000).toFixed(1)}s`;

const replyFor = (text) => {
  const value = text.toLowerCase();
  if (
    value.includes("cost") ||
    value.includes("credit") ||
    value.includes("price")
  )
    return COPY.replies.cost;
  if (
    value.includes("why") ||
    value.includes("business") ||
    value.includes("app")
  )
    return COPY.replies.why;
  if (
    value.includes("verify") ||
    value.includes("proof") ||
    value.includes("watch") ||
    value.includes("receipt")
  )
    return COPY.replies.verify;
  return COPY.replies.fallback;
};

function addTrace(type, detail) {
  trace.unshift({
    id: (traceId += 1),
    offset: performance.now() - startedAtMono,
    type,
    detail,
  });
  trace = trace.slice(0, 14);
  renderTrace();
}

function appendMessage(role, body, options = {}) {
  messages.push({ role, body, id: (messageId += 1), ...options });
}

function scrollChat() {
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  requestAnimationFrame(() => {
    el.messages.scrollTo({ top: el.messages.scrollHeight, behavior });
  });
}

function createMessageRow(message) {
  const row = document.createElement("div");
  row.className = `ah-msg ah-msg-${message.role}`;
  if (message.tone) row.dataset.tone = message.tone;
  if (message.role === "assistant") {
    const avatar = document.createElement("span");
    avatar.className = "ah-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "s";
    row.append(avatar);
  }
  const bubble = document.createElement("div");
  bubble.className = "ah-bubble";
  const body = document.createElement("p");
  body.textContent = message.body;
  bubble.append(body);
  if (message.label) {
    const label = document.createElement("span");
    label.className = "ah-label";
    label.textContent = message.label;
    bubble.append(label);
  }
  row.append(bubble);
  return row;
}

function renderThread({ scroll = false } = {}) {
  el.thread.textContent = "";
  for (const message of messages) el.thread.append(createMessageRow(message));
  if (scroll) scrollChat();
}

function updateSend() {
  const locked = ledger.balance < MESSAGE_COST;
  const canEarn = remainingAds(ledger, MAX_ADS) > 0;
  el.send.textContent = locked
    ? canEarn
      ? COPY.earn
      : "Session limit"
    : "Send";
  el.send.disabled =
    (!locked && !el.message.value.trim()) || (locked && !canEarn);
}

function renderBalance() {
  const locked = ledger.balance < MESSAGE_COST;
  el.player.disabled = remainingAds(ledger, MAX_ADS) === 0;
  el.balance.textContent = formatCredits(ledger.balance);
  el.message.disabled = locked;
  el.message.placeholder = locked ? COPY.placeholderLocked : COPY.placeholder;
  updateSend();
}

function renderTrace() {
  el.trace.textContent = "";
  if (trace.length === 0) {
    const empty = document.createElement("li");
    empty.className = "ah-empty";
    empty.textContent = "The trace starts when the player mounts.";
    el.trace.append(empty);
    return;
  }
  for (const entry of trace) {
    const row = document.createElement("li");
    const time = document.createElement("span");
    time.className = "ah-trace-time";
    time.textContent = formatOffset(entry.offset);
    const type = document.createElement("span");
    type.className = "ah-trace-type";
    type.textContent = entry.type;
    row.append(time, type);
    if (entry.detail) {
      const detail = document.createElement("span");
      detail.className = "ah-trace-detail";
      detail.textContent = entry.detail;
      row.append(detail);
    }
    el.trace.append(row);
  }
}

function renderReceipt() {
  el.receipt.textContent = receipt
    ? JSON.stringify(receipt, null, 2)
    : "Complete a watch to inspect its receipt.";
  el.copy.textContent = copied ? "Copied" : "Copy";
  el.copy.disabled = !receipt;
  el.replay.disabled = !receipt;
}

function renderChrome() {
  renderBalance();
  renderTrace();
  renderReceipt();
}

function setFilm(progress, status) {
  const act = Math.min(3, Math.floor(progress * 4));
  el.film.style.setProperty("--ah-progress", String(progress));
  el.film.dataset.act = String(act);
  el.film.dataset.status = status;
  el.film.querySelectorAll(".ah-film-act").forEach((item, index) => {
    item.dataset.active = String(index === act);
  });
}

function startPlayer(source) {
  if (remainingAds(ledger, MAX_ADS) === 0) return;
  addTrace("player:start", source);
  el.player.scrollIntoView({ block: "center", behavior: "auto" });
  el.player.start();
}

function send(value) {
  const text = value.trim();
  if (!text) return;
  if (ledger.balance < MESSAGE_COST) {
    startPlayer("composer");
    return;
  }
  try {
    const result = spendCredits(
      ledger,
      MESSAGE_COST,
      `Reply · ${text.slice(0, 48)}`,
    );
    ledger = result.state;
    addTrace("ledger:spent", `-${MESSAGE_COST} · reply`);
    appendMessage("user", text);
    const reply = replyFor(text);
    appendMessage("assistant", reply, { label: COPY.scripted });
    el.announcer.textContent = reply;
    el.message.value = "";
    renderThread({ scroll: true });
    renderChrome();
  } catch (error) {
    addTrace("ledger:spend:rejected", error?.code ?? "unknown");
  }
}

async function onClaim(claim) {
  if (busy) return;
  const current = generation;
  busy = true;
  addTrace("claim:received", `${claim.adId} · ${claim.elapsedMs}ms`);
  try {
    assertValidClaim(claim, AD);
    const nextReceipt = await issueReceipt(claim, DEMO_ISSUER_SECRET);
    if (generation !== current) return;
    addTrace("receipt:issued", nextReceipt.receiptId);
    await verifyReceipt(nextReceipt, DEMO_ISSUER_SECRET);
    if (generation !== current) return;
    addTrace("receipt:verified", "signature valid");
    const result = creditReceipt(ledger, nextReceipt, AD, { maxAds: MAX_ADS });
    ledger = result.state;
    receipt = nextReceipt;
    addTrace(
      "ledger:credited",
      `+${nextReceipt.reward} · ${nextReceipt.receiptId}`,
    );
    el.announcer.textContent = COPY.credited;
    appendMessage("system", COPY.credited, { tone: "credit" });
    if (remainingAds(ledger, MAX_ADS) === 0) {
      addTrace("session:cap", `${MAX_ADS} of ${MAX_ADS}`);
      appendMessage("system", COPY.cap);
    }
    renderThread({ scroll: true });
    renderChrome();
  } catch (error) {
    if (generation !== current) return;
    const code = error?.code ? String(error.code) : "claim_invalid";
    ledger = rejectReceipt(ledger, error);
    addTrace("ledger:rejected", code);
    const message = `Receipt rejected. ${code}. The ledger did not move.`;
    el.announcer.textContent = message;
    appendMessage("system", message, { tone: "reject" });
    renderThread({ scroll: true });
    renderChrome();
  } finally {
    busy = false;
  }
}

function replayReceipt() {
  if (!receipt) return;
  addTrace("replay:attempt", receipt.receiptId);
  try {
    const result = creditReceipt(ledger, receipt, AD, { maxAds: MAX_ADS });
    ledger = result.state;
    replayNote = "Credited twice. This is a failure.";
    el.replayNote.dataset.state = "error";
    el.replayNote.textContent = replayNote;
    addTrace("replay:accepted", "duplicate credited");
    renderChrome();
  } catch (error) {
    const code = error?.code ? String(error.code) : "receipt_used";
    ledger = rejectReceipt(ledger, error);
    replayNote = `Rejected · ${code}. The balance did not move.`;
    el.replayNote.dataset.state = "error";
    el.replayNote.textContent = replayNote;
    addTrace("replay:rejected", code);
    const message = `Replay rejected. ${code}. The balance did not move.`;
    el.announcer.textContent = message;
    appendMessage("system", message, { tone: "reject" });
    renderThread({ scroll: true });
    renderChrome();
  }
}

function reset() {
  generation += 1;
  busy = false;
  ledger = createLedger(START_BALANCE);
  messages = [];
  trace = [];
  traceId = 0;
  receipt = null;
  replayNote = "The ledger must refuse a replayed receipt.";
  copied = false;
  startedAtEpoch = Date.now();
  startedAtMono = performance.now();
  milestone = -1;
  el.message.value = "";
  el.announcer.textContent = "";
  el.player.reset();
  el.film.dataset.status = "idle";
  el.film.dataset.act = "0";
  el.film.style.setProperty("--ah-progress", "0");
  el.film.querySelectorAll(".ah-film-act").forEach((item, index) => {
    item.dataset.active = String(index === 0);
  });
  el.replayNote.dataset.state = "idle";
  el.replayNote.textContent = replayNote;
  addTrace("demo:reset", "balance restored");
  renderThread();
  renderChrome();
  el.messages.scrollTop = 0;
}

async function copyReceipt() {
  if (!receipt) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    copied = true;
    markCopied();
    renderReceipt();
  } catch {
    copied = false;
    el.copy.textContent = "Copy failed";
    markCopied();
  }
}

function markCopied() {
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copied = false;
    renderReceipt();
  }, 1600);
}

function openDialog(dialog) {
  if (el.player.status === "playing") el.player.pause("user");
  dialog.showModal();
}

el.composer.addEventListener("submit", (event) => {
  event.preventDefault();
  if (ledger.balance < MESSAGE_COST) {
    startPlayer("composer");
    return;
  }
  send(el.message.value);
});

el.message.addEventListener("input", updateSend);
el.replay.addEventListener("click", replayReceipt);
el.reset.addEventListener("click", reset);
el.copy.addEventListener("click", copyReceipt);
el.how.addEventListener("click", () => openDialog(el.howDialog));
el.developer.addEventListener("click", () => openDialog(el.developerDialog));

for (const button of document.querySelectorAll("[data-close]")) {
  button.addEventListener("click", () => button.closest("dialog")?.close());
}
for (const dialog of [el.developerDialog, el.howDialog]) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

el.player.addEventListener("adharness:started", (event) => {
  milestone = -1;
  setFilm(0, "playing");
  addTrace(
    "adharness:started",
    `${Math.round(event.detail.durationMs / 1000)}s · +${event.detail.reward}`,
  );
});
el.player.addEventListener("adharness:progress", (event) => {
  const detail = event.detail;
  setFilm(detail.progress, "playing");
  const bucket = Math.floor(detail.progress * 4) * 25;
  if (bucket > 0 && bucket > milestone) {
    milestone = bucket;
    addTrace("adharness:progress", `${bucket}%`);
  }
});
el.player.addEventListener("adharness:paused", (event) => {
  const elapsed = Math.min(1, event.detail.elapsedMs / AD.durationMs);
  setFilm(elapsed, "paused");
  addTrace("adharness:paused", event.detail.reason);
});
el.player.addEventListener("adharness:resumed", () => {
  addTrace("adharness:resumed");
});
el.player.addEventListener("adharness:completed", (event) => {
  setFilm(1, "completed");
  addTrace(
    "adharness:completed",
    `${event.detail.claim.elapsedMs}ms · nonce ${event.detail.claim.nonce.slice(0, 8)}`,
  );
  void onClaim(event.detail.claim);
});
el.player.addEventListener("adharness:reset", () => {
  setFilm(0, "idle");
});

addTrace("component:mounted", `${START_BALANCE} credits · ${MAX_ADS} watches`);
renderThread();
renderChrome();

import { stillAd as AD } from "./examples/still-ad.mjs";
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
const METER_SEGMENTS = 4;

const COPY = {
  intro: "A reply costs 10 credits. Watch a sponsored message to earn 40.",
  scripted: "Demo response",
  placeholder: "Ask about the harness",
  placeholderLocked: "Watch a sponsored message to keep going",
  earn: "Earn 40",
  prompts: [
    "What does a reply cost?",
    "Why would an app do this?",
    "How is a watch verified?",
  ],
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
  announcer: $("#announcer"),
  composer: $("#composer"),
  message: $("#message"),
  send: $("#send"),
  balance: $("#balance"),
  meter: $("#meter"),
  state: $("#state"),
  player: $("#player"),
  film: $("#film"),
  ledger: $("#ledger"),
  watchCount: $("#watch-count"),
  trace: $("#trace"),
  receipt: $("#receipt"),
  replay: $("#replay"),
  reset: $("#reset"),
  copy: $("#copy"),
  replayNote: $("#replay-note"),
  inspect: $("#inspect"),
  how: $("#how"),
  developerDialog: $("#developer-dialog"),
  howDialog: $("#how-dialog"),
};

let ledger = createLedger(START_BALANCE);
let messages = [{ role: "assistant", body: COPY.intro }];
let trace = [];
let receipt = null;
let verification = "idle";
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

function renderMessages() {
  el.messages.textContent = "";
  const log = document.createElement("div");
  log.className = "ah-log";
  log.setAttribute("role", "group");
  log.setAttribute("aria-label", "Demo conversation");
  for (const message of messages) {
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
    log.append(row);
  }
  el.messages.append(log);

  if (!messages.some((message) => message.role === "user")) {
    const starters = document.createElement("div");
    starters.className = "ah-starters";
    starters.setAttribute("aria-label", "Suggested questions");
    const heading = document.createElement("p");
    heading.textContent = "Try a question";
    starters.append(heading);
    const locked = ledger.balance < MESSAGE_COST;
    for (const prompt of COPY.prompts) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = prompt;
      button.disabled = locked;
      button.addEventListener("click", () => send(prompt));
      starters.append(button);
    }
    el.messages.append(starters);
  }
  scrollChat();
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
  const filled = Math.min(
    METER_SEGMENTS,
    Math.ceil(ledger.balance / MESSAGE_COST),
  );
  el.player.disabled = remainingAds(ledger, MAX_ADS) === 0;
  el.balance.textContent = formatCredits(ledger.balance);
  Array.from(el.meter.children).forEach((segment, index) => {
    segment.dataset.filled = String(index < filled);
  });
  el.message.disabled = locked;
  el.message.placeholder = locked ? COPY.placeholderLocked : COPY.placeholder;
  el.watchCount.textContent = `${ledger.adsWatched} of ${MAX_ADS} sponsored`;
  updateSend();
}

function renderLedger() {
  el.ledger.textContent = "";
  if (ledger.entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "ah-ledger-empty";
    empty.textContent = "No movements yet.";
    el.ledger.append(empty);
    return;
  }
  for (const entry of ledger.entries.slice(0, 5)) {
    const row = document.createElement("li");
    row.dataset.kind = entry.kind;
    const amount = document.createElement("span");
    amount.className = "ah-ledger-amount";
    amount.textContent = `${entry.kind === "grant" ? "+" : entry.kind === "spend" ? "−" : ""}${Math.abs(entry.amount)}`;
    const label = document.createElement("span");
    label.className = "ah-ledger-label";
    label.textContent = entry.label;
    const time = document.createElement("span");
    time.className = "ah-ledger-time";
    time.textContent = formatOffset(entry.at - startedAtEpoch);
    row.append(amount, label, time);
    el.ledger.append(row);
  }
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

function renderState() {
  const labels = {
    idle: "Awaiting a watch",
    issuing: "Verifying",
    verified: "Verified",
    rejected: "Rejected",
  };
  el.state.dataset.state = verification;
  el.state.textContent = labels[verification];
  el.replay.disabled = !receipt;
}

function renderReceipt() {
  el.receipt.textContent = receipt
    ? JSON.stringify(receipt, null, 2)
    : "Complete a watch to inspect its receipt.";
  el.copy.textContent = copied ? "Copied" : "Copy";
  el.copy.disabled = !receipt;
}

function render() {
  renderBalance();
  renderLedger();
  renderTrace();
  renderState();
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
  if (matchMedia("(max-width: 900px)").matches) {
    el.player.scrollIntoView({ block: "center", behavior: "auto" });
  }
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
    renderMessages();
    render();
  } catch (error) {
    addTrace("ledger:spend:rejected", error?.code ?? "unknown");
  }
}

async function onClaim(claim) {
  if (busy) return;
  const current = generation;
  busy = true;
  verification = "issuing";
  render();
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
    verification = "verified";
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
    renderMessages();
    render();
  } catch (error) {
    if (generation !== current) return;
    const code = error?.code ? String(error.code) : "claim_invalid";
    ledger = rejectReceipt(ledger, error);
    verification = "rejected";
    addTrace("ledger:rejected", code);
    const message = `Receipt rejected. ${code}. The ledger did not move.`;
    el.announcer.textContent = message;
    appendMessage("system", message, { tone: "reject" });
    renderMessages();
    render();
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
    render();
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
    renderMessages();
    render();
  }
}

function reset() {
  generation += 1;
  busy = false;
  ledger = createLedger(START_BALANCE);
  messages = [{ role: "assistant", body: COPY.intro }];
  trace = [];
  traceId = 0;
  receipt = null;
  verification = "idle";
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
  renderMessages();
  render();
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
el.inspect.addEventListener("click", () => openDialog(el.developerDialog));
el.how.addEventListener("click", () => openDialog(el.howDialog));

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
renderMessages();
render();

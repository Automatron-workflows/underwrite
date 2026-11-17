import { AD_HARNESS_VERSION } from "./protocol.mjs";

/**
 * <ad-harness> is the portable attention component.
 *
 * It owns the watch contract: a visible, pausable, monotonic playback window
 * that produces a completion claim. It does not own the balance, the receipt
 * signature or the credit decision. The host app does. That boundary is what
 * makes the component safe to drop into a chat product.
 */

const HTMLElementBase = globalThis.HTMLElement ?? class {};

const DEFAULT_DURATION_SECONDS = 15;
const DEFAULT_REWARD = 40;
const MIN_DURATION_SECONDS = 5;
const MAX_DURATION_SECONDS = 120;
const MIN_REWARD = 1;
const MAX_REWARD = 1000;
const PROGRESS_PAINT_MS = 80;
const PROGRESS_EMIT_MS = 250;

const template = `
<style>
  :host {
    --ah-accent: #e9d5a7;
    --ah-ink: #f4f2ec;
    --ah-muted: #a5a49d;
    --ah-surface: #131312;
    --ah-line: #2f2f2c;
    display: block;
    min-width: 0;
    color: var(--ah-ink);
    font-family: var(--ah-font, "Helvetica Neue", Arial, sans-serif);
    -webkit-font-smoothing: antialiased;
    container-type: inline-size;
  }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; }
  .frame {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--ah-line);
    border-radius: 14px;
    background: var(--ah-surface);
    isolation: isolate;
  }
  .stage { position: relative; aspect-ratio: var(--ah-stage-ratio, 4 / 3); overflow: hidden; }
  ::slotted(*) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transition: filter .45s ease, transform .7s cubic-bezier(.2,.7,.2,1);
  }
  :host([data-status="idle"]) ::slotted(*),
  :host([data-status="completed"]) ::slotted(*) {
    filter: saturate(.7) brightness(.52);
    transform: scale(1.015);
  }
  .fallback {
    position: absolute;
    inset: 0;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 12px;
    padding: 28px;
    text-align: center;
    background:
      radial-gradient(120% 100% at 70% 15%, #3a3426 0%, transparent 55%),
      linear-gradient(150deg, #1b1b18, #0f0f0e);
  }
  .fallback-mark {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border: 1px solid #ffffff2e;
    border-radius: 50%;
    color: var(--ah-accent);
    font: 500 12px/1 ui-monospace, Menlo, monospace;
    letter-spacing: .12em;
  }
  .fallback-title {
    max-width: 22ch;
    margin: 0;
    font-size: 18px;
    line-height: 1.25;
    letter-spacing: -.03em;
    color: #dedbd1;
  }
  .scrim {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, #00000073, transparent 32%, transparent 55%, #080807d9);
  }
  .chrome {
    position: absolute;
    inset: 0 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    padding-right: var(--ah-chrome-right, 16px);
    pointer-events: none;
    font: 500 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #d9d6cb;
    text-shadow: 0 1px 8px #000a;
  }
  .sponsor { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tag { color: #b5b2a7; white-space: nowrap; }
  .idle,
  .paused,
  .complete {
    position: absolute;
    inset: 0;
    display: grid;
    align-content: end;
    gap: 10px;
    padding: 18px;
  }
  .paused,
  .complete {
    place-content: center;
    justify-items: center;
    text-align: center;
    background: #0a0a09c4;
    backdrop-filter: blur(7px);
  }
  .eyebrow {
    margin: 0;
    font: 500 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--ah-accent);
  }
  .reward {
    margin: 0;
    font: 500 34px/1 "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -.055em;
    color: var(--ah-ink);
  }
  .idle-title {
    max-width: 19ch;
    margin: 0;
    font: 500 22px/1.08 "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -.035em;
    color: var(--ah-ink);
    text-wrap: balance;
    text-shadow: 0 1px 10px #0009;
  }
  .reward small {
    margin-left: 6px;
    font-size: 12px;
    letter-spacing: 0;
    color: var(--ah-muted);
  }
  .primary {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    min-height: 48px;
    padding: 13px 16px;
    border: 0;
    border-radius: 999px;
    background: var(--ah-accent);
    color: #17150f;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: background .18s ease, transform .18s ease;
  }
  .primary:hover:enabled { background: #f2e2bd; }
  .primary:active:enabled { transform: translateY(1px); }
  .primary:disabled { cursor: default; opacity: .48; }
  .badge {
    padding-left: 14px;
    border-left: 1px solid #17150f33;
    font: 500 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .02em;
    white-space: nowrap;
  }
  .hint {
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: #c2bfb3;
    text-shadow: 0 1px 6px #000a;
  }
  .controls {
    position: absolute;
    inset: auto 0 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px 13px;
    background: linear-gradient(transparent, #080807e8);
  }
  .icon {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid #ffffff3d;
    border-radius: 50%;
    background: #111111a6;
    color: var(--ah-ink);
    cursor: pointer;
  }
  .icon:hover { background: #ffffff1f; }
  .icon svg { width: 13px; height: 13px; fill: currentColor; }
  .remaining {
    min-width: 52px;
    font: 500 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #d6d3c8;
    font-variant-numeric: tabular-nums;
  }
  .meter {
    position: relative;
    flex: 1;
    height: 3px;
    overflow: hidden;
    border-radius: 3px;
    background: #ffffff2b;
  }
  .meter span {
    display: block;
    width: 0;
    height: 100%;
    border-radius: inherit;
    background: var(--ah-accent);
  }
  .check {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    margin-bottom: 2px;
    border: 1px solid #ffffff3a;
    border-radius: 50%;
    background: #ffffff0f;
    color: var(--ah-accent);
  }
  .check svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.6; }
  .complete .reward { font-size: 30px; }
  .ghost {
    min-height: 40px;
    margin-top: 4px;
    padding: 8px 14px;
    border: 1px solid #ffffff33;
    border-radius: 999px;
    background: transparent;
    color: #d8d5ca;
    font-size: 12px;
    cursor: pointer;
  }
  .ghost:hover:enabled { background: #ffffff12; }
  .ghost:disabled { cursor: default; opacity: .45; }
  .limit {
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: #d7b49a;
  }
  .live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .hidden { display: none !important; }
  button:focus-visible { outline: 2px solid var(--ah-accent); outline-offset: 3px; }
  @container (max-width: 320px) {
    .chrome { padding: 12px 13px; }
    .idle, .paused, .complete { padding: 14px; }
    .reward { font-size: 28px; }
    .primary { font-size: 13px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; }
  }
</style>
<div class="frame" part="frame">
  <div class="stage" part="stage">
    <slot>
      <div class="fallback" aria-hidden="true">
        <span class="fallback-mark">AD</span>
        <p class="fallback-title"></p>
      </div>
    </slot>
    <div class="scrim" aria-hidden="true"></div>
    <div class="chrome">
      <span class="sponsor"></span>
      <span class="tag"></span>
    </div>
    <div class="idle">
      <p class="eyebrow">Sponsored message</p>
      <p class="idle-title"></p>
      <button class="primary" type="button" data-action="start">
        <span class="start-label">Watch 15 seconds</span>
        <span class="badge">+40 credits</span>
      </button>
      <p class="hint">Pause any time. Leaving this tab pauses the film.</p>
    </div>
    <div class="paused hidden">
      <p class="eyebrow">Paused</p>
      <p class="reward"><span class="paused-remaining">12</span><small>seconds left</small></p>
      <button class="primary paused-resume" type="button" data-action="resume">
        <span>Resume</span>
        <span class="badge">Keep the credits</span>
      </button>
      <p class="hint paused-reason"></p>
    </div>
    <div class="complete hidden">
      <span class="check" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>
      </span>
      <p class="eyebrow">Watched</p>
      <p class="reward complete-reward">+40<small>credits</small></p>
      <button class="ghost" type="button" data-action="replay">Watch again</button>
      <p class="limit" hidden></p>
    </div>
    <div class="controls hidden">
      <button class="icon" type="button" data-action="pause" aria-label="Pause sponsored message">
        <svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx=".6"/><rect x="7.4" y="1.5" width="2.6" height="9" rx=".6"/></svg>
      </button>
      <span class="remaining">15s left</span>
      <div class="meter" role="progressbar" aria-label="Sponsored message progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span></span>
      </div>
    </div>
    <p class="live" role="status" aria-live="polite"></p>
  </div>
</div>
`;

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {number} length
 * @returns {string}
 */
function randomToken(length) {
  const bytes = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues)
    globalThis.crypto.getRandomValues(bytes);
  else
    for (let index = 0; index < length; index += 1)
      bytes[index] = Math.floor(Math.random() * 256);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/**
 * @param {HTMLElement} element
 * @param {string} name
 * @param {unknown} detail
 * @returns {void}
 */
function emit(element, name, detail) {
  element.dispatchEvent(
    new CustomEvent(name, { detail, bubbles: true, composed: true }),
  );
}

export class AdHarnessElement extends HTMLElementBase {
  /** @type {"idle" | "playing" | "paused" | "completed"} */
  #status = "idle";
  #elapsedMs = 0;
  #startedAt = 0;
  #attempt = 0;
  #sessionId = `ses_${randomToken(12)}`;
  /** @type {import("./protocol.mjs").CompletionClaim | null} */
  #claim = null;
  #timer;
  #lastFrame = 0;
  #lastPaint = 0;
  #lastEmit = 0;
  #observer;

  /** @type {ShadowRoot} */
  #root;

  #refs;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
    this.#root.innerHTML = template;
    /**
     * @template {Element} T
     * @param {string} selector
     * @returns {T}
     */
    const query = (selector) => {
      const found = this.#root.querySelector(selector);
      if (!found) throw new Error(`ad-harness template is missing ${selector}`);
      return /** @type {T} */ (found);
    };
    this.#refs = {
      sponsor: query(".sponsor"),
      tag: query(".tag"),
      idle: query(".idle"),
      paused: query(".paused"),
      complete: query(".complete"),
      controls: query(".controls"),
      primary: query("[data-action='start']"),
      startLabel: query(".start-label"),
      idleTitle: query(".idle-title"),
      badge: query(".badge"),
      pausedRemaining: query(".paused-remaining"),
      pausedResume: query(".paused-resume"),
      pausedReason: query(".paused-reason"),
      completeReward: query(".complete-reward"),
      replay: query("[data-action='replay']"),
      limit: query(".limit"),
      pause: query("[data-action='pause']"),
      remaining: query(".remaining"),
      meter: query(".meter"),
      meterFill: query(".meter span"),
      live: query(".live"),
      fallbackTitle: query(".fallback-title"),
    };
    this.#refs.primary.addEventListener("click", () => this.start());
    this.#refs.pausedResume.addEventListener("click", () => this.resume());
    this.#refs.replay.addEventListener("click", () => this.start());
    this.#refs.pause.addEventListener("click", () => this.pause("user"));
  }

  static observedAttributes = [
    "ad-id",
    "sponsor",
    "title",
    "duration",
    "reward",
    "disabled",
  ];

  /** @returns {"idle" | "playing" | "paused" | "completed"} */
  get status() {
    return this.#status;
  }

  /** @returns {number} */
  get elapsedMs() {
    return Math.round(this.#elapsedMs);
  }

  /** @returns {import("./protocol.mjs").CompletionClaim | null} */
  get claim() {
    return this.#claim;
  }

  /** @returns {import("./protocol.mjs").AdDefinition} */
  get definition() {
    return {
      id: this.adId,
      sponsor: this.sponsor,
      title: this.#title,
      durationMs: this.durationMs,
      reward: this.reward,
      transcript: [],
    };
  }

  /** @returns {number} */
  get durationMs() {
    const seconds = Number(
      this.getAttribute("duration") ?? DEFAULT_DURATION_SECONDS,
    );
    return (
      clamp(
        Number.isFinite(seconds) ? seconds : DEFAULT_DURATION_SECONDS,
        MIN_DURATION_SECONDS,
        MAX_DURATION_SECONDS,
      ) * 1000
    );
  }

  /** @returns {number} */
  get reward() {
    const value = Math.round(
      Number(this.getAttribute("reward") ?? DEFAULT_REWARD),
    );
    return clamp(
      Number.isFinite(value) ? value : DEFAULT_REWARD,
      MIN_REWARD,
      MAX_REWARD,
    );
  }

  /** @param {number} value */
  set reward(value) {
    this.setAttribute("reward", String(value));
  }

  /** @returns {string} */
  get adId() {
    return this.getAttribute("ad-id") || "sponsored-message";
  }

  /** @param {string} value */
  set adId(value) {
    this.setAttribute("ad-id", value);
  }

  /** @returns {string} */
  get sponsor() {
    return this.getAttribute("sponsor") || "Sponsor";
  }

  /** @param {string} value */
  set sponsor(value) {
    this.setAttribute("sponsor", value);
  }

  /** @returns {string} */
  get #title() {
    return this.getAttribute("title") || "A short sponsored message.";
  }

  /** @returns {boolean} */
  get disabled() {
    return this.hasAttribute("disabled");
  }

  /** @param {boolean} value */
  set disabled(value) {
    this.toggleAttribute("disabled", value);
  }

  connectedCallback() {
    this.#setStatus(this.#status);
    this.#paintChrome();
    document.addEventListener("visibilitychange", this.#onVisibility);
    if ("IntersectionObserver" in globalThis) {
      this.#observer = new IntersectionObserver(this.#onIntersection, {
        threshold: 0.35,
      });
      this.#observer.observe(this);
    }
    emit(this, "adharness:ready", {
      adId: this.adId,
      durationMs: this.durationMs,
      reward: this.reward,
    });
  }

  disconnectedCallback() {
    this.#cancel();
    document.removeEventListener("visibilitychange", this.#onVisibility);
    this.#observer?.disconnect();
    this.#observer = undefined;
  }

  attributeChangedCallback() {
    this.#paintChrome();
    if (this.disabled && this.#status === "playing") this.pause("disabled");
  }

  start() {
    if (this.disabled || this.#status === "playing") return;
    if (this.#status === "paused") {
      this.resume();
      return;
    }
    this.#cancel();
    this.#elapsedMs = 0;
    this.#startedAt = Date.now();
    this.#claim = null;
    this.#attempt += 1;
    this.#status = "playing";
    this.#lastFrame = performance.now();
    this.#lastPaint = 0;
    this.#lastEmit = 0;
    this.#setStatus("playing");
    this.#paintProgress();
    this.#announce(
      `Sponsored message started. ${Math.round(this.durationMs / 1000)} seconds.`,
    );
    emit(this, "adharness:started", {
      adId: this.adId,
      durationMs: this.durationMs,
      reward: this.reward,
      attempt: this.#attempt,
    });
    this.#schedule();
  }

  /** @param {"user" | "hidden" | "offscreen" | "disabled"} [reason] */
  pause(reason = "user") {
    if (this.#status !== "playing") return;
    this.#cancel();
    this.#status = "paused";
    this.#setStatus("paused");
    this.#paintProgress();
    this.#refs.pausedReason.textContent =
      reason === "hidden"
        ? "The tab was hidden, so the clock stopped."
        : reason === "offscreen"
          ? "The player left the screen, so the clock stopped."
          : reason === "disabled"
            ? "This session has reached its sponsored message limit."
            : "Your time is not counting while the film is paused.";
    this.#announce(
      reason === "hidden" || reason === "offscreen"
        ? "Paused. The sponsored message clock stopped."
        : "Paused.",
    );
    emit(this, "adharness:paused", {
      adId: this.adId,
      elapsedMs: this.elapsedMs,
      reason,
    });
  }

  resume() {
    if (this.disabled || this.#status !== "paused") return;
    this.#status = "playing";
    this.#lastFrame = performance.now();
    this.#setStatus("playing");
    this.#announce("Resumed.");
    emit(this, "adharness:resumed", {
      adId: this.adId,
      elapsedMs: this.elapsedMs,
    });
    this.#schedule();
  }

  reset() {
    this.#cancel();
    this.#status = "idle";
    this.#elapsedMs = 0;
    this.#claim = null;
    this.#sessionId = `ses_${randomToken(12)}`;
    this.#setStatus("idle");
    this.#paintProgress();
    this.#refs.live.textContent = "";
    emit(this, "adharness:reset", { adId: this.adId });
  }

  #tick = () => {
    if (this.#status !== "playing") return;
    const now = performance.now();
    const delta = Math.min(1000, Math.max(0, now - this.#lastFrame));
    this.#lastFrame = now;
    this.#elapsedMs += delta;
    if (this.#elapsedMs >= this.durationMs) {
      this.#elapsedMs = this.durationMs;
      this.#paintProgress();
      this.#complete();
      return;
    }
    if (now - this.#lastPaint >= PROGRESS_PAINT_MS) {
      this.#lastPaint = now;
      this.#paintProgress();
    }
    if (now - this.#lastEmit >= PROGRESS_EMIT_MS) {
      this.#lastEmit = now;
      emit(this, "adharness:progress", {
        adId: this.adId,
        elapsedMs: this.elapsedMs,
        durationMs: this.durationMs,
        progress: this.#elapsedMs / this.durationMs,
      });
    }
    this.#schedule();
  };

  #schedule() {
    if (this.#status !== "playing") return;
    this.#timer = setTimeout(this.#tick, 100);
  }

  #complete() {
    this.#cancel();
    this.#status = "completed";
    this.#claim = {
      version: AD_HARNESS_VERSION,
      adId: this.adId,
      sessionId: this.#sessionId,
      startedAt: this.#startedAt,
      completedAt: Date.now(),
      elapsedMs: this.elapsedMs,
      reward: this.reward,
      nonce: randomToken(18),
    };
    this.#setStatus("completed");
    this.#paintProgress();
    this.#announce(`Watched. ${this.reward} credits ready for verification.`);
    emit(this, "adharness:completed", { claim: this.#claim });
  }

  #onVisibility = () => {
    if (document.hidden && this.#status === "playing") this.pause("hidden");
  };

  #onIntersection = (entries) => {
    const entry = entries[0];
    if (!entry) return;
    if (!entry.isIntersecting && this.#status === "playing")
      this.pause("offscreen");
  };

  #cancel() {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  /** @param {"idle" | "playing" | "paused" | "completed"} status */
  #setStatus(status) {
    this.#status = status;
    this.dataset["status"] = status;
    this.#refs.idle.classList.toggle("hidden", status !== "idle");
    this.#refs.paused.classList.toggle("hidden", status !== "paused");
    this.#refs.complete.classList.toggle("hidden", status !== "completed");
    this.#refs.controls.classList.toggle("hidden", status !== "playing");
    this.#refs.primary.disabled = this.disabled;
    this.#refs.replay.disabled = this.disabled;
    this.#refs.limit.hidden = !this.disabled || status !== "completed";
  }

  #paintChrome() {
    const seconds = Math.round(this.durationMs / 1000);
    this.#refs.sponsor.textContent = this.sponsor;
    this.#refs.tag.textContent = `Sponsored · ${seconds}s`;
    this.#refs.startLabel.textContent = `Watch ${seconds} seconds`;
    this.#refs.idleTitle.textContent = this.#title;
    this.#refs.badge.textContent = `+${this.reward} credits`;
    this.#refs.completeReward.innerHTML = `+${this.reward}<small>credits</small>`;
    this.#refs.fallbackTitle.textContent = this.#title;
    this.#refs.primary.disabled = this.disabled;
    this.#refs.replay.disabled = this.disabled;
    this.#refs.limit.hidden = !this.disabled || this.#status !== "completed";
    if (this.disabled)
      this.#refs.limit.textContent =
        "Session limit reached. No further credits this session.";
  }

  #paintProgress() {
    const progress =
      this.durationMs > 0 ? this.#elapsedMs / this.durationMs : 0;
    const percent = clamp(progress * 100, 0, 100);
    this.#refs.meterFill.style.width = `${percent}%`;
    this.#refs.meter.setAttribute("aria-valuenow", String(Math.round(percent)));
    const remaining = Math.max(
      0,
      Math.ceil((this.durationMs - this.#elapsedMs) / 1000),
    );
    this.#refs.remaining.textContent = `${remaining}s left`;
    this.#refs.pausedRemaining.textContent = String(remaining);
  }

  #announce(message) {
    this.#refs.live.textContent = message;
  }
}

export function registerAdHarness() {
  if (typeof customElements === "undefined") return;
  if (!customElements.get("ad-harness"))
    customElements.define("ad-harness", AdHarnessElement);
}

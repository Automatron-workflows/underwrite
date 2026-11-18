const HOSTS = {
  claude: {
    id: "claude",
    name: "Claude",
    model: "Sonnet",
    initial: "C",
    placeholder: "Reply to Claude…",
  },
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    model: "GPT-5",
    initial: "C",
    placeholder: "Ask anything…",
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    model: "2.5 Flash",
    initial: "G",
    placeholder: "Ask Gemini…",
  },
};

const SAMPLE = {
  question: "How do I focus for a deep work block?",
  answer:
    "Try a 25 minute block. One task. No feed. Take a five minute break and repeat.",
};

const state = { host: "claude", view: "after" };

const stage = document.querySelector("#host-stage");
const caption = document.querySelector("#host-caption");
const announcer = document.querySelector("#host-announcer");
const hostButtons = [...document.querySelectorAll("[data-host]")];
const viewButtons = [...document.querySelectorAll("[data-view]")];

function genericCard() {
  return `<div class="host-card host-generic" role="group" aria-label="Illustrative Underwrite sponsored card">
    <div class="host-generic-media" aria-hidden="true"><span class="host-generic-sun"></span></div>
    <div class="host-generic-chrome"><span>STILL</span><span>SPONSORED · 8S</span></div>
    <div class="host-generic-copy">
      <p>A quieter way to start.</p>
      <span class="host-generic-action">Watch 8s <span>+40 credits</span></span>
      <span class="host-generic-hint">Pause any time. Leaving this tab pauses the film.</span>
    </div>
  </div>`;
}

function nativeCard() {
  return `<div class="host-card host-native" role="group" aria-label="Illustrative native sponsored card">
    <div class="host-native-media" aria-hidden="true">
      <span class="host-native-sun"></span>
      <span class="host-native-mark">still</span>
    </div>
    <div class="host-native-body">
      <div class="host-native-top"><span>Still</span><span>Sponsored</span></div>
      <p>A quieter way to start.</p>
      <span class="host-native-action">Watch 8s · +40 free credits <span aria-hidden="true">↗</span></span>
    </div>
  </div>`;
}

function render() {
  const host = HOSTS[state.host];
  const native = state.view === "after";
  stage.innerHTML = `<article class="host-shell" data-host="${host.id}" data-view="${state.view}" aria-label="${host.name} style host preview">
    <header class="host-bar">
      <span class="host-brand">${host.name}</span>
      <span class="host-model">${host.model}</span>
      <span class="host-tag">Illustrative</span>
    </header>
    <div class="host-chat">
      <div class="host-msg host-user">
        <div class="host-bubble"><p>${SAMPLE.question}</p></div>
      </div>
      <div class="host-msg host-assistant">
        <span class="host-avatar" aria-hidden="true">${host.initial}</span>
        <div class="host-answer">
          <p>${SAMPLE.answer}</p>
          <span class="host-label">Illustrative response</span>
        </div>
      </div>
      <div class="host-ad">${native ? nativeCard() : genericCard()}</div>
    </div>
    <div class="host-composer">
      <span>${host.placeholder}</span>
      <span class="host-send" aria-hidden="true">↑</span>
    </div>
  </article>`;

  caption.textContent = native
    ? `After · ${host.name} native card`
    : "Before · Underwrite media card";
  announcer.textContent = `${host.name}, ${native ? "native card" : "Underwrite media card"}`;

  for (const button of hostButtons)
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.host === state.host),
    );
  for (const button of viewButtons)
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.view === state.view),
    );
}

for (const button of hostButtons) {
  button.addEventListener("click", () => {
    if (button.dataset.host in HOSTS) state.host = button.dataset.host;
    render();
  });
}

for (const button of viewButtons) {
  button.addEventListener("click", () => {
    if (button.dataset.view === "before" || button.dataset.view === "after")
      state.view = button.dataset.view;
    render();
  });
}

render();

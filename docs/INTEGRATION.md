# Integration

`<underwrite-card>` is a framework independent custom element. It owns the
watch. The host owns verification and credits.

## Install the source

The component is one module. Import it from this repository, or copy
`src/element.mjs` and `src/protocol.mjs` into the host.

```js
import { registerUnderwrite } from "./src/element.mjs";
registerUnderwrite();
```

## Inline placement

The component is designed to sit inside a conversation. Insert it between turns,
not inside a model answer:

```html
<div class="conversation">
  <assistant-message>...</assistant-message>
  <underwrite-card
    ad-id="still-inline"
    sponsor="Still"
    duration="8"
    reward="40"
  >
    <!-- brand logo, image or video -->
  </underwrite-card>
  <assistant-message>...</assistant-message>
</div>
```

Keep the card visibly labelled. It must not copy the assistant bubble, avatar or
voice. The host should name the model scope where the credits can be used, for
example `Sage Mini`, in the host bar and the surrounding copy.

The demo uses a wide stage inside the conversation:

```css
.conversation underwrite-card {
  --uw-stage-ratio: 16 / 5;
}
@media (max-width: 640px) {
  .conversation underwrite-card {
    --uw-stage-ratio: 16 / 9;
  }
}
```

The demo places the card after a sample assistant answer and keeps the thread
below it. The sample exchange is authored; the assistant answer is labelled.
The card is not recreated on each message; that would reset the watch. Keep the
sponsored node stable while the conversation appends.

## Mark up the slot

```html
<underwrite-card
  ad-id="still-inline"
  sponsor="Still"
  title="A quieter way to start."
  duration="8"
  reward="40"
>
  <!-- the sponsor creative supplied by the ad network -->
</underwrite-card>
```

The creative is optional. Without it, the component renders an honest fallback
card using the sponsor, title and reward. The creative is slotted into the
component and is dimmed while idle and completed.

Use a logo, image, video or text creative supplied by the host. The demo uses a
typographic brand film. Do not inject arbitrary remote HTML into the slot.

## Listen for completion

```js
const player = document.querySelector("underwrite-card");

player.addEventListener("underwrite:completed", async (event) => {
  const claim = event.detail.claim;

  // Production: send the claim to your server. Do not verify on the client.
  const response = await fetch("/api/underwrite/redeem", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ claim, sessionId: currentSession() }),
  });
  const receipt = await response.json();

  ledger = creditReceipt(ledger, receipt, ad, { maxAds: 3 }).state;
  render();
});
```

The demo does not use `fetch`; it calls the issuer locally so the whole contract
is inspectable. That is a demo choice, not the production recommendation.

## Host checklist

- Render the sponsor, duration, reward and model scope before the watch starts.
- Place the card between turns, not inside a model answer.
- Keep the credit balance visible in the host bar. Keep the receipt and trace
  available without making them a prerequisite.
- Start the player only from an explicit user action.
- Verify the claim on the server.
- Bind the receipt to one account, one ad, one model scope and one session.
- Enforce the session and frequency caps on the server.
- Keep the transcript available.
- Refuse to start a watch at the cap.
- Replace the demo issuer before accepting real value.
- Do not use the component to hide price, permissions or consequences.
- Do not autoplay with credits or reward a background tab.
- Do not use conversation content to target an ad without a published policy
  and consent.

## Attributes

| Attribute  | Default                      | Notes                               |
| ---------- | ---------------------------- | ----------------------------------- |
| `ad-id`    | `sponsored-message`          | Required for a real claim.          |
| `sponsor`  | `Sponsor`                    | Shown in the chrome.                |
| `title`    | `A short sponsored message.` | Shown in the idle state.            |
| `duration` | `15`                         | Seconds, 5 through 120.             |
| `reward`   | `40`                         | Credits, 1 through 1000.            |
| `disabled` | absent                       | Closes the player for this session. |

## Events

All events bubble and cross the shadow boundary. `detail` is a plain object.

| Event                  | Detail                                      |
| ---------------------- | ------------------------------------------- |
| `underwrite:ready`     | `{ adId, durationMs, reward }`              |
| `underwrite:started`   | `{ adId, durationMs, reward, attempt }`     |
| `underwrite:progress`  | `{ adId, elapsedMs, durationMs, progress }` |
| `underwrite:paused`    | `{ adId, elapsedMs, reason }`               |
| `underwrite:resumed`   | `{ adId, elapsedMs }`                       |
| `underwrite:completed` | `{ claim }`                                 |
| `underwrite:reset`     | `{ adId }`                                  |

`reason` is `user`, `hidden`, `offscreen` or `disabled`.

## Methods and properties

```js
player.start();
player.pause("user");
player.resume();
player.reset();

player.status; // idle | playing | paused | completed
player.elapsedMs; // active watch time
player.claim; // the last completion claim or null
player.durationMs;
player.reward;
```

The host can call `start()` from its own "Earn credits" action. The element does
not auto play.

## Theming

The shadow DOM consumes inherited custom properties:

```css
underwrite-card {
  --uw-accent: #e9d5a7;
  --uw-ink: #f4f2ec;
  --uw-surface: #131312;
  --uw-line: #2f2f2c;
  --uw-stage-ratio: 16 / 10;
  --uw-chrome-right: 52px;
  --uw-font: "Helvetica Neue", Arial, sans-serif;
}
```

`--uw-chrome-right` reserves space for a host close button. `--uw-stage-ratio`
changes the creative frame. Keep contrast and focus visible.

## React and other frameworks

Create the element and attach listeners in an effect. Do not re-create the
element on every render; that resets the watch.

```tsx
const ref = useRef<HTMLElement>(null);
useEffect(() => {
  const player = ref.current;
  if (!player) return;
  const completed = (event: Event) => {
    const claim = (event as CustomEvent).detail.claim;
    void redeem(claim);
  };
  player.addEventListener("underwrite:completed", completed);
  return () => player.removeEventListener("underwrite:completed", completed);
}, []);
return (
  <underwrite-card ref={ref} ad-id="still-launch" duration="15" reward="40" />
);
```

## Production verifier

The server verifier must:

1. Authenticate the account and session.
2. Load the ad definition from the server, not from the request.
3. Check the claim against that definition and its own clock.
4. Check a server side session ledger for the cap and duplicate nonces.
5. Verify the ad network's proof, not just the demo signature.
6. Issue a receipt bound to the account, ad, session and expiry.
7. Redeem the receipt once in a transaction.

Never accept `reward`, `duration` or `balance` from the client as authoritative.

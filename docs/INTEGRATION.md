# Integration

`<ad-harness>` is a framework independent custom element. It owns the watch. The
host owns verification and credits.

## Install the source

The component is one module. Import it from this repository, or copy
`src/element.mjs` and `src/protocol.mjs` into the host.

```js
import { registerAdHarness } from "./src/element.mjs";
registerAdHarness();
```

## Mark up the slot

```html
<ad-harness
  ad-id="still-launch"
  sponsor="Still"
  title="A quieter way to start."
  duration="15"
  reward="40"
>
  <!-- the sponsor creative supplied by the ad network -->
</ad-harness>
```

The creative is optional. Without it, the component renders an honest fallback
card using the sponsor, title and reward. The creative is slotted into the
component and is dimmed while idle and completed.

## Listen for completion

```js
const player = document.querySelector("ad-harness");

player.addEventListener("adharness:completed", async (event) => {
  const claim = event.detail.claim;

  // Production: send the claim to your server. Do not verify on the client.
  const response = await fetch("/api/ad-harness/redeem", {
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

- Render the sponsor, duration and reward before the watch starts.
- Start the player only from an explicit user action.
- Keep the ledger visible next to the conversation.
- Verify the claim on the server.
- Bind the receipt to one account, one ad and one session.
- Enforce the session and frequency caps on the server.
- Keep the transcript available.
- Refuse to start a watch at the cap.
- Replace the demo issuer before accepting real value.
- Do not use the component to hide price, permissions or consequences.

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

| Event                 | Detail                                      |
| --------------------- | ------------------------------------------- |
| `adharness:ready`     | `{ adId, durationMs, reward }`              |
| `adharness:started`   | `{ adId, durationMs, reward, attempt }`     |
| `adharness:progress`  | `{ adId, elapsedMs, durationMs, progress }` |
| `adharness:paused`    | `{ adId, elapsedMs, reason }`               |
| `adharness:resumed`   | `{ adId, elapsedMs }`                       |
| `adharness:completed` | `{ claim }`                                 |
| `adharness:reset`     | `{ adId }`                                  |

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
ad-harness {
  --ah-accent: #e9d5a7;
  --ah-ink: #f4f2ec;
  --ah-surface: #131312;
  --ah-line: #2f2f2c;
  --ah-stage-ratio: 16 / 10;
  --ah-chrome-right: 52px;
  --ah-font: "Helvetica Neue", Arial, sans-serif;
}
```

`--ah-chrome-right` reserves space for a host close button. `--ah-stage-ratio`
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
  player.addEventListener("adharness:completed", completed);
  return () => player.removeEventListener("adharness:completed", completed);
}, []);
return <ad-harness ref={ref} ad-id="still-launch" duration="15" reward="40" />;
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

# Inline placements

Ad Harness is a placement, not a chat message. It can be a brand suggestion, a
logo card, an editorial image or a short video inside the conversation. It is
always labelled and always supplied by the host. The model never writes or
endorses it.

## Formats

| Format | Use                                                | What the host supplies                                  |
| ------ | -------------------------------------------------- | ------------------------------------------------------- |
| Logo   | A compact brand suggestion or sponsorship credit.  | A wordmark or logo, a short line and a destination.     |
| Image  | A product, editorial photograph or campaign frame. | An image, alt text, a short line and a destination.     |
| Video  | A short brand film or product moment.              | A muted video or animated frame, poster and transcript. |
| Text   | A plain sponsored line in a dense conversation.    | Sponsor, line, label and destination.                   |

The component is format agnostic. The host supplies the creative in the default
slot. The component owns the sponsor chrome, the watch window, the reward and the
completion claim. The demo uses a typographic video-like brand film for Still.

## Placement rules

1. Place the card between turns, normally after an assistant answer and before
   the next user message.
2. Never place it inside an assistant answer or make it look like one.
3. Keep a visible **Sponsored** label and the sponsor name in the chrome.
4. Do not imply that the model chose, recommends or endorses the brand.
5. Do not use conversation content to target an ad in the demo. A production
   policy must state what context, if any, may inform a placement.
6. Keep the placement frequency bounded. One card at a time, with a session cap.
7. Keep the card readable at 390 pixels. The demo uses a wider stage on mobile
   so the title and action do not clip.
8. Do not autoplay with credits. The demo requires an explicit watch, so passive
   scrolling cannot earn.

## Unit anatomy

- Sponsor and **Sponsored** label.
- Creative: logo, image or video.
- One line of brand copy.
- The action: watch and earn, resume, or watched and earned.
- The reward and the model scope.
- Visible progress and a pause control while playing.
- A transcript for the creative.
- A result that remains visible after completion.

The inline card should feel native to the conversation without disguising what
it is. It should not copy the bubble shape, avatar or voice of the assistant.

## Reward rules

- The demo reward is 40 free credits for an 8 second view.
- The credits are free to the person and funded by the sponsor.
- Credits are scoped to the model named in the host. The demo uses **Sage Mini**.
- An explicit watch starts the timer. A scroll out of view pauses it; the person
  must resume.
- The timer pauses when the document is hidden.
- One completion produces one claim, one receipt and one credit movement.
- A receipt is single use. Replays are refused.
- The session cap is 3 watches in the demo.
- The reward is not money and cannot be transferred between models in the demo.

## Measurement

The host records the viewable watch, the claim, the receipt, the credit movement
and the session cap. The demo exposes these in the event trace and receipt. It
does not call an ad network, an analytics service or a viewability vendor.

A production placement needs an independent viewability proof, a server side
verifier and a frequency store. The component's local timer is not a substitute
for those.

## Privacy

- The demo sends no conversation content anywhere.
- The page CSP keeps `connect-src 'none'`.
- No cookies, local storage, targeting or telemetry are used.
- The creative is fictional and the sponsor is labelled.
- A production host must publish what is shared with the advertiser before a
  placement appears.

## Failure and recovery

| State            | What the person sees                                       |
| ---------------- | ---------------------------------------------------------- |
| Scrolled away    | The watch pauses. The card explains and offers resume.     |
| Tab hidden       | The watch pauses. It does not auto resume.                 |
| Claim rejected   | The chat states the rejection. The balance does not move.  |
| Receipt replayed | Developer shows `receipt_used`; the balance does not move. |
| Session cap      | The card closes and the composer states the limit.         |
| Creative missing | The component falls back to the sponsor, title and reward. |

## Demo specifics

- Host: **Sage**, model **Sage Mini**, labelled `Mini · ad supported`.
- Placement: after the assistant intro and before the user's next turn.
- Sponsor: **Still**, a fictional product.
- Watch: 8 seconds, explicit start, pause when hidden or out of view.
- Reward: 40 credits, scoped to Sage Mini.
- Reply cost: 10 credits.
- Session cap: 3 watches.
- Accounting: the credit chip, the chat receipt and the Developer trace.

## Open questions

- Should the host show one card per answer, per session or only when the balance
  is low?
- Does a brand suggestion need a destination, or is the creative enough?
- Should the person be able to dismiss a placement permanently?
- How does a model-scoped wallet behave across a model switch?
- What viewability threshold and duration would an advertiser accept?
- What consent and disclosure are sufficient for a production ad network?

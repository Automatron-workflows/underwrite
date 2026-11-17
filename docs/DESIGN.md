# Design notes

## The decision

An ad funded app usually asks for trust it has not earned. The exchange is
hidden in a subscription page, a token counter or a vague "free" tier. Ad
Harness makes one exchange visible: this sponsor, this duration, this reward,
this receipt, this ledger.

The design rule is **show the operation and its result before adding
explanation**. The demo puts the chat and the ledger side by side. The ad is a
sponsor message, not a fake product tutorial. The verification is inspectable,
not implied.

## Composition

- One dark device surface on a near black page.
- A chat on the left and a credit rail on the right, because the value and the
  accounting should be readable together.
- One primary action at each stage: watch, resume or send.
- A sticky wordmark bar that keeps the page identity visible without covering
  the content.
- The ledger below the player, with the receipt and the event trace in a
  separate inspection panel.
- A contract section above the inspection panel that names the three
  responsibilities: component, proof, ledger.

## The sponsor film

The Still film is typographic: a rising sun, four lines and a quiet note. It is
clearly fictional and clearly labelled. It avoids a fake dashboard, a fake
brand film or a stock product shot.

The film is slotted into the component. The ad network supplies the creative in
production. The component supplies the frame, the sponsor label, the progress
and the pause control.

The film is hidden while idle and completed so the play button and the result
stay legible. It is visible while playing or paused. The copy is also available
as a transcript.

## Motion

The sun rises with the watch and the copy changes at four points. Motion
explains progress, not decoration. Reduced motion removes transitions, but the
watch still requires real time and the progress bar still moves.

The film pauses when the page is hidden or the player leaves the viewport. It
does not auto resume. A background tab cannot earn credits.

## Type and colour

The standalone page uses system fonts: Helvetica Neue or Arial for display and
body, a system monospace for labels and values. This keeps the demo offline and
avoids licensed or downloaded fonts.

The palette is near black, warm off white and one champagne accent. The accent
is used for the primary action, the credit meter, the sponsor label and the
receipt. A second, cooler green marks a successful credit. A soft red marks a
rejection. The sponsor film uses the same warm family.

## Copy

- The headline is **Attention, settled.**
- The component is **adharness** in the wordmark and **Ad Harness** in prose.
- The host app is **Sage**.
- The sponsor is **Still**, a fictional product.
- The reward is **40 credits**, the reply is **10 credits**.
- The boundary is stated plainly: demo issuer, fictional sponsor, no ad network,
  no money.

No dash punctuation is used in prose. Values and units stay next to the action.

## Accessibility

- The watch button, pause, resume, replay, send, replay receipt, copy and reset
  controls are native buttons with visible labels.
- The progress bar exposes `role="progressbar"` and `aria-valuenow`.
- The component announces start, pause and completion through a polite live
  region.
- The film is decorative; the transcript carries the sponsor copy.
- Focus uses a two pixel champagne outline with an offset.
- The page has a skip-free single flow; the top navigation is optional.
- The 390 pixel layout has no horizontal overflow. The chat and rail stack, and
  the advertise action scrolls the player into view before starting.

## Rejected alternatives

- **A fake ad network.** It would add theatre without evidence. The boundary
  section is stronger.
- **Hiding the ledger.** It would make the exchange feel like a trick.
- **A countdown that runs in the background.** It would inflate completion and
  break the attention contract.
- **A real brand.** It would imply a partnership that does not exist.
- **A light page.** The dark frame separates the experiment from the personal
  portfolio and matches the Automatron reference.

## Evidence limits

The browser check covers the desktop flow, pause and resume, completion, replay,
reset, offscreen pause and the 390 pixel layout. It is not a user study. We do
not know whether a first time visitor understands the exchange without opening
the inspection panel. Test that before claiming comprehension.

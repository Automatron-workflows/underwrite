# Design notes

## The decision

An ad funded app usually asks for trust it has not earned. The exchange is
hidden in a subscription page, a token counter or a vague "free" tier. Ad
Underwrite makes one exchange visible: this sponsor, this duration, this reward,
this receipt, this ledger.

The design rule is **show the operation and its result before adding
explanation**. The demo places a labelled sponsor card inside the chat and a
credit chip in the host bar. The ad is a sponsored placement, not a fake model
answer. The verification is inspectable, not implied.

## Composition

The page follows the [Functional Minimalism review](FUNCTIONAL-MINIMALISM.md):
lead with the usable object, keep only the task copy, and reveal optional detail
in context.

- One dark chat surface on a near black page.
- A short wordmark bar, one headline and one task line. No introduction,
  feature pills or numbered contract section above the demo.
- One conversation. An authored sample exchange shows a question and a labelled
  answer. The sponsored card sits after the answer, between turns, with the
  thread continuing below it.
- A model scoped credit chip in the host bar. The inline card is not separated
  from the conversation by a side rail.
- One primary action at each stage: watch, resume or send.
- The receipt, event trace, embed and host verification live behind the
  Developer control in the footer.
- The exchange, placement rules and boundary live behind How it works.
- A concise footer states the boundary without repeating the whole protocol.

The first view at desktop size contains the headline, the sample exchange, the
inline sponsored card, the credit chip and the composer. The page does not
require an introductory read.

## Host previews

`hosts.html` is a separate illustration, not the demo. It places the same
placement in Claude, ChatGPT and Gemini style shells and pairs a Before media
card with an After host-native card. The page uses illustrative chrome, not
official logos, and discloses the trademarks. The working component and reward
flow stay on `index.html`.

## The sponsor film

The Still film is typographic: a rising sun, four lines and a quiet note. It is
clearly fictional and clearly labelled. It avoids a fake dashboard, a fake
brand film or a stock product shot.

The film is slotted into the component. The host or ad network supplies the
creative in production: a logo, an image, a short video or a text placement. The
component supplies the frame, the sponsor label, the progress and the pause
control.

The film is hidden while idle and completed so the watch button and the result
stay legible. It is visible while playing or paused. The copy is also available
as a transcript under the card.

## Motion

The sun rises with the watch and the copy changes at four points. Motion
explains progress, not decoration. Reduced motion removes transitions, but the
watch still requires real time and the progress bar still moves.

The film pauses when the page is hidden or the card leaves the conversation
view. It does not auto resume. A background tab cannot earn credits.

## Type and colour

The standalone page uses system fonts: Helvetica Neue or Arial for display and
body, a system monospace for labels and values. This keeps the demo offline and
avoids licensed or downloaded fonts.

The palette is near black, warm off white and one champagne accent. The accent
is used for the primary action, the credit chip, the sponsor label and the
receipt. A second, cooler green marks a successful credit. A soft red marks a
rejection. The sponsor film uses the same warm family.

## Copy

- The headline is **Attention, underwritten.**
- The task line is **Watch a sponsored message. Earn free credits for Sage Mini.**
- The component is **underwrite** in the wordmark and **Underwrite** in prose.
- The host app is **Sage**, model **Sage Mini**, labelled `Mini · ad supported`.
- The sponsor is **Still**, a fictional product.
- The reward is **40 free credits** for an 8 second inline watch; the reply is
  **10 credits**; the credits are scoped to Sage Mini.
- The boundary is stated plainly in the footer and How it works: demo issuer,
  fictional sponsor, no ad network, no money.

No dash punctuation is used in prose. Values and units stay next to the action.
The first view carries no introductory paragraph, feature pills or numbered
contract section.

## Accessibility

- The watch button, pause, resume, replay, send, replay receipt, copy and reset
  controls are native buttons with visible labels.
- The progress bar exposes `role="progressbar"` and `aria-valuenow`.
- The component announces start, pause and completion through a polite live
  region.
- A separate polite live region announces scripted replies and receipt results.
  The chat history is not re-announced when it re-renders.
- The inline card is labelled in the component chrome and does not use the
  assistant avatar or bubble shape.
- The credit chip names the balance. The model scope is named in the host bar,
  the task line and the card transcript.
- The film is decorative and hidden from the accessibility tree; the transcript
  under the card carries the sponsor copy.
- Focus uses a two pixel champagne outline with an offset.
- A skip link reaches the demo. How it works and Developer are native modal
  dialogs with labelled close controls and focus return.
- A 390 pixel layout has no horizontal overflow. The chat and card stack, and
  the earn action scrolls the card into view before starting.
- Opening How it works or Developer pauses a playing sponsor message.

## Rejected alternatives

- **A side credit rail.** It put the ad outside the conversation and did not
  demonstrate the inline product.
- **An unlabelled brand suggestion.** It would look like a model endorsement.
- **A universal wallet.** It would blur which model the sponsored credits fund.
- **A row of starter buttons.** They competed with the conversation and the
  card. One authored sample exchange shows the task.
- **A tutorial page above the demo.** It delays the usable object and repeats
  what the chat, card and credit chip already show.
- **A duplicate verification card.** The credit chip, chat result and Developer
  receipt already carry the outcome.
- **A fake ad network.** It would add theatre without evidence. The boundary
  section is stronger.
- **Hiding the accounting.** It would make the exchange feel like a trick. The
  chip, the chat receipt and the Developer trace keep it visible.
- **A countdown that runs in the background.** It would inflate completion and
  break the attention contract.
- **A real brand.** It would imply a partnership that does not exist.
- **A light page.** The dark frame separates the experiment from the personal
  portfolio and matches the Automatron reference.

## Evidence limits

The browser check covers the inline card, the model scoped credit chip, the
Developer and How it works dialogs, pause and resume, completion, single credit,
replay refusal, reset, offscreen pause and the 390 pixel layout. It is not a
user study. We do not know whether a first time visitor understands the
placement, the model scope or the exchange without opening How it works. Test
that before claiming comprehension.

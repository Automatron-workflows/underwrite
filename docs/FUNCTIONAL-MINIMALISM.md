# Functional Minimalism review

The demo is reviewed against **Functional Minimalism v0.3** from the
`Automatron-workflows/functional-minimalism` harness:

- [DESIGN_RULES.md](https://github.com/Automatron-workflows/functional-minimalism/blob/main/DESIGN_RULES.md)
- [functional minimalism reference](https://github.com/Automatron-workflows/functional-minimalism/blob/main/references/functional-minimalism.md)
- [object first](https://github.com/Automatron-workflows/functional-minimalism/blob/main/references/object-first.md)
- [Hardwire reference](https://github.com/Automatron-workflows/functional-minimalism/blob/main/references/hardwire.md)

This is a recorded review, not a certification or a user study.

## Screen contract

| Field                         | Decision                                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Task                          | Ask Sage Mini a question, then earn free credits for another reply by watching one inline sponsored card.                               |
| Primary object                | The conversation with the sponsored card inside it, plus the model scoped credit chip in the host bar.                                  |
| Main action                   | Watch the sponsored card when credits run out. Send a reply when credits are available.                                                 |
| Essential visible information | Sponsor, duration, reward, price per reply, balance, model scope, locked send state, pause and resume, receipt result, session cap.     |
| Composition                   | Wordmark bar, one headline, one task line, one conversation with the card between turns, a credit chip, a concise footer. No side rail. |
| Required states               | Idle, playing, paused, completed, spent balance, locked composer, verified receipt, rejected replay, session cap.                       |
| Optional detail               | How it works, Developer receipt, event trace, inline placement snippet, host verification, transcript.                                  |
| Verification                  | Node tests, static audit, Chrome browser flow, desktop and 390 pixel screenshots.                                                       |

## Gate results

| Gate          | Result                                                                                                                                                                                                                           | Evidence                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Comprehension | Pass for the intended object. The first view shows Sage, the inline sponsored card, the model scoped credit chip and the watch action. There is no side rail or introductory paragraph.                                          | `desktop-inline.png`; browser assertion that the card is inside the conversation, no rail exists and the demo is in the first view. |
| Information   | Pass. Sponsor, duration, reward, cost, balance, model scope, locked state, pause, resume and the receipt result stay at the decision point. The credit chip and chat receipt carry the movement; the full trace is in Developer. | Browser flow and screenshots. The receipt id and raw proof are optional.                                                            |
| Behavior      | Pass for the demo path. Inline start, pause, resume, completion, single credit, replay refusal, reset, offscreen pause and both dialogs are exercised.                                                                           | `npm run test:browser`, 28 Node tests.                                                                                              |
| Motion        | Pass for the tested path. The film explains progress; pause and resume work; reduced motion removes transitions; offscreen pause is browser checked. The hidden document rule is implemented and remains a code level check.     | Browser pause, resume and offscreen checks; CSS reduced motion. A screen reader and 200 percent zoom review remain open.            |
| Access        | Partial. Native buttons, visible labels, a skip link, a polite announcer, hidden decorative film, transcript, labelled dialogs, focus return, a 32 pixel control floor and a no overflow 390 pixel layout are present.           | Browser skip link, focus return, small target and layout checks. VoiceOver and zoom review remain open.                             |
| Identity      | Pass. The page keeps the Automatron dark composition and the approved Hardwire restraint while giving the inline sponsored card its own champagne and sun. It is not a reskin of the Hardwire page.                              | Design review; screenshots.                                                                                                         |

## Corrections applied

| Earlier version                                                                | Functional Minimalism finding                                        | Correction                                                                             |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Hero with eyebrow, long lede, feature pills and a contract link above the demo | The explanation delayed the usable object.                           | One headline and one task line. The demo starts in the first view.                     |
| Visible contract section with three numbered principles                        | Optional explanation competed with the task.                         | Moved behind **How it works** in the footer.                                           |
| Visible inspection section with event trace, receipt JSON and snippets         | Developer detail dominated the page and repeated the receipt result. | Moved behind **Developer** in the footer.                                              |
| Side credit rail with the ad player                                            | The ad sat outside the conversation.                                 | Moved the card inside the conversation; the balance became a model scoped credit chip. |
| A 15 second watch                                                              | Too long for an inline placement.                                    | The demo uses 8 seconds with an explicit start and pause on scroll.                    |
| An unnamed model scope                                                         | Credits looked universal.                                            | Host bar, task line, transcript and How it works name Sage Mini.                       |
| Verification card between the player and ledger                                | Duplicated the credit chip, chat result and receipt.                 | Removed. The chip, chat receipt and Developer trace carry the outcome.                 |
| Composer meta line repeating balance and reply count                           | Repeated values already visible in the credit chip.                  | Removed. The locked placeholder and Earn action carry the consequence.                 |
| Three starter buttons below the ad                                             | Extra controls competed with the conversation and the card.          | Replaced with one authored sample exchange. The card follows the answer.               |
| Player state line and device note                                              | Implementation status and repeated behavior copy.                    | Removed. The player itself and How it works carry the behavior.                        |
| Six-item intro in the chat                                                     | Overshadowed the task.                                               | One sentence: a reply costs 10 credits; the sponsored card earns 40.                   |
| Static explanatory footer                                                      | Long boundary text at the end of the page.                           | One concise boundary line; full boundary in How it works.                              |

## Host previews

The host page is a separate, authored comparison. It is reviewed for clarity, not
as part of the working demo's task. It uses illustrative chrome, no official
logos, and a visible trademark disclosure. The Before card is the Underwrite
media card; the After card is a compact host-native card. The page does not
claim an integration. The working component and reward flow remain on the demo.
The host page is covered by the browser check at desktop and 390 pixels.

## What remains visible

- The inline sponsored card and its transcript.
- The sponsor, duration and reward before the watch.
- The model scoped credit chip, price per reply and session cap.
- The locked composer and its consequence.
- Pause, resume, remaining time and progress.
- The receipt result and the credit movement.
- The replay refusal when the person tests it.
- The demo issuer, fictional sponsor and no network boundary.

## Evidence and limits

- The browser check is Chrome only and uses synthetic fixture data.
- It covers the inline flow and the two dialogs. It does not establish first time
  visitor comprehension.
- It checks the skip link and dialog focus return. It does not cover VoiceOver,
  a full keyboard journey through the shadow component, or 200 percent zoom.
- It checks visible controls against a 32 pixel review floor. The sponsor
  component's primary controls are larger; the pause control is 34 pixels.
  Target size is not a substitute for observed touch use.
- The session cap is covered by the protocol tests and the player's disabled
  state. The browser check does not run three full 8 second watches; that keeps
  the check bounded.
- The film is an illustration, not an ad network or measured performance.
- User approval of the direction is not a usability score.

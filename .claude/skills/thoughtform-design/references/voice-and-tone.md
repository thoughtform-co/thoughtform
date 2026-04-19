# Thoughtform Voice & Tone

UX writing, error states, and terminology. The interface speaks like an instrument: precise, guiding, and technically grounded without being cold.

---

## Tone Matrix

| Dimension    | Target                             | Avoid                                 |
| ------------ | ---------------------------------- | ------------------------------------- |
| Precision    | Exact, specific                    | Vague, hand-wavy                      |
| Temperature  | Calm, confident                    | Cold, robotic OR chatty, casual       |
| Technicality | Correct terms, explain when needed | Jargon for its own sake, dumbing down |
| Guidance     | Orient and suggest next step       | Blame, panic, exclamation overload    |

**In practice:** "Signal lost" not "Oops, something went wrong." "Connection refused" not "We couldn't connect." "No messages in this view" not "Your inbox is empty!"

---

## Error States

- **Network / connection:** "Signal lost", "Connection refused", "Request timed out". Optionally add: "Retry" or "Check connection."
- **Permission / auth:** "Access denied", "Session expired", "Credentials required." Next step: sign in or request access.
- **Validation:** State what’s wrong and how to fix it. "Enter a valid email" not "Invalid input."
- **Generic fallback:** "Something went wrong. Retry or contact support." Avoid "Oops", "Whoops", emoji, or exclamation marks.

---

## Empty States

- **Purpose:** Orient the user. What is this view? What would appear here?
- **Formula:** [Context] + optional [next action].
  - "No messages in this view."
  - "No events in this range. Create one or change range."
- **Tone:** Neutral, informative. No exclamation marks or emoji in system copy.

---

## Buttons & Actions

- **Primary action:** Verb or verb phrase. "Save", "Send", "Create event", "Retry".
- **Destructive:** Clear and direct. "Delete", "Remove", "Discard draft". Confirm with a short explanation if irreversible.
- **Cancel / secondary:** "Cancel", "Back", "Close". No need to over-explain.

---

## Terminology Vocabulary

Prefer these when referring to product concepts:

- **Navigate / navigation** — moving through the product or through meaning (align with brand metaphor).
- **Signal** — connection, data presence, state (e.g. "signal lost").
- **View / viewport** — the current frame of content.
- **Compose / composed** — for generated or AI-authored content (align with Atreides / authorship).
- **Bearing / course** — direction, path, selection (e.g. "bearing 02", "on course").
- **Readout** — displayed data (timestamp, count, status).

Avoid: "Oops", "Hey!", "Just", "Simply", "Easy peasy", marketing superlatives, and emoji in system UI.

---

## Consistency

- **Tense:** Use present for state ("Connection refused") and imperative for actions ("Retry", "Save").
- **Voice:** Second person ("Your session expired") or neutral ("Session expired") — avoid first person ("We couldn’t load") unless it’s clearly a product message.
- **Length:** Short. One line for errors and empty states when possible; expand only when the user needs steps or explanation.

---

## What Never Appears

- Exclamation marks in system error or empty state copy
- Emoji in buttons, errors, or empty states
- "Oops", "Whoops", "Uh-oh" in production UI
- Vague errors without a next step when one exists (e.g. "Retry" or "Check connection")

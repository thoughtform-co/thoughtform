# The approved register

What the client has approved, and what each approved item proves.

**Empty.** No verdict exists yet. Until something comes back approved this
table has no rows and `rubric.md` has no calibration anchors.

| Item | File | The dated quote that approved it | What it proves |
| ---- | ---- | -------------------------------- | -------------- |
| —    | —    | —                                | —              |

## Do not touch

Once this table has rows, the files it names are the regression corpus. If a
change to a shared prompt block, a reference or a model alters what these
items look like, **the change is wrong** — not the item.

## How a row gets here

1. The client approves something in a review page, with a comment or a tick.
2. The output is promoted **byte-identical** into `skill/assets/`. Not
   re-encoded, not resized, not optimised.
3. It is pinned in `rubric.md` as a calibration anchor with the client's own
   words and the date.
4. The property it demonstrates is written here in one line. "Approved" is
   not a property; "the mark holds at a three-quarter angle" is.

**Pin the rejections too.** A rubric with only positive anchors cannot say
_not like this_. A rejected frame with the client's reason attached is the
highest-value row this file will ever hold.

**One anchor per look, and never a blend.** If a second, different look gets
approved, it becomes a named lane. Averaging two approved anchors produces a
third thing nobody approved.

## Corrections

When something pinned here turns out to be pinned in error, record the
correction as a correction — struck through, with the date and what the
second look showed. A register that only ever grows cannot be trusted; one
that visibly corrects itself can.

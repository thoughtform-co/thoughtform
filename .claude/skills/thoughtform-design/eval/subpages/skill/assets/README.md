# Assets

**Empty on purpose.**

This folder holds the images that are attached to a model on every
generation: calibration anchors and any reference frame the pipeline depends
on. `.gitignore` opts it back in, so anything here is committed.

Nothing is here yet because **no anchor is locked**. An anchor is an output
the client has approved. Putting a frame here before then would pin our taste
as theirs.

## What goes here, and how

1. Copy the file in **byte-identical**. A downsampled anchor changes what the
   model produces months later, silently, with no error to warn you.
2. Pin it in `references/rubric.md` under Calibration anchors, with the
   client's own words and the date.
3. Add the row to `references/approved-register.md` naming the property it
   proves.

Rejections come here too, under `negative/`.

## What does not go here

The identity references. They live on Drive, are resolved by `tools/refs.py`
from `armada.toml`, and the repo's job is to point at them rather than copy
them.

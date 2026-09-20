# Waves

One `.md` per wave, written in the same session as the wave: what was drawn,
how it graded, what was picked, what the client said, what changed because of
it. Copies of `qa_results.json`, `picks.json` and `verdicts-*.json` sit beside
it; the pixels stay on Drive.

A log written afterwards is a reconstruction, and reconstructions are where
the reasoning goes missing.

The numbers in that log are not transcribed by hand:

```bash
python tools/ledger.py wave "<wave dir>"      # draws and grades, as rows
python tools/ledger.py tick --handback verdicts-<date>.json
python tools/ledger.py summary "<wave dir>"   # the eval log's own table, filled in
```

`../ledger.jsonl` is the append-only record those commands write: one line per
draw, grade, tick, decode and promote, born scrubbed, so a wave's shape
survives as data and travels home while the client's words stay here.

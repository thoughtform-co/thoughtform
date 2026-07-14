# Lighthouse baseline — 2026-07-14 (Phase 0)

Lighthouse 12.8.2 (lab), Chrome headless (`--headless=new`), against the
production custom domain **`https://www.thoughtform.co/`** (`thoughtform.co`
301-redirects to `www.`; the repo README also lists `thoughtform.vercel.app`).
`--only-categories=performance`.

```
CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" \
  npx lighthouse https://www.thoughtform.co/ --preset=desktop \
  --only-categories=performance --output=json --chrome-flags="--headless=new"
# mobile: same without --preset (default = mobile + 4x CPU / slow-4G throttling)
```

## Results

| Metric                       | Desktop   | Mobile     |
| ---------------------------- | --------- | ---------- |
| **Performance score**        | **99**    | **73**     |
| First Contentful Paint       | 0.6 s     | 1.4 s      |
| **Largest Contentful Paint** | **0.9 s** | **8.2 s**  |
| **Cumulative Layout Shift**  | **0**     | **0.004**  |
| **Total Blocking Time**      | **0 ms**  | **180 ms** |
| Speed Index                  | 1.2 s     | 1.9 s      |
| Time to Interactive          | 0.9 s     | 8.3 s      |
| Max Potential FID            | 20 ms     | 210 ms     |

> **INP note.** INP is a field/interaction metric and is **not measured in a
> Lighthouse lab run**. TBT (0 ms desktop / 180 ms mobile) and Max Potential FID
> (20 ms / 210 ms) are the lab responsiveness proxies recorded in its place.

## Read

- **Desktop is excellent** (99, LCP 0.9 s, CLS 0, TBT 0). No concern.
- **Mobile LCP is the standout problem: 8.2 s** (TTI 8.3 s), against a fine FCP
  (1.4 s) and near-zero CLS. The three.js + R3F corridor hero (see
  [bundle.md](bundle.md): 449.8 kB gzip First Load JS, of which 166.5 kB gzip is
  the single three.js chunk) dominates main-thread work on throttled mobile.
  This is the primary perf target for a later phase; **CLS is already healthy**,
  so layout-stability work is not needed.

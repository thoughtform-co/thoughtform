# Voidwalker travel — ground-truth trace

Generated: 2026-08-25T16:46:23.087Z

Headless Chromium via Playwright + CDP CPU throttling. Frame times are rAF→rAF deltas across a 700 ms window at each waypoint.

## 1920x1247 — CPU ×1

| stop             |   n | mean ms |  p50 |  p95 |  max | >33ms | >50ms | vwMode | ambient |
| ---------------- | --: | ------: | ---: | ---: | ---: | ----: | ----: | ------ | ------- |
| 1-corridor-build |  15 |   51.11 |   50 |  100 |  100 |    15 |     3 | travel | n       |
| 2-about-mid      |  19 |   39.47 | 33.4 | 50.1 | 50.1 |    19 |     1 | travel | y       |
| 3-vw-entry       |  36 |   19.91 | 16.7 | 33.4 | 33.4 |     7 |     0 | travel | y       |
| 4-vw-1_5vh       |  22 |   32.57 | 33.4 | 49.9 | 49.9 |    19 |     0 | travel | y       |
| 5-vw-7vh         |  24 |   29.86 | 33.3 | 33.4 | 33.4 |    19 |     0 | travel | y       |
| 6-vw-11vh        |  25 |      28 | 33.3 | 49.9 | 66.6 |    14 |     1 | travel | y       |
| 7-practice       |  43 |   16.67 | 16.7 | 16.8 | 16.8 |     0 |     0 | travel | n       |

## 1920x1247 — CPU ×4

| stop             |   n | mean ms |   p50 |   p95 |   max | >33ms | >50ms | vwMode | ambient |
| ---------------- | --: | ------: | ----: | ----: | ----: | ----: | ----: | ------ | ------- |
| 1-corridor-build |   8 |   110.4 |   100 | 216.6 | 216.6 |     8 |     8 | travel | n       |
| 2-about-mid      |   8 |  181.24 | 116.7 | 749.9 | 749.9 |     8 |     7 | travel | y       |
| 3-vw-entry       |  16 |   45.83 |    50 |  50.1 |  50.1 |    16 |     3 | travel | y       |
| 4-vw-1_5vh       |   7 |  114.29 | 116.6 | 133.4 | 133.4 |     7 |     7 | travel | y       |
| 5-vw-7vh         |   9 |   79.62 |  83.3 |   100 |   100 |     9 |     8 | travel | y       |
| 6-vw-11vh        |  13 |   60.25 |  66.7 |  83.2 |  83.2 |    13 |     9 | travel | y       |
| 7-practice       |  10 |   76.67 |  83.3 |  83.4 |  83.4 |    10 |    10 | travel | y       |

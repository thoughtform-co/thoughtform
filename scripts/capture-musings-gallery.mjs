/**
 * Shoot `/test/musings-gallery` — every direction for what sits under the
 * musings head — and gate what a still cannot show.
 *
 * The lab mounts the PRODUCTION station with a direction in its `gallery`
 * slot (`v0` is the shipped row), so the head, the pin, the decode and the
 * arrival are production's; this script rolls into the pinned dwell, waits on
 * the arrival, and asks each direction the same questions:
 *
 *   · `overflow`   — no horizontal page scroll.
 *   · `floor`      — the device ends on or above the rails' last tick
 *                    (`--hud-rail-y-end`, resolved through a probe).
 *   · `telemetry`  — its right edge ≥ 12px clear of the right rail's readouts.
 *   · `verticals`  — no hairline or one-sided rule taller than half the frame
 *                    (the owner, 2026-09-20: "we already have our rails"); a
 *                    chart's graticule inside its own housing is exempt.
 *   · `faces`      — every lettered element is PT Mono or PP Neue Montreal.
 *   · `radius`     — zero, everywhere in the device.
 *   · `floorType`  — nothing lettered under 9.5px.
 *   · `select`     — hovering a second note moves the selection there and
 *                    ONLY there; focusing a third does the same.
 *   · `contained`  — every visible text rect sits inside the device's box.
 *
 * ⚠ ONLY THE CONTROL (`v0`) CAN FAIL THE RUN. A direction failing a gate is a
 * FINDING, printed and written to the report — the interface kit's law.
 *
 * ⚠ IT WAITS ON AN IDENTITY, NEVER ON A NUMBER IT SET: the shell renders
 * `data-mg-stamp` = `v|src|n|theme` from ADOPTED state, and the theme is read
 * off `<html>` (dark is the ABSENT attribute).
 *
 *   node scripts/capture-musings-gallery.mjs                       # everything
 *   node scripts/capture-musings-gallery.mjs --v v1,v2 --src live  # a slice
 *   node scripts/capture-musings-gallery.mjs --vp 1280x720 --theme light
 *
 * Stills land in `shots/musings-gallery/<vp>-<theme>/` (gitignored), with
 * `report.json` beside them.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const PORT = arg("--port", "3003");
const VPS = arg("--vp", "1920x1247,1280x720").split(",");
const THEMES = arg("--theme", "dark,light").split(",");
const VS = arg("--v", "v0,v1,v2,v3,v4,v5,v6,v7,v8,v9,v10,v11,v12,v13,v14,v15,v16,v17").split(",");
const SRCS = arg("--src", "live,lab5,lab7").split(",");
const HEADED = process.argv.includes("--headed");
const ROOT_OUT = arg("--out", "shots/musings-gallery");
/* Extra query for a direction's own knobs, e.g. `--q cover=raster`. */
const EXTRA = arg("--q", "");

const FACES = /PT Mono|PP Neue Montreal/i;
const report = [];
const controlFails = [];
let findings = 0;

const browser = await chromium.launch({ headless: !HEADED });

for (const vp of VPS) {
  const [W, H] = vp.split("x").map(Number);
  for (const theme of THEMES) {
    const out = `${ROOT_OUT}/${vp}-${theme}`;
    mkdirSync(out, { recursive: true });
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 240)));

    for (const v of VS) {
      for (const srcKey of SRCS) {
        const src = srcKey.startsWith("lab") ? "lab" : "live";
        const n = src === "lab" ? srcKey.slice(3) || "5" : "";
        const tag = `${v}-${srcKey}${EXTRA ? `-${EXTRA.replace(/[=&]/g, "_")}` : ""}`;
        const url =
          `http://localhost:${PORT}/test/musings-gallery?v=${v}&src=${src}` +
          `${n ? `&n=${n}` : ""}&theme=${theme}&console=0${EXTRA ? `&${EXTRA}` : ""}`;
        errors.length = 0;
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(`[data-mg-stamp^="${v}|${src}|"]`, { timeout: 60_000 });
        await page.waitForFunction(
          (t) => (document.documentElement.dataset.theme ?? "dark") === t,
          theme,
          { timeout: 10_000 }
        );

        /* Real scrolls onto p = 0.45 of the runway — converge, never solve once
           (the document grows at hydration). */
        for (let pass = 0; pass < 80; pass += 1) {
          const s = await page.evaluate(() => {
            const r = document.querySelector(".mu__runway");
            if (!r) return null;
            const travel = Math.max(1, r.offsetHeight - document.documentElement.clientHeight);
            return { p: -r.getBoundingClientRect().top / travel, travel };
          });
          if (!s || Math.abs(s.p - 0.45) < 0.004) break;
          await page.evaluate(
            (d) => window.scrollBy({ top: d, behavior: "instant" }),
            Math.round((0.45 - s.p) * s.travel)
          );
          await page.waitForTimeout(70);
        }
        await page
          .waitForFunction(
            () => {
              const mu = document.querySelector(".mu");
              if (mu?.dataset.muArrive !== "in") return false;
              const dev =
                document.querySelector("[data-mg-root]") ?? document.querySelector(".mu__notes");
              return !!dev && dev.getAnimations({ subtree: true }).length === 0;
            },
            null,
            { timeout: 10_000 }
          )
          .catch(() => {});
        await page.mouse.move(6, Math.round(H / 2));
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${out}/${tag}-rest.png` });

        const m = await page.evaluate(
          ({ facesSrc }) => {
            const faces = new RegExp(facesSrc, "i");
            const dev =
              document.querySelector("[data-mg-root]") ?? document.querySelector(".mu__notes");
            const vh = window.innerHeight;
            const r = (b) => ({
              x: Math.round(b.x * 10) / 10,
              y: Math.round(b.y * 10) / 10,
              r: Math.round(b.right * 10) / 10,
              b: Math.round(b.bottom * 10) / 10,
            });
            /* A custom property is a string until something lays it out. */
            const probe = document.createElement("i");
            probe.style.cssText =
              "position:fixed;height:var(--hud-rail-y-end);width:0;visibility:hidden";
            document.body.appendChild(probe);
            const railEnd = probe.getBoundingClientRect().height;
            probe.remove();
            const box = dev ? r(dev.getBoundingClientRect()) : null;
            const tele = [...document.querySelectorAll(".rin-tele")]
              .map((t) => t.getBoundingClientRect())
              .filter((b) => b.width > 0);
            const teleLeft = tele.length ? Math.min(...tele.map((b) => b.x)) : null;

            const shown = (el) => {
              for (let a = el; a && a !== document.body; a = a.parentElement) {
                const cs = getComputedStyle(a);
                if (cs.visibility === "hidden" || cs.display === "none") return false;
              }
              return true;
            };
            const lettered = dev
              ? [...dev.querySelectorAll("*")].filter(
                  (el) =>
                    [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) &&
                    shown(el)
                )
              : [];
            const badFaces = new Set();
            const small = [];
            const outside = [];
            for (const el of lettered) {
              const cs = getComputedStyle(el);
              if (!faces.test(cs.fontFamily.split(",")[0]))
                badFaces.add(cs.fontFamily.split(",")[0]);
              if (parseFloat(cs.fontSize) < 9.5) small.push(`${el.className}:${cs.fontSize}`);
              /* ⚠ A SCROLLER CLIPS ON PURPOSE: text past a scroll container's
                 own box is content waiting to be scrolled to, not text
                 printing outside the device. */
              const clips = [];
              for (let a = el.parentElement; a && a !== dev; a = a.parentElement) {
                const o = getComputedStyle(a);
                if (/(auto|scroll|hidden|clip)/.test(o.overflowX + o.overflowY))
                  clips.push(a.getBoundingClientRect());
              }
              const range = document.createRange();
              range.selectNodeContents(el);
              for (const q of range.getClientRects()) {
                if (!box || q.width === 0) continue;
                /* Cut by a clipping ancestor inside the device (a scroller, a
                   face), in part or whole: that ancestor owns the edge. */
                const cutBy = clips.some(
                  (c) =>
                    q.left < c.left - 0.5 ||
                    q.right > c.right + 0.5 ||
                    q.top < c.top - 0.5 ||
                    q.bottom > c.bottom + 0.5
                );
                if (cutBy) continue;
                if (
                  q.left < box.x - 1 ||
                  q.right > box.r + 1 ||
                  q.top < box.y - 1 ||
                  q.bottom > box.b + 1
                )
                  outside.push((el.textContent ?? "").trim().slice(0, 24));
              }
            }
            const radius = dev
              ? [...dev.querySelectorAll("*")].filter((el) => {
                  const cs = getComputedStyle(el);
                  return ["TopLeft", "TopRight", "BottomLeft", "BottomRight"].some(
                    (k) => parseFloat(cs[`border${k}Radius`]) > 0
                  );
                }).length
              : 0;
            /* A vertical RULE: a box 2px or narrower, or a one-sided side
               border, taller than half the frame. The chart graticule is exempt
               inside its own housing (`/arcs`' monitor carries the same one). */
            const verticals = dev
              ? [...dev.querySelectorAll("*")]
                  .filter((el) => !el.closest(".mg-sm__grid") && !el.closest(".mg-cl__row"))
                  .filter((el) => {
                    const b = el.getBoundingClientRect();
                    if (b.height <= vh / 2 || !shown(el)) return false;
                    const cs = getComputedStyle(el);
                    const thin = b.width <= 2 && b.width > 0;
                    const side =
                      parseFloat(cs.borderLeftWidth) > 0 !== parseFloat(cs.borderRightWidth) > 0 &&
                      parseFloat(cs.borderTopWidth) === 0 &&
                      parseFloat(cs.borderBottomWidth) === 0;
                    return thin || side;
                  })
                  .map((el) => el.className)
              : [];
            const cut = dev
              ? [
                  ...dev.querySelectorAll(
                    ".mg-ch__title, .mg-sm__label, .mg-mm__title, .mg-ft__title, .mg-ft__rowtitle, .mg-cl__title, .mg-tx__subject, .mg-mb__title, .mg-ds__title"
                  ),
                ]
                  .filter((el) => shown(el) && el.scrollWidth > el.clientWidth + 1)
                  .map((el) => el.textContent)
              : [];
            return {
              box,
              vh,
              railEnd: Math.round(railEnd * 10) / 10,
              teleLeft: teleLeft == null ? null : Math.round(teleLeft * 10) / 10,
              overflowX:
                document.documentElement.scrollWidth > document.documentElement.clientWidth,
              badFaces: [...badFaces],
              small: small.slice(0, 6),
              outside: [...new Set(outside)].slice(0, 6),
              radius,
              verticals,
              cut,
            };
          },
          { facesSrc: FACES.source }
        );

        /* The selection, asked of the browser: hover a second note, focus a
           third. The shipped row answers through its own attribute. */
        const sel = await page.evaluate(() => {
          const links = [...document.querySelectorAll("[data-mg-root] a[data-mg-slug]")];
          const slugs = [...new Set(links.map((a) => a.dataset.mgSlug))];
          return { slugs, has: links.length > 0 };
        });
        let hover = null;
        let focus = null;
        const onSlugs = () =>
          page.evaluate(() => [
            ...new Set(
              [...document.querySelectorAll("[data-mg-root] [data-mg-on]")].map(
                (el) => el.dataset.mgSlug
              )
            ),
          ]);
        if (sel.has && sel.slugs.length >= 3) {
          const target = page.locator(`[data-mg-root] a[data-mg-slug="${sel.slugs[1]}"]`).first();
          await target.hover({ force: true }).catch(() => {});
          await page.waitForTimeout(650);
          hover = { want: sel.slugs[1], got: await onSlugs() };
          await page.screenshot({ path: `${out}/${tag}-hover.png` });
          await page.mouse.move(6, Math.round(H / 2));
          await page
            .locator(`[data-mg-root] a[data-mg-slug="${sel.slugs[2]}"]`)
            .first()
            .focus()
            .catch(() => {});
          await page.waitForTimeout(650);
          focus = { want: sel.slugs[2], got: await onSlugs() };
          await page.evaluate(() => document.activeElement?.blur());
        }

        /* Round six's own questions (findings, like every direction's).
           v14: the byline and the way in sit on the cover's floor, and the
           cover carries no frame of its own. v15 · v16: the card's visual
           rests as GLYPHS, resolves on the card, and the two states' mean ink
           stays one transition (ADR-097 U12 — no flash). */
        const own = [];
        if (v === "v14" || v === "v17") {
          const a = await page.evaluate(() => {
            const it = document.querySelector('[data-mg-variant="right"] .mg-ch__item[data-mg-on]');
            const cover = it?.querySelector(".mg-ch__cover");
            const sign = it?.querySelector(".mg-ch__sign");
            if (!cover || !sign) return null;
            const cs = getComputedStyle(cover);
            return {
              delta: sign.getBoundingClientRect().bottom - cover.getBoundingClientRect().bottom,
              border: parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth),
              bg: cs.backgroundColor,
            };
          });
          if (!a) own.push("no open card");
          else {
            if (Math.abs(a.delta) > 1.5)
              own.push(`the sign sits ${Math.round(a.delta * 10) / 10}px off the cover's floor`);
            if (a.border > 0 || a.bg !== "rgba(0, 0, 0, 0)")
              own.push(`the cover is framed (${a.border}px, ${a.bg})`);
          }
        }
        let raster = null;
        if (v === "v15" || v === "v16") {
          const sel = ".mg-ds__card[data-mg-on] .mg-rc";
          const rest = await page
            .waitForFunction((s) => document.querySelector(s)?.dataset.mgRaster === "rest", sel, {
              timeout: 8000,
            })
            .then(() => true)
            .catch(() => false);
          if (!rest) own.push("the card's visual never rested as glyphs");
          else {
            await page.locator(`.mg-ds__card[data-mg-on] .mg-ds__stage`).first().hover();
            const whole = await page
              .waitForFunction((s) => document.querySelector(s)?.dataset.mgLevel === "1", sel, {
                timeout: 5000,
              })
              .then(() => true)
              .catch(() => false);
            if (!whole) own.push("the card's visual never resolved");
            raster = await page.evaluate((s) => {
              const d = document.querySelector(s)?.dataset ?? {};
              return { rest: Number(d.mgInkRest), clean: Number(d.mgInkClean) };
            }, sel);
            /* One transition, not a flash: the resolved drawing may be no more
               than twice as inky as the glyphs, or half. */
            if (raster.rest > 0 && raster.clean > 0) {
              const ratio = raster.clean / raster.rest;
              if (ratio > 2 || ratio < 0.5)
                own.push(`rest→resolved ink ratio ${Math.round(ratio * 100) / 100}`);
            }
            await page.mouse.move(6, Math.round(H / 2));
          }
        }

        const fails = [];
        if (m.overflowX) fails.push("the page scrolls sideways");
        if (!m.box) fails.push("no device");
        else {
          if (m.box.b > m.vh - m.railEnd + 1)
            fails.push(
              `the device ends at ${m.box.b}, past the rails' last tick at ${m.vh - m.railEnd}`
            );
          if (m.teleLeft != null && m.teleLeft - m.box.r < 12)
            fails.push(
              `the device ends ${Math.round((m.teleLeft - m.box.r) * 10) / 10}px from the telemetry`
            );
        }
        if (v !== "v0") {
          if (m.verticals.length) fails.push(`vertical rules: ${m.verticals.join(", ")}`);
          if (m.badFaces.length) fails.push(`third faces: ${m.badFaces.join(", ")}`);
          if (m.radius) fails.push(`${m.radius} rounded elements`);
          if (m.small.length) fails.push(`type under 9.5px: ${m.small.join(", ")}`);
          if (m.outside.length) fails.push(`text outside the device: ${m.outside.join(" | ")}`);
          if (hover && (hover.got.length !== 1 || hover.got[0] !== hover.want))
            fails.push(`hover selected ${hover.got.join(",")} not ${hover.want}`);
          if (focus && (focus.got.length !== 1 || focus.got[0] !== focus.want))
            fails.push(`focus selected ${focus.got.join(",")} not ${focus.want}`);
          fails.push(...own);
        }
        if (errors.length) fails.push(`page errors: ${errors.join(" | ")}`);

        const row = { vp, theme, v, src: srcKey, ...m, hover, focus, raster, fails };
        report.push(row);
        const verdict = fails.length ? (v === "v0" ? "FAIL" : "FIND") : "ok  ";
        console.log(
          `${verdict} ${vp} ${theme.padEnd(5)} ${v} ${srcKey.padEnd(4)} ` +
            `box ${m.box ? `${m.box.y}–${m.box.b}` : "—"} floor ${m.vh - m.railEnd} ` +
            `tele ${m.teleLeft != null && m.box ? Math.round((m.teleLeft - m.box.r) * 10) / 10 : "—"}` +
            `${m.cut.length ? ` · cut ${m.cut.length}` : ""}` +
            `${raster ? ` · ink ${raster.rest}→${raster.clean}` : ""}` +
            (fails.length ? `\n      · ${fails.join("\n      · ")}` : "")
        );
        if (fails.length) {
          if (v === "v0") controlFails.push(`${vp} ${theme} ${srcKey}: ${fails.join("; ")}`);
          else findings += fails.length;
        }
      }
    }
    await page.close();
  }
}
await browser.close();

writeFileSync(`${ROOT_OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(
  `\n${controlFails.length ? "FAIL" : "PASS"} · ${report.length} cells · ${findings} direction findings · report in ${ROOT_OUT}/report.json`
);
for (const f of controlFails) console.log(`  · control: ${f}`);
process.exit(controlFails.length ? 1 : 0);

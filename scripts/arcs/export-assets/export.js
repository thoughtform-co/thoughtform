/*
 * The exported page's only script. It replays, in plain JS, the four things
 * the live page's React islands do in this part of the page. Everything else
 * in the export is settled markup and the site's own stylesheet.
 *
 *  1. The theme switch (LightModeToggle): `data-theme="light"` on <html> or
 *     absent, the visitor's choice in `localStorage["tf-theme"]`. The
 *     pre-paint half lives inline in <head>.
 *  2. The worked tabs (ArcWorkedSwitch): one page-wide pick, `hidden` on the
 *     panels, `aria-checked` + roving tabindex on the tabs, arrow keys.
 *  3. The curve's steps (ArcCurveSteps): the figure drops to the front edge
 *     the first time it is 60 % on screen, the two buttons build it back.
 *  4. The loop clip (ArcClipLoop): plays muted while in view, never under
 *     reduced motion, where the poster stands.
 */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1 · Theme ─────────────────────────────────────────────────────── */
  var STORE = "tf-theme";
  var html = document.documentElement;
  var GLYPHS = window.__SX_GLYPHS__ || {};

  function isLight() {
    return html.getAttribute("data-theme") === "light";
  }
  function paintToggle() {
    var light = isLight();
    var label = light ? "Switch to dark theme" : "Switch to light theme";
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-checked", light ? "true" : "false");
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      var glyph = GLYPHS[light ? "dark" : "light"];
      if (glyph) btn.innerHTML = glyph;
    });
  }
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest(".theme-toggle");
    if (!btn) return;
    var next = isLight() ? "dark" : "light";
    if (next === "light") html.setAttribute("data-theme", "light");
    else html.removeAttribute("data-theme");
    try {
      localStorage.setItem(STORE, next);
    } catch (_err) {
      /* A file:// origin without storage still flips for this visit. */
    }
    paintToggle();
  });
  paintToggle();

  /* ── 2 · Worked tabs ───────────────────────────────────────────────── */
  var root = document.querySelector(".arc-root");
  if (root) {
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-arc-worked-panel]"));
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-arc-worked-tab]"));
    if (panels.length) {
      var resting = panels.filter(function (p) {
        return p.hasAttribute("data-arc-worked-default");
      })[0];
      var restingId = (resting || panels[0]).getAttribute("data-arc-worked-panel");
      var apply = function (pick) {
        root.setAttribute("data-arc-worked", pick);
        panels.forEach(function (p) {
          p.hidden = p.getAttribute("data-arc-worked-panel") !== pick;
        });
        tabs.forEach(function (t) {
          var on = t.getAttribute("data-arc-worked-tab") === pick;
          t.setAttribute("aria-checked", on ? "true" : "false");
          t.tabIndex = on ? 0 : -1;
        });
      };
      root.addEventListener("click", function (e) {
        var tab = e.target.closest("[data-arc-worked-tab]");
        if (tab) apply(tab.getAttribute("data-arc-worked-tab"));
      });
      root.addEventListener("keydown", function (e) {
        var tab = e.target.closest("[data-arc-worked-tab]");
        if (!tab) return;
        var step =
          e.key === "ArrowRight" || e.key === "ArrowDown"
            ? 1
            : e.key === "ArrowLeft" || e.key === "ArrowUp"
              ? -1
              : 0;
        if (!step) return;
        e.preventDefault();
        var bar = tab.closest("[data-arc-worked-bar]");
        var sibs = bar
          ? Array.prototype.slice.call(bar.querySelectorAll("[data-arc-worked-tab]"))
          : [];
        var at = sibs.indexOf(tab);
        var next = sibs[(at + step + sibs.length) % sibs.length];
        if (!next) return;
        apply(next.getAttribute("data-arc-worked-tab"));
        next.focus();
      });
      root.classList.add("is-arc-worked-js");
      apply(restingId);
    }
  }

  /* ── 3 · Curve steps ───────────────────────────────────────────────── */
  document.querySelectorAll("figure.arc-cv").forEach(function (fig) {
    var btns = fig.querySelectorAll(".arc-cv__show");
    var step = 2;
    var set = function (s) {
      step = s;
      fig.setAttribute("data-step", String(s));
      if (btns[0]) btns[0].setAttribute("aria-pressed", s >= 1 ? "true" : "false");
      if (btns[1]) btns[1].setAttribute("aria-pressed", s === 2 ? "true" : "false");
    };
    set(2);
    if (btns[0])
      btns[0].addEventListener("click", function (e) {
        set(step >= 1 ? 0 : 1);
        if (e.detail > 0) e.currentTarget.blur();
      });
    if (btns[1])
      btns[1].addEventListener("click", function (e) {
        set(step === 2 ? 1 : 2);
        if (e.detail > 0) e.currentTarget.blur();
      });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          if (
            !entries.some(function (en) {
              return en.isIntersecting;
            })
          )
            return;
          io.disconnect();
          if (!REDUCED) set(0);
        },
        { threshold: 0.6 }
      );
      io.observe(fig);
    }
  });

  /* ── 4 · The loop clip ─────────────────────────────────────────────── */
  if (!REDUCED && "IntersectionObserver" in window) {
    document.querySelectorAll("video.arc-inter__video").forEach(function (video) {
      video.muted = true;
      var io = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) {
            video.preload = "auto";
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            video.pause();
          }
        },
        { threshold: 0.25 }
      );
      io.observe(video);
    });
  }
})();

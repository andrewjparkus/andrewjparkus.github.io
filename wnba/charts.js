"use strict";
/* charts.js — shared SVG drawing idioms for every Daily RAPM page (Plan 15).
 * Replaces the near-duplicate chart impls: percentile bar + profile radar,
 * sparkline, density gaussian, heat-strip color ramps. The Explorer's bespoke
 * interactive multi-series chart stays local to index.html (it owns the
 * crosshair/hover sync); everything STATELESS lives here. Exposed as `window.RC`.
 * Pure-math helpers are also CommonJS-exported for `node --check`/parity tests.
 * Deliberately describes CAPABILITIES, not the pages that call them — the last
 * header named a page (Draft) that has since been retired, and outlived it.
 *
 * League colors come from CSS vars at draw time via getComputedStyle so charts
 * follow the light/dark theme; LC{} is the JS fallback for non-DOM contexts.
 */
(function (root) {
  var NS = "http://www.w3.org/2000/svg";
  var LC = { nba: "#4aa8ff", gleague: "#ff9138", college: "#ff5f8f" };
  var LVAR = { nba: "--nba", gleague: "--gleague", college: "--college" };

  // SVG element builder (the old el()/elns()).
  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  }
  // Read the CSS var so charts follow the light/dark theme, as the header claims.
  // LC{} is the fallback for non-DOM contexts (node tests) and for an unset var.
  function leagueColor(lg) {
    var v = LVAR[lg];
    if (v && typeof getComputedStyle === "function" && typeof document !== "undefined") {
      var c = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      if (c) return c;
    }
    return LC[lg] || "var(--accent)";
  }

  /* ---- pure math (also node-exported) ------------------------------------ */
  // percentile in [0,1] from an array of sorted quantile edges (binary search).
  function pctile(breaks, x) {
    var lo = 0, hi = breaks.length - 1;
    if (x <= breaks[0]) return 0;
    if (x >= breaks[hi]) return 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (x < breaks[m]) hi = m; else lo = m; }
    var span = breaks[hi] - breaks[lo] || 1e-9;
    return (lo + (x - breaks[lo]) / span) / (breaks.length - 1);
  }
  // gaussian pdf N(mu, se^2) at x.
  function gauss(x, mu, se) { return Math.exp(-((x - mu) * (x - mu)) / (2 * se * se)) / (se * Math.sqrt(2 * Math.PI)); }
  // standard normal CDF (Abramowitz-Stegun 7.1.26).
  function Phi(x) {
    var t = 1 / (1 + 0.2316419 * Math.abs(x));
    var d = 0.3989423 * Math.exp(-x * x / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }
  // ColorBrewer RdBu-11 (CVD-safe diverging); t in [0,1], 0=red ... 1=blue.
  var RDBU = ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7",
    "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"];
  function rdbu(t) {
    t = Math.max(0, Math.min(1, t));
    var x = t * (RDBU.length - 1), i = Math.floor(x), f = x - i;
    if (i >= RDBU.length - 1) return RDBU[RDBU.length - 1];
    function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
    var a = rgb(RDBU[i]), b = rgb(RDBU[i + 1]);
    var L = function (u, v) { return Math.round(u + (v - u) * f); };
    return "rgb(" + L(a[0], b[0]) + "," + L(a[1], b[1]) + "," + L(a[2], b[2]) + ")";
  }
  // ColorBrewer RdYlGn-8 (CVD-friendlier than pure red-green: has a luminance ramp);
  // t in [0,1], 0=red ... 1=green. Pair with visible text — color is never the sole encoder.
  var RDYLGN = ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850"];
  function redGreen(t) {
    t = Math.max(0, Math.min(1, t));
    var x = t * (RDYLGN.length - 1), i = Math.floor(x), f = x - i;
    if (i >= RDYLGN.length - 1) return RDYLGN[RDYLGN.length - 1];
    function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
    var a = rgb(RDYLGN[i]), b = rgb(RDYLGN[i + 1]);
    var L = function (u, v) { return Math.round(u + (v - u) * f); };
    return "rgb(" + L(a[0], b[0]) + "," + L(a[1], b[1]) + "," + L(a[2], b[2]) + ")";
  }
  // perceptual luminance (0..1) of an 'rgb(r,g,b)' or '#rrggbb' string.
  function lum(color) {
    var r, g, b;
    if (color[0] === "#") { r = parseInt(color.slice(1, 3), 16); g = parseInt(color.slice(3, 5), 16); b = parseInt(color.slice(5, 7), 16); }
    else { var m = String(color).match(/\d+/g) || [0, 0, 0]; r = +m[0]; g = +m[1]; b = +m[2]; }
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  // readable text ink for a colored cell background (dark ink on light cells, light on dark).
  function inkOn(color) { return lum(color) > 0.58 ? "#0a0e16" : "#f3f6fb"; }

  /* ---- stateless SVG drawers --------------------------------------------- */
  // sparkline (by-factor trend cell). vals[], returns an <svg>.
  function spark(vals, color) {
    var W = 72, H = 18, pad = 2;
    if (!vals || vals.length < 2) return el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "spark" });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = (hi - lo) || 1, n = vals.length;
    var X = function (i) { return pad + (n > 1 ? i / (n - 1) : 0.5) * (W - 2 * pad); };
    var Y = function (v) { return pad + (H - 2 * pad) - (v - lo) / span * (H - 2 * pad); };
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "spark", role: "img",
      "aria-label": "trend " + vals[0].toFixed(1) + " to " + vals[n - 1].toFixed(1) });
    var pts = vals.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); }).join(" ");
    svg.appendChild(el("polyline", { points: pts, fill: "none", stroke: color, "stroke-width": 1.3, "stroke-linejoin": "round" }));
    svg.appendChild(el("circle", { cx: X(n - 1), cy: Y(vals[n - 1]), r: 1.6, fill: color }));
    return svg;
  }

  // horizontal within-league percentile bar (profile). pct in [0,1]; returns <svg>.
  // The median tick is var(--zero) because that is exactly what it marks — the league midpoint —
  // and because the hard-coded #2b3a51 it replaces measured 1.44:1 on the dark --grid track it is
  // painted on, i.e. the reference line was invisible in the default theme.
  function pctBar(val, pct, accent, label) {
    var W = 300, H = 20, px = Math.max(2, Math.round(pct * W));
    accent = accent || "var(--accent)";
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", height: H, role: "img",
      "aria-label": (label || "") + " " + val.toFixed(2) + ", " + Math.round(pct * 100) + "th percentile" });
    svg.appendChild(el("rect", { x: 0, y: 2, width: W, height: H - 4, fill: "var(--grid)", rx: 2 }));
    svg.appendChild(el("rect", { x: 0, y: 2, width: px, height: H - 4, fill: accent, rx: 2 }));
    svg.appendChild(el("line", { x1: W / 2, y1: 0, x2: W / 2, y2: H, stroke: "var(--zero)", "stroke-width": 1 }));
    return svg;
  }

  // fixed-order profile-shape radar. facs[] labels, pcts{factor:0..1}; draws into mount.
  function radar(mount, facs, pcts, accent) {
    var S = 320, R = 120, cx = S / 2, cy = S / 2, n = facs.length;
    accent = accent || "var(--accent)";
    var svg = el("svg", { viewBox: "0 0 " + S + " " + S, width: "100%", role: "img", "aria-label": "profile shape radar" });
    [0.25, 0.5, 0.75, 1].forEach(function (r) {
      var p = facs.map(function (_, k) { var a = -Math.PI / 2 + k * 2 * Math.PI / n;
        return (cx + Math.cos(a) * R * r).toFixed(1) + "," + (cy + Math.sin(a) * R * r).toFixed(1); }).join(" ");
      svg.appendChild(el("polygon", { points: p, fill: "none", stroke: "var(--line)", "stroke-width": 1 }));
    });
    facs.forEach(function (f, k) {
      var a = -Math.PI / 2 + k * 2 * Math.PI / n;
      svg.appendChild(el("line", { x1: cx, y1: cy, x2: cx + Math.cos(a) * R, y2: cy + Math.sin(a) * R, stroke: "var(--line)", "stroke-width": 1 }));
      // var(--muted), not a hex: the six factor names are 12.5px TEXT, and the #aebccd they used
      // to be hard-coded to measured 1.93:1 on the light --panel — unreadable in the light theme.
      var t = el("text", { x: cx + Math.cos(a) * (R + 18), y: cy + Math.sin(a) * (R + 18) + 4, "font-size": 12.5, fill: "var(--muted)", "text-anchor": "middle" });
      t.textContent = f; svg.appendChild(t);
    });
    var pp = facs.map(function (f, k) { var a = -Math.PI / 2 + k * 2 * Math.PI / n, r = R * (pcts[f] || 0);
      return (cx + Math.cos(a) * r).toFixed(1) + "," + (cy + Math.sin(a) * r).toFixed(1); }).join(" ");
    svg.appendChild(el("polygon", { points: pp, fill: accent, "fill-opacity": 0.18, stroke: accent, "stroke-width": 1.8 }));
    mount.innerHTML = ""; mount.appendChild(svg);
  }

  // REMOVED 2026-07-27: whisker() and miniCurve(). Both were built for the Draft page, which is
  // retired; that page drew its own inline whisker and never called RC.* at all, so neither helper
  // ever had a second caller and both had zero site-wide consumers when the page went. Deleting
  // whisker() is also what retires the --whisk token and the .whisk class, which nothing else read.
  // leagueColor() stays — miniCurve was its last internal caller, but model.html exercises it.

  // true-talent gaussian overlay (density compare). sel: [{net,se,color,name}]; draws into mount.
  function densityPlot(mount, sel) {
    mount.innerHTML = "";
    if (!sel || !sel.length) return;
    var W = 900, H = 320, ml = 10, mr = 10, mt = 14, mb = 28, pw = W - ml - mr, ph = H - mt - mb;
    var lo = Math.min.apply(null, sel.map(function (s) { return s.net - 4 * s.se; }));
    var hi = Math.max.apply(null, sel.map(function (s) { return s.net + 4 * s.se; }));
    lo = Math.min(lo, -2); hi = Math.max(hi, 2); var pad = (hi - lo) * 0.04; lo -= pad; hi += pad;
    var X = function (v) { return ml + ((v - lo) / (hi - lo)) * pw; };
    var N = 240, xs = []; for (var k = 0; k <= N; k++) xs.push(lo + (hi - lo) * k / N);
    var ymax = 0; sel.forEach(function (s) { xs.forEach(function (x) { ymax = Math.max(ymax, gauss(x, s.net, s.se)); }); });
    var Y = function (v) { return mt + ph - (v / ymax) * ph; };
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img",
      "aria-label": "true-talent density overlay; each player a Gaussian N(net, se^2)" });
    svg.appendChild(el("line", { x1: X(0), y1: mt, x2: X(0), y2: mt + ph, stroke: "var(--zero)", "stroke-width": 1.5 }));
    var z = el("text", { x: X(0), y: H - 9, "font-size": 11, fill: "var(--muted)", "text-anchor": "middle" });
    z.textContent = "0 (league avg)"; svg.appendChild(z);
    for (var v = Math.ceil(lo); v <= Math.floor(hi); v += 2) {
      svg.appendChild(el("line", { x1: X(v), y1: mt + ph, x2: X(v), y2: mt + ph + 4, stroke: "var(--zero)" }));
      var t = el("text", { x: X(v), y: H - 9, "font-size": 10.5, fill: "var(--faint)", "text-anchor": "middle" });
      t.textContent = (v > 0 ? "+" : "") + v; svg.appendChild(t);
    }
    sel.forEach(function (s) {
      var dpath = "M " + X(xs[0]) + " " + Y(0);
      xs.forEach(function (x) { dpath += " L " + X(x).toFixed(1) + " " + Y(gauss(x, s.net, s.se)).toFixed(1); });
      dpath += " L " + X(xs[xs.length - 1]) + " " + Y(0) + " Z";
      svg.appendChild(el("path", { d: dpath, fill: s.color, "fill-opacity": 0.16, stroke: s.color, "stroke-width": 1.8 }));
      svg.appendChild(el("line", { x1: X(s.net), y1: Y(gauss(s.net, s.net, s.se)), x2: X(s.net), y2: mt + ph, stroke: s.color, "stroke-width": 1, "stroke-dasharray": "3 2" }));
    });
    mount.appendChild(svg);
  }

  /* ---- theme toggle (light/dark, persisted) ------------------------------ */
  function initTheme() {
    try { var t = localStorage.getItem("rapm_theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    var next = cur === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("rapm_theme", next); } catch (e) {}
    return next;
  }

  var API = { NS: NS, LC: LC, el: el, leagueColor: leagueColor, pctile: pctile, gauss: gauss, Phi: Phi,
    rdbu: rdbu, redGreen: redGreen, lum: lum, inkOn: inkOn, spark: spark, pctBar: pctBar, radar: radar,
    densityPlot: densityPlot, initTheme: initTheme, toggleTheme: toggleTheme };
  if (typeof window !== "undefined") { window.RC = API; initTheme(); }
  if (typeof module !== "undefined" && module.exports) module.exports = API;

  // node self-check: the pure-math invariants (run `node charts.js`).
  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    var a = function (c, m) { if (!c) throw new Error("charts self-check FAILED: " + m); };
    var edges = []; for (var i = 0; i <= 100; i++) edges.push(i / 100); // 0..1 uniform
    a(pctile(edges, -1) === 0, "pctile below min -> 0");
    a(pctile(edges, 2) === 1, "pctile above max -> 1");
    a(Math.abs(pctile(edges, 0.5) - 0.5) < 1e-9, "pctile mid -> 0.5");
    a(Math.abs(Phi(0) - 0.5) < 1e-3, "Phi(0)=0.5");
    a(Phi(5) > 0.999 && Phi(-5) < 0.001, "Phi tails");
    a(Math.abs(gauss(0, 0, 1) - 0.3989423) < 1e-4, "gauss peak");
    a(rdbu(0.5).indexOf("rgb") === 0 && /^(rgb|#)/.test(rdbu(1)), "rdbu returns a color");
    var rg = function (c) { var m = String(c).match(/\d+/g) || [0, 0, 0]; return { r: +m[0], g: +m[1], b: +m[2] }; };
    a(rg(redGreen(0)).r > rg(redGreen(0)).g, "redGreen(0) is reddish (r>g)");
    a(rg(redGreen(1)).g > rg(redGreen(1)).r, "redGreen(1) is greenish (g>r)");
    a(inkOn(rdbu(0.5)) === "#0a0e16", "light mid cell -> dark ink");
    a(inkOn(rdbu(1)) === "#f3f6fb" && inkOn(rdbu(0)) === "#f3f6fb", "dark extreme cells -> light ink");
    console.log("charts.js self-check OK");
  }
})(this);

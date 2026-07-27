"use strict";
/* team_colors.js — the team-accent system for the 2027 team page (and anything
 * else that wants to wear a franchise's colours). Plain classic script, same
 * shape as charts.js/nav.js: an IIFE that hangs its API on `window` and also
 * CommonJS-exports so `node team_colors.js` can assert its own invariants.
 *
 * SOURCE. Every hex below is nbacolors.com's own data — the per-team pages are
 * JS-rendered from https://nbacolors.com/js/data.json, which is what this table
 * transcribes (colors[0] -> primary, colors[1] -> secondary). Spot-checked
 * against the rendered pages: Chicago #ce1141/#000000, San Antonio
 * #c4ced4/#000000. NO team is filled in from general knowledge; if one ever is,
 * mark it right here with an UNSOURCED comment on its line.
 *
 * WHY DERIVE INSTEAD OF USING THE BRAND HEX. These are colours picked for a
 * white jersey and a white broadcast graphic. On this site's #080b11 page the
 * Mavs' #00538C, the Nets' black and the Cavs' #860038 are all but invisible;
 * on the light theme the golds disappear the other way. So teamAccent/teamInk
 * keep the brand HUE (that is the part that reads as "the team") and move
 * lightness/chroma until the result clears a real contrast floor on the target
 * surface. Everything happens in OKLCh so that "keep the hue, move the
 * lightness" means what it says perceptually — HSL would swing the hue of the
 * deep navies and wash the reds.
 */
(function () {

  /* ---- the table -------------------------------------------------------- *
   * Keyed by the 3-letter abbr the projection feed uses (BKN not BRK, PHX not
   * PHO, LAC named "LA Clippers"): read off projection_2026_27_teams.json, not
   * guessed. Names match the feed so a caller can label from either source. */
  var TEAM_COLORS = {
    ATL: { name: "Atlanta Hawks",          primary: "#E03A3E", secondary: "#C1D32F" },
    BOS: { name: "Boston Celtics",         primary: "#007A33", secondary: "#BA9653" },
    BKN: { name: "Brooklyn Nets",          primary: "#000000", secondary: "#FFFFFF" },
    CHA: { name: "Charlotte Hornets",      primary: "#1D1160", secondary: "#00788C" },
    CHI: { name: "Chicago Bulls",          primary: "#CE1141", secondary: "#000000" },
    CLE: { name: "Cleveland Cavaliers",    primary: "#860038", secondary: "#041E42" },
    DAL: { name: "Dallas Mavericks",       primary: "#00538C", secondary: "#002B5E" },
    DEN: { name: "Denver Nuggets",         primary: "#0E2240", secondary: "#FEC524" },
    DET: { name: "Detroit Pistons",        primary: "#C8102E", secondary: "#1D42BA" },
    GSW: { name: "Golden State Warriors",  primary: "#1D428A", secondary: "#FFC72C" },
    HOU: { name: "Houston Rockets",        primary: "#CE1141", secondary: "#000000" },
    IND: { name: "Indiana Pacers",         primary: "#002D62", secondary: "#FDBB30" },
    LAC: { name: "LA Clippers",            primary: "#C8102E", secondary: "#1D428A" },
    LAL: { name: "Los Angeles Lakers",     primary: "#552583", secondary: "#F9A01B" },
    MEM: { name: "Memphis Grizzlies",      primary: "#5D76A9", secondary: "#12173F" },
    MIA: { name: "Miami Heat",             primary: "#98002E", secondary: "#F9A01B" },
    MIL: { name: "Milwaukee Bucks",        primary: "#00471B", secondary: "#EEE1C6" },
    MIN: { name: "Minnesota Timberwolves", primary: "#0C2340", secondary: "#236192" },
    NOP: { name: "New Orleans Pelicans",   primary: "#0C2340", secondary: "#C8102E" },
    NYK: { name: "New York Knicks",        primary: "#006BB6", secondary: "#F58426" },
    OKC: { name: "Oklahoma City Thunder",  primary: "#007AC1", secondary: "#EF3B24" },
    ORL: { name: "Orlando Magic",          primary: "#0077C0", secondary: "#C4CED4" },
    PHI: { name: "Philadelphia 76ers",     primary: "#006BB6", secondary: "#ED174C" },
    PHX: { name: "Phoenix Suns",           primary: "#1D1160", secondary: "#E56020" },
    POR: { name: "Portland Trail Blazers", primary: "#E03A3E", secondary: "#000000" },
    SAC: { name: "Sacramento Kings",       primary: "#5A2D81", secondary: "#63727A" },
    SAS: { name: "San Antonio Spurs",      primary: "#C4CED4", secondary: "#000000" },
    TOR: { name: "Toronto Raptors",        primary: "#CE1141", secondary: "#000000" },
    UTA: { name: "Utah Jazz",              primary: "#002B5C", secondary: "#00471B" },
    WAS: { name: "Washington Wizards",     primary: "#002B5C", secondary: "#E31837" }
  };

  /* ---- surfaces & floors ------------------------------------------------ *
   * Derive against the WORST surface for the mark, which is the one nearest it
   * in luminance: the LIGHTEST surface in the dark theme (--grid #161f2c, above
   * --panel #0e141d and --bg #080b11) and the DARKEST in the light theme
   * (--panel-3 #e3ebf5 — the table row-hover and .btn.active fill — below --grid
   * #e6edf5 and --panel #ffffff). Light used to derive against #ffffff, which is
   * the EASIEST light surface, not the hardest, so every light mark cleared
   * row-hover only by luck. Clearing the worst case clears every card, row-hover
   * and gridline on that theme; the self-check re-checks all five. */
  var SURFACE = { dark: "#161f2c", light: "#e3ebf5" };
  var FLOOR = { accent: 3, ink: 4.5 };          // mark legibility / WCAG AA text
  var SITE_ACCENT = { dark: "#56b6ff", light: "#1f7ae0" };  // --accent, the last resort
  // --pos/--neg are RESERVED: on this site they mean the sign of a number, and
  // nothing else may look like them. A derived colour that lands on --neg makes
  // red stop meaning "negative" on that franchise's page — measured on light
  // ATL, where every player-name link was the same red as the negative net
  // values beside it. So every derived colour is held away from both.
  var SIGN = { dark:  { pos: "#3ddc97", neg: "#ff6b6b" },
               light: { pos: "#11a06a", neg: "#d4393a" } };
  // ~0.02 OKLab dE is one just-noticeable difference on a flat patch, which is
  // exactly what light ATL measured against --neg (0.022 = the same colour to
  // the eye). 0.10 is ~5 JND: still the same FAMILY of red, plainly not the
  // same red as a negative number.
  var SIGN_DE = 0.10;

  // Usable lightness band per theme+role, in OKLab L. A brand colour already
  // inside its band is left ALONE by the clamp — only the out-of-band ones (the
  // navies, the blacks, the wine) get dragged to an edge. Text sits in a
  // lighter/darker band than marks because it has to clear a stiffer floor.
  // The band is also the room the sign separation below is allowed to use, so it
  // is what bounds how far off its brand lightness a colour can ever be pushed.
  var BAND = {
    dark:  { accent: [0.56, 0.82], ink: [0.62, 0.88] },
    light: { accent: [0.46, 0.60], ink: [0.38, 0.52] }
  };
  var C_MIN = 0.11;   // floor the chroma so navies read as navy, not as slate
  // Below this OKLCh chroma a colour has no hue worth preserving (black, white,
  // silver). The 30-team gap either side is wide and unambiguous: Nets black
  // 0.000 and Spurs silver 0.014 sit below it, and the least-saturated colour
  // still treated as a hue is the Timberwolves/Pelicans navy #0C2340 at 0.062
  // (Denver's #0E2240 is a hair above it at 0.063). Nothing lands in between.
  var GREY_C = 0.035;

  /* ---- colour space ----------------------------------------------------- */
  function hex2rgb(h) {
    h = String(h).replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function toLin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toSrgb(c) { return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055); }
  function hex2(n) { n = Math.round(Math.max(0, Math.min(255, n))); return (n < 16 ? "0" : "") + n.toString(16); }

  // sRGB hex -> OKLCh {L, C, h(deg)}  (Björn Ottosson's matrices).
  function toOklch(hex) {
    var p = hex2rgb(hex), r = toLin(p[0]), g = toLin(p[1]), b = toLin(p[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return { L: L, C: Math.sqrt(A * A + B * B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
  }
  // OKLCh -> linear sRGB triple (may fall outside [0,1] = out of gamut).
  function lchToLin(L, C, h) {
    var t = h * Math.PI / 180, A = C * Math.cos(t), B = C * Math.sin(t);
    var l = L + 0.3963377774 * A + 0.2158037573 * B;
    var m = L - 0.1055613458 * A - 0.0638541728 * B;
    var s = L - 0.0894841775 * A - 1.2914855480 * B;
    l = l * l * l; m = m * m * m; s = s * s * s;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  }
  function inGamut(v) {
    for (var i = 0; i < 3; i++) if (v[i] < -1e-4 || v[i] > 1 + 1e-4) return false;
    return true;
  }
  // Render an OKLCh triple as a hex, reducing CHROMA ONLY until it fits sRGB.
  // Hue is never touched, which is the whole point: the clip stays on-brand.
  function lchToHex(L, C, h) {
    if (!inGamut(lchToLin(L, C, h))) {
      var lo = 0, hi = C;
      for (var i = 0; i < 22; i++) {
        var mid = (lo + hi) / 2;
        if (inGamut(lchToLin(L, mid, h))) lo = mid; else hi = mid;
      }
      C = lo;
    }
    var v = lchToLin(L, C, h);
    return "#" + hex2(toSrgb(Math.max(0, Math.min(1, v[0])))) +
                 hex2(toSrgb(Math.max(0, Math.min(1, v[1])))) +
                 hex2(toSrgb(Math.max(0, Math.min(1, v[2]))));
  }

  /* ---- WCAG contrast ---------------------------------------------------- */
  function relLum(hex) {
    var p = hex2rgb(hex);
    return 0.2126 * toLin(p[0]) + 0.7152 * toLin(p[1]) + 0.0722 * toLin(p[2]);
  }
  function contrast(a, b) {
    var x = relLum(a), y = relLum(b), hi = Math.max(x, y), lo = Math.min(x, y);
    return (hi + 0.05) / (lo + 0.05);
  }

  /* ---- perceptual distance ---------------------------------------------- *
   * Straight-line distance in OKLab, the space that was designed so that this
   * number means "how different these look". Contrast (above) cannot do this
   * job: --neg and a team red can be identical to the eye and still have a
   * perfectly healthy contrast ratio against the page, because contrast only
   * compares LUMINANCE and says nothing about hue. */
  function toOklab(hex) {
    var c = toOklch(hex), t = c.h * Math.PI / 180;
    return [c.L, c.C * Math.cos(t), c.C * Math.sin(t)];
  }
  function dE(x, y) {
    var A = toOklab(x), B = toOklab(y), s = 0;
    for (var i = 0; i < 3; i++) s += (A[i] - B[i]) * (A[i] - B[i]);
    return Math.sqrt(s);
  }
  // Distance to the NEARER of that theme's two reserved sign colours.
  function signGap(hex, theme) {
    return Math.min(dE(hex, SIGN[theme].pos), dE(hex, SIGN[theme].neg));
  }

  /* ---- derivation ------------------------------------------------------- */
  // Which brand colour carries the hue: primary, unless it is essentially
  // greyscale (Nets black, Spurs silver) in which case there is no hue to
  // preserve — try the secondary, then give up and wear the site accent.
  // Returns {hex, src} so the self-check can prove the chain actually fires.
  function baseFor(abbr, theme) {
    var t = TEAM_COLORS[abbr];
    if (!t) return { hex: SITE_ACCENT[theme], src: "site" };
    if (toOklch(t.primary).C >= GREY_C) return { hex: t.primary, src: "primary" };
    if (toOklch(t.secondary).C >= GREY_C) return { hex: t.secondary, src: "secondary" };
    return { hex: SITE_ACCENT[theme], src: "site" };
  }

  var cache = {};
  // role is "accent" (3:1, marks) or "ink" (4.5:1, text).
  // NOT a categorical palette: teams whose brand hex is the same navy (UTA,
  // WAS, MIN, NOP...) come out the same colour, and that is correct — one
  // team's accent is on screen at a time. If a chart ever needs to tell two
  // teams apart, encode the difference some other way; do not tune this.
  function derive(abbr, theme, role) {
    var key = abbr + "|" + theme + "|" + role;
    if (cache[key]) return cache[key];
    var base = toOklch(baseFor(abbr, theme).hex);
    var C = Math.max(base.C, C_MIN);
    var surface = SURFACE[theme], floor = FLOOR[role], band = BAND[theme][role];
    var L = Math.min(Math.max(base.L, band[0]), band[1]);
    // Walk lightness away from the surface until the QUANTIZED hex clears the
    // floor — measuring the rounded value means the published colour is the one
    // that passed, not an idealised float that rounds down below the line.
    var step = theme === "dark" ? 0.006 : -0.006, out = lchToHex(L, C, base.h);
    for (var i = 0; i < 170 && contrast(out, surface) < floor; i++) {
      L += step;
      if (L <= 0.02 || L >= 0.995) break;
      out = lchToHex(L, C, base.h);
    }
    // Then move it off --pos/--neg if it landed on one. LIGHTNESS ONLY: hue is
    // the part that reads as "the team", and it is also what keeps a red team
    // red, so this never rotates (measured drift over all 120 colours: 0.48 deg,
    // all of it sRGB quantisation). Step OUTWARD from where the contrast walk
    // left off and take the NEAREST L that clears the gap, so a colour spends
    // the least brand-distance it can. Both directions are tried, not just the
    // far edge of the band: the sign colours sit INSIDE the bands, so marching
    // to the edge can move a colour TOWARDS one (measured: at the top of the
    // dark accent band Boston green is 0.042 from --pos, worse than where it
    // started). Every candidate is re-checked against the contrast floor —
    // separation may not buy itself illegibility.
    // WHAT IT COSTS, so nobody "fixes" it later: 23 of the 120 colours move, all
    // of them red or wine teams. On light they deepen (Hawks #df393e -> #b1001c,
    // still plainly Hawks red). On dark the only legible direction away from
    // --neg is LIGHTER, and sRGB sheds chroma up there, so the ink lands pale
    // (#ef4a4b -> #ff9d96). That is the honest price of a link that cannot be
    // read as a negative number; the accent, which has more room, keeps its bite.
    if (signGap(out, theme) < SIGN_DE) {
      // the walk may have ended outside the band to clear the floor; that L is
      // legible by definition, so it widens the search range instead of voiding it
      var lo = Math.min(band[0], L), hi = Math.max(band[1], L);
      var best = out, bestGap = signGap(out, theme), found = "";
      for (var k = 1; k <= 80 && !found; k++) {          // 80 x 0.006 = wider than any band
        for (var s = 0; s < 2 && !found; s++) {
          var Lt = L + (s ? -step : step) * k;           // contrast-GAINING side first
          if (Lt < lo - 1e-9 || Lt > hi + 1e-9) continue;
          var hex = lchToHex(Lt, C, base.h);
          if (contrast(hex, surface) < floor) continue;
          var g = signGap(hex, theme);
          if (g >= SIGN_DE) found = hex;
          else if (g > bestGap) { bestGap = g; best = hex; }
        }
      }
      // If the band cannot separate this colour, keep the most-separated LEGIBLE
      // candidate rather than silently swapping in some other colour: the
      // self-check asserts SIGN_DE, so that case fails loudly in the test instead
      // of quietly on the page.
      out = found || best;
    }
    cache[key] = out;
    return out;
  }

  // 'dark' unless the document says otherwise (no attribute = dark, per site.css).
  function resolveTheme(theme) {
    if (theme === "dark" || theme === "light") return theme;
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement.dataset.theme === "light" ? "light" : "dark";
    }
    return "dark";
  }

  function teamAccent(abbr, theme) { return derive(abbr, resolveTheme(theme), "accent"); }
  function teamInk(abbr, theme) { return derive(abbr, resolveTheme(theme), "ink"); }

  var API = { TEAM_COLORS: TEAM_COLORS, teamAccent: teamAccent, teamInk: teamInk,
    toOklch: toOklch, contrast: contrast, baseFor: baseFor };
  if (typeof window !== "undefined") {
    window.TEAM_COLORS = TEAM_COLORS;
    window.teamAccent = teamAccent;
    window.teamInk = teamInk;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = API;

  // node self-check: the invariants the page is allowed to assume
  // (run `node team_colors.js`).
  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    var a = function (c, m) { if (!c) throw new Error("team_colors self-check FAILED: " + m); };
    var FEED = ["ATL", "BOS", "BKN", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW",
      "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK",
      "OKC", "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"];
    var keys = Object.keys(TEAM_COLORS);
    a(keys.length === 30, "expected 30 teams, got " + keys.length);
    FEED.forEach(function (k) { a(TEAM_COLORS[k], "missing feed key " + k); });
    keys.forEach(function (k) { a(FEED.indexOf(k) >= 0, "key not in feed: " + k); });
    // source spot-checks (guard against a well-meaning edit drifting off-source)
    a(TEAM_COLORS.CHI.primary === "#CE1141" && TEAM_COLORS.CHI.secondary === "#000000", "CHI off-source");
    a(TEAM_COLORS.SAS.primary === "#C4CED4", "SAS off-source");

    // ---- palette correspondence -----------------------------------------
    // SURFACE / SITE_ACCENT / SIGN are COPIES of site.css tokens, and a copy
    // nothing checks is a copy that drifts. Re-read the real stylesheet and
    // prove each one still matches, so a palette edit that would invalidate
    // every derived colour fails HERE instead of on the page.
    var css = require("fs").readFileSync(require("path").join(__dirname, "site.css"), "utf8");
    function tokens(re, label) {
      var block = css.match(re);
      a(block, "site.css: cannot find the " + label + " :root block — the palette moved");
      var out = {};
      block[1].replace(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})/g,
        function (m, name, hex) { out[name] = hex.toLowerCase(); return m; });
      return out;
    }
    var CSS = { dark: tokens(/:root\s*\{([\s\S]*?)\}/, "dark"),
                light: tokens(/:root\[data-theme=light\]\s*\{([\s\S]*?)\}/, "light") };
    function sameToken(th, name, got, why) {
      a(CSS[th][name], "site.css " + th + " defines no " + name);
      a(CSS[th][name] === String(got).toLowerCase(),
        "site.css " + th + " " + name + " is " + CSS[th][name] + " but " + why + " is " + got);
    }
    ["dark", "light"].forEach(function (th) {
      sameToken(th, "--accent", SITE_ACCENT[th], "SITE_ACCENT." + th);
      sameToken(th, "--pos", SIGN[th].pos, "SIGN." + th + ".pos");
      sameToken(th, "--neg", SIGN[th].neg, "SIGN." + th + ".neg");
    });
    sameToken("dark", "--grid", SURFACE.dark, "SURFACE.dark");     // lightest dark surface
    sameToken("light", "--panel-3", SURFACE.light, "SURFACE.light"); // darkest light surface

    // contrast floors, all 30, both themes, on every surface of that theme —
    // the surface list is READ FROM site.css too, so a new/edited surface token
    // is checked automatically instead of being remembered here.
    var SURFS = { dark: [], light: [] };
    ["dark", "light"].forEach(function (th) {
      ["--bg", "--panel", "--panel-2", "--panel-3", "--grid"].forEach(function (name) {
        a(CSS[th][name], "site.css " + th + " defines no " + name);
        SURFS[th].push(CSS[th][name]);
      });
      // and the surface we DERIVE against must still be the worst of them —
      // nearest the mark in luminance. Naming the token (above) catches a
      // recoloured --panel-3; this catches a palette that grows a NEW surface
      // darker than it, which the token check could not see.
      var lums = SURFS[th].map(relLum), mine = relLum(SURFACE[th]);
      a(mine === (th === "dark" ? Math.max.apply(null, lums) : Math.min.apply(null, lums)),
        "SURFACE." + th + " " + SURFACE[th] + " is no longer the worst-case " + th +
        " surface; derive against the " + (th === "dark" ? "lightest" : "darkest") + " of " +
        SURFS[th].join(" "));
    });
    var worstA = 99, worstI = 99, worstAt = "", worstG = 99, worstGAt = "";
    ["dark", "light"].forEach(function (th) {
      keys.forEach(function (k) {
        var ac = teamAccent(k, th), ink = teamInk(k, th);
        a(/^#[0-9a-f]{6}$/.test(ac) && /^#[0-9a-f]{6}$/.test(ink), k + " " + th + " not a hex");
        SURFS[th].forEach(function (s) {
          var ca = contrast(ac, s), ci = contrast(ink, s);
          a(ca >= 3, "accent " + k + "/" + th + " on " + s + " = " + ca.toFixed(2) + " < 3");
          a(ci >= 4.5, "ink " + k + "/" + th + " on " + s + " = " + ci.toFixed(2) + " < 4.5");
          if (ca < worstA) { worstA = ca; worstAt = k + "/" + th; }
          if (ci < worstI) worstI = ci;
        });
        // sign separation: no derived colour may be mistakable for --pos/--neg,
        // or red stops meaning "negative" on that team's page
        [["accent", ac], ["ink", ink]].forEach(function (pair) {
          var g = signGap(pair[1], th);
          a(g >= SIGN_DE, pair[0] + " " + k + "/" + th + " " + pair[1] + " is dE " +
            g.toFixed(3) + " from a sign colour (floor " + SIGN_DE + ")");
          if (g < worstG) { worstG = g; worstGAt = k + "/" + th + "/" + pair[0]; }
        });
      });
    });

    // the greyscale fallback chain: Nets (black -> white -> site accent) and
    // Spurs (silver -> black -> site accent) must both land on the site accent,
    // and no other team may be pushed off its primary.
    a(baseFor("BKN", "dark").src === "site", "BKN should fall through to the site accent");
    a(baseFor("SAS", "light").src === "site", "SAS should fall through to the site accent");
    keys.forEach(function (k) {
      if (k === "BKN" || k === "SAS") return;
      a(baseFor(k, "dark").src === "primary", k + " unexpectedly left its primary");
    });
    a(Math.abs(toOklch(teamAccent("BKN", "dark")).h - toOklch(SITE_ACCENT.dark).h) < 2,
      "BKN accent should carry the site accent's hue");

    // Hue preservation, every colour: the contrast walk and the sign separation
    // are both allowed to move LIGHTNESS only, so the hue a viewer reads as "the
    // team" has to survive both. Checked against baseFor (not .primary) so the
    // two greyscale teams are held to the site accent's hue rather than to a
    // hue their black/silver brand colour does not have.
    ["dark", "light"].forEach(function (th) {
      keys.forEach(function (k) {
        var want = toOklch(baseFor(k, th).hex).h;
        ["accent", "ink"].forEach(function (role) {
          var got = toOklch(role === "accent" ? teamAccent(k, th) : teamInk(k, th)).h;
          var d = Math.abs(((got - want + 540) % 360) - 180);
          a(d < 2.5, k + "/" + th + "/" + role + " hue drifted " + d.toFixed(1) + " deg");
        });
      });
    });

    console.log("team_colors.js self-check OK — 30/30 teams, accent min " +
      worstA.toFixed(2) + ":1 (" + worstAt + ", floor 3), ink min " +
      worstI.toFixed(2) + ":1 (floor 4.5), sign-colour dE min " + worstG.toFixed(3) +
      " (" + worstGAt + ", floor " + SIGN_DE + "), both themes, " +
      SURFS.dark.length + "/" + SURFS.light.length + " surfaces read from site.css");
  }
})();

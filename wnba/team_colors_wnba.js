"use strict";
/* team_colors.js — the team-accent system for the 2027 team page (and anything
 * else that wants to wear a franchise's colours). Plain classic script, same
 * shape as charts.js/nav.js: an IIFE that hangs its API on `window` and also
 * CommonJS-exports so `node team_colors.js` can assert its own invariants.
 *
 * SOURCE. The twelve franchises teamcolorcodes.com/wnba-color-codes/ carries are
 * transcribed from its per-team pages; the three it has no entry for (GSV, PDX, TOR)
 * are MEASURED off ESPN's own team mark. Which hex becomes the primary is decided by
 * pixel dominance in that mark, not by the source's swatch order. The per-line comments
 * in TEAM_COLORS carry the label, the order and the measurement for every team; the
 * generator is research/wnba/fork_site_html.py and this file is GENERATED -- edit that.
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
 *
 *   teamAccent(abbr, theme)     hex safe for marks    (3:1)
 *   teamInk(abbr, theme)        hex safe for TEXT     (4.5:1)
 *   teamInkIsBrand(abbr, theme) false when that ink is the site accent instead
 *                               of the franchise's colour — see SIGN_DE
 *   teamAccentIsBrand(abbr, theme)  the same question for the mark
 */
(function () {

  /* ---- the table -------------------------------------------------------- *
   * Keyed by the 3-letter abbr the projection feed uses (BKN not BRK, PHX not
   * PHO, LAC named "LA Clippers"): read off projection_2026_27_teams.json, not
   * guessed. Names match the feed so a caller can label from either source. */
  var TEAM_COLORS = {
    // tcc "Red" + "Blue", its order 1,2. Mark: red 12.2% is its only real hue (43% is the
    // greyscale ball, 2.5% blue). Shares #C8102E with IND -- see the collision note.
    ATL: { name: "Atlanta Dream",             primary: "#C8102E", secondary: "#418FDE" },
    // tcc "Blue" + "Yellow", order REVERSED: the mark is 38.3% #418FDE against 30.8% yellow,
    // and the franchise is called the Sky. tcc lists Yellow (#FFCD00) first.
    CHI: { name: "Chicago Sky",               primary: "#418FDE", secondary: "#FFCD00" },
    // tcc "Orange" + "Blue". tcc lists "Red #a6192e" FIRST and that colour is ABSENT from the
    // mark (0 of 91,215 opaque px); the mark is 33.6% #F85828-family orange over 16.8% navy,
    // so the orange is the hue. Was #F05023/#0A2240 -- neither is on the source page.
    CON: { name: "Connecticut Sun",           primary: "#DC4405", secondary: "#041E42" },
    // tcc "Navy" + "Green", order 1,2. Mark: navy 55.3%; cyan 12.8% vs green 12.6% is a tie in
    // the raster, broken by tcc's order (Green is listed before Cyan).
    DAL: { name: "Dallas Wings",              primary: "#0C2340", secondary: "#C4D600" },
    // UNSOURCED-BY-TCC. Measured: the ESPN mark is 62.2% #000000 and 19.3% a single flat
    // #B896D4 violet (987 distinct colours, the rest anti-aliasing). Black cannot be the
    // primary -- baseFor() would skip it -- so the violet is. Was #5A2D81, the KINGS' purple.
    GSV: { name: "Golden State Valkyries",    primary: "#B896D4", secondary: "#000000" },
    // tcc "Red" + "Blue", order 1,2. Mark: navy 37.1% vs red 33.7%, a 3.4-point gap, so
    // dominance is a near-tie and the source order takes it. Was #E03A3E (the NBA Hawks' red).
    IND: { name: "Indiana Fever",             primary: "#C8102E", secondary: "#041E42" },
    // tcc "Purple" + "Yellow", order REVERSED: mark is 50.2% purple vs 34.2% yellow. Was
    // #552583/#FDB927 -- the LAKERS' hexes, not the Sparks'.
    LAS: { name: "Los Angeles Sparks",        primary: "#702F8A", secondary: "#FFC72C" },
    // tcc "Red" + "Black", order 1,2. The mark is 100% GREYSCALE (black 57.6%, white 20.9%,
    // silver 12.2%, zero chromatic pixels), so dominance cannot choose and red is the only hue
    // the franchise has. Was #A7A8AA primary, i.e. a silver that baseFor() would have thrown
    // away for the black secondary and then for the site accent.
    LVA: { name: "Las Vegas Aces",            primary: "#BA0C2F", secondary: "#000000" },
    // tcc "Navy" + "Blue", order 1,2 and dominance 1,2 (36.3% / 21.2%; the green is 0.7%).
    // Shares #0C2340 with DAL and WAS. Was #266092/#79BC43, neither on the source page.
    MIN: { name: "Minnesota Lynx",            primary: "#0C2340", secondary: "#236192" },
    // tcc "Green" + "Black", order 1,2. Mark: black 50.5% (greyscale) over 32.9% seafoam, so
    // the seafoam is the hue. Was #86CEBC, a lighter seafoam than the source's #6ECEB2.
    NYL: { name: "New York Liberty",          primary: "#6ECEB2", secondary: "#000000" },
    // UNSOURCED-BY-TCC. Measured: the ESPN mark is ONE flat colour, #ED2891, over 100% of its
    // 52,927 fully-opaque pixels (1 distinct value). No second colour exists in it, so the
    // secondary is black by convention and is never reached (the primary is chromatic).
    // Was #E03A3E, the Hawks' red again.
    PDX: { name: "Portland Fire",             primary: "#ED2891", secondary: "#000000" },
    // tcc "Purple" + "Orange", order 1,2. Mark: orange 25.0% vs purple 24.7% -- a dead heat
    // (0.3 points), so the source order decides and the franchise keeps the purple it is known
    // for. Both keys carry identical values BY CONSTRUCTION; the self-check asserts it.
    PHO: { name: "Phoenix Mercury",           primary: "#201747", secondary: "#CB6015" },
    PHX: { name: "Phoenix Mercury",           primary: "#201747", secondary: "#CB6015" },
    // tcc "Green" + "Yellow", order REVERSED: the mark is 73.5% green, the most one-sided in
    // the league, against 14.0% yellow. Yellow corrected #FEE11A -> the source's #FBE122.
    SEA: { name: "Seattle Storm",             primary: "#2C5234", secondary: "#FBE122" },
    // UNSOURCED-BY-TCC. Measured: ONE flat #441D36 plum over 100% of 48,459 fully-opaque px.
    // Same single-colour wordmark situation as PDX. Was #B4292F, invented.
    TOR: { name: "Toronto Tempo",             primary: "#441D36", secondary: "#000000" },
    // tcc "Blue" + "Red", order 1,2 and dominance 1,2 (44.2% / 28.8%). Was #002B5C/#E03A3E --
    // the WIZARDS' hexes. Shares #0C2340 with DAL and MIN.
    WAS: { name: "Washington Mystics",        primary: "#0C2340", secondary: "#C8102E" }
  };;

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
  var SITE_ACCENT = { dark: "#56b6ff", light: "#1b68c0" };  // --accent, the last resort
  // --pos/--neg are RESERVED: on this site they mean the sign of a number, and
  // nothing else may look like them. A derived colour that lands on --neg makes
  // red stop meaning "negative" on that franchise's page — measured on light
  // ATL, where every player-name link was the same red as the negative net
  // values beside it. So every derived colour is held away from both.
  var SIGN = { dark:  { pos: "#3ddc97", neg: "#ff6b6b" },
               light: { pos: "#0d784f", neg: "#c72b2c" } };
  // --text is the OTHER thing an ink can be mistaken for, and it is the axis the
  // ink floor below actually spends: the only legible direction away from dark
  // --neg is lighter, and lighter on this page is where body text lives. It is
  // not RESERVED the way --pos/--neg are — a link that reads as body text is a
  // lost affordance, not a lie about a number's sign — so it is checked, not
  // derived against. See TEXT_DE.
  var TEXT = { dark: "#e7eef7", light: "#0e1828" };
  // ~0.02 OKLab dE is one just-noticeable difference on a flat patch, which is
  // what an unseparated team red measures against --neg (light ATL's ink starts
  // 0.025 away, i.e. the same colour to the eye). The floor is PER ROLE, because
  // the two roles sit at different distances from a number.
  //
  // ACCENT 0.10 (~5 JND) is a mark NEXT TO the numbers, and it stays where it
  // is. It could not take the ink floor: at 0.18 eighteen of the sixty accents
  // would need more lightness displacement than the whole PUSH.accent budget —
  // nine on dark (ATL/POR 0.258, the other seven 0.300) and nine on light
  // (MIL 0.132 up to ATL/POR 0.234) — so they would lose their hue to the
  // fallback instead. A mark is not read as the sign of a number; it does not
  // have to buy that much room.
  //
  // INK 0.18 (~9 JND) is TEXT, one cell from a sign-coloured number, same size,
  // read down a 16-row column. 0.10 was measured as not enough there: Chicago's
  // ink came out #ff9ba0 against --neg #ff6b6b, clearing the old floor and
  // still reading as one red family all the way down the table.
  // 0.18 is the largest floor all 30 teams hold on both themes while keeping
  // 4.5:1 text contrast AND their own hue — searched over the shipping
  // derivation, not picked. What binds it is not a red team: it is BOSTON on
  // dark, whose green tops out 0.1805 from --pos (#399d54, 4.84:1 on --grid)
  // within the lightness PUSH.ink allows it, with Milwaukee next at 0.1876.
  // Push the floor to 0.20 and those two stop wearing their own colour (see
  // FALLBACK in the self-check); 0.21 puts ten of the sixty inks there and 0.22
  // puts fifteen.
  // 0.18 IS A CEILING TO SIT AT, NOT A TARGET TO BEAT, and Boston is only the
  // first of two reasons. The second is that every step of this floor costs the
  // dark reds their chroma and their separation FROM EACH OTHER: max pairwise dE
  // across the nine-team red/wine family measures 0.039 at floor 0.10, 0.028 at
  // 0.16, 0.023 at 0.18 and 0.020 at 0.20, i.e. it walks INTO the ~0.02 JND
  // above rather than out of it (see derive()'s disclaimer). Raising the floor
  // does not make ink safer, it moves which colour the ink is unsafe against.
  var SIGN_DE = { accent: 0.10, ink: 0.18 };

  // Distance from --text, the side of that trade. A RATCHET, not a target: it
  // pins what shipped so a future edit cannot quietly spend more of this axis.
  // It sits BELOW SIGN_DE and always will — partly because --text carries no
  // reserved meaning and a link is distinguished from body text by weight and
  // position as well as colour, and partly because it has to: at any sign floor
  // of 0.18 or more the dark reds are inside 0.13 of --text, so the two numbers
  // could not be equal even if that were wanted. Today's minima are ink 0.1212
  // (DET/dark #ffbebb) and accent 0.2334
  // (BKN,SAS/dark, which is the site accent itself) — so the ink pin has ~0.001
  // of slack and the accent pin ~0.03, both measured by the self-check below.
  // WORTH SAYING OUT LOUD, because it is what the 0.10 -> 0.18 ink change bought
  // and nobody costed it: those nine dark inks are now NEARER plain body text
  // (0.121) than they are to the sign colour they were moved off (0.181-0.183).
  // At the old 0.10 floor the closest any of the sixty came to --text was 0.186.
  // That is defensible — --text and a team link differ in weight, position and
  // underline, while a red number and a red name differ in nothing — but it is a
  // real cost, and it is why raising the ink floor again is not free: at 0.20 the
  // minimum ink-to---text distance is 0.100 and this assertion goes red.
  var TEXT_DE = { accent: 0.20, ink: 0.12 };

  // Usable lightness band per theme+role, in OKLab L. A brand colour already
  // inside its band is left ALONE by the clamp — only the out-of-band ones (the
  // navies, the blacks, the wine) get dragged to an edge. Text sits in a
  // lighter/darker band than marks because it has to clear a stiffer floor.
  //
  // THE BAND PLACES A COLOUR. It does NOT bound the sign-separation search any
  // more — that is PUSH, below. One interval doing both jobs is exactly what
  // broke when the light sign tokens moved; see PUSH for the measurements.
  var BAND = {
    dark:  { accent: [0.56, 0.82], ink: [0.62, 0.88] },
    light: { accent: [0.46, 0.60], ink: [0.38, 0.52] }
  };
  var L_STEP = 0.006;   // lightness quantum for both walks below

  // How far the sign-separation walk may drag a colour OFF the lightness the
  // band placed it at, in OKLab L, per role. This used to BE the band, and that
  // is what broke: placement and displacement are unrelated jobs and the same
  // interval cannot be right for both.
  //
  // WHAT HAPPENED. site.css darkened its light sign tokens to clear 4.5:1 on the
  // row-hover plate --panel-3 #e3ebf5 (--pos #11a06a -> #0d784f, L 0.624 ->
  // 0.507; --neg #d4393a -> #c72b2c, L 0.580 -> 0.543). That was a real
  // site-wide text-contrast bug and the fix is not up for revision — but it also
  // moved both sign colours into the MIDDLE of the light accent band
  // [0.46, 0.60]. With the search bounded by that band, TEN of the thirty light
  // accents could no longer get 0.10 away — ATL/POR 0.0803, DET/LAC 0.0804,
  // CHI/HOU/TOR 0.0888, MIA 0.0908, MIL 0.0942, BOS 0.0989 (the self-check named
  // only ATL because it asserts in alphabetical order) — and ELEVEN light inks
  // silently took the fallback, so thirteen of thirty franchises would have worn
  // the site accent in a roster column. Against the OLD tokens the same code
  // derived cleanly, both roles, with only the two greyscale brands falling back.
  //
  // WHY NOT WIDEN THE BAND (re-derivable by editing BAND above and re-running):
  //   [0.42, 0.60]  leaves BOS 0.0989 and MIL 0.0947 still colliding.
  //   [0.38, 0.62]  clears all ten — and drags INDIANA's accent, which never
  //                 collided with anything (sign gap 0.171), from #2b5894 down
  //                 to #13417b, 0.1863 from --text against TEXT_DE's 0.20.
  // That is the trap, and it is structural: widening the band moves the colours
  // that DO NOT NEED TO MOVE. What collides with a sign colour is reds (hue
  // 7-25) and greens (hue 149). What cannot afford lightness is the navies,
  // whose hue is 1-12 deg off --text's 259.5 and whose whole separation from
  // body text IS lightness — in the a/b plane they are 0.027 (MIN, DEN), 0.064
  // (UTA), 0.070 (IND), 0.082 (DAL) from it. The reds and greens sit 110-125 deg
  // away, 0.114-0.230 from --text in a/b before lightness is counted. The two
  // sets are disjoint, so a budget only the colliding colours ever spend costs
  // the navies exactly nothing — and on this repo's palette it costs the dark
  // theme nothing at all: all 60 dark colours come out bit-identical.
  //
  // The budget is a CAP ON BRAND DISTANCE, which is the only part of the band's
  // old double duty worth keeping here. Hue is preserved exactly, so lightness
  // displacement is the whole of how far a derived colour can get from the
  // franchise's. Each is a round number set just above the worst push that
  // ships: accent 0.096 (BOS, CHI, HOU and TOR on light) under 0.12, ink 0.222
  // (CLE on dark) under 0.24, leaving 0.024 and 0.018 of slack — four and three
  // of the 0.006 steps the walk moves in. That is enough that hex quantisation
  // cannot drop a franchise onto the fallback list, and deliberately not enough
  // to absorb a real palette move, which SHOULD surface as a named franchise
  // rather than as a colour quietly wandering off brand. Both worst pushes are
  // printed by the self-check, so the two numbers are re-derivable in one
  // command. A colour that cannot separate inside its budget DOES NOT GET A
  // BIGGER BUDGET — it takes the fallback and is named.
  var PUSH = { accent: 0.12, ink: 0.24 };
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
  // Distance to body text on that theme. Same measure, different thing to be
  // mistaken for — see TEXT_DE.
  function textGap(hex, theme) { return dE(hex, TEXT[theme]); }

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

  // The contrast + sign-separation walk, on whatever base colour it is handed.
  // Split out of derive() so the fallback below can re-run it on the site accent
  // without a second copy of the maths drifting from this one.
  // role is "accent" (3:1, marks) or "ink" (4.5:1, text).
  // Returns {hex, push} — push being the lightness the separation step spent, so
  // the self-check can report how much of PUSH[role] is actually in use.
  function walk(baseHex, theme, role) {
    var base = toOklch(baseHex);
    var C = Math.max(base.C, C_MIN);
    var surface = SURFACE[theme], floor = FLOOR[role], band = BAND[theme][role];
    var L = Math.min(Math.max(base.L, band[0]), band[1]);
    // Walk lightness away from the surface until the QUANTIZED hex clears the
    // floor — measuring the rounded value means the published colour is the one
    // that passed, not an idealised float that rounds down below the line.
    var step = theme === "dark" ? L_STEP : -L_STEP, out = lchToHex(L, C, base.h);
    for (var i = 0; i < 170 && contrast(out, surface) < floor; i++) {
      L += step;
      if (L <= 0.02 || L >= 0.995) break;
      out = lchToHex(L, C, base.h);
    }
    // Then move it off --pos/--neg if it landed on one. LIGHTNESS ONLY: hue is
    // the part that reads as "the team", and it is also what keeps a red team
    // red, so this never rotates (measured drift over all 120 colours: 0.84 deg
    // worst, 0.14 mean, all of it sRGB quantisation — it is worst where the
    // chroma is lowest, on the pale dark-theme reds). CHROMA is not varied
    // either, and that is a decision, not an oversight: dropping chroma at a
    // fixed lightness is the other way to leave a sign colour, and it was
    // measured. It cannot reach the ink floor AT ALL for sixteen of the thirty
    // light inks — no chroma, all the way down to grey, is 0.18 from --pos/--neg
    // when those sixteen sit 0.001-0.127 of lightness from it (thirteen of them
    // inside 0.023), because dropping chroma slides a colour along the sign
    // colour's own hue line rather than away from it — and where it does reach
    // the accent floor it
    // pays in the one thing a hue rides on: Boston's light accent comes out
    // #616762, OKLCh chroma 0.011, and Milwaukee's #515b52 at 0.019 — both BELOW
    // GREY_C, i.e. colours this file elsewhere refuses to call a hue. A green
    // team would be wearing slate.
    //
    // Step OUTWARD from where the contrast walk left off and take the NEAREST L
    // that clears the gap, so a colour spends the least brand-distance it can.
    // Both directions are tried: sign colours sit INSIDE the bands, so marching
    // to one edge can move a colour TOWARDS one (measured: at the top of the
    // dark accent band Boston green is 0.042 from --pos, worse than where it
    // started). The range is the PUSH budget, not the band — see PUSH. Every
    // candidate is re-checked against the contrast floor, so separation may not
    // buy itself illegibility; the budget is checked because separation may not
    // buy itself the franchise's identity either.
    // WHAT IT COSTS, so nobody "fixes" it later: 36 of the 120 colours move —
    // 9 dark inks and 10 light accents, all reds, wine or greens, plus 17 light
    // inks. That last group is bigger than the eye expects because at the ink
    // floor the mid-BLUES land inside it too: DAL, MEM, NYK, OKC, ORL and PHI
    // start 0.165-0.180 from light --pos, an 89-deg hue difference carried on
    // only ~0.11 of chroma. They deepen a step or two and are done.
    // On light the deep brands deepen and the bright ones brighten, whichever is
    // nearer (Hawks #E03A3E -> #ef494a accent, #7a0010 ink; Pistons #C8102E ->
    // #9e001f accent — both still plainly their own red, and 0.203 apart, twice
    // as far from each other as either is from --neg). On
    // dark the only legible direction away from --neg is LIGHTER, and sRGB sheds
    // chroma up there, so the ink lands pale: at the ink floor Chicago is
    // #ffbdbf, OKLCh chroma 0.076 against the brand #CE1141's 0.2115 — 36% of it
    // left. That is the honest price of a NAME that cannot be read as a negative
    // number; the accent keeps its bite (CHI dark #d31c45, chroma 0.2108,
    // essentially all of it) because it is held to a floor a mark can afford.
    // Two further prices are booked elsewhere: the nine dark reds become one ink
    // (derive()'s disclaimer) and they move nearer --text than --neg (TEXT_DE).
    var push = 0;
    if (signGap(out, theme) < SIGN_DE[role]) {
      var steps = Math.round(PUSH[role] / L_STEP);
      var best = out, bestGap = signGap(out, theme), bestPush = 0, found = "", foundPush = 0;
      for (var k = 1; k <= steps && !found; k++) {
        for (var s = 0; s < 2 && !found; s++) {
          var Lt = L + (s ? -step : step) * k;           // contrast-GAINING side first
          if (Lt <= 0.02 || Lt >= 0.995) continue;
          var hex = lchToHex(Lt, C, base.h);
          if (contrast(hex, surface) < floor) continue;
          var g = signGap(hex, theme);
          if (g >= SIGN_DE[role]) { found = hex; foundPush = k * L_STEP; }
          else if (g > bestGap) { bestGap = g; best = hex; bestPush = k * L_STEP; }
        }
      }
      // If the budget cannot separate this colour, hand back the most-separated
      // LEGIBLE candidate. It is NOT the answer for either role: derive() checks
      // the gap again and falls back to the site accent.
      out = found || best;
      push = found ? foundPush : bestPush;
    }
    return { hex: out, push: push };
  }

  var cache = {};
  // Returns {hex, brand, push} — brand false meaning "this is not the
  // franchise's own hue", which the page can read through teamInkIsBrand() /
  // teamAccentIsBrand().
  // NOT a categorical palette, and since the 0.18 ink floor that is true in a
  // second, stronger way than "shared brand hexes":
  //
  //   (a) teams whose brand hex is the same navy (UTA, WAS, MIN, NOP...) come
  //       out the same colour, because they ARE the same colour;
  //   (b) NINE franchises with nine DIFFERENT brand hexes — DET LAC MIA CLE CHI
  //       HOU TOR ATL POR — now share one dark ink. Five distinct hexes
  //       (#ffbebb #ffbdc0 #ffbcc8 #ffbdbf #ffbeb9), max pairwise dE 0.0227
  //       across the whole family and 32 of the 36 pairs under the ~0.02 JND
  //       this file treats as "the same colour". Cleveland's #860038 and
  //       Atlanta's #E03A3E are the widest pair in it and they are 0.0227 apart.
  //       teamInk CANNOT tell those two franchises apart on dark. Hue survives
  //       (7.0 deg to 23.8 deg, tracking the brands' 7.1-24.6), but chroma
  //       collapses from 0.16-0.21 to 0.075-0.079, and at that chroma the hue
  //       has nothing to ride on.
  //   (c) the same nine share a LIGHT ink too, now that they have one at all:
  //       #790016 #790023 #7b0033 #7b0022 #7a0010, max pairwise 0.0467 and 20 of
  //       the 36 pairs under 0.02. That is twice the spread of the dark family
  //       and it keeps 0.146-0.150 of chroma, so the wines and the fire-engines
  //       are at least different wines — but it is still one deep red per
  //       screen, not nine. It is an improvement on what it replaced, which was
  //       eleven franchises rendering in the identical site-accent blue.
  //
  // That is a consequence of the sign floor, not a bug to tune out, and it is
  // NOT the thing that caps SIGN_DE.ink at 0.18 — Boston's green is (see there).
  // It is the independent second reason 0.18 is a ceiling: the collapse gets
  // monotonically worse as the floor rises, so the fix for "these teams look
  // alike" is never a bigger floor.
  // Accents are unaffected and remain usable: on dark the same nine are 0.0816
  // apart at their widest, with #d32337 / #c53c51 / #bd4264 / #d31c45 / #e03a3e
  // still reading as five different reds. On LIGHT they are the most separated
  // this family gets anywhere in the file — 0.2028 at their widest, against
  // 0.0816 dark accent, 0.0467 light ink, 0.0227 dark ink — because the
  // separation walk sends the deep brands down and the bright ones up, so
  // Detroit's #9e001f and Chicago's #f1405c end up on opposite sides of --neg.
  // That spread is a by-product of "spend the least brand-distance you can", not
  // a goal; do not tune for it.
  // So: one team's ink is on screen at a time, by design. If a chart ever needs
  // to tell two teams apart, encode the difference some other way — a second
  // channel, or teamAccent, never teamInk; do not tune this.
  function derive(abbr, theme, role) {
    var key = abbr + "|" + theme + "|" + role;
    if (cache[key]) return cache[key];
    var base = baseFor(abbr, theme);
    var out = walk(base.hex, theme, role);
    var brand = base.src !== "site";
    // THE FALLBACK, NOW ON BOTH ROLES. A team whose hue cannot be held clear of
    // --pos/--neg inside its push budget has no honest colour in that role, and
    // shipping the near-miss anyway is how a roster column ends up all one red.
    // So it falls through to the site accent, exactly the way a greyscale brand
    // already does, and SAYS SO: a page told the colour is not the team's can
    // style around it (drop the tint, use --text); a page handed a colliding hex
    // cannot.
    // The accent used to be excluded here, on the grounds that a mark is not
    // read as the sign of a number — true, and it is why SIGN_DE.accent is the
    // looser floor, but it left the accent with no answer at all when even that
    // floor could not be met. It asserted and died, which is what the darkened
    // light sign tokens then made it do. A role that can fail needs somewhere to
    // fail TO; the self-check pins exactly who ends up there, so the set can
    // never silently grow.
    if (signGap(out.hex, theme) < SIGN_DE[role]) {
      var alt = walk(SITE_ACCENT[theme], theme, role);
      if (signGap(alt.hex, theme) >= SIGN_DE[role]) { out = alt; brand = false; }
    }
    cache[key] = { hex: out.hex, brand: brand, push: out.push };
    return cache[key];
  }

  // Same derivation, for a brand hex that has no entry in TEAM_COLORS -- the ~350 college
  // schools whose colours ride in on the ESPN box export (card_data.py emits card.team_color /
  // team_color_alt straight off it). Those hexes are NOT safe to paint: measured over the 564
  // (school, colour) pairs the card actually emits, ZERO clear 4.5:1 against BOTH themes' panel
  // (dark median 1.98, and three schools ship #ffffff as their primary). Through this walk all
  // 564 clear 4.5:1 on both, worst 4.56:1, with their hue intact.
  //
  // It exists so the page never needs a SECOND spelling of the derivation. Porting the walk into
  // Python, or hand-bounding a hex on the page, would be a copy of the one piece of this file
  // that is actually hard, and it would drift the first time a floor moves.
  //
  // `alt` is the secondary brand hex, used exactly the way baseFor() uses TEAM_COLORS.secondary:
  // when the primary is greyscale it has no hue to preserve, so try the alternate before giving
  // up. 57 of the 564 pairs have a greyscale primary; the alternate rescues 29 of them, and the
  // remaining 28 fall through to the site accent with brand=false, the same answer the Nets and
  // the Spurs already get.
  function deriveHex(hex, alt, theme, role) {
    theme = resolveTheme(theme);
    role = role === "accent" ? "accent" : "ink";
    var base = null;
    if (hex && toOklch(hex).C >= GREY_C) base = hex;
    else if (alt && toOklch(alt).C >= GREY_C) base = alt;
    var brand = base !== null;
    var out = walk(brand ? base : SITE_ACCENT[theme], theme, role);
    if (signGap(out.hex, theme) < SIGN_DE[role]) {
      var acc = walk(SITE_ACCENT[theme], theme, role);
      if (signGap(acc.hex, theme) >= SIGN_DE[role]) { out = acc; brand = false; }
    }
    return { hex: out.hex, brand: brand, push: out.push };
  }

  // 'dark' unless the document says otherwise (no attribute = dark, per site.css).
  function resolveTheme(theme) {
    if (theme === "dark" || theme === "light") return theme;
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement.dataset.theme === "light" ? "light" : "dark";
    }
    return "dark";
  }

  function teamAccent(abbr, theme) { return derive(abbr, resolveTheme(theme), "accent").hex; }
  function teamInk(abbr, theme) { return derive(abbr, resolveTheme(theme), "ink").hex; }
  // false = the colour above is the SITE ACCENT, not this franchise's, because
  // its own hue has none that is both legible and unmistakable for a sign. Two
  // reasons land here: a greyscale brand (Nets, Spurs) and the fallback in
  // derive(). Either way the answer to "may I read this colour as the team?" is
  // no, which is the only thing a caller needs. Ask per ROLE — the two floors
  // differ, so a franchise can own its mark and not its text.
  function teamInkIsBrand(abbr, theme) { return derive(abbr, resolveTheme(theme), "ink").brand; }
  function teamAccentIsBrand(abbr, theme) { return derive(abbr, resolveTheme(theme), "accent").brand; }


  /* ---- ESPN team marks -------------------------------------------------- *
   * Slug map VERIFIED 2026-07-29: all sixteen tricodes fetched 200 with a real PNG body
   * (10.9-67.9 KB). Two traps, both measured rather than assumed:
   *   PDX -> 'por'. The obvious 'pdx' 404s.
   *   PHO and PHX -> 'phx'. Phoenix is recoded mid-corpus and both codes are live in the
   *   board, so both must resolve; they are the same franchise and the same mark.
   * Everything else is the lower-cased tricode except the four ESPN shortens (GSV/LAS/LVA/NYL).
   * check_wnba_identity.py re-fetches all sixteen, so a URL that rots fails a script rather
   * than showing a reader a broken-image glyph. */
  var LOGO_SLUG = { ATL: "atl", CHI: "chi", CON: "con", DAL: "dal", GSV: "gs", IND: "ind",
    LAS: "la", LVA: "lv", MIN: "min", NYL: "ny", PDX: "por", PHO: "phx", PHX: "phx",
    SEA: "sea", TOR: "tor", WAS: "was" };
  // The fifteen FRANCHISES (PHO is an alias of PHX, not a sixteenth club). Alphabetical, which
  // is not a ranking -- a page that wants standings order gets it from its own feed.
  var TRICODES = ["ATL", "CHI", "CON", "DAL", "GSV", "IND", "LAS", "LVA", "MIN", "NYL",
    "PDX", "PHX", "SEA", "TOR", "WAS"];
  var ALIASES = { PHO: "PHX" };

  function canonTri(tri) {
    var k = String(tri || "").toUpperCase();
    return ALIASES[k] || k;
  }
  function logoURL(tri) {
    var k = String(tri || "").toUpperCase();
    return "https://a.espncdn.com/i/teamlogos/wnba/500/" + (LOGO_SLUG[k] || k.toLowerCase()) + ".png";
  }
  // ONE spelling of the <img>, because the failure mode is the thing worth sharing: these are
  // third-party rasters and a 404 must degrade to NOTHING, not to a broken-image glyph. Same
  // pattern as the men's team page: onerror hides the element and then clears itself so a
  // second failure cannot loop. `plate` asks for the near-white .wt-plate treatment -- most WNBA
  // marks are dark-on-transparent (GSV 62% black, LVA 58%, NYL 51%) and would be a smudge on
  // the dark theme without it.
  //
  // EAGER BY DEFAULT, opt into lazy. The men's .pc-badge is loading="lazy" because it rides a
  // long scrolling result list; a WNBA team hero and a 15-item switcher rail are both ABOVE THE
  // FOLD, where lazy buys nothing and can cost everything -- measured: in an embedded webview
  // that never reports the element as near-viewport, all 33 lazy marks on the component
  // reference stayed at complete=false, naturalWidth=0 forever, and because the load never
  // FAILED, onerror never fired either, so the plates rendered as blank white discs with no
  // error anywhere. Removing the attribute loaded them at 500px immediately. Pass {lazy:true}
  // for a genuinely long list.
  function logoIMG(tri, size, opts) {
    opts = opts || {};
    var cls = ["wt-logo"];
    if (opts.plate !== false) cls.push("wt-plate");
    if (opts.cls) cls.push(opts.cls);
    var t = TEAM_COLORS[canonTri(tri)];
    var alt = opts.alt === undefined ? (t ? t.name : String(tri || "")) : opts.alt;
    return '<img class="' + cls.join(" ") + '" src="' + logoURL(tri) + '" alt="' +
      String(alt).replace(/[&<>"]/g, "") + '" width="' + size + '" height="' + size +
      '" decoding="async"' + (opts.lazy ? ' loading="lazy"' : "") +
      ' onerror="this.onerror=null;this.style.visibility=\'hidden\'">';
  }
  function teamName(tri) {
    var t = TEAM_COLORS[canonTri(tri)];
    return t ? t.name : String(tri || "");
  }
  // The SECOND channel. Two brand-hex collisions (ATL/IND red, DAL/MIN/WAS navy) mean the
  // accent alone cannot tell five of the fifteen franchises apart; the pair can, and the
  // self-check proves all fifteen pairs are distinct on both themes. Derived through deriveHex
  // so the secondary clears the same 3:1 mark floor the accent does -- and so the five clubs
  // whose secondary is #000000 fall back to their own primary rather than to a black nobody can
  // see, which is why teamAlt() == teamAccent() for GSV/LVA/NYL/PDX/TOR.
  function teamAlt(tri, theme) {
    var k = canonTri(tri), t = TEAM_COLORS[k];
    if (!t) return teamAccent(k, theme);
    return deriveHex(t.secondary, t.primary, theme, "accent").hex;
  }

  /* ---- page theming ----------------------------------------------------- *
   * Ported from team2027.html's applyTeamColor(): the --team-* custom properties, every alpha
   * SOLVED against the surface it is actually painted on rather than picked. See site.css's
   * .wt-* block for what reads each one. */
  function toRGB(c) {
    var m = String(c || "").trim().match(/^#([0-9a-f]{6})$/i);
    if (m) return [0, 2, 4].map(function (i) { return parseInt(m[1].slice(i, i + 2), 16); });
    m = String(c || "").match(/rgba?\(([^)]+)\)/i);
    if (m) { var p = m[1].split(","); return [+p[0] || 0, +p[1] || 0, +p[2] || 0]; }
    return null;
  }
  function relLumRGB(p) { return 0.2126 * toLin(p[0]) + 0.7152 * toLin(p[1]) + 0.0722 * toLin(p[2]); }
  function contrastRGB(a, b) {
    var x = relLumRGB(a), y = relLumRGB(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function over(fg, alpha, bg) {
    return [0, 1, 2].map(function (i) { return Math.round(fg[i] * alpha + bg[i] * (1 - alpha)); });
  }
  function hexOfRGB(p) {
    return "#" + p.map(function (v) { return hex2(v); }).join("");
  }
  // Smallest alpha whose COMPOSITED pixel clears `floor` on its backing. Walked over k/255, not
  // bisected: the compositor quantises alpha to 8 bits, so a bisected 0.794 ships as 202/255 and
  // lands under the floor it was solved for.
  function solveAlpha(fg, bg, floor) {
    for (var k = 1; k <= 255; k++) {
      if (contrastRGB(over(fg, k / 255, bg), bg) >= floor) return k / 255;
    }
    return 1;
  }
  // PURE white/black for text sitting ON the accent fill. An accent at the luminance crossover
  // measures 4.24:1 against the site's near-white and near-black both; #fff/#000 reach 4.58.
  function onFill(rgb) {
    return contrastRGB([255, 255, 255], rgb) >= contrastRGB([0, 0, 0], rgb) ? "#ffffff" : "#000000";
  }
  // Largest alpha (<= cap) whose composite stays inside the luminance range the inks above were
  // certified against -- never lighter than --grid on dark, never darker than --panel-3 on
  // light -- so a tinted panel is provably no worse a ground for text than --panel-3 already is.
  function boundedWash(fg, bg, limitRGB, light, cap) {
    var L = relLumRGB(limitRGB), best = 0;
    for (var k = 1; k <= Math.round(cap * 255); k++) {
      var l = relLumRGB(over(fg, k / 255, bg));
      if (light ? l >= L : l <= L) best = k / 255; else break;
    }
    return best;
  }
  function cssRGB(root, name, fallback) {
    return toRGB((getComputedStyle(root).getPropertyValue(name) || "").trim()) || fallback;
  }
  // Call on load AND on every theme flip -- every value below is solved against the current
  // theme's surfaces, so a stale set is a contrast guarantee that no longer holds. Returns the
  // two brand hexes plus whether they ARE the franchise's, so a page can drop the tint for a
  // team wearing the site accent instead of implying a colour it does not have.
  function applyTeamTheme(tri, rootEl) {
    var root = rootEl || (typeof document !== "undefined" ? document.documentElement : null);
    if (!root) return null;
    var k = canonTri(tri);
    var theme = resolveTheme();
    var site = (getComputedStyle(root).getPropertyValue("--accent") || SITE_ACCENT[theme]).trim();
    var accent = site, ink = site, alt = site, brand = false;
    try {
      accent = teamAccent(k, theme) || site;
      ink = teamInk(k, theme) || site;
      alt = teamAlt(k, theme) || accent;
      brand = teamAccentIsBrand(k, theme);
    } catch (e) { accent = site; ink = site; alt = site; brand = false; }
    var rgb = toRGB(accent) || toRGB(site) || [86, 182, 255];
    var A = function (a) { return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")"; };
    var light = theme === "light";
    root.style.setProperty("--team", accent);
    root.style.setProperty("--team-ink", ink);
    root.style.setProperty("--team-2", alt);
    root.style.setProperty("--team-on", onFill(rgb));
    var rail = cssRGB(root, "--panel-2", light ? [238, 243, 249] : [12, 18, 27]);
    var panel = cssRGB(root, "--panel", light ? [255, 255, 255] : [14, 20, 29]);
    root.style.setProperty("--team-wash", A(solveAlpha(rgb, rail, 3)));
    root.style.setProperty("--neg-on", onFill(cssRGB(root, "--neg", light ? [199, 43, 44] : [255, 107, 107])));
    var limit = cssRGB(root, light ? "--panel-3" : "--grid", light ? [227, 235, 245] : [22, 31, 44]);
    var tint = over(rgb, boundedWash(rgb, panel, limit, light, 0.05), panel);
    root.style.setProperty("--team-hover", hexOfRGB(over(rgb, boundedWash(rgb, panel, limit, light, 0.14), panel)));
    root.style.setProperty("--team-tint", hexOfRGB(tint));
    root.style.setProperty("--team-line", A(solveAlpha(rgb, tint, 3)));
    root.style.setProperty("--team-soft", A(0.34));
    return { tri: k, accent: accent, ink: ink, alt: alt, brand: brand, theme: theme };
  }

  var API = { TEAM_COLORS: TEAM_COLORS, teamAccent: teamAccent, teamInk: teamInk,
    teamInkIsBrand: teamInkIsBrand, teamAccentIsBrand: teamAccentIsBrand,
    deriveHex: deriveHex, toOklch: toOklch, contrast: contrast, baseFor: baseFor,
    teamAlt: teamAlt, wnbaLogoURL: logoURL, wnbaLogoIMG: logoIMG, wnbaTeamName: teamName,
    wnbaCanonTri: canonTri, WNBA_TRICODES: TRICODES, WNBA_LOGO_SLUG: LOGO_SLUG,
    applyTeamTheme: applyTeamTheme, teamOnFill: onFill };
  if (typeof window !== "undefined") {
    window.TEAM_COLORS = TEAM_COLORS;
    window.teamAccent = teamAccent;
    window.teamInk = teamInk;
    window.teamAlt = teamAlt;
    window.teamInkIsBrand = teamInkIsBrand;
    window.teamAccentIsBrand = teamAccentIsBrand;
    window.deriveHex = deriveHex;
    window.wnbaLogoURL = logoURL;
    window.wnbaLogoIMG = logoIMG;
    window.wnbaTeamName = teamName;
    window.wnbaCanonTri = canonTri;
    window.WNBA_TRICODES = TRICODES;
    window.applyTeamTheme = applyTeamTheme;
    window.teamOnFill = onFill;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = API;

  // node self-check: the invariants the WNBA pages are allowed to assume
  // (run `node team_colors_wnba.js` from site_wnba/, or check_wnba_identity.py which also
  // re-fetches the sixteen logo URLs -- the one thing node cannot check offline).
  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    var a = function (c, m) { if (!c) throw new Error("team_colors_wnba self-check FAILED: " + m); };
    // Every tricode the BOARD carries, which is sixteen keys for fifteen franchises: Phoenix is
    // PHO in 2022-24 and PHX in 2025-26 and both are live, so both must resolve.
    var FEED = ["ATL", "CHI", "CON", "DAL", "GSV", "IND", "LAS", "LVA", "MIN", "NYL",
      "PDX", "PHO", "PHX", "SEA", "TOR", "WAS"];
    var keys = Object.keys(TEAM_COLORS);
    a(keys.length === 16, "expected 16 keys (15 franchises + the PHO alias), got " + keys.length);
    FEED.forEach(function (k) { a(TEAM_COLORS[k], "missing feed key " + k); });
    keys.forEach(function (k) { a(FEED.indexOf(k) >= 0, "key not in feed: " + k); });
    a(TRICODES.length === 15 && TRICODES.indexOf("PHO") < 0,
      "TRICODES should be the 15 FRANCHISES with PHO folded into PHX");
    // Phoenix, both ways round: same franchise, same mark, so the same colours -- and canonTri
    // has to agree, because that is what a page groups by.
    a(TEAM_COLORS.PHO.primary === TEAM_COLORS.PHX.primary &&
      TEAM_COLORS.PHO.secondary === TEAM_COLORS.PHX.secondary &&
      TEAM_COLORS.PHO.name === TEAM_COLORS.PHX.name, "PHO and PHX must carry identical colours");
    a(canonTri("PHO") === "PHX" && canonTri("pho") === "PHX" && canonTri("SEA") === "SEA",
      "canonTri must fold PHO into PHX and pass everything else through");
    ["accent", "ink"].forEach(function (role) {
      ["dark", "light"].forEach(function (th) {
        a(derive("PHO", th, role).hex === derive("PHX", th, role).hex,
          "PHO/PHX derived " + role + " differ on " + th);
      });
    });
    // source spot-checks: one per decision the map documents, so a well-meaning edit that drifts
    // back off teamcolorcodes.com (or re-invents an expansion club's colour) fails here.
    a(TEAM_COLORS.ATL.primary === "#C8102E", "ATL off-source (tcc Red, PMS 186)");
    a(TEAM_COLORS.SEA.secondary === "#FBE122", "SEA off-source (tcc Yellow, PMS 107)");
    a(TEAM_COLORS.CON.primary === "#DC4405", "CON off-source (tcc Orange; its Red is absent from the mark)");
    a(TEAM_COLORS.LVA.primary === "#BA0C2F", "LVA off-source (tcc Red; the mark is 100% greyscale)");
    a(TEAM_COLORS.PDX.primary === "#ED2891", "PDX is measured off the ESPN mark, not invented");
    a(TEAM_COLORS.TOR.primary === "#441D36", "TOR is measured off the ESPN mark, not invented");
    a(TEAM_COLORS.GSV.primary === "#B896D4", "GSV is measured off the ESPN mark, not invented");

    // ---- logo slugs ------------------------------------------------------
    // The map is checked for SHAPE here; check_wnba_identity.py fetches all sixteen.
    FEED.forEach(function (k) { a(LOGO_SLUG[k], "no logo slug for " + k); });
    a(Object.keys(LOGO_SLUG).length === 16, "LOGO_SLUG should have one entry per feed key");
    a(LOGO_SLUG.PDX === "por", "PDX's slug is 'por' -- 'pdx' 404s");
    a(LOGO_SLUG.PHO === "phx" && LOGO_SLUG.PHX === "phx", "both Phoenix codes map to 'phx'");
    a(logoURL("pdx") === "https://a.espncdn.com/i/teamlogos/wnba/500/por.png",
      "logoURL must upper-case and map: got " + logoURL("pdx"));
    a(/^<img class="wt-logo wt-plate" src="https:\/\/a\.espncdn/.test(logoIMG("SEA", 34)),
      "logoIMG should plate by default: " + logoIMG("SEA", 34));
    a(logoIMG("SEA", 34).indexOf("onerror=") > 0, "logoIMG must carry the onerror hide");
    a(logoIMG("SEA", 34, { plate: false }).indexOf("wt-plate") < 0, "plate:false should drop the plate");
    a(logoIMG("SEA", 34).indexOf("loading=") < 0 &&
      logoIMG("SEA", 34, { lazy: true }).indexOf('loading="lazy"') > 0,
      "logoIMG must be EAGER by default (a lazy mark that never enters the viewport never loads " +
      "AND never fires onerror -- it renders as a blank plate with no error) and lazy on request");
    a(teamName("PHO") === "Phoenix Mercury" && teamName("ZZZ") === "ZZZ",
      "teamName should resolve through the alias and pass an unknown tricode through");

    // ---- palette correspondence -----------------------------------------
    // SURFACE / SITE_ACCENT / SIGN / TEXT are COPIES of site.css tokens. This file sits NEXT TO
    // the FORKED site.css, so the fork's own palette is what gets read -- a WNBA-only token edit
    // that invalidated every derived colour would fail here.
    var css = require("fs").readFileSync(require("path").join(__dirname, "site.css"), "utf8");
    function tokens(re, label) {
      var block = css.match(re);
      a(block, "site.css: cannot find the " + label + " :root block -- the palette moved");
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
      sameToken(th, "--text", TEXT[th], "TEXT." + th);
    });
    sameToken("dark", "--grid", SURFACE.dark, "SURFACE.dark");
    sameToken("light", "--panel-3", SURFACE.light, "SURFACE.light");

    // ---- contrast, sign separation, hue, on every surface of both themes --
    var SURFS = { dark: [], light: [] };
    ["dark", "light"].forEach(function (th) {
      ["--bg", "--panel", "--panel-2", "--panel-3", "--grid"].forEach(function (name) {
        a(CSS[th][name], "site.css " + th + " defines no " + name);
        SURFS[th].push(CSS[th][name]);
      });
      var lums = SURFS[th].map(relLum), mine = relLum(SURFACE[th]);
      a(mine === (th === "dark" ? Math.max.apply(null, lums) : Math.min.apply(null, lums)),
        "SURFACE." + th + " " + SURFACE[th] + " is no longer the worst-case " + th + " surface");
    });
    var worst = { accent: { r: 99, at: "" }, ink: { r: 99, at: "" } };
    var worstG = { accent: 99, ink: 99 }, worstGAt = {};
    var worstT = { accent: 99, ink: 99 }, worstTAt = {};
    var worstP = { accent: 0, ink: 0 }, worstPAt = { accent: "nobody", ink: "nobody" };
    var worstAlt = { r: 99, at: "" };
    ["dark", "light"].forEach(function (th) {
      keys.forEach(function (k) {
        var got = { accent: teamAccent(k, th), ink: teamInk(k, th) };
        ["accent", "ink"].forEach(function (role) {
          var hex = got[role];
          a(/^#[0-9a-f]{6}$/.test(hex), k + " " + th + " " + role + " is not a hex: " + hex);
          SURFS[th].forEach(function (s) {
            var c = contrast(hex, s);
            a(c >= FLOOR[role], role + " " + k + "/" + th + " on " + s + " = " + c.toFixed(2) +
              " < " + FLOOR[role]);
            if (c < worst[role].r) { worst[role].r = c; worst[role].at = k + "/" + th + " on " + s; }
          });
          var g = signGap(hex, th);
          a(g >= SIGN_DE[role], role + " " + k + "/" + th + " " + hex + " is dE " + g.toFixed(3) +
            " from a sign colour (floor " + SIGN_DE[role] + ")");
          if (g < worstG[role]) { worstG[role] = g; worstGAt[role] = k + "/" + th; }
          var t = textGap(hex, th);
          if (t < worstT[role]) { worstT[role] = t; worstTAt[role] = k + "/" + th; }
          var p = derive(k, th, role).push;
          if (p > worstP[role]) { worstP[role] = p; worstPAt[role] = k + "/" + th; }
          // hue preservation: both walks move LIGHTNESS only, so the hue a reader takes for
          // "the team" must survive them, measured against the base this colour was handed.
          var d0 = derive(k, th, role);
          var want = toOklch(d0.brand ? baseFor(k, th).hex : SITE_ACCENT[th]).h;
          var dh = Math.abs(((toOklch(d0.hex).h - want + 540) % 360) - 180);
          a(dh < 2.5, k + "/" + th + "/" + role + " hue drifted " + dh.toFixed(1) + " deg");
        });
        // the SECOND channel has to be a legible mark too, on every surface -- it is what tells
        // ATL from IND and DAL from MIN from WAS.
        var alt = teamAlt(k, th);
        a(/^#[0-9a-f]{6}$/.test(alt), k + " " + th + " alt is not a hex: " + alt);
        SURFS[th].forEach(function (s) {
          var c = contrast(alt, s);
          a(c >= FLOOR.accent, "alt " + k + "/" + th + " on " + s + " = " + c.toFixed(2) + " < 3");
          if (c < worstAlt.r) { worstAlt.r = c; worstAlt.at = k + "/" + th + " on " + s; }
        });
      });
    });

    // ---- the collisions, pinned ------------------------------------------
    // ATL/IND ship the same PMS 186 red and DAL/MIN/WAS the same PMS 289 navy, so five of the
    // fifteen franchises DO derive to a colour another franchise wears. That is pinned as an
    // exact set rather than hidden: a page that puts two of them side by side must carry the
    // logo and the second channel. What must hold is that the PAIR is unique -- if that ever
    // breaks, two franchises are genuinely indistinguishable and the page has no way out.
    var COLLIDE = "ATL=IND,DAL=MIN,DAL=WAS,MIN=WAS";
    ["dark", "light"].forEach(function (th) {
      var byAccent = {}, byPair = {}, same = [];
      TRICODES.forEach(function (k) {
        var acc = teamAccent(k, th), pair = acc + "|" + teamAlt(k, th);
        a(!byPair[pair], "two franchises share the (accent, alt) PAIR on " + th + ": " +
          byPair[pair] + " and " + k + " -- the identity layer has no second channel left");
        byPair[pair] = k;
        (byAccent[acc] = byAccent[acc] || []).push(k);
      });
      Object.keys(byAccent).forEach(function (h) {
        var g = byAccent[h];
        for (var i = 0; i < g.length; i++)
          for (var j = i + 1; j < g.length; j++) same.push(g[i] + "=" + g[j]);
      });
      a(same.sort().join(",") === COLLIDE, "accent collisions on " + th + " are [" +
        same.sort().join(",") + "], expected [" + COLLIDE + "]");
    });

    // ---- who does not wear their own colour ------------------------------
    // Pinned as an exact set, both roles, both themes. EMPTY is the shipping value: every one of
    // the fifteen franchises has a hue that clears both floors and stays clear of --pos/--neg.
    // That is a WNBA-palette fact, not a general one -- the men's file has two greyscale brands
    // on this list -- and it only holds because LVA's primary is its red rather than its silver
    // (its mark carries no chromatic pixel at all).
    var FALLBACK = { accent: { dark: "", light: "" }, ink: { dark: "", light: "" } };
    var fellBack = {};
    ["dark", "light"].forEach(function (th) {
      fellBack[th] = {};
      ["accent", "ink"].forEach(function (role) {
        fellBack[th][role] = keys.filter(function (k) { return !derive(k, th, role).brand; }).sort();
        a(fellBack[th][role].join(",") === FALLBACK[role][th],
          "teams not wearing their own " + role + " on " + th + " are [" +
          fellBack[th][role].join(",") + "], expected [" + FALLBACK[role][th] + "]");
      });
      keys.forEach(function (k) {
        a(baseFor(k, th).src === "primary", k + " unexpectedly left its primary on " + th);
      });
    });

    // The --text ratchet, LAST for the same reason it is last upstream: it names a consequence,
    // and running it earlier front-runs the checks that name a cause.
    ["accent", "ink"].forEach(function (role) {
      a(worstT[role] >= TEXT_DE[role], role + " " + worstTAt[role] + " is dE " +
        worstT[role].toFixed(4) + " from --text (floor " + TEXT_DE[role] + ")");
    });

    console.log("team_colors_wnba.js self-check OK -- 16 keys / 15 franchises, both themes, " +
      SURFS.dark.length + "/" + SURFS.light.length + " surfaces read from site.css\n" +
      "  contrast   accent min " + worst.accent.r.toFixed(2) + ":1 (" + worst.accent.at +
      ", floor 3)\n" +
      "             ink    min " + worst.ink.r.toFixed(2) + ":1 (" + worst.ink.at +
      ", floor 4.5)\n" +
      "             alt    min " + worstAlt.r.toFixed(2) + ":1 (" + worstAlt.at + ", floor 3)\n" +
      "  sign dE    accent min " + worstG.accent.toFixed(4) + " (" + worstGAt.accent +
      ", floor " + SIGN_DE.accent + ")   ink min " + worstG.ink.toFixed(4) +
      " (" + worstGAt.ink + ", floor " + SIGN_DE.ink + ")\n" +
      "  text dE    accent min " + worstT.accent.toFixed(4) + " (" + worstTAt.accent +
      ", floor " + TEXT_DE.accent + ")   ink min " + worstT.ink.toFixed(4) +
      " (" + worstTAt.ink + ", floor " + TEXT_DE.ink + ")\n" +
      "  push L     accent max " + worstP.accent.toFixed(3) + " (" + worstPAt.accent +
      ", budget " + PUSH.accent + ")   ink max " + worstP.ink.toFixed(3) +
      " (" + worstPAt.ink + ", budget " + PUSH.ink + ")\n" +
      "  brand-hex collisions (accent shared): " + COLLIDE + "  -- pair still unique 15/15\n" +
      "  every franchise wears its own hue in both roles on both themes");
  }
})();

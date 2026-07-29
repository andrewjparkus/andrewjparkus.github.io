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

  var API = { TEAM_COLORS: TEAM_COLORS, teamAccent: teamAccent, teamInk: teamInk,
    teamInkIsBrand: teamInkIsBrand, teamAccentIsBrand: teamAccentIsBrand,
    deriveHex: deriveHex, toOklch: toOklch, contrast: contrast, baseFor: baseFor };
  if (typeof window !== "undefined") {
    window.TEAM_COLORS = TEAM_COLORS;
    window.teamAccent = teamAccent;
    window.teamInk = teamInk;
    window.teamInkIsBrand = teamInkIsBrand;
    window.teamAccentIsBrand = teamAccentIsBrand;
    window.deriveHex = deriveHex;
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
      sameToken(th, "--text", TEXT[th], "TEXT." + th);
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
    // The ink floor is pinned by VALUE, not only by the per-colour assertions
    // below, because those would still pass at the old 0.10 — that is exactly
    // how a roster column of player names shipped in the same red family as the
    // negative numbers beside them. Text one cell from a sign colour needs more
    // separation than a mark does, and this is the line.
    a(SIGN_DE.ink >= 0.18, "the ink floor is " + SIGN_DE.ink + "; it may not go below 0.18, " +
      "the largest separation all 30 teams hold with 4.5:1 text contrast and their own hue");
    a(SIGN_DE.ink > SIGN_DE.accent, "ink is text and must be held further off --pos/--neg " +
      "than a mark: got ink " + SIGN_DE.ink + " vs accent " + SIGN_DE.accent);
    // The push budget is pinned by VALUE for the same reason, and it is the more
    // tempting number of the two to "just nudge": every collision this file has
    // ever had could be made to go away by letting the separation walk drag a
    // colour further, and the thing that stops it is not legibility: a light
    // red at Atlanta's hue is 15.4:1 on --panel-3 and 0.355 clear of --neg at
    // L 0.20, where the hex is #320003 and the "team colour" is a black smudge.
    // What stops it is whether the result is still the franchise's. Raising this
    // is how a team page ends up in a maroon nobody in Atlanta would recognise.
    // If a colour cannot separate inside the
    // budget, it takes the fallback and gets NAMED — that is the intended
    // outcome, not a bigger budget.
    a(PUSH.accent <= 0.12 && PUSH.ink <= 0.24,
      "the push budget is accent " + PUSH.accent + " / ink " + PUSH.ink + "; it may not grow " +
      "past accent 0.12 / ink 0.24 — that is the cap on how far off its brand lightness a " +
      "franchise's colour can be dragged, and a collision is not a reason to raise it");
    a(PUSH.ink > PUSH.accent, "ink has to buy " + SIGN_DE.ink + " of separation against the " +
      "accent's " + SIGN_DE.accent + ", so it must be allowed to travel further: got ink " +
      PUSH.ink + " vs accent " + PUSH.accent);

    var worstA = 99, worstI = 99, worstAt = "", worstG = { accent: 99, ink: 99 }, worstGAt = {};
    var worstT = { accent: 99, ink: 99 }, worstTAt = {};
    var worstP = { accent: 0, ink: 0 }, worstPAt = { accent: "nobody", ink: "nobody" };
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
        // or red stops meaning "negative" on that team's page. Per role — the
        // ink is held further out because it is text sharing a row with a
        // sign-coloured number, and it has the fallback to get there.
        [["accent", ac], ["ink", ink]].forEach(function (pair) {
          var role = pair[0], g = signGap(pair[1], th);
          a(g >= SIGN_DE[role], role + " " + k + "/" + th + " " + pair[1] + " is dE " +
            g.toFixed(3) + " from a sign colour (floor " + SIGN_DE[role] + ")");
          if (g < worstG[role]) { worstG[role] = g; worstGAt[role] = k + "/" + th; }
          // --text distance is MEASURED here and asserted after the fallback
          // block below, on purpose: "which teams lost their own colour" is the
          // more informative failure, and asserting it first keeps a raised
          // sign floor reporting the franchise it cost rather than the body-text
          // collision that came with it.
          var t = textGap(pair[1], th);
          if (t < worstT[role]) { worstT[role] = t; worstTAt[role] = k + "/" + th; }
          // and how much of PUSH[role] this colour spent getting there
          var p = derive(k, th, role).push;
          if (p > worstP[role]) { worstP[role] = p; worstPAt[role] = k + "/" + th; }
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
    // team" has to survive both. Checked against the base each colour was
    // actually given — baseFor's pick (which is already the site accent for the
    // two greyscale teams), or the site accent for one that fell back.
    //
    // BEFORE the fallback list below, and that ordering is load-bearing. This
    // check names a CAUSE ("the walk rotated") and the list names a CONSEQUENCE
    // ("this franchise lost its colour"), and a rotation produces both: measured,
    // a 3-degree rotation of the separation walk's candidates costs ATL and POR
    // their light accent, so with the list first the report was "a franchise
    // changed hands" for a defect that is nothing to do with the palette. The
    // reverse cannot happen — a team that falls back is compared against the site
    // accent it was actually handed, so falling back never registers as drift.
    ["dark", "light"].forEach(function (th) {
      keys.forEach(function (k) {
        ["accent", "ink"].forEach(function (role) {
          var d0 = derive(k, th, role);
          var want = toOklch(d0.brand ? baseFor(k, th).hex : SITE_ACCENT[th]).h;
          var got = toOklch(d0.hex).h;
          var d = Math.abs(((got - want + 540) % 360) - 180);
          a(d < 2.5, k + "/" + th + "/" + role + " hue drifted " + d.toFixed(1) + " deg");
        });
      });
    });

    // WHICH TEAMS DO NOT WEAR THEIR OWN COLOUR, per role, pinned as an exact set
    // so a franchise losing its colour is loud rather than invisible. Both roles
    // are listed because both can now fall back; before the light sign tokens
    // moved, the accent had no fallback and simply asserted.
    // Today only the two greyscale brands are on either list — every one of the
    // other 28 franchises wears its own hue in both roles on both themes — and
    // the margins are genuinely thin in places: Boston's dark green clears the
    // ink floor by 0.0005 and Atlanta's light accent clears the mark floor by
    // 0.0001, so a nudge to --pos/--neg would put those on this list rather than
    // on the page in a colour a reader could take for the sign of a number.
    var FALLBACK = { accent: { dark: "BKN,SAS", light: "BKN,SAS" },
                     ink:    { dark: "BKN,SAS", light: "BKN,SAS" } };
    var fellBack = {};
    ["dark", "light"].forEach(function (th) {
      fellBack[th] = {};
      ["accent", "ink"].forEach(function (role) {
        fellBack[th][role] = keys.filter(function (k) { return !derive(k, th, role).brand; }).sort();
        // The colour a fallback team is handed needs no separate assertion: the
        // contrast and sign loops above ran over every colour including these,
        // and the hue check above holds a fallen-back one to the site accent's hue.
        a(fellBack[th][role].join(",") === FALLBACK[role][th],
          "teams not wearing their own " + role + " on " + th + " are [" +
          fellBack[th][role].join(",") + "], expected [" + FALLBACK[role][th] +
          "] — a franchise changed hands with the site accent");
      });
    });

    // THE OTHER SIDE OF THE SIGN FLOOR. Every assertion above measures a derived
    // colour against --pos/--neg, the surfaces, or its own hue; none of them
    // measures it against --text, which is the axis the 0.10 -> 0.18 ink change
    // actually spent (see TEXT_DE). Unguarded, that axis is free to be spent
    // again: the ink is walked lighter to escape dark --neg, and lighter on this
    // theme is where body text is, so the next raise trades one collision for
    // another and every check above still passes.
    //
    // A RATCHET pinned to what shipped, not a designed floor. Its job is to make
    // the trade visible and to fail the next raise loudly. It is also the guard
    // on PUSH: the separation walk is no longer fenced in by the placement band,
    // so "spend more lightness" is a thing it can now do, and THIS is what says
    // how much is too much. Deliberately NOT enforced inside walk() — a
    // constraint the search satisfies by construction is an assertion that
    // cannot fail, and this file may not have one of those.
    //
    // DELIBERATELY LAST, and it must stay last. Every check above names a cause
    // (this surface, this sign colour, this franchise, this hue); this one names
    // a CONSEQUENCE, and its margin is thin by construction — ink clears it by
    // 0.0012. Run it earlier and it front-runs the diagnostic failures: measured,
    // a 3-degree hue rotation of the sign-separation walk drags Cleveland's dark
    // ink to 0.1200 and this assertion fires instead of "hue drifted", reporting
    // the symptom of a mutation whose actual defect is named twenty lines up.
    ["accent", "ink"].forEach(function (role) {
      a(worstT[role] >= TEXT_DE[role], role + " " + worstTAt[role] + " is dE " +
        worstT[role].toFixed(4) + " from --text (floor " + TEXT_DE[role] + "). Team " +
        "colour is drifting into body text — check what was just raised: the only " +
        "legible way off dark --neg is lighter, and that is where --text lives.");
    });
    // NO ordering assertion between TEXT_DE.ink and SIGN_DE.ink, deliberately.
    // The obvious one — "text must be held further off a sign colour than off
    // body text" — cannot fail: SIGN_DE.ink is pinned at >= 0.18 above, and at
    // any sign floor that high the worst ink is <= 0.1212 from --text, so the
    // per-role assertion just above goes red long before the ordering could.
    // An assertion that cannot fail reports success either way, which is the one
    // thing this self-check may not do. The relationship is stated in TEXT_DE.

    console.log("team_colors.js self-check OK — 30/30 teams, both themes, " +
      SURFS.dark.length + "/" + SURFS.light.length + " surfaces read from site.css\n" +
      "  contrast   accent min " + worstA.toFixed(2) + ":1 (" + worstAt + ", floor 3)" +
      "   ink min " + worstI.toFixed(2) + ":1 (floor 4.5)\n" +
      "  sign dE    accent min " + worstG.accent.toFixed(4) + " (" + worstGAt.accent +
      ", floor " + SIGN_DE.accent + ")   ink min " + worstG.ink.toFixed(4) +
      " (" + worstGAt.ink + ", floor " + SIGN_DE.ink + ")\n" +
      "  text dE    accent min " + worstT.accent.toFixed(4) + " (" + worstTAt.accent +
      ", floor " + TEXT_DE.accent + ")   ink min " + worstT.ink.toFixed(4) +
      " (" + worstTAt.ink + ", floor " + TEXT_DE.ink + ")\n" +
      "  push L     accent max " + worstP.accent.toFixed(3) + " (" + worstPAt.accent +
      ", budget " + PUSH.accent + ")   ink max " + worstP.ink.toFixed(3) +
      " (" + worstPAt.ink + ", budget " + PUSH.ink + ")\n" +
      "  accent is not the team's own hue for: dark [" + fellBack.dark.accent.join(" ") +
      "]  light [" + fellBack.light.accent.join(" ") + "]\n" +
      "  ink is not the team's own hue for: dark [" + fellBack.dark.ink.join(" ") +
      "]  light [" + fellBack.light.ink.join(" ") + "]");
  }
})();

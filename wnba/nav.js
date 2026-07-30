/* Canonical top-nav for every Daily RAPM page (Plan 15).
 *
 * ONE source of truth: each page carries only
 *     <nav id="topnav" data-active="KEY"></nav>
 *     <script src="charts.js"></script>   (theme init)
 *     <script src="nav.js"></script>
 * and this file renders the identical tab set everywhere. Edit the nav HERE,
 * never per-page, so the bar can never drift again. Styling lives in site.css
 * (.topnav/.tab/...), which every page links — nav.js no longer injects CSS.
 *
 * Top bar (flattened 2026-07-26; Draft retired 2026-07-27 — four tabs, no dropdown):
 *     Explorer · Tables · Rest of 2026 · Model      (WNBA fork)
 *
 * The standalone Draft page is GONE, not hidden: its board was superseded by the "2026 Draft
 * Class" table on table.html, so there is no page left to keep reachable (owner 2026-07-27).
 *
 * Pages that still EXIST and must stay reachable, but are deliberately not tabs. Every one of
 * them is entered by an in-page link, so dropping the tab does not orphan it:
 *   teams.html            measured 2025-26 team ratings; entered from projection.html
 *                         ("See 2025-26 team ratings") and from team.html
 *   metrics.html          folded into model.html#accuracy (2026-07-26); redirect stub
 *   vegas.html            folded into model.html#vegas    (2026-07-26); redirect stub
 *   margin_history.html   redirect stub into the same folded accuracy section
 *   grades.html           entered from trade.html, which the owner pulled 2026-07-09 (neither is
 *                         published by build_pages.py; both set data-active="trade", now inert)
 * A page whose data-active key matches no tab simply lights nothing — that is the intended
 * state for all of the above, not a bug.
 */
/* ── the rating-mode default migration, for EVERY page ───────────────────────────────────────
 * `rapm_mode` + `rapm_mode_pinned` are shared by the Explorer and the Tables page, so the
 * one-time flip that moves a returning visitor onto a new default has to be shared too. It lived
 * inside index.html until 2026-07-28, which meant a visitor who landed on Tables FIRST kept their
 * old pinned mode until they happened to open the Explorer, and the two pages disagreed about
 * which mode was selected until then. nav.js is the only script every page already loads, and it
 * runs before every page's own inline script (both tags are above it), so this is the one place
 * that can be the single spelling. Duplicating it per page is exactly the drift this file exists
 * to prevent.
 *
 * WHY EACH BUMP CLEARS THE PIN: any click on either page's mode toggle sets `rapm_mode_pinned`,
 * so a returning visitor is almost always pinned and would never see a new default at all. The
 * clear is what makes the change visible, and it costs them one re-pick, once.
 *
 * v4 (owner 2026-07-28 morning): default latent everywhere.
 * v5 (owner 2026-07-28 evening): REVERTED to prior-informed. Latent stays a first-class mode —
 *   selectable on the Explorer and on the Tables' NBA populations, and Compare still draws it by
 *   owner request — it just no longer opens by default. Bump the KEY, never edit v4 in place:
 *   every visitor already carries rapm_dflt_v4=1, so re-using it is a silent no-op and the revert
 *   would appear not to have shipped.
 */
(function () {
  "use strict";
  try {
    // SEPARATE STORAGE NAMESPACE from the men's site -- see namespace_storage() in
    // fork_site_html.py. The two sites' mode vocabularies differ, so a shared key would
    // hand a WNBA visitor a mode this page does not have.
    if (!localStorage.getItem("wrapm_dflt_v1")) {
      localStorage.setItem("wrapm_mode", "pure");
      localStorage.removeItem("wrapm_mode_pinned");
      localStorage.setItem("wrapm_dflt_v1", "1");
    }
  } catch (e) { /* storage disabled (private mode / blocked cookies) -> pages fall back to their
                   own default, which is already prior. Never let this break the nav. */ }
})();

(function () {
  "use strict";

  // FOUR tabs, same shape as the men's, but the forward product is the REST of 2026 rather
  // than a next season: the WNBA season is in progress at the board's last day, so what a
  // WNBA reader wants projected is the 128 games that remain, not 2027. Hence the label.
  var TABS = [
    { key: "explorer", href: "index.html", label: "Explorer" },
    { key: "tables",   href: "table.html", label: "Tables" },
    { key: "proj",     href: "projection.html", label: "Rest of 2026" },
    { key: "model",    href: "model.html", label: "Model" }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ── the league switch ──────────────────────────────────────────────────────────────────────
   * The men's board is the site root; the women's is /wnba/ (a subdirectory of the same Pages
   * repo since the 2026-07-30 fold).
   *
   * THIS FILE IS FORKED to site_wnba/nav.js by research/wnba/fork_site_html.py, and every fork
   * substitution asserts its pattern still matches. So the switch works out which side it is on
   * from location.pathname rather than from a build-time constant: both sites then ship the
   * IDENTICAL function and there is no fork delta to keep in sync. Do not "simplify" this to a
   * hardcoded direction per site — that is precisely the drift the fork asserts exist to stop.
   *
   * Only the four shared nav pages carry across. team.html exists on both sides but is a
   * different product (the men's is the daily team page, the women's is the forward one) and is
   * addressed by tricodes that share no vocabulary, so it falls back to the Explorer like every
   * other unshared page. Query strings are always dropped: ?p= ids are league-scoped (WNBA global
   * ids carry a `w` prefix) and ?abbr= tricodes do not overlap, so carrying either across would
   * land on a "no such player/team" state every time.
   */
  var SHARED_PAGES = { "index.html": 1, "table.html": 1, "projection.html": 1, "model.html": 1 };

  function leagueHref(path) {
    var onW = path === "/wnba" || path.indexOf("/wnba/") === 0;
    var base = onW ? path.slice(5) : path;          // strip the /wnba segment to compare pages
    var page = base.split("/").pop();
    if (!SHARED_PAGES[page]) page = "";             // "" -> the destination site's own index
    return onW ? "/" + page : "/wnba/" + page;
  }

  function render() {
    var nav = document.getElementById("topnav");
    if (!nav) return;
    var active = (nav.getAttribute("data-active") || "").toLowerCase();
    nav.className = "topnav";

    var html = '<div class="navinner">';
    html += '<a class="brand" href="index.html">WNBA <b>RAPM</b></a>';
    TABS.forEach(function (t) {
      var cls = "tab" + (t.key === active ? " active" : "");
      html += '<a class="' + cls + '" href="' + esc(t.href) + '">' + esc(t.label) + "</a>";
    });
    html += '<span class="navspace"></span>';
    // Two segments rather than one "go to the other league" button: a single button cannot say
    // which board you are currently reading, and these two boards are on DIFFERENT SCALES that
    // must never be compared (there is no WNBA<->NBA translation and there cannot be one). The
    // pair states where you are as well as where you can go. Labels are words, not colour alone,
    // per STYLEGUIDE's CVD rule. hrefs are attached below as DOM PROPERTIES, never written as
    // literal href attributes here -- check_links.py resolves every such literal in this file
    // against site/, where a cross-site target is a hard failure. (Nor may this comment spell one
    // out: test_published_pages_only_reference_staged_assets scans comments too, and an example
    // in prose fails the gate exactly like real markup would.)
    var onW = location.pathname === "/wnba" || location.pathname.indexOf("/wnba/") === 0;
    html += '<span class="leaguesw" role="group" aria-label="League">';
    html += '<a class="lg' + (onW ? '' : ' on') + '" id="nav-lg-n">NBA</a>';
    html += '<a class="lg' + (onW ? ' on' : '') + '" id="nav-lg-w">WNBA</a>';
    html += '</span>';
    html += '<button class="navsearch" id="nav-search" type="button" title="Search players & teams (⌘K)" aria-label="Search">Search<b>⌘K</b></button>';
    html += '<button class="themebtn" id="nav-theme" type="button" title="Toggle light / dark" aria-label="Toggle theme"></button>';
    html += "</div>";
    nav.innerHTML = html;

    var sb = document.getElementById("nav-search");
    if (sb) sb.addEventListener("click", openPalette);

    // Only the segment you are NOT on gets an href. The current one stays a bare <a> -- not
    // focusable, not clickable, marked aria-current -- so tabbing never lands on a control that
    // does nothing and "NBA" while already on the NBA board cannot bounce you off table.html
    // back to the index. Assigned as a property, so no literal href attribute exists in this file.
    var other = document.getElementById(onW ? "nav-lg-n" : "nav-lg-w");
    var here = document.getElementById(onW ? "nav-lg-w" : "nav-lg-n");
    if (other) {
      other.href = leagueHref(location.pathname);
      other.title = (onW ? "NBA" : "WNBA") + " board — a separate scale, not comparable";
    }
    if (here) here.setAttribute("aria-current", "page");

    // theme toggle (RC.toggleTheme lives in charts.js, loaded alongside nav.js).
    var tb = document.getElementById("nav-theme");
    var label = function () {
      var light = document.documentElement.getAttribute("data-theme") === "light";
      tb.textContent = light ? "☀ Light" : "☽ Dark";
    };
    label();
    tb.addEventListener("click", function () {
      if (window.RC && window.RC.toggleTheme) window.RC.toggleTheme();
      label();
    });
  }

  /* ---- Command palette (Cmd-K / "/") — global player + team search --------
   * Lazy-loads players.json on first open, fuzzy-filters players + the 30 NBA
   * franchises, and navigates to the Explorer (index.html?p=id) or a team page
   * (team.html?abbr=ABBR). One shared widget so every page gets it for free. */
  // The FIFTEEN 2026 WNBA franchises. PHO is deliberately absent: the board carries PHO for
  // 2022-24 and PHX for 2025-26, team_colors_wnba.js folds one into the other, and a palette
  // offering both would present one club twice.
  var TEAMS = {
    ATL: "Atlanta Dream", CHI: "Chicago Sky", CON: "Connecticut Sun", DAL: "Dallas Wings",
    GSV: "Golden State Valkyries", IND: "Indiana Fever", LAS: "Los Angeles Sparks",
    LVA: "Las Vegas Aces", MIN: "Minnesota Lynx", NYL: "New York Liberty", PDX: "Portland Fire",
    PHX: "Phoenix Mercury", SEA: "Seattle Storm", TOR: "Toronto Tempo",
    WAS: "Washington Mystics"
  };
  var PLAYERS = null, LOADING = false, ACT = 0, RESULTS = [], BG = null, IN = null, LIST = null;

  // primary league of a multi-league lg string (e.g. "cgn" -> nba). NBA > G-League > college.
  function leaguePill(lg) {
    // one league, one token ('w'). The men's three-way test read 'w' as none-of-the-above and
    // pilled every WNBA player as NCAA.
    return ['b-w', 'WNBA'];
  }
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ""); }

  function buildOverlay() {
    BG = document.createElement("div"); BG.className = "pal-bg";
    BG.innerHTML =
      '<div class="pal" role="dialog" aria-label="Search players and teams">' +
      '<input type="text" placeholder="Search players & teams…" autocomplete="off" spellcheck="false" aria-label="Search query">' +
      '<div class="pal-list"></div>' +
      '<div class="pal-hint"><span><b>↑↓</b> navigate</span><span><b>↵</b> open</span><span><b>esc</b> close</span></div>' +
      '</div>';
    document.body.appendChild(BG);
    IN = BG.querySelector("input"); LIST = BG.querySelector(".pal-list");
    BG.addEventListener("click", function (e) { if (e.target === BG) closePalette(); });
    IN.addEventListener("input", function () { ACT = 0; query(IN.value); });
    IN.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); ACT = Math.min(ACT + 1, RESULTS.length - 1); paint(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); ACT = Math.max(ACT - 1, 0); paint(); }
      else if (e.key === "Enter") { e.preventDefault(); go(RESULTS[ACT]); }
      else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
    });
  }

  function openPalette() {
    if (!BG) buildOverlay();
    BG.classList.add("open"); IN.value = ""; ACT = 0;
    IN.focus();
    query("");
    if (!PLAYERS && !LOADING) {
      LOADING = true;
      fetch("players.json").then(function (r) { return r.json(); })
        .then(function (d) { PLAYERS = d; LOADING = false; if (BG.classList.contains("open")) query(IN.value); })
        .catch(function () { LOADING = false; });
    }
  }
  function closePalette() { if (BG) BG.classList.remove("open"); }

  function query(q) {
    var n = norm(q), out = [];
    // teams first when the query looks like a team
    for (var ab in TEAMS) {
      if (!n || norm(ab).indexOf(n) === 0 || norm(TEAMS[ab]).indexOf(n) >= 0)
        out.push({ kind: "team", abbr: ab, name: TEAMS[ab] });
    }
    out.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    var teamN = out.length;
    if (PLAYERS && n) {        // empty query shows teams only (no 27k-row dump)
      var pm = [];
      for (var i = 0; i < PLAYERS.length; i++) {
        var p = PLAYERS[i], nm = norm(p.n), at = nm.indexOf(n);
        if (at >= 0) pm.push({ kind: "player", p: p, starts: at === 0 });
      }
      pm.sort(function (a, b) {
        if (a.starts !== b.starts) return a.starts ? -1 : 1;
        return (b.p.net || 0) - (a.p.net || 0);
      });
      out = out.concat(pm.slice(0, 20));
    } else if (n && LOADING) {
      out = out.concat([{ kind: "loading" }]);
    }
    // when searching, keep teams that matched but let players dominate; cap total
    RESULTS = (n ? out : out.slice(0, teamN)).slice(0, 24);
    if (ACT >= RESULTS.length) ACT = Math.max(0, RESULTS.length - 1);
    paint();
  }

  function paint() {
    if (!LIST) return;
    if (!RESULTS.length) {
      LIST.innerHTML = '<div class="pal-empty">' + (LOADING ? "Loading players…" : "No matches") + '</div>';
      return;
    }
    var h = "";
    RESULTS.forEach(function (r, i) {
      var on = i === ACT ? " active" : "";
      if (r.kind === "loading") { h += '<div class="opt' + on + '"><span class="nm">Loading players…</span></div>'; return; }
      if (r.kind === "team") {
        h += '<div class="opt' + on + '" data-i="' + i + '"><span class="nm">' + esc(r.name) +
          '</span><span class="meta"><span class="badge b-w">' + esc(r.abbr) + '</span> team</span></div>';
      } else {
        var pill = leaguePill(r.p.lg);
        h += '<div class="opt' + on + '" data-i="' + i + '"><span class="nm">' + esc(r.p.n) +
          '</span><span class="meta"><span class="badge ' + pill[0] + '">' + pill[1] + '</span>' +
          (r.p.net != null ? '<span>' + (r.p.net >= 0 ? "+" : "") + r.p.net + '</span>' : '') + '</span></div>';
      }
    });
    LIST.innerHTML = h;
    LIST.querySelectorAll(".opt[data-i]").forEach(function (el) {
      el.addEventListener("click", function () { go(RESULTS[+el.getAttribute("data-i")]); });
    });
    var a = LIST.querySelector(".opt.active");
    if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest" });
  }

  function go(r) {
    if (!r) return;
    if (r.kind === "team") location.href = "team.html?abbr=" + encodeURIComponent(r.abbr);
    else if (r.kind === "player") location.href = "index.html?p=" + encodeURIComponent(r.p.id);
  }

  // global hotkeys: Cmd/Ctrl-K always; "/" only when not typing in a field.
  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if ((e.metaKey || e.ctrlKey) && (k === "k" || k === "K")) { e.preventDefault(); openPalette(); return; }
    if (k === "/" && !(BG && BG.classList.contains("open"))) {
      var t = e.target, tag = t && t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
      e.preventDefault(); openPalette();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();

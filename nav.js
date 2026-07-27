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
 *     Explorer · Tables · 2026-27 · Model
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
(function () {
  "use strict";

  var TABS = [
    { key: "explorer", href: "index.html", label: "Explorer" },
    { key: "tables",   href: "table.html", label: "Tables" },
    { key: "proj",     href: "projection.html", label: "2026-27" },
    { key: "model",    href: "model.html", label: "Model" }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render() {
    var nav = document.getElementById("topnav");
    if (!nav) return;
    var active = (nav.getAttribute("data-active") || "").toLowerCase();
    nav.className = "topnav";

    var html = '<div class="navinner">';
    html += '<a class="brand" href="index.html">Daily <b>RAPM</b></a>';
    TABS.forEach(function (t) {
      var cls = "tab" + (t.key === active ? " active" : "");
      html += '<a class="' + cls + '" href="' + esc(t.href) + '">' + esc(t.label) + "</a>";
    });
    html += '<span class="navspace"></span>';
    html += '<button class="navsearch" id="nav-search" type="button" title="Search players & teams (⌘K)" aria-label="Search">Search<b>⌘K</b></button>';
    html += '<button class="themebtn" id="nav-theme" type="button" title="Toggle light / dark" aria-label="Toggle theme"></button>';
    html += "</div>";
    nav.innerHTML = html;

    var sb = document.getElementById("nav-search");
    if (sb) sb.addEventListener("click", openPalette);

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
  var TEAMS = {
    ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets", CHA: "Charlotte Hornets",
    CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers", DAL: "Dallas Mavericks", DEN: "Denver Nuggets",
    DET: "Detroit Pistons", GSW: "Golden State Warriors", HOU: "Houston Rockets", IND: "Indiana Pacers",
    LAC: "LA Clippers", LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies", MIA: "Miami Heat",
    MIL: "Milwaukee Bucks", MIN: "Minnesota Timberwolves", NOP: "New Orleans Pelicans", NYK: "New York Knicks",
    OKC: "Oklahoma City Thunder", ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns",
    POR: "Portland Trail Blazers", SAC: "Sacramento Kings", SAS: "San Antonio Spurs", TOR: "Toronto Raptors",
    UTA: "Utah Jazz", WAS: "Washington Wizards"
  };
  var PLAYERS = null, LOADING = false, ACT = 0, RESULTS = [], BG = null, IN = null, LIST = null;

  // primary league of a multi-league lg string (e.g. "cgn" -> nba). NBA > G-League > college.
  function leaguePill(lg) {
    lg = String(lg || "");
    if (lg.indexOf("n") >= 0) return ['b-n', 'NBA'];
    if (lg.indexOf("g") >= 0) return ['b-g', 'GL'];
    return ['b-c', 'NCAA'];
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
          '</span><span class="meta"><span class="badge b-n">' + esc(r.abbr) + '</span> team</span></div>';
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

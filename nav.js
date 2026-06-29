/* Canonical top-nav for every Daily RAPM page (Plan 14 Phase 3).
 *
 * ONE source of truth: each page carries only
 *     <nav id="topnav" data-active="KEY"></nav>
 *     <script src="nav.js"></script>
 * and this file renders the identical tab set everywhere. Edit the nav HERE,
 * never per-page, so the bar can never drift again.
 *
 * data-active KEY marks the current tab (see TABS / VIZ `key` fields). The
 * secondary visualization pages (heatmap/density/journey/draft_tracker) live in
 * a "Viz" dropdown to keep the bar from overflowing.
 *
 * All colors come from the page's own CSS variables (--accent/--line/--muted/
 * --text/--bg), which every site page defines, so the bar themes itself.
 */
(function () {
  "use strict";

  // Primary tabs (always visible, in order).
  var TABS = [
    { key: "explorer", href: "index.html",   label: "Explorer" },
    { key: "teams",    href: "teams.html",    label: "Teams" },
    { key: "tables",   href: "table.html",    label: "Tables" },
    { key: "leaders",  href: "leaders.html",  label: "Leaders" },
    { key: "profile",  href: "profile.html",  label: "Profile" },
    { key: "trade",    href: "trade.html",    label: "Trade" },
    { key: "draft",    href: "draft.html",    label: "Draft" },
    { key: "pvb",      href: "pvb.html",      label: "Pure·Box" }
  ];

  // Secondary visualization pages, grouped under a "Viz" dropdown.
  var VIZ = [
    { key: "heatmap",       href: "heatmap.html",       label: "Heatmap" },
    { key: "density",       href: "density.html",       label: "Density" },
    { key: "journey",       href: "journey.html",       label: "Journey" },
    { key: "draft_tracker", href: "draft_tracker.html", label: "Draft Tracker" }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Idempotent <style>: scoped to .topnav so it can't clash with page CSS.
  function injectStyle() {
    if (document.getElementById("nav-shared-style")) return;
    var css =
      ".topnav{border-bottom:1px solid var(--line);background:#0a0e16;position:sticky;top:0;z-index:50}" +
      ".topnav .navinner{max-width:1040px;margin:0 auto;padding:0 22px;display:flex;align-items:center;gap:6px;height:52px;flex-wrap:nowrap}" +
      ".topnav .brand{font-size:16px;font-weight:700;letter-spacing:-.2px;margin-right:14px;color:var(--text);text-decoration:none;white-space:nowrap}" +
      ".topnav .brand b{color:var(--accent)}" +
      ".topnav .tab{font-size:13.5px;color:var(--muted);text-decoration:none;padding:16px 11px;border-bottom:2px solid transparent;white-space:nowrap}" +
      ".topnav .tab:hover{color:var(--text)}" +
      ".topnav .tab.active{color:var(--text);border-bottom-color:var(--accent)}" +
      ".topnav .navspace{flex:1 1 auto}" +
      ".topnav .dropdown{position:relative}" +
      ".topnav .dropbtn{cursor:pointer;background:none;border:none;font:inherit}" +
      ".topnav .dropbtn::after{content:'\\25be';font-size:10px;margin-left:5px;color:var(--muted)}" +
      ".topnav .dropmenu{display:none;position:absolute;right:0;top:100%;background:#0a0e16;border:1px solid var(--line);min-width:150px;padding:5px 0;box-shadow:0 6px 18px rgba(0,0,0,.45)}" +
      ".topnav .dropdown.open .dropmenu{display:block}" +
      ".topnav .dropmenu a{display:block;padding:8px 14px;font-size:13px;color:var(--muted);text-decoration:none;border:none}" +
      ".topnav .dropmenu a:hover{color:var(--text);background:#121b27}" +
      ".topnav .dropmenu a.active{color:var(--text)}";
    var st = document.createElement("style");
    st.id = "nav-shared-style";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function render() {
    var nav = document.getElementById("topnav");
    if (!nav) return;
    var active = (nav.getAttribute("data-active") || "").toLowerCase();
    injectStyle();
    nav.className = "topnav";

    var html = '<div class="navinner">';
    html += '<a class="brand" href="index.html">Daily <b>RAPM</b></a>';

    TABS.forEach(function (t) {
      var cls = "tab" + (t.key === active ? " active" : "");
      html += '<a class="' + cls + '" href="' + esc(t.href) + '">' + esc(t.label) + "</a>";
    });

    html += '<span class="navspace"></span>';

    // Viz dropdown. Active when the current page is one of the grouped pages.
    var vizActive = VIZ.some(function (v) { return v.key === active; });
    html += '<div class="dropdown' + (vizActive ? " open" : "") + '" id="nav-viz">';
    html += '<a class="tab dropbtn' + (vizActive ? " active" : "") + '" href="#" role="button">Viz</a>';
    html += '<div class="dropmenu">';
    VIZ.forEach(function (v) {
      var cls = "" + (v.key === active ? "active" : "");
      html += '<a class="' + cls + '" href="' + esc(v.href) + '">' + esc(v.label) + "</a>";
    });
    html += "</div></div>";

    html += "</div>";
    nav.innerHTML = html;

    // Dropdown toggle (click to open; click outside to close).
    var dd = document.getElementById("nav-viz");
    var btn = dd.querySelector(".dropbtn");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      dd.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!dd.contains(e.target)) dd.classList.remove("open");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();

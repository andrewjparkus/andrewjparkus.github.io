"use strict";
// Trade-simulator math engine — actual-season counterfactual (Plan 16, Approach A).
// Baseline = the ACTUAL 2025-26 season (meta.actual_wins). A simulated trade is the
// ONLY change: each affected team's win total shifts by the per-game win-probability
// change vs the real game outcome, with the traded player's real availability (his
// exact games) preserved. NO backend; runs entirely in the browser off one static export.
const FACTORS = ["oTS", "oTOV", "oSC", "dTS", "dTOV", "dSC"];

// standard normal CDF (Abramowitz-Stegun 7.1.26 erf).
function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x < 0 ? -y : y;
}

// cold-start fill mirrors player_rating(): unrated (net==null) -> repl_net, zero factors, fill_se.
function rate(p, meta) {
  if (p && p.net != null) return { net: p.net, f: p.f, se: p.se_net };
  return { net: meta.repl_net, f: [0, 0, 0, 0, 0, 0], se: meta.fill_se };
}

// Build pid -> {net, f[6], se}, deduped from players[] (a pid's rating is identical across
// its (franchise,pid) records). A cold-start pid (net==null) uses the replacement fill.
function buildRate(players, meta) {
  const RATE = {};
  for (const p of players) {
    if (RATE[p.pid]) continue;
    RATE[p.pid] = (p.net != null)
      ? { net: p.net, f: p.f, se: p.se_net }
      : { net: meta.repl_net, f: [0, 0, 0, 0, 0, 0], se: meta.fill_se };
  }
  return RATE;
}

// Minute-weighted on-court strength for one game's lineup.
// pids/mins are parallel arrays; RATE maps pid -> rating. Returns {net (pts/100, NBA scale), f[6]}.
function strengthLineup(pids, mins, RATE, meta) {
  const M = mins.reduce((s, m) => s + m, 0);
  const S = meta.scale;
  if (M <= 0) return { net: 0, f: [0, 0, 0, 0, 0, 0] };
  let net = 0; const fac = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < pids.length; i++) {
    const r = RATE[pids[i]] || { net: meta.repl_net, f: [0, 0, 0, 0, 0, 0], se: meta.fill_se };
    net += mins[i] * r.net;
    for (let k = 0; k < 6; k++) fac[k] += mins[i] * r.f[k];
  }
  return { net: S * net / M, f: fac.map(v => S * v / M) };
}

// apply_trade renormalization, preserving each team's total minutes (display-only now).
// rosters: {fr: [{pid,min,...}]}. moves: [[pid, fromFr, toFr], ...]. Returns NEW deep copy.
function applyTrade(rosters, moves) {
  const nw = {}; for (const fr in rosters) nw[fr] = rosters[fr].map(p => ({ ...p }));
  for (const [pid, ff, tf] of moves) {
    const donor = nw[ff], recip = nw[tf];
    const i = donor.findIndex(p => p.pid === pid);
    if (i < 0) throw new Error(`${pid} not on donor ${ff}`);
    const moved = donor[i].min;
    const donorTotal = donor.reduce((s, p) => s + p.min, 0);
    const recipTotal = recip.reduce((s, p) => s + p.min, 0);
    const movedPlayer = donor.splice(i, 1)[0];
    const rem = donor.reduce((s, p) => s + p.min, 0);
    if (rem > 0) { const sc = donorTotal / rem; donor.forEach(p => p.min *= sc); }
    movedPlayer.min = moved; recip.push(movedPlayer);
    const nu = recip.reduce((s, p) => s + p.min, 0);
    if (nu > 0) { const sc = recipTotal / nu; recip.forEach(p => p.min *= sc); }
  }
  return nw;
}

// Per-game anchored win-probability deltas for a set of moves.
//   moves: [[pid, fromFr(IGNORED — donor is wherever he actually played), toFr], ...]
//   games: the rosters_2025_26.json games[] array (per-game truth incl. actual margin).
//   RATE:  pid -> rating (buildRate). meta: {sigma, scale, repl_net, fill_se}.
// Returns { dWins:{fr->ΣΔp}, perGame:{fr->[{dMu,dF[6],m_own,dp}]} }.
// Automatically handles mid-season movers: the donor loop subtracts from EVERY team the pid
// actually played for; the recipient loop routes ALL his real game-dates to T (union
// availability), so he is removed from all real teams and 100% routed to T (never re-traded).
function computeDeltas(moves, games, RATE, meta) {
  const sigma = meta.sigma;
  const dWins = {};
  const perGame = {};
  const bump = (fr, dp, rec) => {
    dWins[fr] = (dWins[fr] || 0) + dp;
    (perGame[fr] || (perGame[fr] = [])).push(rec);
  };

  for (const mv of moves) {
    const pid = mv[0], T = mv[2];

    for (const g of games) {
      const onHome = g.hr.indexOf(pid) >= 0;
      const onAway = !onHome && g.ar.indexOf(pid) >= 0;

      // ---- DONOR side: every actual game pid played in ----
      if (onHome || onAway) {
        const side = onHome ? 'h' : 'a';
        const team = onHome ? g.h : g.a;
        const P = onHome ? g.hr : g.ar;
        const Mn = onHome ? g.hm : g.am;
        const Sa = strengthLineup(P, Mn, RATE, meta);
        const i = P.indexOf(pid);
        const movedMin = Mn[i];
        const total = Mn.reduce((s, m) => s + m, 0);
        const cfP = []; const cfMn = [];
        if (total - movedMin > 0) {
          const sc = total / (total - movedMin);
          for (let j = 0; j < P.length; j++) {
            if (j === i) continue;
            cfP.push(P[j]); cfMn.push(Mn[j] * sc);
          }
        }
        const Scf = strengthLineup(cfP, cfMn, RATE, meta);
        const dMu = Scf.net - Sa.net;                       // own-side strength change (loses a good player => negative)
        const m_own = onHome ? g.m : -g.m;                  // ACTUAL own-perspective margin
        const dp = Phi((m_own + dMu) / sigma) - Phi(m_own / sigma);
        bump(team, dp, { dMu, dF: Scf.f.map((v, k) => v - Sa.f[k]), m_own, dp });
      }
    }

    // ---- RECIPIENT side: route pid into T's games on the dates pid actually played (OQ-A). ----
    // Keyed by the dates pid actually played; drop him into T's same-date game.
    // Build date -> minutes(pid) from his real games, then drop him into T's same-date game.
    const playedDates = new Map();   // date_ord -> minutes pid logged that date
    for (const g of games) {
      const onHome = g.hr.indexOf(pid) >= 0;
      const onAway = !onHome && g.ar.indexOf(pid) >= 0;
      if (!onHome && !onAway) continue;
      const Mn = onHome ? g.hm : g.am;
      const i = (onHome ? g.hr : g.ar).indexOf(pid);
      playedDates.set(g.d, (playedDates.get(g.d) || 0) + Mn[i]);  // union across stints
    }
    for (const g of games) {
      if (g.h !== T && g.a !== T) continue;
      const mx = playedDates.get(g.d);
      if (mx == null) continue;                                   // pid did not play this date
      const tside = g.h === T ? 'h' : 'a';
      const P = tside === 'h' ? g.hr : g.ar;
      if (P.indexOf(pid) >= 0) continue;                          // already in T's lineup today (no-op)
      const Mn = tside === 'h' ? g.hm : g.am;
      const Sa = strengthLineup(P, Mn, RATE, meta);
      const baseSum = Mn.reduce((s, m) => s + m, 0);
      const newSum = baseSum + mx;
      const newP = P.concat([pid]);
      const cfMn = newSum > 0 ? Mn.concat([mx]).map(m => m * baseSum / newSum) : Mn.concat([mx]);
      const Scf = strengthLineup(newP, cfMn, RATE, meta);
      const dMu = Scf.net - Sa.net;                               // gains a good player => positive
      const m_own = tside === 'h' ? g.m : -g.m;
      const dp = Phi((m_own + dMu) / sigma) - Phi(m_own / sigma);
      bump(T, dp, { dMu, dF: Scf.f.map((v, k) => v - Sa.f[k]), m_own, dp });
    }
  }
  return { dWins, perGame };
}

// Per-team result card inputs from perGame[fr] + dWins[fr].
//   dwins   = ΣΔp; band80 via CRN binomial flip-variance over the affected games;
//   meanStr = avg per-game strength shift (pts/100); meanFac[k] = avg per-game factor delta;
//   resid   = meanStr - Σ meanFac (per-player RESID + cold-start fill not in the six factors).
function summarizeTeam(fr, dWins, perGame, sigma, z) {
  if (z == null) z = 1.2816;                                      // 80%; 1.96 for 95%
  const games = perGame[fr] || [];
  const dwins = dWins[fr] || 0;
  let varAcc = 0;
  const meanFac = [0, 0, 0, 0, 0, 0]; let meanStr = 0;
  for (const gx of games) {
    const dp_g = gx.dp;
    const a = (-gx.m_own - gx.dMu) / sigma, b = (-gx.m_own) / sigma;
    const pBetween = Phi(Math.max(a, b)) - Phi(Math.min(a, b));   // P(eps in flip interval)
    varAcc += pBetween - dp_g * dp_g;                             // per-game Bernoulli flip variance
    meanStr += gx.dMu;
    for (let k = 0; k < 6; k++) meanFac[k] += gx.dF[k];
  }
  const n = games.length || 1;
  meanStr /= n; for (let k = 0; k < 6; k++) meanFac[k] /= n;
  const resid = meanStr - meanFac.reduce((s, v) => s + v, 0);
  const sd = Math.sqrt(Math.max(varAcc, 0));
  return { dwins, sd, band80: [dwins - z * sd, dwins + z * sd], meanStr, meanFac, resid, nGames: games.length };
}

// Export for both the browser (UI in trade.html) and a Node parity check.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { FACTORS, Phi, erf, rate, buildRate, strengthLineup, applyTrade, computeDeltas, summarizeTeam };
}

// ---- node trade.js self-check (assert-based) ----
if (typeof require !== "undefined" && require.main === module) {
  const assert = require("assert");
  const meta = { sigma: 14.0, scale: 5.0, repl_net: -1.46, fill_se: 16.0 };
  // Two teams AAA/BBB, a clear rating gap: STAR(net +6) on AAA, others ~0.
  const RATE = {
    1: { net: 6.0, f: [3, 1, 0, 1, 1, 0], se: 1 },   // star on AAA
    2: { net: 0.0, f: [0, 0, 0, 0, 0, 0], se: 1 },
    3: { net: 0.0, f: [0, 0, 0, 0, 0, 0], se: 1 },
    4: { net: 0.0, f: [0, 0, 0, 0, 0, 0], se: 1 },
  };
  // 3 games: AAA home vs BBB (won by 5), BBB home vs AAA (BBB won by 3), AAA home vs BBB (won by 1).
  const games = [
    { g: 1, d: 1, h: "AAA", a: "BBB", hw: true,  m: 5,  hr: [1, 2], hm: [30, 30], ar: [3, 4], am: [30, 30] },
    { g: 2, d: 2, h: "BBB", a: "AAA", hw: true,  m: 3,  hr: [3, 4], hm: [30, 30], ar: [1, 2], am: [30, 30] },
    { g: 3, d: 3, h: "AAA", a: "BBB", hw: true,  m: 1,  hr: [1, 2], hm: [30, 30], ar: [3, 4], am: [30, 30] },
  ];

  // (a) no moves => all dWins ~0
  let r = computeDeltas([], games, RATE, meta);
  for (const fr in r.dWins) assert(Math.abs(r.dWins[fr]) < 1e-9, "no-move dWins must be 0");

  // (b) moving the high-net player from AAA to BBB => dWins[AAA]<0, dWins[BBB]>0
  r = computeDeltas([[1, "AAA", "BBB"]], games, RATE, meta);
  assert(r.dWins["AAA"] < 0, `AAA should lose wins (got ${r.dWins["AAA"]})`);
  assert(r.dWins["BBB"] > 0, `BBB should gain wins (got ${r.dWins["BBB"]})`);

  // (c) band sd >= 0
  const sA = summarizeTeam("AAA", r.dWins, r.perGame, meta.sigma);
  const sB = summarizeTeam("BBB", r.dWins, r.perGame, meta.sigma);
  assert(sA.sd >= 0 && sB.sd >= 0, "band sd must be >= 0");
  assert(Math.abs(sA.dwins - r.dWins["AAA"]) < 1e-12, "summarize dwins parity");

  // (d) Phi monotonic
  let prev = -1;
  for (let x = -4; x <= 4; x += 0.5) { const v = Phi(x); assert(v >= prev, "Phi must be monotonic"); prev = v; }

  console.log("OK", { AAA: r.dWins["AAA"].toFixed(3), BBB: r.dWins["BBB"].toFixed(3), sdA: sA.sd.toFixed(3) });
}

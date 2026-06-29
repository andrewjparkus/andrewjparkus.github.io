"use strict";
// Trade-simulator math engine — a vanilla-JS port of daily_v5/trade_sim.py.
// Exposes the same point-estimate + CRN binomial flip-variance band the Python
// 10k Monte-Carlo converges to. NO backend, NO se_net in the win-delta band.
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

// strength_from_roster: roster = [{pid,min,...rating}]. Returns {strength, factors[6], se, M}.
function strength(roster, meta) {
  const M = roster.reduce((s, p) => s + p.min, 0);
  if (M <= 0) return { strength: 0, factors: [0, 0, 0, 0, 0, 0], se: 0, M: 0 };
  let net = 0, fac = [0, 0, 0, 0, 0, 0], varAcc = 0;
  for (const p of roster) {
    const r = rate(p, meta);
    net += p.min * r.net;
    for (let k = 0; k < 6; k++) fac[k] += p.min * r.f[k];
    const w = p.min / M; varAcc += w * w * r.se * r.se;
  }
  const S = meta.scale;
  return { strength: S * net / M, factors: fac.map(v => S * v / M), se: S * Math.sqrt(varAcc), M };
}

// apply_trade renormalization, preserving each team's total minutes (trade_sim.py 172-186).
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

// Per-game own-perspective PRE-TRADE margins for `fr` (use base strengths).
function teamMargins(fr, schedule, strengthOf, hca) {
  const mus = [];
  for (const g of schedule) {
    if (g.h === fr) mus.push(strengthOf[fr] - strengthOf[g.a] + hca);
    else if (g.a === fr) mus.push(strengthOf[fr] - strengthOf[g.h] - hca);
  }
  return mus;  // length == this team's actual game count (78-85, NOT 82)
}

// Closed-form win delta + 80% band via the CRN binomial flip-variance (NOT the delta method).
// mus: per-game own-perspective pre-trade margins; dStrength: this team's strength shift; sigma.
function winDelta(mus, dStrength, sigma, z) {
  if (z == null) z = 1.2816;                                  // 80%; use 1.96 for 95%
  let dwins = 0, varAcc = 0;
  for (const mu of mus) {
    const dp = Phi((mu + dStrength) / sigma) - Phi(mu / sigma); // signed per-game win-prob change
    // flip thresholds (own perspective: win iff eps > -mu): a=(-mu-ds)/s, b=(-mu)/s
    const a = (-mu - dStrength) / sigma, b = (-mu) / sigma;
    const pBetween = Phi(Math.max(a, b)) - Phi(Math.min(a, b)); // P(eps lands in flip interval)
    dwins += dp;
    varAcc += pBetween - dp * dp;                              // per-game Bernoulli flip variance
  }
  const sd = Math.sqrt(Math.max(varAcc, 0));
  return { dwins, sd, band80: [dwins - z * sd, dwins + z * sd] };
}

// Export for both the browser (UI in trade.html) and a Node parity check.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { FACTORS, Phi, erf, rate, strength, applyTrade, teamMargins, winDelta };
}

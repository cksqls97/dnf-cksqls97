import { CUBE_FRAGMENTS_PER_CONTRADICTION } from './constants';

export const MAX_TARGET = 12;
export const SAFE_MAX_FROM = 9; // 안전 증폭은 +9 이하 상태에서만 시도 가능(+10까지).

// 모순의 결정체 1개를 가장 싸게 마련하는 방법. 가격 0은 "매물 없음/미입력"으로 보고 후보에서 뺀다.
export function getContradictionSource(prices) {
  const direct = Number(prices.contradiction) || 0;
  const viaCube = (Number(prices.cube) || 0) * CUBE_FRAGMENTS_PER_CONTRADICTION;
  if (direct > 0 && viaCube > 0) return direct <= viaCube ? { method: 'direct', price: direct, direct, viaCube } : { method: 'cube', price: viaCube, direct, viaCube };
  if (direct > 0) return { method: 'direct', price: direct, direct, viaCube };
  if (viaCube > 0) return { method: 'cube', price: viaCube, direct, viaCube };
  return { method: 'none', price: 0, direct, viaCube };
}

// 안전 증폭으로 한 단계를 통과하는 데 필요한 기대 시도 횟수. 실패해도 단계는 유지되고, 실패할 때마다
// 다음 시도 확률이 pityIncrement만큼 누적된다(최대 100%). startProb로 이미 누적된 확률에서 시작할 수 있다.
export function safeExpectedAttempts(stage, startProb = stage.successProb) {
  let p = startProb;
  let reach = 1;
  let expected = 0;
  for (let guard = 0; guard < 1000; guard++) {
    expected += reach;
    if (p >= 1) break;
    reach *= (1 - p);
    p = Math.min(1, p + (stage.pityIncrement || 0));
  }
  return expected;
}

export function safeCurrentProb(stage, safeFails) {
  return Math.min(1, stage.successProb + safeFails * (stage.pityIncrement || 0));
}

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const pv = M[col][col];
    if (Math.abs(pv) < 1e-12) return null;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / pv;
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

// 단계 k에서 가능한 행동들과 그 비용/전이를 만든다. 일반 증폭 실패 시:
// onFail null → 같은 단계 유지, { dropTo } → 해당 단계로 강등, 'destroy' → +0으로 돌아간다
// (+0 복구 수단의 비용은 계산에 넣지 않는다).
export function buildActions(ctx) {
  const { generalStages, safeStages, isWeapon, goldFee, contradictionPrice, harmonyPrice, targetStage } = ctx;
  const fee = isWeapon ? goldFee.weapon : goldFee.nonWeapon;
  const actions = [];
  for (let k = 0; k < targetStage; k++) {
    const g = generalStages.find(s => s.from === k);
    const sf = k <= SAFE_MAX_FROM ? safeStages.find(s => s.from === k) : null;
    const opts = {};
    if (g) {
      const p = Math.max(0.0001, g.successProb);
      const destroy = g.onFail === 'destroy';
      const failTo = g.onFail === null ? k : destroy ? 0 : g.onFail.dropTo;
      opts.general = {
        type: 'general', p, failTo, destroy, stage: g,
        attemptCost: g.material * contradictionPrice + fee,
        attemptFee: fee,
        costs: {
          gold: g.material * contradictionPrice + fee,
          contradiction: g.material,
          harmony: 0,
          fee,
          generalAttempts: 1,
          safeAttempts: 0,
          destroys: destroy ? 1 - p : 0
        }
      };
    }
    if (sf) {
      const att = safeExpectedAttempts(sf);
      const sfGold = isWeapon ? sf.weaponGold : sf.nonWeaponGold;
      const attemptCost = sf.material * harmonyPrice + sfGold;
      opts.safe = {
        type: 'safe', p: 1, failTo: k, expectedAttempts: att, stage: sf,
        attemptCost,
        attemptFee: sfGold,
        costs: {
          gold: att * attemptCost,
          contradiction: 0,
          harmony: att * sf.material,
          fee: att * sfGold,
          generalAttempts: 0,
          safeAttempts: att,
          destroys: 0
        }
      };
    }
    actions.push(opts);
  }
  return actions;
}

// 고정된 정책에서, 단계 m에 처음 도달할 때까지의 기대 비용 H(j)를 단계 j(< m)마다 정확히 푼다.
// H(j) = c_j + p·H(j+1) + (1-p)·H(실패 후 단계),  H(m) = 0.  m = 목표 단계면 "목표까지 남은 기대비용".
export function evaluatePolicyTo(actions, policy, m, metric = 'gold') {
  if (m <= 0) return [0];
  const A = Array.from({ length: m }, () => new Array(m).fill(0));
  const b = new Array(m).fill(0);
  for (let k = 0; k < m; k++) {
    const a = actions[k][policy[k]];
    A[k][k] += 1;
    if (k + 1 < m) A[k][k + 1] -= a.p;
    A[k][a.failTo] -= (1 - a.p);
    b[k] = a.costs[metric];
  }
  const H = solveLinear(A, b);
  return H ? [...H, 0] : null;
}

export function evaluatePolicy(actions, policy, metric) {
  const V = evaluatePolicyTo(actions, policy, actions.length, metric);
  return V ? V.slice(0, actions.length) : null;
}

// 정책 반복으로 기대 골드가 최소인 단계별 선택(일반/안전)을 찾는다. 일반 증폭 실패가 낮은 단계로
// 되돌려 보내기 때문에 단계끼리 서로 얽혀 있어(순환), 단계마다 따로 최솟값을 고르는 것으로는 부족하다.
export function optimizePolicy(actions) {
  let policy = actions.map(o => (o.general ? 'general' : 'safe'));
  for (let iter = 0; iter < 100; iter++) {
    const V = evaluatePolicy(actions, policy, 'gold');
    if (!V) break;
    let changed = false;
    const next = policy.map((cur, k) => {
      const q = {};
      for (const [name, a] of Object.entries(actions[k])) {
        const vNext = k + 1 < actions.length ? V[k + 1] : 0;
        q[name] = a.costs.gold + a.p * vNext + (1 - a.p) * V[a.failTo];
      }
      const best = Object.keys(q).reduce((x, y) => (q[y] < q[x] - 1e-6 ? y : x), cur);
      if (best !== cur) changed = true;
      return best;
    });
    policy = next;
    if (!changed) break;
  }
  return policy;
}

const METRICS = ['gold', 'contradiction', 'harmony', 'fee', 'generalAttempts', 'safeAttempts', 'destroys'];
export function summarizePolicy(actions, policy, startStage) {
  if (startStage >= actions.length) return Object.fromEntries(METRICS.map(m => [m, 0]));
  return Object.fromEntries(METRICS.map(m => {
    const V = evaluatePolicy(actions, policy, m);
    return [m, V ? V[startStage] : NaN];
  }));
}

export function stageQValues(actions, policy) {
  const V = evaluatePolicy(actions, policy, 'gold');
  if (!V) return [];
  return actions.map((opts, k) => {
    const q = {};
    for (const [name, a] of Object.entries(opts)) {
      const vNext = k + 1 < actions.length ? V[k + 1] : 0;
      q[name] = a.costs.gold + a.p * vNext + (1 - a.p) * V[a.failTo];
    }
    return q;
  });
}

// 시뮬레이터용: 지금 단계 k에서 각 선택을 "이번에" 했을 때의 기대값.
// - toNext: 다음 단계(k+1)에 처음 도달할 때까지의 기대 골드(실패로 강등되면 이후엔 최적 루트로 다시 올라온다고 가정)
// - toTarget: 목표 단계까지 남은 기대 골드
// 안전 증폭은 현재 단계에서 이미 쌓인 보정 확률(safeFails)을 반영한다.
export function choiceExpectations(actions, policy, k, safeFails) {
  const m = actions.length;
  if (k >= m) return {};
  const toNextH = evaluatePolicyTo(actions, policy, k + 1, 'gold');
  const toTargetV = evaluatePolicyTo(actions, policy, m, 'gold');
  const out = {};
  const g = actions[k].general;
  if (g && toNextH && toTargetV) {
    out.general = {
      prob: g.p,
      attemptCost: g.attemptCost,
      toNext: g.attemptCost + (1 - g.p) * toNextH[g.failTo],
      toTarget: g.attemptCost + g.p * toTargetV[k + 1] + (1 - g.p) * toTargetV[g.failTo]
    };
  }
  const s = actions[k].safe;
  if (s && toTargetV) {
    const prob = safeCurrentProb(s.stage, safeFails);
    const toNext = safeExpectedAttempts(s.stage, prob) * s.attemptCost;
    out.safe = { prob, attemptCost: s.attemptCost, toNext, toTarget: toNext + toTargetV[k + 1] };
  }
  return out;
}

export function formatGold(v) {
  if (!isFinite(v)) return '-';
  const rounded = Math.round(v);
  if (Math.abs(rounded) >= 1e8) return `${rounded.toLocaleString()} 골드 (약 ${(rounded / 1e8).toFixed(2)}억)`;
  if (Math.abs(rounded) >= 1e4) return `${rounded.toLocaleString()} 골드 (약 ${Math.round(rounded / 1e4).toLocaleString()}만)`;
  return `${rounded.toLocaleString()} 골드`;
}
export const fmt1 = v => (isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '-');

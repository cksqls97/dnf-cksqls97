"use client";

import React, { useState, useEffect } from 'react';
import {
  AMP_GENERAL_STAGES, AMP_SAFE_STAGES, AMP_GENERAL_GOLD_PER_ATTEMPT,
  CUBE_FRAGMENTS_PER_CONTRADICTION, AMP_AUCTION_ITEMS
} from '../lib/constants';

const MAX_TARGET = 12;
const SAFE_MAX_FROM = 9; // 안전 증폭은 +9 이하 상태에서만 시도 가능(+10까지).

const DEFAULT_SETTINGS = {
  isWeapon: false,
  startStage: 0,
  targetStage: 12,
  prices: { cube: 0, contradiction: 0, harmony: 0 },
  goldFee: { ...AMP_GENERAL_GOLD_PER_ATTEMPT },
  restoreCost: 0
};

// 모순의 결정체 1개를 가장 싸게 마련하는 방법. 가격 0은 "매물 없음/미입력"으로 보고 후보에서 뺀다.
function getContradictionSource(prices) {
  const direct = Number(prices.contradiction) || 0;
  const viaCube = (Number(prices.cube) || 0) * CUBE_FRAGMENTS_PER_CONTRADICTION;
  if (direct > 0 && viaCube > 0) return direct <= viaCube ? { method: 'direct', price: direct, direct, viaCube } : { method: 'cube', price: viaCube, direct, viaCube };
  if (direct > 0) return { method: 'direct', price: direct, direct, viaCube };
  if (viaCube > 0) return { method: 'cube', price: viaCube, direct, viaCube };
  return { method: 'none', price: 0, direct, viaCube };
}

// 안전 증폭 한 단계를 통과하는 데 필요한 기대 시도 횟수. 실패해도 단계는 유지되고, 실패할 때마다
// 다음 시도 확률이 pityIncrement만큼 누적된다(최대 100%). 단계 안에서는 안전 증폭을 끝까지 유지한다고 본다.
function safeExpectedAttempts(stage) {
  let p = stage.successProb;
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
// onFail null → 같은 단계 유지, { dropTo } → 해당 단계로 강등, 'destroy' → 장비 파괴(증폭 보호권 등으로
// +0 복구) → +0으로 돌아가며 복구 비용이 추가로 든다.
function buildActions(ctx) {
  const { generalStages, safeStages, isWeapon, goldFee, contradictionPrice, harmonyPrice, restoreCost, targetStage } = ctx;
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
        type: 'general', p, failTo,
        attemptCost: g.material * contradictionPrice + fee,
        costs: {
          gold: g.material * contradictionPrice + fee + (destroy ? (1 - p) * restoreCost : 0),
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
      opts.safe = {
        type: 'safe', p: 1, failTo: k, expectedAttempts: att,
        costs: {
          gold: att * (sf.material * harmonyPrice + sfGold),
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

// 고정된 정책(단계별 일반/안전 선택)에서 각 단계부터 목표까지의 기대 비용을 정확히 푼다.
// V(k) = c_k + p·V(k+1) + (1-p)·V(실패 후 단계),  V(목표) = 0  → 선형 연립방정식.
function evaluatePolicy(actions, policy, metric) {
  const n = actions.length;
  if (n === 0) return [];
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    const a = actions[k][policy[k]];
    A[k][k] += 1;
    if (k + 1 < n) A[k][k + 1] -= a.p;
    A[k][a.failTo] -= (1 - a.p);
    b[k] = a.costs[metric];
  }
  return solveLinear(A, b);
}

// 정책 반복으로 기대 골드가 최소인 단계별 선택(일반/안전)을 찾는다. 일반 증폭 실패가 낮은 단계로
// 되돌려 보내기 때문에 단계끼리 서로 얽혀 있어(순환), 단계마다 따로 최솟값을 고르는 것으로는 부족하다.
function optimizePolicy(actions) {
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
function summarizePolicy(actions, policy, startStage) {
  if (startStage >= actions.length) return Object.fromEntries(METRICS.map(m => [m, 0]));
  return Object.fromEntries(METRICS.map(m => {
    const V = evaluatePolicy(actions, policy, m);
    return [m, V ? V[startStage] : NaN];
  }));
}

function stageQValues(actions, policy) {
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

function formatGold(v) {
  if (!isFinite(v)) return '-';
  const rounded = Math.round(v);
  if (Math.abs(rounded) >= 1e8) return `${rounded.toLocaleString()} 골드 (약 ${(rounded / 1e8).toFixed(2)}억)`;
  if (Math.abs(rounded) >= 1e4) return `${rounded.toLocaleString()} 골드 (약 ${Math.round(rounded / 1e4).toLocaleString()}만)`;
  return `${rounded.toLocaleString()} 골드`;
}
const fmt1 = v => (isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '-');

export default function AmpCalculatorTab({ apiKey }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showEditor, setShowEditor] = useState(false);
  const [generalStages, setGeneralStages] = useState(AMP_GENERAL_STAGES);
  const [safeStages, setSafeStages] = useState(AMP_SAFE_STAGES);
  const [isFetching, setIsFetching] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const readJson = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } };
    const setRaw = (setter, value) => setter(value);
    const savedGeneral = readJson('DNF_AMP_GENERAL_STAGES');
    if (savedGeneral && savedGeneral.length === AMP_GENERAL_STAGES.length) setRaw(setGeneralStages, savedGeneral);
    const savedSafe = readJson('DNF_AMP_SAFE_STAGES');
    if (savedSafe && savedSafe.length === AMP_SAFE_STAGES.length) setRaw(setSafeStages, savedSafe);
    const savedSettings = readJson('DNF_AMP_SETTINGS');
    if (savedSettings) {
      setRaw(setSettings, {
        ...DEFAULT_SETTINGS, ...savedSettings,
        prices: { ...DEFAULT_SETTINGS.prices, ...(savedSettings.prices || {}) },
        goldFee: { ...DEFAULT_SETTINGS.goldFee, ...(savedSettings.goldFee || {}) }
      });
    }
    setRaw(setHydrated, true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_AMP_GENERAL_STAGES', JSON.stringify(generalStages)); }, [generalStages, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_AMP_SAFE_STAGES', JSON.stringify(safeStages)); }, [safeStages, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_AMP_SETTINGS', JSON.stringify(settings)); }, [settings, hydrated]);

  const update = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));
  const updatePrice = (key, value) => setSettings(prev => ({ ...prev, prices: { ...prev.prices, [key]: value } }));
  const updateFee = (key, value) => setSettings(prev => ({ ...prev, goldFee: { ...prev.goldFee, [key]: value } }));

  const fetchPrices = async () => {
    if (!apiKey) { alert('API 키가 필요합니다.'); return; }
    setIsFetching(true);
    try {
      const names = Object.values(AMP_AUCTION_ITEMS);
      const res = await fetch('/api/auction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, itemNames: names }) });
      const data = await res.json();
      if (data.success) {
        const p = data.data;
        setSettings(prev => ({
          ...prev,
          prices: {
            cube: p[AMP_AUCTION_ITEMS.cube] ?? prev.prices.cube,
            contradiction: p[AMP_AUCTION_ITEMS.contradiction] ?? prev.prices.contradiction,
            harmony: p[AMP_AUCTION_ITEMS.harmony] ?? prev.prices.harmony
          },
          restoreCost: p[AMP_AUCTION_ITEMS.protection] > 0 ? p[AMP_AUCTION_ITEMS.protection] : prev.restoreCost
        }));
        const missing = names.filter(n => !p[n]);
        alert(`경매장 시세를 불러왔습니다.${missing.length ? `\n매물이 없어 반영되지 않은 항목: ${missing.join(', ')} (직접 입력해주세요)` : ''}`);
      } else {
        alert('불러오기 실패: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('경매장 API 연동 중 오류가 발생했습니다.');
    }
    setIsFetching(false);
  };

  const resetStages = () => {
    if (!window.confirm('단계별 확률/재료 수치를 기본값(나무위키 기준)으로 되돌릴까요?')) return;
    setGeneralStages(AMP_GENERAL_STAGES);
    setSafeStages(AMP_SAFE_STAGES);
  };

  const { isWeapon, startStage, targetStage, prices, goldFee, restoreCost } = settings;
  const source = getContradictionSource(prices);
  const ctx = {
    generalStages, safeStages, isWeapon, goldFee, targetStage,
    contradictionPrice: source.price,
    harmonyPrice: Number(prices.harmony) || 0,
    restoreCost: Number(restoreCost) || 0
  };
  const actions = buildActions(ctx);
  const optimal = optimizePolicy(actions);
  const allGeneral = actions.map(o => (o.general ? 'general' : 'safe'));
  const safeMax = actions.map(o => (o.safe ? 'safe' : 'general'));
  const plans = [
    { key: 'optimal', label: '🏆 최적 루트', policy: optimal },
    { key: 'general', label: '🎲 일반 증폭만', policy: allGeneral },
    { key: 'safe', label: '🛡️ 안전 증폭 최대 활용', policy: safeMax }
  ].map(pl => ({ ...pl, summary: summarizePolicy(actions, pl.policy, startStage) }));
  const qValues = stageQValues(actions, optimal);
  const optimalSummary = plans[0].summary;

  const warnings = [];
  if (source.method === 'none') warnings.push('모순의 결정체 / 무색 큐브 조각 가격이 없어 일반 증폭 재료비가 0으로 계산됩니다.');
  if (!(Number(prices.harmony) > 0)) warnings.push('조화의 결정체 가격이 0이라 안전 증폭 재료비가 0으로 계산됩니다(거래 불가 재화라면 직접 획득 가치로 입력하세요).');
  if (targetStage > 10 && !(Number(restoreCost) > 0)) warnings.push('파괴 시 복구 비용이 0이라 +10 이후 실패(장비 파괴) 손실이 과소평가됩니다.');

  const inp = { width: '110px', padding: '0.35rem', fontSize: '0.72rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };
  const lbl = { fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' };
  const panel = { background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem 1.2rem', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.2rem' };
  const th = { textAlign: 'center', padding: '0.45rem', fontSize: '0.66rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' };
  const td = { textAlign: 'center', padding: '0.4rem', fontSize: '0.68rem', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' };
  const pill = (active) => ({ fontSize: '0.7rem', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', background: active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)', color: active ? '#38bdf8' : '#94a3b8', border: `1px solid ${active ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.15)'}` });

  const updateGeneralField = (idx, field, value) => setGeneralStages(prev => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  const updateSafeField = (idx, field, value) => setSafeStages(prev => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>⚡ 증폭 효율 계산기</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 0, marginBottom: '0.6rem' }}>
        경매장 시세로 재료 가치를 골드로 환산해, 현재 단계에서 목표 단계(최대 +12)까지 기대 골드가 가장 적게 드는 루트를 찾습니다.
        단계마다 일반 증폭과 안전 증폭(+9 이하에서만 가능)을 자유롭게 오갈 수 있다고 보고, 일반 증폭 실패 시의 강등과
        +10 이후 실패 시의 장비 파괴(+0 복구)까지 반영해 정확한 기대값으로 계산합니다.
      </p>
      <p style={{ color: '#fbbf24', fontSize: '0.64rem', marginTop: 0, marginBottom: '1.2rem' }}>
        ⚠️ 단계별 확률·재료·수수료 기본값은 나무위키(100레벨 에픽 기준) 수치이며 실제와 다를 수 있습니다. 아래에서 직접 수정할 수 있습니다.
        안전 증폭은 한 단계 안에서는 성공할 때까지 계속 안전 증폭을 쓴다고 가정합니다(누적 보정 확률 유지).
      </p>

      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>💰 경매장 시세 (개당)</div>
          <button onClick={fetchPrices} disabled={isFetching} style={{ fontSize: '0.68rem', padding: '0.3rem 0.7rem', background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '4px', cursor: 'pointer' }}>
            {isFetching ? '불러오는 중...' : '🔄 경매장 시세 불러오기'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
          <div><label style={lbl}>{AMP_AUCTION_ITEMS.cube}</label><input type="number" min="0" style={inp} value={prices.cube} onChange={e => updatePrice('cube', Number(e.target.value))} /></div>
          <div><label style={lbl}>{AMP_AUCTION_ITEMS.contradiction}</label><input type="number" min="0" style={inp} value={prices.contradiction} onChange={e => updatePrice('contradiction', Number(e.target.value))} /></div>
          <div><label style={lbl}>{AMP_AUCTION_ITEMS.harmony}</label><input type="number" min="0" style={inp} value={prices.harmony} onChange={e => updatePrice('harmony', Number(e.target.value))} /></div>
          <div><label style={lbl}>파괴 시 복구 비용 (증폭 보호권 등)</label><input type="number" min="0" style={inp} value={restoreCost} onChange={e => update('restoreCost', Number(e.target.value))} /></div>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', color: '#cbd5e1', lineHeight: 1.8 }}>
          <div style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: '0.2rem' }}>🔎 모순의 결정체 조달 방법 비교</div>
          <div>경매장 직접 구매: <b>{source.direct > 0 ? `${source.direct.toLocaleString()} 골드` : '매물/입력 없음'}</b></div>
          <div>무색 큐브 조각 {CUBE_FRAGMENTS_PER_CONTRADICTION.toLocaleString()}개로 교환: <b>{source.viaCube > 0 ? `${source.viaCube.toLocaleString()} 골드` : '매물/입력 없음'}</b></div>
          <div style={{ marginTop: '0.2rem', color: source.method === 'none' ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
            {source.method === 'direct' && `✅ 경매장에서 모순의 결정체를 직접 사는 쪽이 유리 (개당 ${source.direct.toLocaleString()} 골드${source.viaCube > 0 ? `, 큐브 교환 대비 ${(source.viaCube - source.direct).toLocaleString()} 골드 절약` : ''})`}
            {source.method === 'cube' && `✅ 무색 큐브 조각을 사서 교환하는 쪽이 유리 (개당 ${source.viaCube.toLocaleString()} 골드${source.direct > 0 ? `, 직접 구매 대비 ${(source.direct - source.viaCube).toLocaleString()} 골드 절약` : ''})`}
            {source.method === 'none' && '가격 정보가 없습니다. 시세를 불러오거나 직접 입력해주세요.'}
          </div>
        </div>
      </div>

      <div style={{ ...panel, display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={lbl}>부위</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={() => update('isWeapon', false)} style={pill(!isWeapon)}>무기 외</button>
            <button onClick={() => update('isWeapon', true)} style={pill(isWeapon)}>무기</button>
          </div>
        </div>
        <div>
          <label style={lbl}>현재 단계</label>
          <select value={startStage} onChange={e => update('startStage', Math.min(Number(e.target.value), targetStage - 1))} style={{ ...inp, width: '80px' }}>
            {Array.from({ length: MAX_TARGET }, (_, i) => i).map(n => <option key={n} value={n}>+{n}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>목표 단계</label>
          <select value={targetStage} onChange={e => { const t = Number(e.target.value); setSettings(prev => ({ ...prev, targetStage: t, startStage: Math.min(prev.startStage, t - 1) })); }} style={{ ...inp, width: '80px' }}>
            {Array.from({ length: MAX_TARGET }, (_, i) => i + 1).map(n => <option key={n} value={n}>+{n}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>일반 증폭 1회 수수료 ({isWeapon ? '무기' : '무기 외'})</label>
          <input type="number" min="0" style={inp} value={isWeapon ? goldFee.weapon : goldFee.nonWeapon} onChange={e => updateFee(isWeapon ? 'weapon' : 'nonWeapon', Number(e.target.value))} />
        </div>
      </div>

      {warnings.length > 0 && (
        <div style={{ marginBottom: '1.2rem', fontSize: '0.66rem', color: '#f87171', lineHeight: 1.7 }}>
          {warnings.map(w => <div key={w}>⚠️ {w}</div>)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {plans.map(pl => {
          const isBest = pl.key === 'optimal';
          const diff = pl.summary.gold - optimalSummary.gold;
          return (
            <div key={pl.key} style={{ background: isBest ? 'rgba(250,204,21,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1.1rem', border: `1px solid ${isBest ? 'rgba(250,204,21,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
              <h3 style={{ margin: '0 0 0.7rem', fontSize: '0.82rem', color: isBest ? '#fde047' : '#e2e8f0' }}>{pl.label} (+{startStage} → +{targetStage})</h3>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', lineHeight: 1.85 }}>
                기대 총비용: <b style={{ color: '#fbbf24' }}>{formatGold(pl.summary.gold)}</b><br />
                {!isBest && diff > 1 && <span style={{ color: '#f87171' }}>최적 루트보다 {formatGold(diff)} 더 듦<br /></span>}
                ㄴ 수수료(골드): {formatGold(pl.summary.fee)}<br />
                ㄴ 모순의 결정체: {fmt1(pl.summary.contradiction)}개
                {source.method === 'cube' && pl.summary.contradiction > 0 && ` (큐브 조각 ${fmt1(pl.summary.contradiction * CUBE_FRAGMENTS_PER_CONTRADICTION)}개)`}<br />
                ㄴ 조화의 결정체: {fmt1(pl.summary.harmony)}개<br />
                시도 횟수: 일반 {fmt1(pl.summary.generalAttempts)}회 / 안전 {fmt1(pl.summary.safeAttempts)}회<br />
                {targetStage > 10 && <>기대 파괴 횟수: {pl.summary.destroys.toFixed(2)}회<br /></>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '0.5rem' }}>🗺️ 단계별 최적 선택</div>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={th}>단계</th>
              <th style={th}>추천</th>
              <th style={th}>일반 선택 시 남은 기대비용</th>
              <th style={th}>안전 선택 시 남은 기대비용</th>
              <th style={th}>일반 1회 비용 / 확률</th>
              <th style={th}>일반 실패 시</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((opts, k) => {
              const choice = optimal[k];
              const q = qValues[k] || {};
              const g = opts.general;
              const belowStart = k < startStage;
              return (
                <tr key={k} style={{ opacity: belowStart ? 0.5 : 1 }}>
                  <td style={td}>+{k} → +{k + 1}</td>
                  <td style={{ ...td, fontWeight: 'bold', color: choice === 'safe' ? '#4ade80' : '#38bdf8' }}>{choice === 'safe' ? '🛡️ 안전' : '🎲 일반'}</td>
                  <td style={td}>{q.general !== undefined ? formatGold(q.general) : '-'}</td>
                  <td style={td}>{q.safe !== undefined ? formatGold(q.safe) : '불가'}</td>
                  <td style={td}>{g ? `${formatGold(g.attemptCost)} / ${Math.round(g.p * 100)}%` : '-'}</td>
                  <td style={td}>{!g ? '-' : g.failTo === k ? '유지' : generalStages.find(s => s.from === k)?.onFail === 'destroy' ? '파괴 → +0' : `+${g.failTo}로 강등`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {startStage > 0 && <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '-1rem', marginBottom: '1.5rem' }}>흐리게 표시된 단계는 현재 단계보다 낮지만, 강등/파괴로 내려갔을 때 따를 선택입니다.</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
        <button onClick={() => setShowEditor(v => !v)} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', background: 'rgba(192,132,252,0.1)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)', borderRadius: '4px', cursor: 'pointer' }}>
          {showEditor ? '단계별 수치 숨기기' : '⚙️ 단계별 확률/재료 수정'}
        </button>
        <button onClick={resetStages} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '4px', cursor: 'pointer' }}>기본값으로 초기화</button>
      </div>

      {showEditor && (
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '0.5rem' }}>일반 증폭 (모순의 결정체)</div>
          <div style={{ overflowX: 'auto', marginBottom: '1.2rem' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead><tr><th style={th}>단계</th><th style={th}>성공확률(%)</th><th style={th}>재료 개수</th><th style={th}>실패 시</th></tr></thead>
              <tbody>
                {generalStages.filter(s => s.from < MAX_TARGET).map(s => {
                  const idx = generalStages.indexOf(s);
                  return (
                    <tr key={`${s.from}-${s.to}`}>
                      <td style={td}>+{s.from} → +{s.to}</td>
                      <td style={td}><input type="number" min="0" max="100" style={{ ...inp, width: '70px' }} value={Math.round(s.successProb * 100)} onChange={e => updateGeneralField(idx, 'successProb', Math.max(0, Math.min(100, Number(e.target.value))) / 100)} /></td>
                      <td style={td}><input type="number" min="0" style={{ ...inp, width: '70px' }} value={s.material} onChange={e => updateGeneralField(idx, 'material', Number(e.target.value))} /></td>
                      <td style={td}>{s.onFail === null ? '-' : s.onFail === 'destroy' ? '장비 파괴' : `+${s.onFail.dropTo}로 강등`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '0.5rem' }}>안전 증폭 (조화의 결정체)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead><tr><th style={th}>단계</th><th style={th}>성공확률(%)</th><th style={th}>실패 시 확률 증가(%p)</th><th style={th}>재료 개수</th><th style={th}>무기 골드</th><th style={th}>무기 외 골드</th></tr></thead>
              <tbody>
                {safeStages.map((s, idx) => (
                  <tr key={`${s.from}-${s.to}`}>
                    <td style={td}>+{s.from} → +{s.to}</td>
                    <td style={td}><input type="number" min="0" max="100" style={{ ...inp, width: '70px' }} value={Math.round(s.successProb * 100)} onChange={e => updateSafeField(idx, 'successProb', Math.max(0, Math.min(100, Number(e.target.value))) / 100)} /></td>
                    <td style={td}><input type="number" min="0" max="100" style={{ ...inp, width: '70px' }} value={Math.round((s.pityIncrement || 0) * 100)} onChange={e => updateSafeField(idx, 'pityIncrement', Math.max(0, Math.min(100, Number(e.target.value))) / 100)} /></td>
                    <td style={td}><input type="number" min="0" style={{ ...inp, width: '70px' }} value={s.material} onChange={e => updateSafeField(idx, 'material', Number(e.target.value))} /></td>
                    <td style={td}><input type="number" min="0" style={{ ...inp, width: '95px' }} value={s.weaponGold} onChange={e => updateSafeField(idx, 'weaponGold', Number(e.target.value))} /></td>
                    <td style={td}><input type="number" min="0" style={{ ...inp, width: '95px' }} value={s.nonWeaponGold} onChange={e => updateSafeField(idx, 'nonWeaponGold', Number(e.target.value))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

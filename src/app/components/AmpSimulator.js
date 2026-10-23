"use client";

import React, { useState, useEffect } from 'react';
import { CUBE_FRAGMENTS_PER_CONTRADICTION } from '../lib/constants';
import { safeCurrentProb, choiceExpectations, formatGold, fmt1 } from '../lib/ampMath';

const LOG_LIMIT = 300;
const AUTO_RUN_LIMIT = 20000;

const EMPTY_TOTALS = () => ({ gold: 0, fee: 0, contradiction: 0, harmony: 0, generalAttempts: 0, safeAttempts: 0, destroys: 0 });
const freshSim = (startStage) => ({ stage: startStage, safeFails: 0, totals: EMPTY_TOTALS(), log: [], attempts: 0 });

// 한 번 증폭을 시도한 결과를 반영한 새 상태를 돌려준다(순수 함수).
// 안전 증폭의 누적 보정 확률(safeFails)은 같은 단계에 머무는 동안만 유지되고, 단계가 바뀌면 초기화된다.
function rollOnce(sim, mode, actions, rng) {
  const k = sim.stage;
  const a = actions[k]?.[mode];
  if (!a) return sim;
  const prob = mode === 'general' ? a.p : safeCurrentProb(a.stage, sim.safeFails);
  const success = rng() < prob;
  const to = success ? k + 1 : a.failTo;
  const destroyed = !success && mode === 'general' && a.destroy;
  const safeFails = to !== k ? 0 : (mode === 'safe' && !success ? sim.safeFails + 1 : sim.safeFails);
  const totals = {
    gold: sim.totals.gold + a.attemptCost,
    fee: sim.totals.fee + a.attemptFee,
    contradiction: sim.totals.contradiction + (mode === 'general' ? a.stage.material : 0),
    harmony: sim.totals.harmony + (mode === 'safe' ? a.stage.material : 0),
    generalAttempts: sim.totals.generalAttempts + (mode === 'general' ? 1 : 0),
    safeAttempts: sim.totals.safeAttempts + (mode === 'safe' ? 1 : 0),
    destroys: sim.totals.destroys + (destroyed ? 1 : 0)
  };
  const attempts = sim.attempts + 1;
  const entry = { n: attempts, from: k, to, mode, prob, success, destroyed, cost: a.attemptCost };
  return { stage: to, safeFails, totals, attempts, log: [entry, ...sim.log].slice(0, LOG_LIMIT) };
}

// 목표까지 남은 기대 골드가 더 작은 쪽(안전 증폭은 현재 누적 보정 확률 반영)을 고른다.
function recommendedMode(actions, policy, sim) {
  const exp = choiceExpectations(actions, policy, sim.stage, sim.safeFails);
  if (exp.general && exp.safe) return exp.safe.toTarget < exp.general.toTarget ? 'safe' : 'general';
  return exp.general ? 'general' : exp.safe ? 'safe' : null;
}

export default function AmpSimulator({ actions, policy, startStage, targetStage, contradictionSource, expectedFromStart }) {
  const [sim, setSim] = useState(() => freshSim(startStage));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const setRaw = (setter, value) => setter(value);
    try {
      const saved = JSON.parse(localStorage.getItem('DNF_AMP_SIM'));
      if (saved && typeof saved.stage === 'number') setRaw(setSim, { ...freshSim(saved.stage), ...saved, totals: { ...EMPTY_TOTALS(), ...(saved.totals || {}) } });
    } catch (e) { /* 저장된 시뮬레이션이 깨졌으면 새로 시작 */ }
    setRaw(setHydrated, true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_AMP_SIM', JSON.stringify(sim)); }, [sim, hydrated]);

  const done = sim.stage >= targetStage;
  const k = sim.stage;
  const exp = done ? {} : choiceExpectations(actions, policy, k, sim.safeFails);
  const rec = done ? null : recommendedMode(actions, policy, sim);

  const roll = (mode) => setSim(prev => rollOnce(prev, mode, actions, Math.random));
  const autoRun = () => setSim(prev => {
    let s = prev;
    for (let i = 0; i < AUTO_RUN_LIMIT && s.stage < targetStage; i++) {
      const mode = recommendedMode(actions, policy, s);
      if (!mode) break;
      s = rollOnce(s, mode, actions, Math.random);
    }
    return s;
  });
  const reset = () => {
    if (sim.attempts > 0 && !window.confirm(`시뮬레이션을 +${startStage}부터 다시 시작할까요? 지금까지의 기록은 지워집니다.`)) return;
    setSim(freshSim(startStage));
  };

  const card = (active, disabled) => ({
    flex: '1 1 260px', textAlign: 'left', padding: '1rem', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1, color: '#e2e8f0', fontSize: '0.7rem', lineHeight: 1.75,
    background: active ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'rgba(250,204,21,0.45)' : 'rgba(255,255,255,0.12)'}`
  });
  const th = { textAlign: 'center', padding: '0.4rem', fontSize: '0.64rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#111827' };
  const td = { textAlign: 'center', padding: '0.35rem', fontSize: '0.66rem', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' };
  const smallBtn = (color) => ({ fontSize: '0.66rem', padding: '0.3rem 0.65rem', borderRadius: '4px', cursor: 'pointer', background: `rgba(${color},0.12)`, color: `rgb(${color})`, border: `1px solid rgba(${color},0.3)` });

  const generalA = actions[k]?.general;
  const safeA = actions[k]?.safe;
  const failText = !generalA ? '' : generalA.p >= 1 ? '실패 없음' : generalA.destroy ? '실패 시 장비 파괴 → +0' : `실패 시 +${generalA.failTo}로 강등`;

  return (
    <div style={{ marginBottom: '1.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1.1rem 1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 'bold' }}>🎮 증폭 시뮬레이터 (+{startStage} → +{targetStage})</div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={() => rec && roll(rec)} disabled={done} style={smallBtn('192,132,252')}>🤖 추천대로 1회</button>
          <button onClick={autoRun} disabled={done} style={smallBtn('56,189,248')}>⏩ 추천대로 목표까지</button>
          <button onClick={reset} style={smallBtn('248,113,113')}>↺ 처음부터</button>
        </div>
      </div>
      <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: '0 0 0.9rem' }}>
        위와 같은 확률·비용 모델로 실제로 한 번씩 굴려봅니다. 각 선택지의 &ldquo;다음 단계까지 기대값&rdquo;은 이번에 그 방식으로 시도하고,
        실패해서 내려가면 이후엔 최적 루트로 다시 올라온다고 할 때 +{k + 1}에 처음 도달하기까지 드는 평균 골드입니다.
        안전 증폭은 이 단계에서 이미 쌓인 보정 확률을 반영합니다.
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: done ? '#4ade80' : '#fde047' }}>+{k}</div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          {done ? `🎉 목표 +${targetStage} 달성! (${sim.attempts}회 시도)` : `목표 +${targetStage}까지 ${targetStage - k}단계 남음 · 지금까지 ${sim.attempts}회 시도`}
          {!done && safeA && sim.safeFails > 0 && ` · 이 단계 안전 증폭 ${sim.safeFails}회 실패 누적`}
        </div>
      </div>

      {!done && (
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button onClick={() => roll('general')} disabled={!generalA} style={card(rec === 'general', !generalA)}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
              🎲 일반 증폭 (+{k} → +{k + 1}) {rec === 'general' && <span style={{ color: '#fde047', fontSize: '0.65rem' }}>★ 추천</span>}
            </div>
            {exp.general ? (
              <>
                <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 'bold' }}>다음 단계(+{k + 1})까지 기대값: {formatGold(exp.general.toNext)}</div>
                <div>성공 확률 {Math.round(exp.general.prob * 100)}% · 1회 비용 {formatGold(exp.general.attemptCost)}</div>
                <div style={{ color: '#94a3b8' }}>모순의 결정체 {generalA.stage.material}개 · {failText}</div>
                <div style={{ color: '#94a3b8' }}>목표(+{targetStage})까지 남은 기대값: {formatGold(exp.general.toTarget)}</div>
              </>
            ) : <div style={{ color: '#94a3b8' }}>이 단계는 일반 증폭 정보가 없습니다.</div>}
          </button>

          <button onClick={() => roll('safe')} disabled={!safeA} style={card(rec === 'safe', !safeA)}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
              🛡️ 안전 증폭 (+{k} → +{k + 1}) {rec === 'safe' && <span style={{ color: '#fde047', fontSize: '0.65rem' }}>★ 추천</span>}
            </div>
            {exp.safe ? (
              <>
                <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 'bold' }}>다음 단계(+{k + 1})까지 기대값: {formatGold(exp.safe.toNext)}</div>
                <div>
                  성공 확률 {Math.round(exp.safe.prob * 100)}%
                  {sim.safeFails > 0 && <span style={{ color: '#4ade80' }}> (기본 {Math.round(safeA.stage.successProb * 100)}% + 보정 {Math.round((exp.safe.prob - safeA.stage.successProb) * 100)}%p)</span>}
                  {' '}· 1회 비용 {formatGold(exp.safe.attemptCost)}
                </div>
                <div style={{ color: '#94a3b8' }}>조화의 결정체 {safeA.stage.material}개 · 실패 시 단계 유지{safeA.stage.pityIncrement > 0 ? `, 다음 확률 +${Math.round(safeA.stage.pityIncrement * 100)}%p` : ''}</div>
                <div style={{ color: '#94a3b8' }}>목표(+{targetStage})까지 남은 기대값: {formatGold(exp.safe.toTarget)}</div>
              </>
            ) : <div style={{ color: '#94a3b8' }}>+10 이상에서는 안전 증폭을 쓸 수 없습니다.</div>}
          </button>
        </div>
      )}

      <div style={{ padding: '0.8rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', color: '#cbd5e1', lineHeight: 1.8, marginBottom: '1rem' }}>
        <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>💸 이번 시뮬레이션 누적 소모</div>
        <div>총비용: <b style={{ color: '#fbbf24' }}>{formatGold(sim.totals.gold)}</b>
          {expectedFromStart > 0 && <span style={{ color: '#94a3b8' }}> (최적 루트 기대값 {formatGold(expectedFromStart)}의 {fmt1((sim.totals.gold / expectedFromStart) * 100)}%)</span>}
        </div>
        <div>ㄴ 수수료 {formatGold(sim.totals.fee)} · 모순의 결정체 {sim.totals.contradiction.toLocaleString()}개
          {contradictionSource.method === 'cube' && sim.totals.contradiction > 0 && ` (큐브 조각 ${(sim.totals.contradiction * CUBE_FRAGMENTS_PER_CONTRADICTION).toLocaleString()}개)`}
          {' '}· 조화의 결정체 {sim.totals.harmony.toLocaleString()}개</div>
        <div>시도: 일반 {sim.totals.generalAttempts}회 / 안전 {sim.totals.safeAttempts}회{targetStage > 10 && ` · 파괴 ${sim.totals.destroys}회`}</div>
      </div>

      {sim.log.length > 0 && (
        <div style={{ overflowX: 'auto', maxHeight: '320px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr><th style={th}>#</th><th style={th}>방식</th><th style={th}>시도</th><th style={th}>확률</th><th style={th}>결과</th><th style={th}>비용</th></tr>
            </thead>
            <tbody>
              {sim.log.map(e => (
                <tr key={e.n}>
                  <td style={td}>{e.n}</td>
                  <td style={td}>{e.mode === 'safe' ? '🛡️ 안전' : '🎲 일반'}</td>
                  <td style={td}>+{e.from} → +{e.from + 1}</td>
                  <td style={td}>{Math.round(e.prob * 100)}%</td>
                  <td style={{ ...td, color: e.success ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                    {e.success ? `성공 → +${e.to}` : e.destroyed ? '파괴 → +0' : e.to === e.from ? '실패 (유지)' : `실패 → +${e.to}`}
                  </td>
                  <td style={td}>{formatGold(e.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sim.attempts > LOG_LIMIT && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', padding: '0.4rem' }}>최근 {LOG_LIMIT}회만 표시합니다.</div>}
        </div>
      )}
    </div>
  );
}

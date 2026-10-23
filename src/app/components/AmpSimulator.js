"use client";

import React, { useState, useEffect } from 'react';
import { CUBE_FRAGMENTS_PER_CONTRADICTION } from '../lib/constants';
import { safeCurrentProb, choiceExpectations, formatGold, fmt1 } from '../lib/ampMath';

const LOG_LIMIT = 300;

const EMPTY_TOTALS = () => ({ gold: 0, fee: 0, contradiction: 0, harmony: 0, generalAttempts: 0, safeAttempts: 0, destroys: 0 });
const freshSim = (startStage) => ({ stage: startStage, safeFails: 0, totals: EMPTY_TOTALS(), log: [], attempts: 0 });

// 인게임에서 실제로 한 증폭 1회의 결과(success)를 반영한 새 상태를 돌려준다.
// 안전 증폭의 누적 보정 확률(safeFails)은 같은 단계에 머무는 동안만 유지되고, 단계가 바뀌면 초기화된다.
// 되돌리기를 위해 로그 항목에 이 시도로 더해진 값과 시도 전 상태를 함께 남긴다.
function recordResult(sim, mode, success, actions) {
  const k = sim.stage;
  const a = actions[k]?.[mode];
  if (!a) return sim;
  const prob = mode === 'general' ? a.p : safeCurrentProb(a.stage, sim.safeFails);
  const to = success ? k + 1 : a.failTo;
  const destroyed = !success && mode === 'general' && a.destroy;
  const delta = {
    gold: a.attemptCost,
    fee: a.attemptFee,
    contradiction: mode === 'general' ? a.stage.material : 0,
    harmony: mode === 'safe' ? a.stage.material : 0,
    generalAttempts: mode === 'general' ? 1 : 0,
    safeAttempts: mode === 'safe' ? 1 : 0,
    destroys: destroyed ? 1 : 0
  };
  const totals = Object.fromEntries(Object.keys(EMPTY_TOTALS()).map(key => [key, (sim.totals[key] || 0) + delta[key]]));
  const safeFails = to !== k ? 0 : (mode === 'safe' && !success ? sim.safeFails + 1 : sim.safeFails);
  const attempts = sim.attempts + 1;
  const entry = { n: attempts, from: k, to, mode, prob, success, destroyed, cost: a.attemptCost, delta, safeFailsBefore: sim.safeFails };
  return { stage: to, safeFails, totals, attempts, log: [entry, ...sim.log].slice(0, LOG_LIMIT) };
}

function undoLast(sim) {
  const [last, ...rest] = sim.log;
  if (!last) return sim;
  const d = last.delta || { gold: last.cost };
  const totals = Object.fromEntries(Object.keys(EMPTY_TOTALS()).map(key => [key, Math.max(0, (sim.totals[key] || 0) - (d[key] || 0))]));
  return { stage: last.from, safeFails: last.safeFailsBefore || 0, totals, attempts: Math.max(0, sim.attempts - 1), log: rest };
}

// 목표까지 남은 기대 골드가 더 작은 쪽(안전 증폭은 현재 누적 보정 확률 반영)을 추천한다.
function recommendedMode(exp) {
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
    } catch (e) { /* 저장된 기록이 깨졌으면 새로 시작 */ }
    setRaw(setHydrated, true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_AMP_SIM', JSON.stringify(sim)); }, [sim, hydrated]);

  const done = sim.stage >= targetStage;
  const k = sim.stage;
  const exp = done ? {} : choiceExpectations(actions, policy, k, sim.safeFails);
  const rec = done ? null : recommendedMode(exp);

  const record = (mode, success) => setSim(prev => recordResult(prev, mode, success, actions));
  const undo = () => setSim(prev => undoLast(prev));
  const reset = () => {
    if (sim.attempts > 0 && !window.confirm(`기록을 모두 지우고 +${startStage}부터 다시 시작할까요?`)) return;
    setSim(freshSim(startStage));
  };
  // 인게임 상태와 어긋났을 때 시도 기록 없이 현재 단계/안전 실패 누적만 맞춘다.
  const setStage = (stage) => setSim(prev => ({ ...prev, stage, safeFails: 0 }));
  const setSafeFails = (n) => setSim(prev => ({ ...prev, safeFails: Math.max(0, n) }));

  const cardStyle = (active, disabled) => ({
    flex: '1 1 280px', padding: '1rem', borderRadius: '8px', opacity: disabled ? 0.45 : 1,
    color: '#e2e8f0', fontSize: '0.7rem', lineHeight: 1.75,
    background: active ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'rgba(250,204,21,0.45)' : 'rgba(255,255,255,0.12)'}`
  });
  const resultBtn = (color, disabled) => ({
    flex: 1, fontSize: '0.72rem', fontWeight: 'bold', padding: '0.45rem 0.5rem', borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
    background: `rgba(${color},0.14)`, color: `rgb(${color})`, border: `1px solid rgba(${color},0.4)`
  });
  const smallBtn = (color, disabled) => ({ fontSize: '0.66rem', padding: '0.3rem 0.65rem', borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, background: `rgba(${color},0.12)`, color: `rgb(${color})`, border: `1px solid rgba(${color},0.3)` });
  const th = { textAlign: 'center', padding: '0.4rem', fontSize: '0.64rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#111827' };
  const td = { textAlign: 'center', padding: '0.35rem', fontSize: '0.66rem', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' };
  const miniInp = { width: '64px', padding: '0.25rem', fontSize: '0.68rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };

  const generalA = actions[k]?.general;
  const safeA = actions[k]?.safe;
  const generalFailLabel = !generalA ? '' : generalA.p >= 1 ? '실패 없음' : generalA.destroy ? '실패 (파괴 → +0)' : `실패 (+${generalA.failTo}로 강등)`;

  return (
    <div style={{ marginBottom: '1.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1.1rem 1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 'bold' }}>🎮 증폭 시뮬레이터 · 인게임 결과 기록 (+{startStage} → +{targetStage})</div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={undo} disabled={sim.log.length === 0} style={smallBtn('192,132,252', sim.log.length === 0)}>↶ 마지막 기록 되돌리기</button>
          <button onClick={reset} style={smallBtn('248,113,113', false)}>↺ 처음부터</button>
        </div>
      </div>
      <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: '0 0 0.9rem' }}>
        인게임에서 증폭을 1회 진행한 뒤, 사용한 방식의 카드에서 실제 결과(성공/실패)를 눌러 기록하세요. 결과에 맞춰 단계와 안전 증폭
        누적 보정 확률, 소모 비용이 갱신됩니다. &ldquo;다음 단계까지 기대값&rdquo;은 이번에 그 방식으로 시도하고, 실패해서 내려가면 이후엔
        최적 루트로 다시 올라온다고 할 때 +{k + 1}에 처음 도달하기까지 드는 평균 골드입니다.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: done ? '#4ade80' : '#fde047' }}>+{k}</div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          {done ? `🎉 목표 +${targetStage} 달성! (${sim.attempts}회 기록)` : `목표 +${targetStage}까지 ${targetStage - k}단계 남음 · 지금까지 ${sim.attempts}회 기록`}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.64rem', color: '#94a3b8' }}>
          <span>인게임과 다르면 맞추기 →</span>
          <label>단계 <select value={k} onChange={e => setStage(Number(e.target.value))} style={miniInp}>
            {Array.from({ length: targetStage + 1 }, (_, i) => i).map(n => <option key={n} value={n}>+{n}</option>)}
          </select></label>
          {safeA && !done && <label>안전 실패 누적 <input type="number" min="0" style={miniInp} value={sim.safeFails} onChange={e => setSafeFails(Number(e.target.value))} /></label>}
        </div>
      </div>

      {!done && (
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={cardStyle(rec === 'general', !generalA)}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
              🎲 일반 증폭 (+{k} → +{k + 1}) {rec === 'general' && <span style={{ color: '#fde047', fontSize: '0.65rem' }}>★ 추천</span>}
            </div>
            {exp.general ? (
              <>
                <div style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 'bold' }}>다음 단계(+{k + 1})까지 기대값: {formatGold(exp.general.toNext)}</div>
                <div>성공 확률 {Math.round(exp.general.prob * 100)}% · 1회 비용 {formatGold(exp.general.attemptCost)}</div>
                <div style={{ color: '#94a3b8' }}>모순의 결정체 {generalA.stage.material}개 · 목표(+{targetStage})까지 남은 기대값 {formatGold(exp.general.toTarget)}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                  <button onClick={() => record('general', true)} style={resultBtn('74,222,128', false)}>✅ 성공</button>
                  <button onClick={() => record('general', false)} disabled={generalA.p >= 1} style={resultBtn('248,113,113', generalA.p >= 1)}>❌ {generalFailLabel}</button>
                </div>
              </>
            ) : <div style={{ color: '#94a3b8' }}>이 단계는 일반 증폭 정보가 없습니다.</div>}
          </div>

          <div style={cardStyle(rec === 'safe', !safeA)}>
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
                <div style={{ color: '#94a3b8' }}>조화의 결정체 {safeA.stage.material}개 · 목표(+{targetStage})까지 남은 기대값 {formatGold(exp.safe.toTarget)}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                  <button onClick={() => record('safe', true)} style={resultBtn('74,222,128', false)}>✅ 성공</button>
                  <button onClick={() => record('safe', false)} disabled={exp.safe.prob >= 1} style={resultBtn('248,113,113', exp.safe.prob >= 1)}>
                    ❌ 실패 (유지{safeA.stage.pityIncrement > 0 ? `, 확률 +${Math.round(safeA.stage.pityIncrement * 100)}%p` : ''})
                  </button>
                </div>
              </>
            ) : <div style={{ color: '#94a3b8' }}>+10 이상에서는 안전 증폭을 쓸 수 없습니다.</div>}
          </div>
        </div>
      )}

      <div style={{ padding: '0.8rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', color: '#cbd5e1', lineHeight: 1.8, marginBottom: '1rem' }}>
        <div style={{ fontWeight: 'bold', color: '#e2e8f0' }}>💸 지금까지 실제 소모 (현재 시세 기준 환산)</div>
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
          {sim.attempts > LOG_LIMIT && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', padding: '0.4rem' }}>최근 {LOG_LIMIT}회만 표시합니다(되돌리기도 이 범위까지).</div>}
        </div>
      )}
    </div>
  );
}

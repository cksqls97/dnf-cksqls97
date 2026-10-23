"use client";

import React, { useState, useEffect } from 'react';
import { AMP_GENERAL_STAGES, AMP_GENERAL_TOTAL_GOLD, AMP_SAFE_STAGES } from '../lib/constants';

const MAX_TARGET = 10; // 11증 이상은 실패 시 장비 파괴라 기대비용 모델이 다르게 적용되어 제외.

// 일반 증폭 재료(모순의 결정체) 1개당 평균 골드 단가. 단계별 골드가 아니라 0→10 합산 골드만
// 나와 있어서, 합산 골드 ÷ 합산 재료 개수로 역산한 근사치다.
function generalGoldPerMaterial(stages, totalGold) {
  const totalMaterial = stages.filter(s => s.from < MAX_TARGET).reduce((sum, s) => sum + s.material, 0);
  return totalMaterial > 0 ? totalGold / totalMaterial : 0;
}

// 일반 증폭: 실패하면 더 낮은 단계로 강등되는 마르코프 체인. 단계 k→k+1을 "성공할 때까지"
// 반복한다고 할 때, 거기 드는 기대 비용(재료/골드/시도 중 하나)을 재귀식으로 계산한다.
// C(k) = [그 1회 시도 비용 + (1-성공확률)×(강등된 단계에서 k까지 다시 올라오는 기대 비용)] / 성공확률
// 강등 지점이 항상 k보다 낮은 단계이므로, k를 0부터 순서대로 계산하면 더 낮은 C(j)들만 참조하게 된다.
function computeGeneralExpected(stages, targetStage, costFn) {
  const C = {};
  for (const s of stages) {
    if (s.from >= targetStage) break;
    const p = s.successProb;
    const cost1 = costFn(s);
    if (p >= 1) { C[s.from] = cost1; continue; }
    let reclimb = 0;
    if (s.onFail && s.onFail !== 'destroy') {
      for (let j = s.onFail.dropTo; j < s.from; j++) reclimb += C[j];
    }
    C[s.from] = (cost1 + (1 - p) * reclimb) / p;
  }
  return Object.keys(C).reduce((sum, k) => (Number(k) < targetStage ? sum + C[k] : sum), 0);
}

// 안전 증폭: +10까지는 실패해도 단계가 떨어지지 않고, 대신 실패할 때마다 다음 시도 성공 확률이
// pityIncrement만큼 누적되어 오른다(최대 100%). 단계별로 독립적인 "확률이 오르는 베르누이 시행".
function computeSafeExpected(stages, targetStage, costFn) {
  let total = 0;
  for (const s of stages) {
    if (s.from >= targetStage) break;
    const cost1 = costFn(s);
    let p = s.successProb;
    let probReached = 1; // 이번 시행까지 도달할 확률
    let expectedAttempts = 0;
    for (let guard = 0; guard < 1000; guard++) {
      expectedAttempts += probReached;
      if (p >= 1) break;
      probReached *= (1 - p);
      p = Math.min(1, p + (s.pityIncrement || 0));
    }
    total += expectedAttempts * cost1;
  }
  return total;
}

function computeAttemptsExpected(stages, targetStage, mode) {
  const costFn = () => 1;
  return mode === 'general' ? computeGeneralExpected(stages, targetStage, costFn) : computeSafeExpected(stages, targetStage, costFn);
}

export default function AmpCalculatorTab() {
  const [isWeapon, setIsWeapon] = useState(false);
  const [targetStage, setTargetStage] = useState(10);
  const [showEditor, setShowEditor] = useState(false);
  const [generalStages, setGeneralStages] = useState(AMP_GENERAL_STAGES);
  const [safeStages, setSafeStages] = useState(AMP_SAFE_STAGES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const readJson = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } };
    const setRaw = (setter, value) => setter(value);
    const savedGeneral = readJson('DNF_AMP_GENERAL_STAGES');
    if (savedGeneral && savedGeneral.length === AMP_GENERAL_STAGES.length) setRaw(setGeneralStages, savedGeneral);
    const savedSafe = readJson('DNF_AMP_SAFE_STAGES');
    if (savedSafe && savedSafe.length === AMP_SAFE_STAGES.length) setRaw(setSafeStages, savedSafe);
    setRaw(setHydrated, true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_AMP_GENERAL_STAGES', JSON.stringify(generalStages)); }, [generalStages, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_AMP_SAFE_STAGES', JSON.stringify(safeStages)); }, [safeStages, hydrated]);

  const resetDefaults = () => {
    if (!window.confirm('단계별 수치를 기본값(나무위키 기준)으로 되돌릴까요?')) return;
    setGeneralStages(AMP_GENERAL_STAGES);
    setSafeStages(AMP_SAFE_STAGES);
  };

  const goldPerMaterial = generalGoldPerMaterial(generalStages, isWeapon ? AMP_GENERAL_TOTAL_GOLD.weapon : AMP_GENERAL_TOTAL_GOLD.nonWeapon);
  const generalMaterial = computeGeneralExpected(generalStages, targetStage, s => s.material);
  const generalGold = computeGeneralExpected(generalStages, targetStage, s => s.material * goldPerMaterial);
  const generalAttempts = computeAttemptsExpected(generalStages, targetStage, 'general');

  const safeMaterial = computeSafeExpected(safeStages, targetStage, s => s.material);
  const safeGold = computeSafeExpected(safeStages, targetStage, s => (isWeapon ? s.weaponGold : s.nonWeaponGold));
  const safeAttempts = computeAttemptsExpected(safeStages, targetStage, 'safe');

  const inp = { width: '70px', padding: '0.3rem', fontSize: '0.7rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };
  const th = { textAlign: 'center', padding: '0.4rem', fontSize: '0.65rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' };
  const td = { textAlign: 'center', padding: '0.3rem', fontSize: '0.65rem', borderBottom: '1px solid rgba(255,255,255,0.05)' };

  const updateGeneralField = (idx, field, value) => {
    setGeneralStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const updateSafeField = (idx, field, value) => {
    setSafeStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>⚡ 증폭 효율 계산기</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 0, marginBottom: '0.6rem' }}>
        목표 단계까지의 기대(평균) 재료·골드·시도 횟수를 일반 증폭과 안전 증폭 두 방식으로 비교합니다.
        일반 증폭은 실패 시 더 낮은 단계로 강등되는 구조를, 안전 증폭은 +10까지 실패해도 단계가 떨어지지 않는 대신
        실패할수록 다음 시도 확률이 누적되는 구조를 각각 반영해 계산합니다. +11 이상은 실패 시 장비가 파괴되므로
        이 계산기 범위(최대 +10)에서는 제외됩니다.
      </p>
      <p style={{ color: '#fbbf24', fontSize: '0.65rem', marginTop: 0, marginBottom: '1.2rem' }}>
        ⚠️ 아래 기본 수치는 나무위키(100레벨 에픽 아이템 기준) 수치를 그대로 옮긴 것으로, 실제 서버/패치 수치와 다를 수 있습니다.
        &ldquo;단계별 수치 수정&rdquo;에서 직접 고칠 수 있고, 수정한 값은 이 브라우저에 저장됩니다. 일반 증폭의 골드는 단계별 수치가 없어
        0→10 합산 골드를 재료 개수로 나눈 근사치입니다(안전 증폭 골드는 단계별 정확한 값입니다).
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>부위</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={() => setIsWeapon(false)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', background: !isWeapon ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)', color: !isWeapon ? '#38bdf8' : '#94a3b8', border: `1px solid ${!isWeapon ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.15)'}` }}>무기 외</button>
            <button onClick={() => setIsWeapon(true)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', background: isWeapon ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)', color: isWeapon ? '#38bdf8' : '#94a3b8', border: `1px solid ${isWeapon ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.15)'}` }}>무기</button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' }}>목표 단계</label>
          <select value={targetStage} onChange={e => setTargetStage(Number(e.target.value))} style={{ ...inp, width: '90px' }}>
            {Array.from({ length: MAX_TARGET }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>+{n}</option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowEditor(v => !v)} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', background: 'rgba(192,132,252,0.1)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)', borderRadius: '4px', cursor: 'pointer' }}>
            {showEditor ? '단계별 수치 숨기기' : '⚙️ 단계별 수치 수정'}
          </button>
          <button onClick={resetDefaults} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '4px', cursor: 'pointer' }}>기본값으로 초기화</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: '0 0 0.8rem', fontSize: '0.85rem', color: '#e2e8f0' }}>🎲 일반 증폭 (+0 → +{targetStage})</h3>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.9 }}>
            기대 재료(모순의 결정체): <b style={{ color: '#38bdf8' }}>{generalMaterial.toFixed(1)}개</b><br />
            기대 골드(근사치): <b style={{ color: '#fbbf24' }}>{Math.round(generalGold).toLocaleString()} 골드</b><br />
            기대 시도 횟수: <b style={{ color: '#4ade80' }}>{generalAttempts.toFixed(1)}회</b>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: '0 0 0.8rem', fontSize: '0.85rem', color: '#e2e8f0' }}>🛡️ 안전 증폭 (+0 → +{targetStage})</h3>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.9 }}>
            기대 재료(조화의 결정체): <b style={{ color: '#38bdf8' }}>{safeMaterial.toFixed(1)}개</b><br />
            기대 골드: <b style={{ color: '#fbbf24' }}>{Math.round(safeGold).toLocaleString()} 골드</b><br />
            기대 시도 횟수: <b style={{ color: '#4ade80' }}>{safeAttempts.toFixed(1)}회</b>
          </div>
        </div>
      </div>

      {showEditor && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '0.5rem' }}>일반 증폭 단계별 수치</div>
          <div style={{ overflowX: 'auto', marginBottom: '1.2rem' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={th}>단계</th>
                  <th style={th}>성공확률(%)</th>
                  <th style={th}>재료 개수</th>
                  <th style={th}>실패 시</th>
                </tr>
              </thead>
              <tbody>
                {generalStages.map((s, idx) => (
                  <tr key={`${s.from}-${s.to}`}>
                    <td style={td}>+{s.from} → +{s.to}</td>
                    <td style={td}>
                      <input type="number" min="0" max="100" style={inp} value={Math.round(s.successProb * 100)}
                        onChange={e => updateGeneralField(idx, 'successProb', Math.max(0, Math.min(100, Number(e.target.value))) / 100)} />
                    </td>
                    <td style={td}>
                      <input type="number" min="0" style={inp} value={s.material}
                        onChange={e => updateGeneralField(idx, 'material', Number(e.target.value))} />
                    </td>
                    <td style={td}>
                      {s.onFail === null ? '-' : s.onFail === 'destroy' ? '장비 파괴' : `+${s.onFail.dropTo}로 강등`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '0.5rem' }}>안전 증폭 단계별 수치</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={th}>단계</th>
                  <th style={th}>성공확률(%)</th>
                  <th style={th}>실패 시 확률 증가(%p)</th>
                  <th style={th}>재료 개수</th>
                  <th style={th}>무기 골드</th>
                  <th style={th}>무기 외 골드</th>
                </tr>
              </thead>
              <tbody>
                {safeStages.map((s, idx) => (
                  <tr key={`${s.from}-${s.to}`}>
                    <td style={td}>+{s.from} → +{s.to}</td>
                    <td style={td}>
                      <input type="number" min="0" max="100" style={inp} value={Math.round(s.successProb * 100)}
                        onChange={e => updateSafeField(idx, 'successProb', Math.max(0, Math.min(100, Number(e.target.value))) / 100)} />
                    </td>
                    <td style={td}>
                      <input type="number" min="0" max="100" style={inp} value={Math.round((s.pityIncrement || 0) * 100)}
                        onChange={e => updateSafeField(idx, 'pityIncrement', Math.max(0, Math.min(100, Number(e.target.value))) / 100)} />
                    </td>
                    <td style={td}>
                      <input type="number" min="0" style={inp} value={s.material}
                        onChange={e => updateSafeField(idx, 'material', Number(e.target.value))} />
                    </td>
                    <td style={td}>
                      <input type="number" min="0" style={{ ...inp, width: '90px' }} value={s.weaponGold}
                        onChange={e => updateSafeField(idx, 'weaponGold', Number(e.target.value))} />
                    </td>
                    <td style={td}>
                      <input type="number" min="0" style={{ ...inp, width: '90px' }} value={s.nonWeaponGold}
                        onChange={e => updateSafeField(idx, 'nonWeaponGold', Number(e.target.value))} />
                    </td>
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

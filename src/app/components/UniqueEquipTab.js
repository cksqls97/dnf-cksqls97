"use client";

import React, { useState, useEffect } from 'react';
import { UNIQUE_EQUIPMENT_ITEMS } from '../lib/constants';

// 두 장비가 공유하는 재료(태초 소울 결정, 순례의 인장)는 material.key로 자동 합쳐지므로
// 여기서 한 번만 나열한다. label 뒤 '*'는 주간 수급량을 함께 입력받는 재료.
const MATERIAL_FIELDS = [
  ['primordialSoul', '태초 소울 결정'],
  ['epicSoul', '에픽 소울 결정'],
  ['pilgrimageSeal', '순례의 인장'],
  ['dawnDroplet', '여명의 빛망울']
];
const EMPTY_OWNED = () => Object.fromEntries(MATERIAL_FIELDS.map(([k]) => [k, '']));

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
    </div>
  );
}

function MaterialRow({ label, owned, required, weeklyIncome }) {
  const pct = required > 0 ? (owned / required * 100) : 0;
  const isDone = owned >= required;
  const remaining = Math.max(0, required - owned);
  const tracksWeekly = weeklyIncome !== undefined;
  let weeksText = null;
  if (tracksWeekly) {
    if (isDone) weeksText = '완료';
    else if (!weeklyIncome || weeklyIncome <= 0) weeksText = '주간 수급량 입력 필요';
    else weeksText = `${Math.ceil(remaining / weeklyIncome).toLocaleString()}주 남음`;
  }
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
        <span style={{ color: '#cbd5e1' }}>{label}</span>
        <span>
          <span style={{ color: isDone ? '#4ade80' : '#94a3b8' }}>{owned.toLocaleString()} / {required.toLocaleString()} ({Math.min(100, pct).toFixed(1)}%)</span>
          {weeksText && <span style={{ marginLeft: '0.5rem', color: isDone ? '#4ade80' : '#fbbf24', fontWeight: 'bold' }}>· {weeksText}</span>}
        </span>
      </div>
      <ProgressBar pct={pct} color={isDone ? '#4ade80' : '#38bdf8'} />
    </div>
  );
}

export default function UniqueEquipTab() {
  const [owned, setOwned] = useState(EMPTY_OWNED());
  const [weeklyDawnDroplet, setWeeklyDawnDroplet] = useState('');
  // 마운트 시 저장된 값을 불러오기 전까지 저장 effect가 초기 빈 값으로 덮어쓰지 않도록 막는 플래그.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadJson = (key, setter) => {
      const raw = localStorage.getItem(key);
      if (raw) { try { setter(prev => ({ ...prev, ...JSON.parse(raw) })); } catch (e) {} }
    };
    const loadRaw = (key, setter) => {
      const raw = localStorage.getItem(key);
      if (raw !== null) setter(raw);
    };
    const markHydrated = (setter) => setter(true);
    loadJson('DNF_UNIQUE_EQUIP_OWNED', setOwned);
    loadRaw('DNF_UNIQUE_EQUIP_WEEKLY_DAWN', setWeeklyDawnDroplet);
    markHydrated(setHydrated);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_OWNED', JSON.stringify(owned)); }, [owned, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_WEEKLY_DAWN', weeklyDawnDroplet); }, [weeklyDawnDroplet, hydrated]);

  const inp = { width: '120px', padding: '0.4rem', fontSize: '0.75rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };
  const lbl = { fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' };

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>🔨 유일장비 제작 현황</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 0, marginBottom: '1.5rem' }}>
        보유 재화를 입력하면 유일장비별 제작 진행률을 계산합니다. 태초 소울 결정·순례의 인장은 두 장비가 요구량을 공유합니다.
      </p>

      <div style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginBottom: '1rem' }}>📦 보유 재화 입력</div>
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
          {MATERIAL_FIELDS.map(([key, label]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input type="number" min="0" value={owned[key]} onChange={e => setOwned(p => ({ ...p, [key]: e.target.value }))} style={inp} placeholder="0" />
            </div>
          ))}
          <div>
            <label style={lbl}>여명의 빛망울 주간 수급량</label>
            <input type="number" min="0" value={weeklyDawnDroplet} onChange={e => setWeeklyDawnDroplet(e.target.value)} style={inp} placeholder="0" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem' }}>
        {UNIQUE_EQUIPMENT_ITEMS.map(item => {
          const overallPct = Math.min(...item.materials.map(m => {
            const ownedVal = Number(owned[m.key] || 0);
            return m.required > 0 ? Math.min(100, ownedVal / m.required * 100) : 100;
          }));
          return (
            <div key={item.key} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>{item.name}</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: overallPct >= 100 ? '#4ade80' : '#fbbf24' }}>{overallPct.toFixed(1)}%</span>
              </div>
              {item.materials.map(m => (
                <MaterialRow
                  key={m.key}
                  label={m.name}
                  owned={Number(owned[m.key] || 0)}
                  required={m.required}
                  weeklyIncome={m.weeklyTracked ? Number(weeklyDawnDroplet || 0) : undefined}
                />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

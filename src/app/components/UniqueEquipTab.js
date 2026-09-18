"use client";

import React, { useState, useEffect } from 'react';
import { UNIQUE_EQUIPMENT_ITEMS } from '../lib/constants';

// 재료별 보유량 입력창 목록. sourceKeys가 있는 재료(예: 여명의 빛망울)는 입력창을 여러 개로
// 나눠서(교환불가/계정귀속 등) 각각 입력받고, 합산해서 그 재료의 보유량으로 쓴다.
function collectInputFields(items) {
  const seen = new Map();
  for (const item of items) {
    for (const m of item.materials) {
      const fields = m.sourceKeys || [{ key: m.key, name: m.name }];
      for (const f of fields) { if (!seen.has(f.key)) seen.set(f.key, f.name); }
    }
  }
  return [...seen.entries()];
}
const MATERIAL_FIELDS = collectInputFields(UNIQUE_EQUIPMENT_ITEMS);
const getMaterialOwned = (m, owned) => (m.sourceKeys || [{ key: m.key }]).reduce((sum, f) => sum + Number(owned[f.key] || 0), 0);

// 여명의 빛망울은 주간 수급량이 고정값으로 정해져 있어 일일 페이스 추적 대상에서 제외한다.
const DAILY_TRACKED_KEYS = ['primordialSoul', 'epicSoul', 'pilgrimageSeal'];

const EMPTY_OWNED = () => Object.fromEntries(MATERIAL_FIELDS.map(([k]) => [k, '']));
const EMPTY_FIRST_RECORD = () => Object.fromEntries(DAILY_TRACKED_KEYS.map(k => [k, null]));

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// 입력값을 "그 날의 최종 보유량"으로 보고, 최초 기록 시점 대비 증가분을 경과일로 나눠 일평균
// 수급량을 구한 뒤, 남은 물량을 그 페이스로 채우면 며칠 걸리는지 계산한다.
function getDailyPaceInfo(firstRecord, currentValue, required) {
  if (currentValue >= required) return { status: 'done' };
  if (!firstRecord) return { status: 'noData' };
  const elapsedDays = daysBetween(firstRecord.date, todayISO());
  if (elapsedDays < 1) return { status: 'collecting' };
  const gained = currentValue - firstRecord.value;
  if (gained <= 0) return { status: 'noProgress' };
  const dailyRate = gained / elapsedDays;
  const daysNeeded = Math.ceil((required - currentValue) / dailyRate);
  return { status: 'ok', daysNeeded, dailyRate };
}

function paceLabel(info) {
  switch (info.status) {
    case 'done': return { text: '완료', color: '#4ade80' };
    case 'noData': return { text: '기록 대기 중 (값 입력 후 다른 곳 클릭)', color: '#64748b' };
    case 'collecting': return { text: '추이 기록 중 (1일 후 계산됨)', color: '#64748b' };
    case 'noProgress': return { text: '최근 증가 없음', color: '#f87171' };
    case 'ok': return { text: `약 ${info.daysNeeded.toLocaleString()}일 후 도달 (일평균 ${info.dailyRate.toFixed(1)}개)`, color: '#fbbf24' };
    default: return { text: '', color: '#64748b' };
  }
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
    </div>
  );
}

function MaterialRow({ label, owned, required, weeklyIncome, paceInfo }) {
  const pct = required > 0 ? (owned / required * 100) : 0;
  const isDone = owned >= required;
  const remaining = Math.max(0, required - owned);

  let extraText = null, extraColor = '#fbbf24';
  if (weeklyIncome !== undefined) {
    if (isDone) extraText = '완료';
    else if (!weeklyIncome || weeklyIncome <= 0) extraText = '주간 수급량 입력 필요';
    else extraText = `${Math.ceil(remaining / weeklyIncome).toLocaleString()}주 남음`;
    extraColor = isDone ? '#4ade80' : '#fbbf24';
  } else if (paceInfo) {
    const l = paceLabel(paceInfo);
    extraText = l.text;
    extraColor = l.color;
  }

  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
        <span style={{ color: '#cbd5e1' }}>{label}</span>
        <span>
          <span style={{ color: isDone ? '#4ade80' : '#94a3b8' }}>{owned.toLocaleString()} / {required.toLocaleString()} ({Math.min(100, pct).toFixed(1)}%)</span>
          {extraText && <span style={{ marginLeft: '0.5rem', color: extraColor, fontWeight: 'bold' }}>· {extraText}</span>}
        </span>
      </div>
      <ProgressBar pct={pct} color={isDone ? '#4ade80' : '#38bdf8'} />
    </div>
  );
}

export default function UniqueEquipTab() {
  const [owned, setOwned] = useState(EMPTY_OWNED());
  const [weeklyDawnDroplet, setWeeklyDawnDroplet] = useState('');
  const [firstRecords, setFirstRecords] = useState(EMPTY_FIRST_RECORD());
  // 마운트 시 저장된 값을 불러오기 전까지 저장 effect가 초기 빈 값으로 덮어쓰지 않도록 막는 플래그.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const readJson = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } };
    const setJson = (setter, value) => setter(prev => ({ ...prev, ...value }));
    const setRaw = (setter, value) => setter(value);

    const loadedOwned = readJson('DNF_UNIQUE_EQUIP_OWNED');
    if (loadedOwned) setJson(setOwned, loadedOwned);

    const rawWeekly = localStorage.getItem('DNF_UNIQUE_EQUIP_WEEKLY_DAWN');
    if (rawWeekly !== null) setRaw(setWeeklyDawnDroplet, rawWeekly);

    // 이 기능이 생기기 전부터 값이 들어있던 재료는 오늘을 시작점으로 소급 기록한다.
    const loadedFirstRecord = { ...EMPTY_FIRST_RECORD(), ...(readJson('DNF_UNIQUE_EQUIP_FIRST_RECORD') || {}) };
    const today = todayISO();
    DAILY_TRACKED_KEYS.forEach(key => {
      if (!loadedFirstRecord[key] && loadedOwned && Number(loadedOwned[key] || 0) > 0) {
        loadedFirstRecord[key] = { date: today, value: Number(loadedOwned[key]) };
      }
    });
    setRaw(setFirstRecords, loadedFirstRecord);
    setRaw(setHydrated, true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_OWNED', JSON.stringify(owned)); }, [owned, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_WEEKLY_DAWN', weeklyDawnDroplet); }, [weeklyDawnDroplet, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_FIRST_RECORD', JSON.stringify(firstRecords)); }, [firstRecords, hydrated]);

  // 일일 페이스 추적 대상 재료에 최초로 값을 입력하면, 그 날을 기준(최초 기록)으로 한 번만 고정한다.
  const commitFirstRecordIfNeeded = (key) => {
    if (!DAILY_TRACKED_KEYS.includes(key) || firstRecords[key]) return;
    const val = Number(owned[key] || 0);
    if (val <= 0) return;
    setFirstRecords(prev => ({ ...prev, [key]: { date: todayISO(), value: val } }));
  };

  const resetTracking = () => {
    if (!window.confirm('일일 수급 페이스 기록(최초 기록 시점)을 초기화할까요? 보유 재화 입력값은 그대로 유지됩니다.')) return;
    setFirstRecords(EMPTY_FIRST_RECORD());
  };

  const inp = { width: '120px', padding: '0.4rem', fontSize: '0.75rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };
  const lbl = { fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' };

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>🔨 유일장비 제작 현황</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 0, marginBottom: '1.5rem' }}>
        보유 재화를 입력하면 유일장비별 제작 진행률을 계산합니다. 태초 소울 결정·순례의 인장은 두 장비가 요구량을 공유합니다.
        입력값은 항상 그 날의 최종 보유량으로 취급되며, 최초 입력 시점 대비 증가분으로 일평균 수급량과 예상 소요일수를 계산합니다.
      </p>

      <div style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>📦 보유 재화 입력</div>
          <button onClick={resetTracking} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '3px', cursor: 'pointer' }}>페이스 기록 초기화</button>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
          {MATERIAL_FIELDS.map(([key, label]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input
                type="number" min="0" value={owned[key]}
                onChange={e => setOwned(p => ({ ...p, [key]: e.target.value }))}
                onBlur={() => commitFirstRecordIfNeeded(key)}
                style={inp} placeholder="0"
              />
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
            const ownedVal = getMaterialOwned(m, owned);
            return m.required > 0 ? Math.min(100, ownedVal / m.required * 100) : 100;
          }));
          return (
            <div key={item.key} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>{item.name}</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: overallPct >= 100 ? '#4ade80' : '#fbbf24' }}>{overallPct.toFixed(1)}%</span>
              </div>
              {item.materials.map(m => {
                const ownedVal = getMaterialOwned(m, owned);
                return (
                  <MaterialRow
                    key={m.key}
                    label={m.name}
                    owned={ownedVal}
                    required={m.required}
                    weeklyIncome={m.weeklyTracked ? Number(weeklyDawnDroplet || 0) : undefined}
                    paceInfo={m.weeklyTracked ? undefined : getDailyPaceInfo(firstRecords[m.key], ownedVal, m.required)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

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

// 일일 증가량 표에 표시할 "합산 재료" 목록(같은 key를 공유하는 재료는 한 열로 합쳐서 보여준다).
function collectDisplayMaterials(items) {
  const seen = new Map();
  for (const item of items) {
    for (const m of item.materials) { if (!seen.has(m.key)) seen.set(m.key, m); }
  }
  return [...seen.values()];
}
const DISPLAY_MATERIALS = collectDisplayMaterials(UNIQUE_EQUIPMENT_ITEMS);

// 여명의 빛망울은 주간 수급량이 고정값으로 정해져 있어 일일 페이스 추적 대상에서 제외한다.
const DAILY_TRACKED_KEYS = ['primordialSoul', 'epicSoul', 'pilgrimageSeal'];

const EMPTY_OWNED = () => Object.fromEntries(MATERIAL_FIELDS.map(([k]) => [k, '']));
const EMPTY_FIRST_RECORD = () => Object.fromEntries(DAILY_TRACKED_KEYS.map(k => [k, null]));

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// KST(UTC+9) 기준 날짜 계산 헬퍼. 실제 브라우저 타임존과 무관하게 항상 KST 달력 기준으로
// "오늘"과 요일을 구하기 위해, 타임스탬프를 +9시간 밀어둔 뒤 UTC getter로 읽는 방식을 쓴다.
const KST_OFFSET_MS = 9 * 3600000;
const DOW_KOR = ['일', '월', '화', '수', '목', '금', '토'];
// 하루 수급량 기록은 KST 기준 "오전 6시"에 갱신된다(던파 일일 컨텐츠 초기화 시각과 동일).
// 즉 새벽 0~6시 사이는 아직 전날의 연장이며, 그 전에 마지막으로 입력한 값이 전날의 최종 기록으로 남는다.
const GAME_DAY_RESET_HOUR = 6;
function kstTodayMidnightUTC() {
  const shifted = new Date(Date.now() + KST_OFFSET_MS);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}
function kstGameDayStartUTC() {
  const shifted = new Date(Date.now() + KST_OFFSET_MS);
  const midnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return shifted.getUTCHours() < GAME_DAY_RESET_HOUR ? midnight - 86400000 : midnight;
}
const kstGameDayISO = () => new Date(kstGameDayStartUTC()).toISOString().slice(0, 10);
function formatKSTDate(utcMidnight) {
  const d = new Date(utcMidnight);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${DOW_KOR[d.getUTCDay()]})`;
}
// 게임 데이(dateISO, "YYYY-MM-DD")의 실제 기간(KST 06:00:00 ~ 다음날 05:59:59)을 문자열로 표시한다.
function formatGameDayRange(dateISO) {
  const nextDayISO = new Date(new Date(dateISO + 'T00:00:00Z').getTime() + 86400000).toISOString().slice(0, 10);
  return `${dateISO} 06:00:00~${nextDayISO} 05:59:59`;
}

// 입력값을 "그 날의 최종 보유량"으로 보고, 최초 기록 시점 대비 증가분을 경과일로 나눠 일평균
// 수급량을 구한 뒤, 남은 물량을 그 페이스로 채우면 며칠 걸리는지 계산한다.
function getDailyPaceInfo(firstRecord, currentValue, required) {
  if (currentValue >= required) return { status: 'done' };
  if (!firstRecord) return { status: 'noData' };
  const elapsedDays = daysBetween(firstRecord.date, kstGameDayISO());
  if (elapsedDays < 1) return { status: 'collecting' };
  const gained = currentValue - firstRecord.value;
  if (gained <= 0) return { status: 'noProgress' };
  const dailyRate = gained / elapsedDays;
  const daysNeeded = Math.ceil((required - currentValue) / dailyRate);
  return { status: 'ok', daysNeeded, dailyRate };
}

// 여명의 빛망울은 KST 기준 매주 토요일에만 수급 가능하므로, 오늘 이후 가장 가까운 토요일부터
// weeksNeeded번째 토요일까지의 날짜를 완성일로 계산한다(오늘이 토요일이면 그날을 1번째로 센다).
function getWeeklySupplyCompletionDate(weeksNeeded) {
  const todayMid = kstTodayMidnightUTC();
  const dow = new Date(todayMid).getUTCDay();
  const daysUntilSaturday = (6 - dow + 7) % 7;
  const firstSaturday = todayMid + daysUntilSaturday * 86400000;
  return firstSaturday + (weeksNeeded - 1) * 7 * 86400000;
}

// 재료 하나의 진행 상태 + (계산 가능하면) 완성 예정일을 한 번에 구한다.
function getMaterialCompletion(m, ownedVal, firstRecords, weeklyDawnDroplet) {
  if (ownedVal >= m.required) return { status: 'done' };
  if (m.weeklyTracked) {
    const weekly = Number(weeklyDawnDroplet || 0);
    if (!weekly || weekly <= 0) return { status: 'noWeeklyIncome' };
    const weeksNeeded = Math.ceil((m.required - ownedVal) / weekly);
    return { status: 'ok', weeksNeeded, dateUTC: getWeeklySupplyCompletionDate(weeksNeeded) };
  }
  const pace = getDailyPaceInfo(firstRecords[m.key], ownedVal, m.required);
  if (pace.status !== 'ok') return pace;
  return { status: 'ok', daysNeeded: pace.daysNeeded, dailyRate: pace.dailyRate, dateUTC: kstTodayMidnightUTC() + pace.daysNeeded * 86400000 };
}

function materialCompletionLabel(info) {
  switch (info.status) {
    case 'done': return { text: '완료', color: '#4ade80' };
    case 'noData': return { text: '기록 대기 중 (값 입력 후 다른 곳 클릭)', color: '#64748b' };
    case 'collecting': return { text: '추이 기록 중 (1일 후 계산됨)', color: '#64748b' };
    case 'noProgress': return { text: '최근 증가 없음', color: '#f87171' };
    case 'noWeeklyIncome': return { text: '주간 수급량 입력 필요', color: '#fbbf24' };
    case 'ok': {
      const rateText = info.weeksNeeded !== undefined
        ? `${info.weeksNeeded.toLocaleString()}주 남음`
        : `약 ${info.daysNeeded.toLocaleString()}일 후 (일평균 ${info.dailyRate.toFixed(1)}개)`;
      return { text: `${rateText} → ${formatKSTDate(info.dateUTC)} 예상`, color: '#fbbf24' };
    }
    default: return { text: '', color: '#64748b' };
  }
}

// 아이템의 예상 완성일 = 그 아이템에 필요한 재료들 중 가장 늦게 채워지는 재료의 완성일(병목).
// 아직 계산 불가능한(진행 추이 미확인 등) 재료가 하나라도 있으면 전체 완성일도 "정보 부족"으로 둔다.
function getItemCompletion(item, owned, firstRecords, weeklyDawnDroplet) {
  let maxDateUTC = null;
  let allDone = true;
  for (const m of item.materials) {
    const ownedVal = getMaterialOwned(m, owned);
    const info = getMaterialCompletion(m, ownedVal, firstRecords, weeklyDawnDroplet);
    if (info.status === 'done') continue;
    allDone = false;
    if (info.status !== 'ok') return { status: 'unknown' };
    if (maxDateUTC === null || info.dateUTC > maxDateUTC) maxDateUTC = info.dateUTC;
  }
  if (allDone) return { status: 'done' };
  return { status: 'ok', dateUTC: maxDateUTC };
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
    </div>
  );
}

function MaterialRow({ label, owned, required, completion }) {
  const pct = required > 0 ? (owned / required * 100) : 0;
  const isDone = owned >= required;
  const { text: extraText, color: extraColor } = materialCompletionLabel(completion);

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

// 날짜별 기록(dailyLog)을 오름차순으로 정리해, 전날 대비 증가량을 함께 계산한다.
// 가장 오래된(최초) 기록은 비교 대상이 없으므로 isFirst로 표시해 절대값을, 그 외에는 증가량만 쓴다.
function computeDailyDeltaRows(dailyLog) {
  const asc = [...dailyLog].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return asc.map((entry, i) => {
    const prevEntry = i > 0 ? asc[i - 1] : null;
    const cells = DISPLAY_MATERIALS.map(m => {
      const value = getMaterialOwned(m, entry.owned);
      const prevValue = prevEntry ? getMaterialOwned(m, prevEntry.owned) : null;
      return { key: m.key, value, delta: prevValue === null ? null : value - prevValue };
    });
    return { date: entry.date, isFirst: i === 0, cells };
  }).reverse(); // 최신 날짜가 위로 오도록
}

// 가공(증감 계산) 없이, 실제로 저장된 원본 입력값(각 입력창 단위, 날짜별)을 그대로 보여준다.
function RawLogTable({ dailyLog }) {
  const rowsDesc = [...dailyLog].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).reverse();
  const th = { textAlign: 'right', padding: '0.5rem 0.7rem', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' };
  const td = { textAlign: 'right', padding: '0.45rem 0.7rem', fontSize: '0.72rem', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap', color: '#e2e8f0' };

  return (
    <div style={{ marginTop: '0.8rem' }}>
      <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', position: 'sticky', top: 0, background: '#111827' }}>날짜</th>
              {MATERIAL_FIELDS.map(([key, label]) => (
                <th key={key} style={{ ...th, position: 'sticky', top: 0, background: '#111827' }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsDesc.map(entry => (
              <tr key={entry.date}>
                <td style={{ ...td, textAlign: 'left', color: '#cbd5e1' }}>{formatGameDayRange(entry.date)}</td>
                {MATERIAL_FIELDS.map(([key]) => (
                  <td key={key} style={td}>{Number(entry.owned[key] || 0).toLocaleString()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailyLogTable({ dailyLog }) {
  const [showRaw, setShowRaw] = useState(false);
  const rows = computeDailyDeltaRows(dailyLog);
  if (rows.length === 0) return null;
  const th = { textAlign: 'right', padding: '0.5rem 0.7rem', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' };
  const td = { textAlign: 'right', padding: '0.45rem 0.7rem', fontSize: '0.72rem', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>📈 일별 증가량</div>
        <button
          onClick={() => setShowRaw(v => !v)}
          style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '3px', cursor: 'pointer' }}
        >
          {showRaw ? '증가량 표로 돌아가기' : '🗂 입력된 원본 데이터 전체 보기'}
        </button>
      </div>
      {showRaw ? (
        <RawLogTable dailyLog={dailyLog} />
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: '360px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left', position: 'sticky', top: 0, background: '#111827' }}>날짜</th>
                {DISPLAY_MATERIALS.map(m => (
                  <th key={m.key} style={{ ...th, position: 'sticky', top: 0, background: '#111827' }}>{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.date} style={row.isFirst ? { background: 'rgba(255,255,255,0.03)' } : undefined}>
                  <td style={{ ...td, textAlign: 'left', color: '#cbd5e1' }}>
                    {formatGameDayRange(row.date)}
                    {row.isFirst && <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', color: '#94a3b8' }}>(최초 기록)</span>}
                  </td>
                  {row.cells.map(cell => (
                    <td key={cell.key} style={{ ...td, color: row.isFirst ? '#94a3b8' : '#e2e8f0' }}>
                      {row.isFirst
                        ? cell.value.toLocaleString()
                        : (cell.delta === 0
                            ? '-'
                            : <span style={{ color: cell.delta > 0 ? '#4ade80' : '#f87171' }}>{cell.delta > 0 ? '+' : ''}{cell.delta.toLocaleString()}</span>)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function UniqueEquipTab() {
  const [owned, setOwned] = useState(EMPTY_OWNED());
  const [weeklyDawnDroplet, setWeeklyDawnDroplet] = useState('');
  const [firstRecords, setFirstRecords] = useState(EMPTY_FIRST_RECORD());
  const [dailyLog, setDailyLog] = useState([]);
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
    const today = kstGameDayISO();
    DAILY_TRACKED_KEYS.forEach(key => {
      if (!loadedFirstRecord[key] && loadedOwned && Number(loadedOwned[key] || 0) > 0) {
        loadedFirstRecord[key] = { date: today, value: Number(loadedOwned[key]) };
      }
    });
    setRaw(setFirstRecords, loadedFirstRecord);

    // 일별 기록 로그. 이 기능보다 firstRecords(최초 기록) 추적이 먼저 생겼기 때문에, 로그가 아직
    // 그 최초 기록 시점(가장 오래된 날짜)을 담고 있지 않다면 그 시점의 값을 소급 복원해 채워 넣는다.
    // (firstRecords에 없는 재료는 그 시점 값을 알 수 없으므로 현재값으로 대신한다.)
    // firstRecords조차 없으면(완전히 새로운 사용자) 오늘 값으로만 한 줄 기록한다.
    let loadedDailyLog = readJson('DNF_UNIQUE_EQUIP_DAILY_LOG') || [];
    if (loadedOwned) {
      const knownRecords = DAILY_TRACKED_KEYS.map(key => loadedFirstRecord[key]).filter(Boolean);
      if (knownRecords.length > 0) {
        const earliestDate = knownRecords.reduce((min, r) => (r.date < min ? r.date : min), knownRecords[0].date);
        const alreadyCovered = loadedDailyLog.some(e => e.date <= earliestDate);
        if (!alreadyCovered) {
          const backfillOwned = { ...loadedOwned };
          DAILY_TRACKED_KEYS.forEach(key => {
            if (loadedFirstRecord[key]) backfillOwned[key] = String(loadedFirstRecord[key].value);
          });
          loadedDailyLog = [{ date: earliestDate, owned: backfillOwned }, ...loadedDailyLog];
        }
      } else if (loadedDailyLog.length === 0) {
        loadedDailyLog = [{ date: today, owned: loadedOwned }];
      }
    }
    setRaw(setDailyLog, loadedDailyLog);

    setRaw(setHydrated, true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_OWNED', JSON.stringify(owned)); }, [owned, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_WEEKLY_DAWN', weeklyDawnDroplet); }, [weeklyDawnDroplet, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_FIRST_RECORD', JSON.stringify(firstRecords)); }, [firstRecords, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem('DNF_UNIQUE_EQUIP_DAILY_LOG', JSON.stringify(dailyLog)); }, [dailyLog, hydrated]);

  // "오늘(KST 6시 기준 게임데이)"의 기록을 항상 최신 보유량으로 맞춰 둔다. 입력을 바꿀 때뿐 아니라
  // 아무 입력 없이 날짜만 넘어가도(하루 종일 값이 그대로였어도) 그 날의 행이 생기도록,
  // blur 이벤트가 아니라 owned 변경 + 최초 마운트(하이드레이션 완료) 시점 모두에 걸어 둔다.
  useEffect(() => {
    if (!hydrated) return;
    const upsertToday = (setter, snapshot) => setter(prev => {
      const today = kstGameDayISO();
      const idx = prev.findIndex(e => e.date === today);
      if (idx === -1) return [...prev, { date: today, owned: snapshot }];
      const next = [...prev];
      next[idx] = { date: today, owned: snapshot };
      return next;
    });
    upsertToday(setDailyLog, { ...owned });
  }, [owned, hydrated]);

  // 일일 페이스 추적 대상 재료에 최초로 값을 입력하면, 그 날을 기준(최초 기록)으로 한 번만 고정한다.
  const commitFirstRecordIfNeeded = (key) => {
    if (!DAILY_TRACKED_KEYS.includes(key) || firstRecords[key]) return;
    const val = Number(owned[key] || 0);
    if (val <= 0) return;
    setFirstRecords(prev => ({ ...prev, [key]: { date: kstGameDayISO(), value: val } }));
  };

  const resetTracking = () => {
    if (!window.confirm('일일 수급 페이스 기록(최초 기록 시점)을 초기화할까요? 보유 재화 입력값은 그대로 유지됩니다.')) return;
    setFirstRecords(EMPTY_FIRST_RECORD());
  };

  const inp = { width: '120px', padding: '0.4rem', fontSize: '0.75rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };
  const lbl = { fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' };

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>🔨 유일 장비 제작 현황</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 0, marginBottom: '1.5rem' }}>
        보유 재화를 입력하면 유일장비별 제작 진행률을 계산합니다. 태초 소울 결정·순례의 인장은 두 장비가 요구량을 공유합니다.
        입력값은 항상 그 날의 최종 보유량으로 취급되며(하루는 KST 오전 6시에 갱신), 최초 입력 시점 대비 증가분으로 일평균 수급량과 예상 완성일을 계산합니다.
        여명의 빛망울은 KST 기준 매주 토요일에만 수급 가능한 점을 반영합니다.
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
          const itemCompletion = getItemCompletion(item, owned, firstRecords, weeklyDawnDroplet);
          return (
            <div key={item.key} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>{item.name}</h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: overallPct >= 100 ? '#4ade80' : '#fbbf24' }}>{overallPct.toFixed(1)}%</span>
              </div>
              <div style={{ fontSize: '0.7rem', marginBottom: '1rem', fontWeight: 'bold', color: itemCompletion.status === 'done' ? '#4ade80' : itemCompletion.status === 'ok' ? '#fbbf24' : '#64748b' }}>
                {itemCompletion.status === 'done' && '✅ 재료 준비 완료'}
                {itemCompletion.status === 'ok' && `📅 예상 완성일: ${formatKSTDate(itemCompletion.dateUTC)}`}
                {itemCompletion.status === 'unknown' && '📅 예상 완성일: 정보 부족 (재료별 추이 기록 필요)'}
              </div>
              {item.materials.map(m => {
                const ownedVal = getMaterialOwned(m, owned);
                return (
                  <MaterialRow
                    key={m.key}
                    label={m.name}
                    owned={ownedVal}
                    required={m.required}
                    completion={getMaterialCompletion(m, ownedVal, firstRecords, weeklyDawnDroplet)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <DailyLogTable dailyLog={dailyLog} />
    </section>
  );
}

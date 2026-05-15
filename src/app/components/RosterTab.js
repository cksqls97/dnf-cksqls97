"use client";

import React, { useState } from 'react';
import { SERVER_LIST, ADVANCED_DUNGEONS, RAIDS } from '../lib/constants';
import { getTierClass, buildGroups } from '../lib/gameUtils';

// ─── ManualModal ────────────────────────────────────────────────────────────

function ManualModal({ char, form, setForm, customOptions, onSave, onClose }) {
  const groups = [
    { title: '장비 영역', keys: ['enchant', 'title'], labels: { enchant: '마부 상태', title: '칭호 현황' } },
    { title: '크리쳐 영역', keys: ['creature', 'creatureArtifact'], labels: { creature: '크리쳐 현황', creatureArtifact: '크리쳐 아티팩트' } },
    { title: '스위칭 영역', keys: ['buffLevel', 'buffAbyss'], labels: { buffLevel: '버프 레벨', buffAbyss: '심연의 편린 개수' } },
    {
      title: '아바타 영역',
      keys: ['avatar', 'emblem', 'platEmblem', 'skinAvatar', 'skinSocket', 'skinEmblem', 'weaponAvatar', 'weaponSocket', 'weaponEmblem', 'aura', 'auraEmblem'],
      labels: { avatar: '아바타 현황', emblem: '일반 엠블렘', platEmblem: '상하의 플래티넘', skinAvatar: '피부 아바타', skinSocket: '피부 소켓 여부', skinEmblem: '피부 엠블렘', weaponAvatar: '무기 아바타', weaponSocket: '무기 소켓 여부', weaponEmblem: '무기 엠블렘', aura: '오라 현황', auraEmblem: '오라 엠블렘' }
    }
  ];

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '650px', width: '95%' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>[{char.base.charName}] 수동 제원 설정</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.5rem' }}>상단 🛠️ 탭에서 구성한 목록에서만 선택 가능합니다.</p>
        <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.7rem', margin: '0 0 1rem 0', color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>기본 설정</h3>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', color: '#cbd5e1' }}>역할군 (로스터 편성에 사용됨)</label>
          <select
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem' }}
            value={form.role || 'dealer'}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="dealer">딜러</option>
            <option value="buffer">버퍼</option>
          </select>
        </div>
        <div className="manual-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
          {groups.map(group => (
            <div key={group.title} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '0.7rem', margin: '0 0 1rem 0', color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>{group.title}</h3>
              {group.keys.map(k => (
                <div key={k} style={{ marginBottom: '0.8rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', color: '#cbd5e1' }}>{group.labels[k]}</label>
                  {(k === 'buffAbyss' || k === 'buffLevel') ? (
                    <input
                      type="number" min="0"
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem' }}
                      value={form[k] || ''}
                      placeholder="양의 정수 입력"
                      onChange={e => setForm({ ...form, [k]: e.target.value })}
                    />
                  ) : (
                    <select
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem' }}
                      value={form[k] || ''}
                      onChange={e => setForm({ ...form, [k]: e.target.value })}
                    >
                      <option value="">- 선택 안 함 -</option>
                      {customOptions[k]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
          <button type="button" onClick={onSave}>저장</button>
        </div>
      </div>
    </div>
  );
}

// ─── 던담 수치 포맷 헬퍼 ──────────────────────────────────────────────────────

function formatDundamScore(n) {
  if (!n || n <= 0) return '';
  const rounded = Math.round(n / 100_000_000) * 100_000_000;
  if (rounded === 0) return n.toLocaleString();
  const jo = Math.floor(rounded / 1_000_000_000_000);
  const eok = Math.floor((rounded % 1_000_000_000_000) / 100_000_000);
  if (jo > 0 && eok > 0) return `${jo}조 ${eok}억`;
  if (jo > 0) return `${jo}조`;
  if (eok > 0) return `${eok}억`;
  return n.toLocaleString();
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── RosterOverview ──────────────────────────────────────────────────────────

function RosterOverview({ characters, isAdding, isRefreshing, server, charName, setServer, setCharName, onAdd, onRefreshAll, onForceRefreshAll, onDelete, onSaveManual }) {
  const [editingDundamId, setEditingDundamId] = React.useState(null);
  const [editingDundamValue, setEditingDundamValue] = React.useState('');
  const groups = buildGroups(characters);

  return (
    <>
      <section className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form className="add-form" onSubmit={onAdd}>
          <select value={server} onChange={e => setServer(e.target.value)}>
            {SERVER_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="text" placeholder="캐릭터명 입력" value={charName} onChange={e => setCharName(e.target.value)} />
          <button type="submit" disabled={isAdding}>{isAdding ? <div className="loader" /> : "캐릭터 추가"}</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => onRefreshAll()} disabled={isRefreshing || characters.length === 0} style={{ background: '#475569' }}>
              {isRefreshing ? <div className="loader" /> : "🔄 전체 갱신"}
            </button>
            <button type="button" onClick={() => onForceRefreshAll()} disabled={isRefreshing || characters.length === 0} style={{ background: '#7c3aed' }} title="명성 감소 여부 무시하고 API 최신값으로 강제 덮어쓰기">
              {isRefreshing ? <div className="loader" /> : "⚡ 강제 갱신"}
            </button>
          </div>
        </form>
      </section>

      <section className="glass-panel table-wrapper">
        {characters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>상단의 폼을 이용해 관리할 캐릭터를 추가해주세요.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {groups.map((group, gIdx) => (
              <div key={gIdx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ marginBottom: '1rem', color: '#38bdf8', fontSize: '1.1rem', paddingLeft: '0.5rem', borderLeft: '3px solid #38bdf8' }}>그룹 {gIdx + 1}</h3>
                <table style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%', textAlign: 'center' }}>서버</th>
                      <th style={{ width: '7%', textAlign: 'center' }}>직업</th>
                      <th style={{ width: '14%', textAlign: 'center' }}>캐릭터명</th>
                      <th style={{ width: '6%', textAlign: 'center' }}>명성</th>
                      <th style={{ width: '11%', textAlign: 'center' }}>상급던전</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>레이드</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>아포칼립스</th>
                      <th style={{ width: '12%', textAlign: 'center' }}>장비 (점수)</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>서약 (점수)</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>던담</th>
                      <th style={{ width: '7%', textAlign: 'center' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((c, mIdx) => {
                      if (!c) {
                        return (
                          <tr key={`empty-${mIdx}`}>
                            <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                              {mIdx < 3 ? '딜러 자리 비어있음' : '버퍼 자리 비어있음'}
                            </td>
                          </tr>
                        );
                      }
                      const filteredRaids = RAIDS.filter(r => r.name !== '이내 황혼전' || gIdx < 2);
                      const nextDungeon = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > c.base.fame);
                      const nextRaid = [...filteredRaids].reverse().find(r => r.fame > c.base.fame);
                      const diffD = nextDungeon ? nextDungeon.fame - c.base.fame : null;
                      const diffR = nextRaid ? nextRaid.fame - c.base.fame : null;
                      const isImminentFame = (diffD !== null && diffD < 1000) || (diffR !== null && diffR < 1000);

                      const fame = c.base.fame;
                      const apocState = fame >= 105881 ? 3 : fame >= 98171 ? 2 : fame >= 73993 ? 1 : 0;
                      const apocLabels = ['', '매칭', '1단계', '2단계'];
                      const apocTargets = [{ name: '매칭', fame: 73993 }, { name: '1단계', fame: 98171 }, { name: '2단계', fame: 105881 }, null];
                      const apocNext = apocState < 3 ? apocTargets[apocState] : null;
                      const apocDiff = apocNext ? apocNext.fame - fame : null;
                      const isApocImminent = apocDiff !== null && apocDiff < 1000;

                      const clearedDungeons = ADVANCED_DUNGEONS.filter(d => c.base.fame >= d.fame).slice(0, 2);
                      const clearedRaids = filteredRaids.filter(r => c.base.fame >= r.fame);

                      return (
                        <tr key={c.id} style={{ verticalAlign: 'middle', background: mIdx === 3 ? 'rgba(167, 139, 250, 0.05)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td data-label="서버" style={{ textAlign: 'center' }}>{SERVER_LIST.find(s => s.id === c.base.server)?.name || c.base.server}</td>
                          <td data-label="직업" style={{ textAlign: 'center' }}>{c.base.jobGrowName}</td>
                          <td data-label="캐릭터명" style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{c.base.charName}</div>
                          </td>
                          <td data-label="명성" style={{ textAlign: 'center' }}>
                            <div style={{ color: isImminentFame ? '#fef08a' : '#fbbf24', fontWeight: 'bold', fontSize: '1.05rem', textShadow: isImminentFame ? '0 0 10px rgba(234, 179, 8, 0.6)' : 'none' }}>
                              {isImminentFame && <span style={{ marginRight: '3px' }}>🔥</span>}
                              {c.base.fame.toLocaleString()}
                            </div>
                          </td>
                          <td data-label="상급던전" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {nextDungeon && (
                                <div style={{ fontSize: '0.7rem', color: diffD < 1000 ? '#fef08a' : '#fca5a5', background: diffD < 1000 ? 'rgba(234,179,8,0.15)' : 'rgba(248,113,113,0.08)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: diffD < 1000 ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(248,113,113,0.2)', whiteSpace: 'nowrap', fontWeight: diffD < 1000 ? 'bold' : 'normal' }}>
                                  {diffD < 1000 ? '🔥' : '🚀'} {nextDungeon.name}까지 <strong style={{ color: diffD < 1000 ? '#fde047' : '#f87171' }}>{diffD.toLocaleString()}</strong>
                                </div>
                              )}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                                {clearedDungeons.map(d => (
                                  <span key={d.name} style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.7rem', border: '1px solid rgba(56,189,248,0.2)' }}>{d.name}</span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td data-label="레이드" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {nextRaid && (
                                <div style={{ fontSize: '0.7rem', color: diffR < 1000 ? '#fef08a' : '#c084fc', background: diffR < 1000 ? 'rgba(234,179,8,0.15)' : 'rgba(192,132,252,0.08)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: diffR < 1000 ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(192,132,252,0.2)', whiteSpace: 'nowrap', fontWeight: diffR < 1000 ? 'bold' : 'normal' }}>
                                  {diffR < 1000 ? '🔥' : '⚔️'} {nextRaid.name}까지 <strong style={{ color: diffR < 1000 ? '#fde047' : '#a855f7' }}>{diffR.toLocaleString()}</strong>
                                </div>
                              )}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
                                {clearedRaids.map(r => (
                                  <span key={r.name} style={{ background: 'rgba(192,132,252,0.15)', color: '#d8b4fe', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.7rem', border: '1px solid rgba(192,132,252,0.2)' }}>{r.name}</span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td data-label="아포칼립스" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {apocState > 0 && (
                                <span style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid rgba(251,146,60,0.35)' }}>
                                  💀 {apocLabels[apocState]}
                                </span>
                              )}
                              {apocNext && (
                                <div style={{ fontSize: '0.7rem', color: isApocImminent ? '#fef08a' : '#fb923c', background: isApocImminent ? 'rgba(234,179,8,0.15)' : 'rgba(251,146,60,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: isApocImminent ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(251,146,60,0.2)', whiteSpace: 'nowrap', fontWeight: isApocImminent ? 'bold' : 'normal' }}>
                                  {isApocImminent ? '🔥' : (apocState === 0 ? '💀' : '▶')} {apocNext.name}까지 <strong style={{ color: isApocImminent ? '#fde047' : '#f97316' }}>{apocDiff.toLocaleString()}</strong>
                                </div>
                              )}
                            </div>
                          </td>
                          <td data-label="장비" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '-0.3px' }}>{c.equipment.setName}</div>
                            <div className={getTierClass(c.equipment.rarity)} style={{ fontSize: '0.7rem', letterSpacing: '-0.3px', marginTop: '2px' }}>
                              {c.equipment.gradeDesc} ({c.equipment.points})
                            </div>
                          </td>
                          <td data-label="서약" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '-0.3px' }}>{c.oath.setName}</div>
                            <div className={getTierClass(c.oath.rarity)} style={{ fontSize: '0.7rem', letterSpacing: '-0.3px', marginTop: '2px' }}>
                              {c.oath.gradeDesc} ({c.oath.points})
                            </div>
                          </td>
                          <td data-label="던담" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            {(() => {
                              const score = c.manual?.dundamScore;
                              const scoreAt = c.manual?.dundamUpdatedAt;
                              const fameAtEntry = c.manual?.dundamFameAtEntry;
                              const needsUpdate = score && fameAtEntry !== undefined && c.base.fame > fameAtEntry;
                              if (editingDundamId === c.id) {
                                return (
                                  <input
                                    autoFocus
                                    type="text"
                                    value={editingDundamValue}
                                    onChange={e => setEditingDundamValue(e.target.value)}
                                    onBlur={() => {
                                      const raw = Number(editingDundamValue.replace(/,/g, ''));
                                      if (!isNaN(raw) && raw > 0) {
                                        onSaveManual(c.id, { ...c.manual, dundamScore: raw, dundamUpdatedAt: Date.now(), dundamFameAtEntry: c.base.fame });
                                      }
                                      setEditingDundamId(null);
                                      setEditingDundamValue('');
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') e.target.blur();
                                      if (e.key === 'Escape') { setEditingDundamId(null); setEditingDundamValue(''); }
                                    }}
                                    style={{ width: '100px', padding: '0.2rem 0.3rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(56,189,248,0.5)', color: '#fff', borderRadius: '4px', textAlign: 'center' }}
                                  />
                                );
                              }
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <div
                                    onClick={() => { setEditingDundamId(c.id); setEditingDundamValue(score ? score.toLocaleString() : ''); }}
                                    style={{ cursor: 'pointer', padding: '0.1rem 0.2rem' }}
                                    title="클릭하여 던담 수치 입력"
                                  >
                                    {score ? (
                                      <>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: needsUpdate ? '#fbbf24' : '#e2e8f0' }}>
                                          {c.manual?.role === 'buffer' ? score.toLocaleString() : formatDundamScore(score)}
                                        </div>
                                        {needsUpdate && (
                                          <div style={{ fontSize: '0.65rem', color: '#fbbf24', lineHeight: 1.2 }}>⚠️ 갱신 필요</div>
                                        )}
                                        {scoreAt && (
                                          <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '1px' }}>{formatTimestamp(scoreAt)}</div>
                                        )}
                                      </>
                                    ) : (
                                      <span style={{ fontSize: '0.7rem', color: '#334155' }}>클릭 입력</span>
                                    )}
                                  </div>
                                  {c.charId && (
                                    <a href={`https://dundam.xyz/character?server=${c.base.server}&key=${c.charId}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.65rem', color: '#38bdf8', textDecoration: 'none' }}>조회 🔗</a>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td data-label="관리" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button type="button" className="danger" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }} onClick={() => onDelete(c.id)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ─── RosterItems ─────────────────────────────────────────────────────────────

function RosterItems({ characters, onOpenManual }) {
  const groups = buildGroups(characters);
  const dash = <span style={{ color: '#475569' }}>-</span>;
  const cell = (content, isBuffer) => (
    <td style={{ padding: '0.5rem 0.7rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle', background: isBuffer ? 'rgba(167, 139, 250, 0.05)' : 'transparent' }}>
      {content}
    </td>
  );

  return (
    <section className="glass-panel" style={{ overflowX: 'auto' }}>
      <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.5rem' }}>
        🎽 캐릭터 아이템 현황
        <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.6rem', fontWeight: 'normal' }}>수동 입력 정보 기준</span>
      </h3>
      {characters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>캐릭터를 먼저 추가해주세요.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', color: '#cbd5e1', tableLayout: 'auto', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              {['캐릭터명', '직업', '칭호', '오라', '크리쳐', '마부', '스위칭', '아바타', '피부', '무기압', '수동설정'].map((h, i) => (
                <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: ['#e2e8f0', '#e2e8f0', '#38bdf8', '#f472b6', '#10b981', '#a78bfa', '#fb923c', '#818cf8', '#e879f9', '#ef4444', '#64748b'][i], fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((group, gIdx) => [
              <tr key={`group-${gIdx}-header`} style={{ background: 'rgba(56,189,248,0.1)', borderBottom: '1px solid rgba(56,189,248,0.3)' }}>
                <td colSpan="11" style={{ textAlign: 'left', fontWeight: 'bold', color: '#38bdf8', padding: '0.4rem 1rem' }}>그룹 {gIdx + 1}</td>
              </tr>,
              ...group.map((c, mIdx) => {
                if (!c) {
                  return (
                    <tr key={`group-${gIdx}-empty-${mIdx}`}>
                      <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.2)' }}>
                        {mIdx < 3 ? '딜러 자리 비어있음' : '버퍼 자리 비어있음'}
                      </td>
                    </tr>
                  );
                }
                const m = c.manual || {};
                const isBuf = mIdx === 3;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = isBuf ? 'rgba(167,139,250,0.1)' : 'rgba(56,189,248,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    {cell(<span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{c.base.charName}</span>, isBuf)}
                    {cell(<span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{c.base.jobGrowName}</span>, isBuf)}
                    {cell(m.title ? <span style={{ color: '#38bdf8' }}>{m.title}</span> : dash, isBuf)}
                    {cell((m.aura || m.auraEmblem) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {m.aura && <span style={{ color: '#f472b6' }}>{m.aura}</span>}
                        {m.auraEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.auraEmblem}]</span>}
                      </div>
                    ) : dash, isBuf)}
                    {cell((m.creature || m.creatureArtifact) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {m.creature && <span style={{ color: '#10b981' }}>{m.creature}</span>}
                        {m.creatureArtifact && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.creatureArtifact}]</span>}
                      </div>
                    ) : dash, isBuf)}
                    {cell(m.enchant ? <span style={{ color: '#a78bfa' }}>{m.enchant}</span> : dash, isBuf)}
                    {cell((m.buffLevel || m.buffAbyss) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {m.buffLevel && <span style={{ color: '#fb923c' }}>버프 {String(m.buffLevel).includes('레벨') ? m.buffLevel : `${m.buffLevel}레벨`}</span>}
                        {m.buffAbyss && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>편린 {String(m.buffAbyss).includes('개') ? m.buffAbyss : `${m.buffAbyss}개`}</span>}
                      </div>
                    ) : dash, isBuf)}
                    {cell((m.avatar || m.platEmblem || m.emblem) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {m.avatar && <span style={{ color: '#818cf8' }}>{m.avatar}</span>}
                        {m.platEmblem && <span style={{ color: 'rgba(56,189,248,0.7)', fontSize: '0.7rem' }}>플:{m.platEmblem}</span>}
                        {m.emblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>일:{m.emblem}</span>}
                      </div>
                    ) : dash, isBuf)}
                    {cell((m.skinAvatar || m.skinSocket || m.skinEmblem) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {m.skinAvatar && <span style={{ color: '#e879f9' }}>{m.skinAvatar}</span>}
                        {m.skinSocket && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>소켓: {m.skinSocket}</span>}
                        {m.skinEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.skinEmblem}]</span>}
                      </div>
                    ) : dash, isBuf)}
                    {cell((m.weaponAvatar || m.weaponSocket || m.weaponEmblem) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {m.weaponAvatar && <span style={{ color: '#ef4444' }}>{m.weaponAvatar}</span>}
                        {m.weaponSocket && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>소켓: {m.weaponSocket}</span>}
                        {m.weaponEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.weaponEmblem}]</span>}
                      </div>
                    ) : dash, isBuf)}
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle', background: isBuf ? 'rgba(167,139,250,0.05)' : 'transparent' }}>
                      <button type="button" onClick={() => onOpenManual(c)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', background: '#3b82f6', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>⚙️</button>
                    </td>
                  </tr>
                );
              })
            ])}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ─── RosterTab (root) ────────────────────────────────────────────────────────

export default function RosterTab({
  characters, isAdding, isRefreshing, server, charName, setServer, setCharName,
  customOptions, onAdd, onRefreshAll, onForceRefreshAll, onDelete, onSaveManual
}) {
  const [subTab, setSubTab] = useState('overview');
  const [manualChar, setManualChar] = useState(null);
  const [manualForm, setManualForm] = useState({});

  const openManualModal = (char) => {
    const existingManual = char.manual || {};
    const bufferKeywords = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];
    const jobName = char.base?.jobGrowName || char.base?.jobName || '';
    const defaultRole = bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
    setManualForm({
      enchant: '', title: '', creature: '', creatureArtifact: '', buffLevel: '', buffAbyss: '',
      avatar: '', emblem: '', platEmblem: '', skinAvatar: '', skinSocket: '', skinEmblem: '',
      weaponAvatar: '', weaponSocket: '', weaponEmblem: '', aura: '', auraEmblem: '',
      ...existingManual,
      role: existingManual.isManualRoleSet ? existingManual.role : defaultRole
    });
    setManualChar(char);
  };

  const handleSaveManual = () => {
    if (!manualChar) return;
    onSaveManual(manualChar.id, { ...manualForm, isManualRoleSet: true });
    setManualChar(null);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        <button className={`tab-btn ${subTab === 'overview' ? 'active' : ''}`} onClick={() => setSubTab('overview')} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>📋 캐릭터 종합 정보</button>
        <button className={`tab-btn ${subTab === 'items' ? 'active' : ''}`} onClick={() => setSubTab('items')} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>🎽 캐릭터 아이템 현황</button>
      </div>

      {subTab === 'overview' && (
        <RosterOverview
          characters={characters} isAdding={isAdding} isRefreshing={isRefreshing}
          server={server} charName={charName} setServer={setServer} setCharName={setCharName}
          onAdd={onAdd} onRefreshAll={onRefreshAll} onForceRefreshAll={onForceRefreshAll} onDelete={onDelete}
          onSaveManual={onSaveManual}
        />
      )}
      {subTab === 'items' && (
        <RosterItems characters={characters} onOpenManual={openManualModal} />
      )}

      {manualChar && (
        <ManualModal
          char={manualChar} form={manualForm} setForm={setManualForm}
          customOptions={customOptions} onSave={handleSaveManual} onClose={() => setManualChar(null)}
        />
      )}
    </>
  );
}

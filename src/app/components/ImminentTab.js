"use client";

import React, { useState } from 'react';
import { ADVANCED_DUNGEONS, RAIDS } from '../lib/constants';
import { getRole } from '../lib/gameUtils';

function renderCard(c, target, diff, emoji = '🚀', accentColor = '#38bdf8', currentBadge = null) {
  const isImminent = diff < 1000;
  return (
    <div key={c.id} style={{
      background: isImminent ? 'rgba(234,179,8,0.05)' : 'rgba(255,255,255,0.02)',
      border: isImminent ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', padding: '1.2rem',
      boxShadow: isImminent ? '0 0 12px rgba(234,179,8,0.1)' : 'none',
      display: 'flex', flexDirection: 'column', gap: '0.8rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isImminent ? '#fef08a' : '#e2e8f0' }}>{c.base.charName}</span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.base.jobGrowName}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>명성: <span style={{ color: isImminent ? '#fbbf24' : accentColor, fontWeight: 'bold' }}>{c.base.fame.toLocaleString()}</span></div>
        {currentBadge && <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>{currentBadge}</span>}
      </div>
      <div style={{ background: isImminent ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.7rem', color: isImminent ? '#fef08a' : '#cbd5e1', textAlign: 'center', marginTop: 'auto', border: isImminent ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
        {isImminent ? '🔥' : emoji} <strong>{target.name}</strong> 컷까지 <strong style={{ color: '#fff', fontSize: '1.15em' }}>{diff.toLocaleString()}</strong> 남음{isImminent ? '!' : ''}
      </div>
    </div>
  );
}

const emptyMsg = (msg = '모든 조건을 달성했거나 대상 캐릭터가 없습니다.') => (
  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', gridColumn: '1 / -1', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>{msg}</div>
);

function DungeonSubTab({ characters, view, setView }) {
  const dungeons = [...ADVANCED_DUNGEONS].reverse();

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[['byDungeon', '🗂️ 던전별 정렬'], ['overall', '📊 전체 정렬']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: view === v ? 'rgba(147,197,253,0.2)' : 'rgba(255,255,255,0.04)', border: view === v ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(255,255,255,0.1)', color: view === v ? '#93c5fd' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      {view === 'overall' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {(() => {
            const items = characters.map(c => {
              const next = dungeons.find(d => d.fame > c.base.fame);
              return { c, next };
            }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));
            return items.length === 0 ? emptyMsg('모든 캐릭터가 최고 상급던전에 진입 가능합니다.') : items.map(({ c, next }) => renderCard(c, next, next.fame - c.base.fame, '🚀', '#93c5fd'));
          })()}
        </div>
      ) : (
        <div>
          {ADVANCED_DUNGEONS.map(target => {
            const targetIdx = dungeons.findIndex(d => d.name === target.name);
            const prevDungeon = targetIdx > 0 ? dungeons[targetIdx - 1] : null;
            const eligible = characters.filter(c =>
              c.base.fame < target.fame && (prevDungeon == null || c.base.fame >= prevDungeon.fame)
            ).sort((a, b) => (target.fame - a.base.fame) - (target.fame - b.base.fame));
            const currentDungeonName = prevDungeon ? prevDungeon.name : '진입 가능 던전 없음';
            return (
              <div key={target.name} style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '1px solid rgba(147,197,253,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#93c5fd', fontSize: '0.7rem' }}>
                  🚀 {target.name} 진입 목표
                  <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>현재 최고: {currentDungeonName} | 잔여 {eligible.length}명</span>
                </h3>
                {eligible.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '8px', textAlign: 'center' }}>해당 캐릭터 없음</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                    {eligible.map(c => renderCard(c, target, target.fame - c.base.fame, '🚀', '#93c5fd', `현재: ${currentDungeonName}`))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function RaidSubTab({ characters }) {
  const dealers = characters.filter(c => getRole(c) === 'dealer').sort((a, b) => b.base.fame - a.base.fame);
  const buffers = characters.filter(c => getRole(c) === 'buffer').sort((a, b) => b.base.fame - a.base.fame);

  const raidItems = characters.map(c => {
    const role = getRole(c);
    const rank = role === 'dealer' ? dealers.findIndex(x => x.id === c.id) : buffers.findIndex(x => x.id === c.id);
    const gIdx = rank === -1 ? 999 : (role === 'dealer' ? Math.floor(rank / 3) : rank);
    const filtered = RAIDS.filter(r => r.name !== '이내 황혼전' || gIdx < 2);
    const next = [...filtered].reverse().find(r => r.fame > c.base.fame);
    return { c, next };
  }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
      {raidItems.length === 0 ? emptyMsg('모든 레이드 조건을 달성했거나 대상 캐릭터가 없습니다.') : raidItems.map(({ c, next }) => renderCard(c, next, next.fame - c.base.fame, '⚔️', '#d8b4fe'))}
    </div>
  );
}

function ApocSubTab({ characters, view, setView }) {
  const apocTiers = [{ name: '매칭', fame: 73993 }, { name: '1단계', fame: 98171 }, { name: '2단계', fame: 105881 }];

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[['byTier', '🗂️ 단계별 정렬'], ['overall', '📊 전체 정렬']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: view === v ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)', border: view === v ? '1px solid rgba(251,146,60,0.4)' : '1px solid rgba(255,255,255,0.1)', color: view === v ? '#fb923c' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      {view === 'overall' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {(() => {
            const apocItems = characters.map(c => {
              const fame = c.base.fame;
              const state = fame >= 105881 ? 3 : fame >= 98171 ? 2 : fame >= 73993 ? 1 : 0;
              const currentLabel = ['없음', '매칭', '1단계', '2단계'][state];
              const next = state < 3 ? apocTiers[state] : null;
              return { c, state, currentLabel, next };
            }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));
            return apocItems.length === 0 ? emptyMsg('모든 캐릭터가 아포칼립스 2단계에 진입 가능합니다.') : apocItems.map(({ c, state, currentLabel, next }) => renderCard(c, next, next.fame - c.base.fame, '💀', '#fb923c', state > 0 ? `현재: ${currentLabel}` : '미진입'));
          })()}
        </div>
      ) : (
        <div>
          {[
            { target: apocTiers[2], currentLabel: '1단계', minFame: 98171, maxFame: 105881 },
            { target: apocTiers[1], currentLabel: '매칭', minFame: 73993, maxFame: 98171 },
            { target: apocTiers[0], currentLabel: '미진입', minFame: 0, maxFame: 73993 },
          ].map(({ target, currentLabel, minFame, maxFame }) => {
            const eligible = characters.filter(c => c.base.fame >= minFame && c.base.fame < maxFame).sort((a, b) => (target.fame - a.base.fame) - (target.fame - b.base.fame));
            return (
              <div key={target.name} style={{ marginBottom: '2rem' }}>
                <h3 style={{ borderBottom: '1px solid rgba(251,146,60,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#fb923c', fontSize: '0.7rem' }}>
                  💀 {target.name} 진입 목표
                  <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>현재: {currentLabel} | 잔여 {eligible.length}명</span>
                </h3>
                {eligible.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '8px', textAlign: 'center' }}>해당 캐릭터 없음</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                    {eligible.map(c => renderCard(c, target, target.fame - c.base.fame, '💀', '#fb923c', `현재: ${currentLabel}`))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ImminentTab({ characters }) {
  const [subTab, setSubTab] = useState('dungeon');
  const [dungeonView, setDungeonView] = useState('byDungeon');
  const [apocView, setApocView] = useState('byTier');

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <h2 style={{ margin: '0 0 1.5rem' }}>🎯 다음 던전 목표 현황</h2>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        {[['dungeon', '🚀 상급던전'], ['raid', '⚔️ 레이드'], ['apoc', '💀 아포칼립스']].map(([v, label]) => (
          <button key={v} className={`tab-btn ${subTab === v ? 'active' : ''}`} onClick={() => setSubTab(v)} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>{label}</button>
        ))}
      </div>

      {subTab === 'dungeon' && <DungeonSubTab characters={characters} view={dungeonView} setView={setDungeonView} />}
      {subTab === 'raid' && <RaidSubTab characters={characters} />}
      {subTab === 'apoc' && <ApocSubTab characters={characters} view={apocView} setView={setApocView} />}
    </section>
  );
}

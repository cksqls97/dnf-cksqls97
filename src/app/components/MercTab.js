"use client";

import React, { useState } from 'react';

export default function MercTab({ characters, mercLevel, mercNextLevelTarget, onSaveMerc }) {
  const [mercLevelInput, setMercLevelInput] = useState(String(mercLevel));
  const [mercTargetInput, setMercTargetInput] = useState(String(mercNextLevelTarget || ''));

  const top20 = [...characters]
    .sort((a, b) => (b.oath.rawPoints ?? b.oath.points ?? 0) - (a.oath.rawPoints ?? a.oath.points ?? 0))
    .slice(0, 20);
  const totalOath = top20.reduce((acc, c) => acc + (c.oath.rawPoints ?? c.oath.points ?? 0), 0);
  const hasTarget = mercNextLevelTarget > 0;
  const progress = hasTarget ? Math.min(totalOath / mercNextLevelTarget * 100, 100) : 0;
  const remaining = hasTarget ? Math.max(mercNextLevelTarget - totalOath, 0) : null;
  const isNearTarget = remaining !== null && remaining < 500;

  const handleSave = () => {
    const lv = parseInt(mercLevelInput) || 1;
    const tgt = parseInt(mercTargetInput.replace(/,/g, '')) || 0;
    onSaveMerc(lv, tgt);
  };

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>⚔️ 용병단 레벨</h2>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1rem 1.2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem' }}>현재 레벨</div>
            <input type="number" min="1" value={mercLevelInput} onChange={e => setMercLevelInput(e.target.value)} placeholder="예: 6" style={{ width: '80px', padding: '0.4rem 0.6rem', textAlign: 'center' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem' }}>다음 레벨 목표 포인트</div>
            <input type="text" value={mercTargetInput} onChange={e => setMercTargetInput(e.target.value)} placeholder="예: 30000" style={{ width: '130px', padding: '0.4rem 0.6rem', textAlign: 'center' }} />
          </div>
          <button onClick={handleSave} style={{ padding: '0.4rem 1rem', background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer' }}>저장</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(251,146,60,0.15),rgba(234,179,8,0.1))', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '12px', padding: '1.2rem 2rem', textAlign: 'center', minWidth: '140px' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.4rem' }}>현재 레벨</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fb923c', lineHeight: 1 }}>Lv.{mercLevel}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem' }}>→ Lv.{mercLevel + 1} 도전 중</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.2rem 1.5rem', minWidth: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>서약 총합</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: isNearTarget ? '#fef08a' : '#e2e8f0', marginLeft: '0.6rem' }}>{totalOath.toLocaleString()}</span>
              {hasTarget && <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.4rem' }}>/ {mercNextLevelTarget.toLocaleString()}</span>}
            </div>
            {remaining !== null && (
              <div style={{ fontSize: '0.7rem', color: isNearTarget ? '#fef08a' : '#fb923c', fontWeight: isNearTarget ? 'bold' : 'normal' }}>
                {isNearTarget ? '🔥' : '📈'} {remaining === 0 ? '목표 달성!' : `${remaining.toLocaleString()} 부족`}
              </div>
            )}
          </div>
          {hasTarget && (
            <div>
              <div style={{ height: '18px', background: 'rgba(255,255,255,0.07)', borderRadius: '9px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ height: '100%', width: `${progress}%`, borderRadius: '9px', background: progress >= 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : isNearTarget ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#fb923c,#f97316)', transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.7rem', color: '#64748b' }}>
                <span>Lv.{mercLevel}</span>
                <span style={{ color: isNearTarget ? '#fbbf24' : '#fb923c', fontWeight: 'bold' }}>{progress.toFixed(1)}%</span>
                <span>Lv.{mercLevel + 1}</span>
              </div>
            </div>
          )}
          {!hasTarget && <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>우측 상단 설정에서 현재 레벨과 다음 레벨 목표 포인트를 입력하세요.</p>}
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
          캐릭터별 서약 기여도 <span style={{ fontSize: '0.7rem', color: '#64748b' }}>(등록순 상위 20개)</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {top20.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>캐릭터를 먼저 추가해주세요.</div>
          ) : top20.map((c, i) => {
            const pts = c.oath.rawPoints ?? c.oath.points ?? 0;
            const pct = totalOath > 0 ? (pts / totalOath * 100) : 0;
            const maxPts = top20.reduce((mx, ch) => Math.max(mx, ch.oath.rawPoints ?? ch.oath.points ?? 0), 0);
            const relPct = maxPts > 0 ? (pts / maxPts * 100) : 0;
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ width: '1.4rem', textAlign: 'right', fontSize: '0.7rem', color: '#64748b', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ width: '130px', flexShrink: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.base.charName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{c.base.jobGrowName}</div>
                </div>
                <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${relPct}%`, background: 'linear-gradient(90deg,#fb923c,#f97316)', borderRadius: '5px', transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ width: '70px', textAlign: 'right', fontWeight: 'bold', color: '#fb923c', fontSize: '0.7rem', flexShrink: 0 }}>{pts.toLocaleString()}</span>
                <span style={{ width: '45px', textAlign: 'right', fontSize: '0.7rem', color: '#64748b', flexShrink: 0 }}>{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
        {characters.length > 20 && <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.8rem', textAlign: 'center' }}>* 등록된 {characters.length}개 캐릭터 중 상위 20개만 계산에 포함됩니다.</p>}
      </div>
    </section>
  );
}

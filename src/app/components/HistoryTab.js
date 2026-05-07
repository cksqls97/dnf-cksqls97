"use client";

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GradeBadge, getSortedCharacters, formatTimestamp } from '../lib/gameUtils';
import { computeChartData } from '../lib/chartUtils';

function EditLogModal({ log, onSave, onClose }) {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(log)));

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
        <h2 style={{ marginTop: 0 }}>성장 일지 수동 교정</h2>
        {form.fameChange && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>명성치 수정</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="number" style={{ width: '100%' }} value={form.fameChange.old} onChange={e => setForm({ ...form, fameChange: { ...form.fameChange, old: Number(e.target.value) } })} />
              <span>➡️</span>
              <input type="number" style={{ width: '100%' }} value={form.fameChange.new} onChange={e => setForm({ ...form, fameChange: { ...form.fameChange, new: Number(e.target.value) } })} />
            </div>
          </div>
        )}
        {form.equipChange && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>장비점수 및 세트 수정</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input type="text" style={{ width: '45%' }} value={form.equipChange.oldSet || ''} placeholder="이전세트" onChange={e => setForm({ ...form, equipChange: { ...form.equipChange, oldSet: e.target.value } })} />
              <span>➡️</span>
              <input type="text" style={{ width: '45%' }} value={form.equipChange.newSet || ''} placeholder="신규세트" onChange={e => setForm({ ...form, equipChange: { ...form.equipChange, newSet: e.target.value } })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="number" style={{ width: '45%' }} value={form.equipChange.old} placeholder="이전점수" onChange={e => setForm({ ...form, equipChange: { ...form.equipChange, old: Number(e.target.value) } })} />
              <span>➡️</span>
              <input type="number" style={{ width: '45%' }} value={form.equipChange.new} placeholder="신규점수" onChange={e => setForm({ ...form, equipChange: { ...form.equipChange, new: Number(e.target.value) } })} />
            </div>
          </div>
        )}
        {form.oathChange && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>서약점수 및 세트 수정</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input type="text" style={{ width: '45%' }} value={form.oathChange.oldSet || ''} placeholder="이전서약" onChange={e => setForm({ ...form, oathChange: { ...form.oathChange, oldSet: e.target.value } })} />
              <span>➡️</span>
              <input type="text" style={{ width: '45%' }} value={form.oathChange.newSet || ''} placeholder="신규서약" onChange={e => setForm({ ...form, oathChange: { ...form.oathChange, newSet: e.target.value } })} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="number" style={{ width: '45%' }} value={form.oathChange.old} placeholder="이전점수" onChange={e => setForm({ ...form, oathChange: { ...form.oathChange, old: Number(e.target.value) } })} />
              <span>➡️</span>
              <input type="number" style={{ width: '45%' }} value={form.oathChange.new} placeholder="신규점수" onChange={e => setForm({ ...form, oathChange: { ...form.oathChange, new: Number(e.target.value) } })} />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} className="danger">취소</button>
          <button type="button" onClick={() => onSave(form)}>저장</button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryTab({ historyLogs, characters, onDeleteLog, onSaveLog }) {
  const [historyFilterChar, setHistoryFilterChar] = useState('');
  const [chartViewMode, setChartViewMode] = useState('event');
  const [editingLog, setEditingLog] = useState(null);

  const chartData = useMemo(
    () => computeChartData(historyLogs, characters, historyFilterChar, chartViewMode),
    [historyLogs, characters, historyFilterChar, chartViewMode]
  );

  const currentFame = (() => {
    if (historyFilterChar === '') return characters.reduce((acc, c) => acc + c.base.fame, 0);
    const char = characters.find(c => c.id === historyFilterChar);
    if (char) return char.base.fame;
    const charLogs = historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).sort((a, b) => a.timestamp - b.timestamp);
    return charLogs.length > 0 ? charLogs[charLogs.length - 1].fameChange.new : 0;
  })();

  const filteredLogs = historyLogs.filter(L => historyFilterChar === '' || L.charId === historyFilterChar);

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>성장 일지</h2>
          {currentFame > 0 && (
            <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', color: '#38bdf8', fontWeight: 'bold' }}>
              현재 명성: <span style={{ color: '#fff' }}>{currentFame.toLocaleString()}</span>
            </div>
          )}
        </div>
        <select value={historyFilterChar} onChange={e => setHistoryFilterChar(e.target.value)} style={{ padding: '0.2rem 0.1rem', minWidth: '200px' }}>
          <option value="">전체 캐릭터 보기</option>
          {getSortedCharacters(characters).map(c => <option key={c.id} value={c.id}>{c.base.charName} ({c.base.jobGrowName})</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>그래프 기준:</span>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {[['event', '⚡ 이벤트 발생 기준', 'rgba(56,189,248,0.25)', '#38bdf8'], ['daily', '📅 일자별 (매일 06:00 기준)', 'rgba(167,139,250,0.25)', '#a78bfa']].map(([mode, label, bg, color]) => (
            <button key={mode} onClick={() => setChartViewMode(mode)} style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: chartViewMode === mode ? bg : 'transparent', color: chartViewMode === mode ? color : '#94a3b8', fontWeight: chartViewMode === mode ? 'bold' : 'normal' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 && (
        <div style={{ width: '100%', height: 300, marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="formattedTime" stroke="#94a3b8" fontSize={11} tickMargin={10} minTickGap={20} />
              <YAxis domain={['dataMin', 'dataMax']} stroke="#94a3b8" fontSize={11} width={50} tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(1)}만` : v.toLocaleString()} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                formatter={value => [value.toLocaleString(), historyFilterChar === '' ? '모험단 총 명성' : '명성']}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Line type={chartViewMode === 'daily' ? 'linear' : 'stepAfter'} dataKey="fame" stroke={chartViewMode === 'daily' ? '#a78bfa' : '#38bdf8'} strokeWidth={2} dot={{ r: 3, strokeWidth: 1, fill: '#0f172a' }} activeDot={{ r: 5 }} animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
          아직 변동 기록이 없습니다.<br />서버에서 새로운 스펙업 정보가 감지되면 자동으로 이곳에 누적 기록됩니다!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {filteredLogs.map(log => (
            <div key={log.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1.15rem', color: '#60a5fa' }}>{log.charName} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.job}</span></strong>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.5rem' }}>🕒 {formatTimestamp(log.timestamp)}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" onClick={() => setEditingLog(log)} style={{ padding: '0.2rem 0.4rem', background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>✏️ 수정</button>
                  <button type="button" onClick={() => onDeleteLog(log.id)} className="danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>❌ 삭제</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {log.fameChange && (
                  <div className="log-pill" style={{ borderColor: log.fameChange.new > log.fameChange.old ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)' }}>
                    <strong>명성:</strong> {log.fameChange.old.toLocaleString()} ➡️{' '}
                    <span style={{ color: log.fameChange.new > log.fameChange.old ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                      {log.fameChange.new.toLocaleString()} ({log.fameChange.new > log.fameChange.old ? '+' : ''}{(log.fameChange.new - log.fameChange.old).toLocaleString()})
                    </span>
                  </div>
                )}
                {log.equipChange && (
                  <div className="log-pill" style={{ borderColor: log.equipChange.new > log.equipChange.old ? 'rgba(74,222,128,0.4)' : (log.equipChange.new < log.equipChange.old ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.2)') }}>
                    <strong>장비:</strong> {log.equipChange.oldSet ? `[${log.equipChange.oldSet}] ` : ''}{log.equipChange.old}<GradeBadge points={log.equipChange.old} /> ➡️{' '}
                    {log.equipChange.newSet ? `[${log.equipChange.newSet}] ` : ''}<span style={{ color: log.equipChange.new > log.equipChange.old ? '#4ade80' : (log.equipChange.new < log.equipChange.old ? '#f87171' : '#fff'), fontWeight: 'bold' }}>{log.equipChange.new}<GradeBadge points={log.equipChange.new} /> ({log.equipChange.new > log.equipChange.old ? '+' : ''}{(log.equipChange.new - log.equipChange.old)})</span>
                  </div>
                )}
                {log.oathChange && (
                  <div className="log-pill" style={{ borderColor: log.oathChange.new > log.oathChange.old ? 'rgba(74,222,128,0.4)' : (log.oathChange.new < log.oathChange.old ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.2)') }}>
                    <strong>서약:</strong> {log.oathChange.oldSet ? `[${log.oathChange.oldSet}] ` : ''}{log.oathChange.old}<GradeBadge points={log.oathChange.old} /> ➡️{' '}
                    {log.oathChange.newSet ? `[${log.oathChange.newSet}] ` : ''}<span style={{ color: log.oathChange.new > log.oathChange.old ? '#4ade80' : (log.oathChange.new < log.oathChange.old ? '#f87171' : '#fff'), fontWeight: 'bold' }}>{log.oathChange.new}<GradeBadge points={log.oathChange.new} /> ({log.oathChange.new > log.oathChange.old ? '+' : ''}{(log.oathChange.new - log.oathChange.old)})</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingLog && (
        <EditLogModal
          log={editingLog}
          onSave={updated => { onSaveLog(editingLog.id, updated); setEditingLog(null); }}
          onClose={() => setEditingLog(null)}
        />
      )}
    </section>
  );
}

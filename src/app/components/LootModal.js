"use client";

import { useState } from 'react';

export default function LootModal({ activeLootModal, setActiveLootModal, characters, getCharForm, updateCharForm, apiKey, setAuctionPrices }) {
  const [fetchingItemId, setFetchingItemId] = useState(null);
  const [focusedItemId, setFocusedItemId] = useState(null);

  const getSuggestions = () => {
    const freq = {};
    characters.forEach(c => {
      (getCharForm(c.id).customItems || []).forEach(item => {
        if (item.name?.trim()) freq[item.name.trim()] = (freq[item.name.trim()] || 0) + 1;
      });
    });
    (activeLootModal?._pilgrimageHistory || []).forEach(record => {
      (record.details || []).forEach(d => {
        (d.customItems || []).forEach(item => {
          if (item.name?.trim()) freq[item.name.trim()] = (freq[item.name.trim()] || 0) + 1;
        });
      });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  };

  const fetchCustomItemPrice = async (itemName, itemId) => {
    if (!itemName || !apiKey) return;
    setFetchingItemId(itemId);
    try {
      const res = await fetch('/api/auction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, itemNames: [itemName] }) });
      const data = await res.json();
      if (data.success && data.data[itemName] !== undefined) {
        const charId = activeLootModal.charId;
        const items = getCharForm(charId).customItems || [];
        updateCharForm(charId, 'customItems', items.map(i => i.id === itemId ? { ...i, price: data.data[itemName] } : i));
      }
    } catch (e) { console.error('Custom item price fetch error:', e); }
    setFetchingItemId(null);
  };

  const handleClose = () => {
    const items = getCharForm(activeLootModal.charId).customItems || [];
    const newPrices = {};
    items.forEach(item => {
      if (item.name?.trim() && Number(item.price || 0) > 0) newPrices[item.name.trim()] = Number(item.price);
    });
    if (Object.keys(newPrices).length > 0) setAuctionPrices(prev => ({ ...prev, ...newPrices }));
    setActiveLootModal(null);
  };

  if (!activeLootModal) return null;
  const charId = activeLootModal.charId;
  const charName = characters.find(c => c.id === charId)?.base.charName || '알 수 없음';
  const form = getCharForm(charId);

  const inputStyle = { width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' };
  const labelStyle = { display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' };

  const FIELDS = [
    ['pureGold', '순 골드 (비밀상점 후 잔여액)'], ['seal', '순례의 인장'], ['tradableSeal', '순례의 인장(1회 교환 가능)'],
    ['condensedCore', '응축된 라이언 코어'], ['flawlessCore', '무결점 라이언 코어'],
    ['crystal', '빛나는 조화의 결정체'], ['flawlessCrystal', '무결점 조화의 결정체'],
    ['sealVoucher', '순례의 인장(1회 교환 가능) 교환권'],
    ['sealVoucherBox', '순례의 인장(1회 교환 가능) 교환권 1개 상자'],
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '12px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#4ade80' }}>📦 {charName} - 재화 및 메모 입력</h3>
        <div style={{ marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>{FIELDS[0][1]}</label>
            <input type="number" style={inputStyle} value={form.pureGold || ''} onChange={e => updateCharForm(charId, 'pureGold', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {FIELDS.slice(1).map(([key, label]) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input type="number" style={inputStyle} value={form[key] || ''} onChange={e => updateCharForm(charId, key, e.target.value)} />
              </div>
            ))}
          </div>

          {/* 커스텀 추가 항목 */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 'bold' }}>커스텀 추가 항목 (교환 가능)</label>
              <button onClick={() => {
                const items = form.customItems || [];
                updateCharForm(charId, 'customItems', [...items, { id: Date.now().toString(), name: '', quantity: '', price: 0 }]);
              }} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'rgba(96,165,250,0.2)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ 항목 추가</button>
            </div>
            {(form.customItems || []).length === 0 && (
              <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>항목이 없습니다. 위 버튼으로 추가하세요.</div>
            )}
            {(form.customItems || []).map(item => {
              const suggestions = getSuggestions();
              return (
                <div key={item.id} style={{ marginBottom: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input type="text" placeholder="아이템 이름 입력" style={{ width: '100%', padding: '0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                        value={item.name}
                        onChange={e => {
                          const items = form.customItems || [];
                          updateCharForm(charId, 'customItems', items.map(i => i.id === item.id ? { ...i, name: e.target.value } : i));
                        }}
                        onFocus={() => setFocusedItemId(item.id)}
                        onBlur={e => {
                          setTimeout(() => setFocusedItemId(null), 150);
                          if (e.target.value.trim()) fetchCustomItemPrice(e.target.value.trim(), item.id);
                        }}
                      />
                      {focusedItemId === item.id && (() => {
                        const all = suggestions.filter(s => s !== item.name && (!item.name || s.toLowerCase().includes(item.name.toLowerCase())));
                        if (all.length === 0) return null;
                        return (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', maxHeight: '120px', overflowY: 'auto', marginTop: '2px' }}>
                            {all.map(name => (
                              <div key={name} style={{ padding: '0.3rem 0.5rem', fontSize: '0.65rem', color: '#cbd5e1', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                onMouseDown={() => {
                                  const items = form.customItems || [];
                                  updateCharForm(charId, 'customItems', items.map(i => i.id === item.id ? { ...i, name } : i));
                                  setFocusedItemId(null);
                                  fetchCustomItemPrice(name, item.id);
                                }}
                                onMouseEnter={e => e.target.style.background = 'rgba(96,165,250,0.2)'}
                                onMouseLeave={e => e.target.style.background = 'transparent'}
                              >{name}</div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <input type="number" placeholder="수량" style={{ width: '60px', padding: '0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', textAlign: 'center' }}
                      value={item.quantity}
                      onChange={e => {
                        const items = form.customItems || [];
                        updateCharForm(charId, 'customItems', items.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i));
                      }}
                    />
                    <button onClick={() => {
                      const items = form.customItems || [];
                      updateCharForm(charId, 'customItems', items.filter(i => i.id !== item.id));
                    }} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 0.3rem', flexShrink: 0 }}>×</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#94a3b8', paddingLeft: '0.2rem' }}>
                    {fetchingItemId === item.id ? (
                      <span style={{ color: '#fbbf24' }}>⏳ 단가 조회 중...</span>
                    ) : (
                      <span>단가: <span style={{ color: Number(item.price || 0) > 0 ? '#fbbf24' : '#64748b', fontWeight: 'bold' }}>{Number(item.price || 0) > 0 ? `${Number(item.price).toLocaleString()} G` : '미조회'}</span></span>
                    )}
                    {item.name && Number(item.quantity || 0) > 0 && Number(item.price || 0) > 0 && (
                      <span style={{ color: '#4ade80' }}>= {(Number(item.quantity) * Number(item.price)).toLocaleString()} G</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label style={{ ...labelStyle, color: '#94a3b8' }}>기타 메모</label>
            <input type="text" style={inputStyle} value={form.memo || ''} onChange={e => updateCharForm(charId, 'memo', e.target.value)} placeholder="특이사항 메모 입력" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleClose} style={{ padding: '0.6rem 1.2rem', background: '#4ade80', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>완료 및 닫기</button>
        </div>
      </div>
    </div>
  );
}

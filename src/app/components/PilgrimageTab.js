"use client";

import React, { useState, useEffect } from 'react';
import { PILGRIMAGE_BASE_ITEMS, DEFAULT_AUCTION_PRICES } from '../lib/constants';

// 순례 시작 전 / 종료 후에 입력받는 계정 전체 보유량 스냅샷 (골드 제외 8종)
const SNAPSHOT_FIELDS = [
  ['token', '닳아버린\n순례의 증표'],
  ['seal', '순례의\n인장'],
  ['sealVoucher', '교환권'],
  ['sealVoucherBox', '교환권\n1개 상자'],
  ['condensedCore', '응축\n라이언 코어'],
  ['flawlessCore', '무결점\n라이언 코어'],
  ['crystal', '빛나는\n조화의 결정체'],
  ['flawlessCrystal', '무결점\n조화의 결정체'],
];
const SNAPSHOT_KEYS = SNAPSHOT_FIELDS.map(([k]) => k);
const EMPTY_SNAP = () => ({ gold: '', ...Object.fromEntries(SNAPSHOT_KEYS.map(k => [k, ''])) });
const EMPTY_SHOP = () => ({ generalRecipes: [], shinyGiftCount: '', brilliantGiftCount: '', customItems: [] });

// 일괄정산: 캐릭터별 분배 없이, 시작 전/종료 후 스냅샷 증감분을 그대로 골드 가치로 환산한다.
// - 골드/증표는 특별상점 지출·제작으로 증가하거나 줄어들 수 있으므로 증감분을 그대로 반영(음수 허용).
// - 나머지 재료는 순례 중 늘어나기만 한다고 가정해 0 미만으로 내려가지 않게 한다.
function calcBatchValues(before, after, auctionPrices, shop, useVoucherExchange) {
  const signedDelta = (k) => Number(after[k] || 0) - Number(before[k] || 0);
  const gainDelta = (k) => Math.max(0, signedDelta(k));

  const goldDelta = signedDelta('gold');
  const tokenDelta = signedDelta('token');
  const sealDelta = signedDelta('seal');
  const sealVoucherDelta = gainDelta('sealVoucher');
  const sealVoucherBoxDelta = gainDelta('sealVoucherBox');
  const condensedCoreDelta = gainDelta('condensedCore');
  const flawlessCoreDelta = gainDelta('flawlessCore');
  const crystalDelta = gainDelta('crystal');
  const flawlessCrystalDelta = gainDelta('flawlessCrystal');

  const priceFlawlessCore = auctionPrices['무결점 라이언 코어'] || 0;
  const priceFlawlessCrystal = auctionPrices['무결점 조화의 결정체'] || 0;
  const priceToken = auctionPrices['닳아버린 순례의 증표'] || 0;
  const priceTradableSeal = auctionPrices['순례의 인장(1회 교환 가능)'] || 0;
  const priceVoucherBox = auctionPrices['순례의 인장(1회 교환 가능) 교환권 1개 상자'] || 0;
  const legendarySoulPrice = auctionPrices['레전더리 소울 결정'] || 0;
  const epicSoulPrice = auctionPrices['에픽 소울 결정'] || 0;

  // 귀속 가치 (Bound): 인장 고정단가 5000G + 응축코어/빛나는결정체(무결점 시세로 환산, 귀속이라 거래는 불가)
  const sealValue = sealDelta * 5000;
  const boundCoreValue = condensedCoreDelta * priceFlawlessCore;
  const boundCrystalValue = crystalDelta * priceFlawlessCrystal;
  const boundValue = sealValue + boundCoreValue + boundCrystalValue;

  // 교환 가치 (Tradable): 골드 증감분 + 무결점 코어/결정체 + 증표 + 교환권(3배 환산)/상자
  const tokenValue = tokenDelta * priceToken;
  const flawlessCoreValue = flawlessCoreDelta * priceFlawlessCore;
  const flawlessCrystalValue = flawlessCrystalDelta * priceFlawlessCrystal;
  const voucherValue = useVoucherExchange ? sealVoucherDelta * 3 * priceTradableSeal : 0;
  const voucherBoxValue = sealVoucherBoxDelta * priceVoucherBox;

  // 특별상점 부가정산: 답례품은 소울 결정 기회비용만 차감(증표 획득분은 증표 스냅샷에 이미 반영됨),
  // 일반 레시피/기타 획득 아이템은 아직 팔지 않은 결과물이라 예상 판매가를 더해준다.
  const shinyCount = Number(shop.shinyGiftCount || 0);
  const brilliantCount = Number(shop.brilliantGiftCount || 0);
  const giftSoulCost = shinyCount * legendarySoulPrice + brilliantCount * epicSoulPrice;
  const recipeUnsoldValue = (shop.generalRecipes || []).reduce((s, r) => s + Number(r.sellPrice || 0), 0);
  const customValue = (shop.customItems || []).reduce((s, it) => s + Number(it.quantity || 0) * (Number(it.price || 0) || (auctionPrices[it.name] || 0)), 0);

  const tradableValue = goldDelta + tokenValue + flawlessCoreValue + flawlessCrystalValue + voucherValue + voucherBoxValue + recipeUnsoldValue + customValue - giftSoulCost;
  const totalProfit = boundValue + tradableValue;

  return {
    deltas: {
      gold: goldDelta, token: tokenDelta, seal: sealDelta,
      sealVoucher: sealVoucherDelta, sealVoucherBox: sealVoucherBoxDelta,
      condensedCore: condensedCoreDelta, flawlessCore: flawlessCoreDelta,
      crystal: crystalDelta, flawlessCrystal: flawlessCrystalDelta
    },
    sealValue, boundCoreValue, boundCrystalValue, boundValue,
    tokenValue, flawlessCoreValue, flawlessCrystalValue, voucherValue, voucherBoxValue,
    giftSoulCost, recipeUnsoldValue, customValue,
    tradableValue, totalProfit, profitExclBound: tradableValue
  };
}

function AuctionPricesModal({ auctionPrices, setAuctionPrices, onClose }) {
  const baseItems = PILGRIMAGE_BASE_ITEMS;
  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px', width: '90%' }}>
        <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>⚖️ 현재 적용된 경매장 단가</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
          {Object.entries(auctionPrices).map(([name, price]) => {
            const isBase = baseItems.includes(name);
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                <span style={{ flex: 1, color: '#cbd5e1', fontSize: '0.75rem' }}>{name}</span>
                <input type="number" value={price} onChange={e => setAuctionPrices(prev => ({ ...prev, [name]: Number(e.target.value) || 0 }))} style={{ width: '90px', padding: '0.3rem 0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fbbf24', borderRadius: '4px', textAlign: 'right', fontWeight: 'bold' }} />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>G</span>
                {!isBase && (
                  <button onClick={() => setAuctionPrices(prev => { const next = { ...prev }; delete next[name]; return next; })} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 0.2rem' }}>×</button>
                )}
                {isBase && <span style={{ width: '1.2rem' }}></span>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>닫기</button>
        </div>
      </div>
    </div>
  );
}

// 기타 획득 아이템 한 행 — customItems 배열은 id로 keying되어 있어 그냥 직접 바인딩해도 포커스가 끊기지 않는다.
function CustomItemRow({ item, updateShop, fetchCustomItemPrice, fetchingItemId }) {
  const inp = { padding: '0.3rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' };

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
      <input type="text" placeholder="아이템명" style={{ ...inp, flex: 1, minWidth: '120px' }} value={item.name}
        onChange={e => { const val = e.target.value; updateShop('customItems', cur => (cur || []).map(i => i.id === item.id ? { ...i, name: val } : i)); }}
        onBlur={e => { if (e.target.value.trim()) fetchCustomItemPrice(e.target.value.trim(), item.id); }}
      />
      <input type="number" placeholder="수량" style={{ ...inp, width: '64px' }} value={item.quantity}
        onChange={e => { const val = e.target.value; updateShop('customItems', cur => (cur || []).map(i => i.id === item.id ? { ...i, quantity: val } : i)); }}
      />
      <span style={{ fontSize: '0.65rem', color: fetchingItemId === item.id ? '#fbbf24' : (Number(item.price || 0) > 0 ? '#94a3b8' : '#475569'), minWidth: '80px' }}>
        {fetchingItemId === item.id ? '⏳ 조회 중' : (Number(item.price || 0) > 0 ? `단가 ${Number(item.price).toLocaleString()}G` : '단가 미조회')}
      </span>
      <button onClick={() => updateShop('customItems', cur => (cur || []).filter(i => i.id !== item.id))} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0' }}>×</button>
    </div>
  );
}

export default function PilgrimageTab({ pilgrimageHistory, onSavePilgrimage, onDeletePilgrimage, apiKey }) {
  const [snapBefore, setSnapBefore] = useState(EMPTY_SNAP());
  const [snapAfter, setSnapAfter] = useState(EMPTY_SNAP());
  const [shop, setShop] = useState(EMPTY_SHOP());
  const [memo, setMemo] = useState('');
  const [useVoucherExchange, setUseVoucherExchange] = useState(true);
  const [auctionPrices, setAuctionPrices] = useState(DEFAULT_AUCTION_PRICES);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [showAuctionPricesModal, setShowAuctionPricesModal] = useState(false);
  const [fetchingItemId, setFetchingItemId] = useState(null);
  const [saveResult, setSaveResult] = useState(null);

  useEffect(() => {
    const loadJson = (key, setter) => {
      const raw = localStorage.getItem(key);
      if (raw) { try { setter(JSON.parse(raw)); } catch (e) {} }
    };
    const loadRaw = (key, setter) => {
      const raw = localStorage.getItem(key);
      if (raw !== null) setter(raw);
    };
    loadJson('DNF_PILGRIMAGE_BATCH_BEFORE', setSnapBefore);
    loadJson('DNF_PILGRIMAGE_BATCH_AFTER', setSnapAfter);
    loadJson('DNF_PILGRIMAGE_BATCH_SHOP', setShop);
    loadRaw('DNF_PILGRIMAGE_BATCH_MEMO', setMemo);
    loadJson('DNF_PILGRIMAGE_AUCTION_PRICES', prices => setAuctionPrices(prev => ({ ...prev, ...prices })));
  }, []);

  useEffect(() => { localStorage.setItem('DNF_PILGRIMAGE_BATCH_BEFORE', JSON.stringify(snapBefore)); }, [snapBefore]);
  useEffect(() => { localStorage.setItem('DNF_PILGRIMAGE_BATCH_AFTER', JSON.stringify(snapAfter)); }, [snapAfter]);
  useEffect(() => { localStorage.setItem('DNF_PILGRIMAGE_BATCH_SHOP', JSON.stringify(shop)); }, [shop]);
  useEffect(() => { localStorage.setItem('DNF_PILGRIMAGE_BATCH_MEMO', memo); }, [memo]);
  useEffect(() => { localStorage.setItem('DNF_PILGRIMAGE_AUCTION_PRICES', JSON.stringify(auctionPrices)); }, [auctionPrices]);

  const updateShop = (field, value) => setShop(prev => ({ ...prev, [field]: typeof value === 'function' ? value(prev[field]) : value }));

  const fetchCustomItemPrice = async (itemName, itemId) => {
    if (!itemName || !apiKey) return;
    setFetchingItemId(itemId);
    try {
      const res = await fetch('/api/auction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, itemNames: [itemName] }) });
      const data = await res.json();
      if (data.success && data.data[itemName] !== undefined) {
        const price = data.data[itemName];
        updateShop('customItems', cur => (cur || []).map(i => i.id === itemId ? { ...i, price } : i));
      }
    } catch (e) { console.error(e); }
    setFetchingItemId(null);
  };

  const fetchAuctionPrices = async () => {
    if (!apiKey) { alert("API 키가 필요합니다."); return; }
    setIsFetchingPrices(true);
    try {
      const customNames = (shop.customItems || []).map(i => i.name?.trim()).filter(Boolean);
      const allItemNames = [...PILGRIMAGE_BASE_ITEMS, ...new Set(customNames)];
      const res = await fetch('/api/auction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, itemNames: allItemNames }) });
      const data = await res.json();
      if (data.success) {
        setAuctionPrices(prev => ({ ...prev, ...data.data }));
        updateShop('customItems', cur => (cur || []).map(item => item.name && data.data[item.name] !== undefined ? { ...item, price: data.data[item.name] } : item));
        alert("경매장 시세를 성공적으로 불러왔습니다!");
      } else { alert("불러오기 실패: " + data.error); }
    } catch (e) { console.error(e); alert("경매장 API 연동 중 오류가 발생했습니다."); }
    setIsFetchingPrices(false);
  };

  const values = calcBatchValues(snapBefore, snapAfter, auctionPrices, shop, useVoucherExchange);
  const hasAnyInput = Object.keys(snapBefore).some(k => snapBefore[k] !== '') || Object.keys(snapAfter).some(k => snapAfter[k] !== '');

  const handleSave = () => {
    if (!hasAnyInput) { alert('시작 전 / 종료 후 재화를 먼저 입력해주세요.'); return; }
    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      before: snapBefore, after: snapAfter,
      deltas: values.deltas,
      shop: { generalRecipes: shop.generalRecipes, shinyGiftCount: shop.shinyGiftCount, brilliantGiftCount: shop.brilliantGiftCount, customItems: shop.customItems },
      values: { bound: values.boundValue, tradable: values.tradableValue, profitIncl: values.totalProfit, profitExcl: values.profitExclBound },
      memo
    };
    onSavePilgrimage(newRecord);
    setSaveResult(newRecord);

    setSnapBefore(EMPTY_SNAP());
    setSnapAfter(EMPTY_SNAP());
    setShop(EMPTY_SHOP());
    setMemo('');
    ['DNF_PILGRIMAGE_BATCH_BEFORE', 'DNF_PILGRIMAGE_BATCH_AFTER', 'DNF_PILGRIMAGE_BATCH_SHOP', 'DNF_PILGRIMAGE_BATCH_MEMO'].forEach(k => localStorage.removeItem(k));
  };

  const snapInp = { width: '64px', padding: '0.25rem', fontSize: '0.7rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', borderRadius: '4px' };
  const goldInp = { ...snapInp, width: '110px' };
  const lbl = { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' };

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.4rem' }}>✨ 광휘의 순례 — 일괄 정산</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 0, marginBottom: '1.5rem' }}>
        캐릭터별로 나누지 않고, 계정 전체 보유량의 시작 전 → 종료 후 증감분만으로 손익을 계산합니다.
      </p>

      {/* Global Actions */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setUseVoucherExchange(v => !v)} style={{ padding: '0.5rem 0.9rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid', cursor: 'pointer', fontWeight: 'bold',
          background: useVoucherExchange ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
          color: useVoucherExchange ? '#4ade80' : '#f87171',
          borderColor: useVoucherExchange ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)' }}>
          교환권 {useVoucherExchange ? '교환 O' : '교환 X'}
        </button>
        <button onClick={fetchAuctionPrices} disabled={isFetchingPrices} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
          {isFetchingPrices ? '불러오는 중...' : '단가 새로고침'}
        </button>
        <button onClick={() => setShowAuctionPricesModal(true)} style={{ padding: '0.5rem 1rem', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>단가 확인</button>
        <button onClick={handleSave} style={{ padding: '0.5rem 1.5rem', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', borderRadius: '4px', fontSize: '0.7rem' }}>이번 순례 저장</button>
      </div>

      {/* 재화 스냅샷 */}
      <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>📦 재화 스냅샷 (순례 시작 전 / 종료 후 보유량)</span>
          <button onClick={() => { setSnapBefore(EMPTY_SNAP()); setSnapAfter(EMPTY_SNAP()); }} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '3px', cursor: 'pointer' }}>초기화</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.9rem' }}>
          <span style={{ ...lbl, minWidth: '70px' }}>💰 골드</span>
          <input type="number" placeholder="시작 전" value={snapBefore.gold} onChange={e => setSnapBefore(p => ({ ...p, gold: e.target.value }))} style={goldInp} />
          <span style={{ color: '#475569', fontSize: '0.65rem' }}>→</span>
          <input type="number" placeholder="종료 후" value={snapAfter.gold} onChange={e => setSnapAfter(p => ({ ...p, gold: e.target.value }))} style={goldInp} />
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: values.deltas.gold > 0 ? '#4ade80' : values.deltas.gold < 0 ? '#f87171' : '#475569' }}>
            {values.deltas.gold !== 0 ? `${values.deltas.gold > 0 ? '+' : ''}${values.deltas.gold.toLocaleString()}` : '-'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '0.2rem 0.6rem 0.2rem 0', color: '#64748b', fontSize: '0.65rem', width: '54px' }}></th>
                {SNAPSHOT_FIELDS.map(([k, label]) => (
                  <th key={k} style={{ padding: '0.2rem 0.3rem', color: '#94a3b8', fontSize: '0.6rem', whiteSpace: 'pre-line', minWidth: '64px' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[['시작 전', snapBefore, setSnapBefore, '#64748b'], ['종료 후', snapAfter, setSnapAfter, '#4ade80']].map(([label, snap, setSnap, color]) => (
                <tr key={label}>
                  <td style={{ textAlign: 'left', padding: '0.2rem 0.6rem 0.2rem 0', color, fontSize: '0.65rem', fontWeight: 'bold' }}>{label}</td>
                  {SNAPSHOT_FIELDS.map(([k]) => (
                    <td key={k} style={{ padding: '0.15rem 0.2rem' }}>
                      <input type="number" value={snap[k]} onChange={e => setSnap(p => ({ ...p, [k]: e.target.value }))} style={snapInp} placeholder="0" />
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <td style={{ textAlign: 'left', padding: '0.2rem 0.6rem 0.2rem 0', color: '#fbbf24', fontSize: '0.65rem', fontWeight: 'bold' }}>증감</td>
                {SNAPSHOT_FIELDS.map(([k]) => {
                  const d = values.deltas[k];
                  return <td key={k} style={{ padding: '0.15rem 0.2rem', fontWeight: 'bold', color: d > 0 ? '#4ade80' : d < 0 ? '#f87171' : '#475569', fontSize: '0.7rem' }}>{d !== 0 ? `${d > 0 ? '+' : ''}${d}` : '-'}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.6rem', color: '#475569', margin: '0.6rem 0 0' }}>* 골드·증표는 특별상점 지출/제작으로 줄어들 수 있어 증감분을 그대로 반영합니다. 나머지 재료는 감소분을 인정하지 않습니다.</p>
      </div>

      {/* 특별상점 부가정산 */}
      <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 'bold', marginBottom: '0.8rem' }}>🛒 특별상점 부가정산 (재화 스냅샷에 안 잡히는 항목만)</div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>🎁 빛나는 답례품 제작 횟수</span>
            <input type="number" min="0" value={shop.shinyGiftCount} onChange={e => updateShop('shinyGiftCount', e.target.value)} style={{ ...snapInp, width: '54px' }} placeholder="0" />
            <span style={{ fontSize: '0.6rem', color: '#64748b' }}>(회당 레전더리 소울 결정 1개 소모)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>🎁 화려한 답례품 제작 횟수</span>
            <input type="number" min="0" value={shop.brilliantGiftCount} onChange={e => updateShop('brilliantGiftCount', e.target.value)} style={{ ...snapInp, width: '54px' }} placeholder="0" />
            <span style={{ fontSize: '0.6rem', color: '#64748b' }}>(회당 에픽 소울 결정 1개 소모)</span>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#a78bfa' }}>일반 레시피 제작 (아직 안 판 결과물의 예상 판매가)</span>
            <button onClick={() => updateShop('generalRecipes', cur => [...(cur || []), { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: '', sellPrice: '' }])} style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem', background: 'rgba(167,139,250,0.18)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '3px', cursor: 'pointer' }}>+ 추가</button>
          </div>
          {(shop.generalRecipes || []).map(r => (
            <div key={r.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
              <input type="text" placeholder="결과물 이름 (선택)" value={r.name} onChange={e => updateShop('generalRecipes', cur => cur.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} style={{ ...snapInp, width: '160px', textAlign: 'left' }} />
              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>예상 판매가:</span>
              <input type="number" placeholder="0" value={r.sellPrice} onChange={e => updateShop('generalRecipes', cur => cur.map(x => x.id === r.id ? { ...x, sellPrice: e.target.value } : x))} style={{ ...snapInp, width: '90px' }} />
              <button onClick={() => updateShop('generalRecipes', cur => cur.filter(x => x.id !== r.id))} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>×</button>
            </div>
          ))}
          {(shop.generalRecipes || []).length === 0 && <div style={{ fontSize: '0.65rem', color: '#475569' }}>없음</div>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#60a5fa' }}>기타 획득 아이템 (재화 스냅샷/레시피 외 잡템)</span>
            <button onClick={() => updateShop('customItems', cur => [...(cur || []), { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: '', quantity: '', price: 0 }])} style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem', background: 'rgba(96,165,250,0.18)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '3px', cursor: 'pointer' }}>+ 추가</button>
          </div>
          {(shop.customItems || []).map(item => (
            <CustomItemRow key={item.id} item={item} updateShop={updateShop} fetchCustomItemPrice={fetchCustomItemPrice} fetchingItemId={fetchingItemId} />
          ))}
          {(shop.customItems || []).length === 0 && <div style={{ fontSize: '0.65rem', color: '#475569' }}>없음</div>}
        </div>
      </div>

      {/* 계산 결과 */}
      <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: '0.75rem', color: '#fb923c', fontWeight: 'bold', marginBottom: '0.8rem' }}>📊 계산 결과</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.7rem', marginBottom: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>순례의 인장 (귀속, {values.deltas.seal}개 × 5,000G)</span><span>{values.sealValue.toLocaleString()} G</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>응축된 라이언 코어 (귀속, {values.deltas.condensedCore}개)</span><span>{values.boundCoreValue.toLocaleString()} G</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>빛나는 조화의 결정체 (귀속, {values.deltas.crystal}개)</span><span>{values.boundCrystalValue.toLocaleString()} G</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fb923c', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.3rem' }}><span>귀속 가치 합계</span><span>{values.boundValue.toLocaleString()} G</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.7rem', marginBottom: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>골드 증감</span><span>{values.deltas.gold.toLocaleString()} G</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>닳아버린 순례의 증표 증감 ({values.deltas.token}개)</span><span>{values.tokenValue.toLocaleString()} G</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>무결점 라이언 코어 ({values.deltas.flawlessCore}개)</span><span>{values.flawlessCoreValue.toLocaleString()} G</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>무결점 조화의 결정체 ({values.deltas.flawlessCrystal}개)</span><span>{values.flawlessCrystalValue.toLocaleString()} G</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>교환권 → 교환 인장 ({values.deltas.sealVoucher}×3개, {useVoucherExchange ? '교환 O' : '교환 X'})</span><span>{values.voucherValue.toLocaleString()} G</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>교환권 1개 상자 ({values.deltas.sealVoucherBox}개)</span><span>{values.voucherBoxValue.toLocaleString()} G</span></div>
          {values.recipeUnsoldValue > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>일반 레시피 예상 판매가</span><span>+{values.recipeUnsoldValue.toLocaleString()} G</span></div>}
          {values.customValue > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>기타 획득 아이템</span><span>+{values.customValue.toLocaleString()} G</span></div>}
          {values.giftSoulCost > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>답례품 소울 결정 소모 (기회비용)</span><span>-{values.giftSoulCost.toLocaleString()} G</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#38bdf8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.3rem' }}><span>교환 가치 합계</span><span>{values.tradableValue.toLocaleString()} G</span></div>
        </div>
        <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <span style={{ color: '#e2e8f0' }}>순수익 (귀속 포함)</span>
            <span style={{ color: values.totalProfit > 0 ? '#4ade80' : values.totalProfit < 0 ? '#f87171' : '#cbd5e1' }}>{values.totalProfit.toLocaleString()} G</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <span style={{ color: '#e2e8f0' }}>순수익 (귀속 제외)</span>
            <span style={{ color: values.profitExclBound > 0 ? '#38bdf8' : values.profitExclBound < 0 ? '#f87171' : '#cbd5e1' }}>{values.profitExclBound.toLocaleString()} G</span>
          </div>
        </div>
      </div>

      {/* 메모 */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ ...lbl, display: 'block', marginBottom: '0.4rem' }}>메모</label>
        <input type="text" value={memo} onChange={e => setMemo(e.target.value)} placeholder="이번 순례 특이사항" style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', borderRadius: '4px' }} />
      </div>

      {/* 히스토리 */}
      <h3 style={{ fontSize: '1.1rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>히스토리</h3>
      {pilgrimageHistory.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>아직 등록된 기록이 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pilgrimageHistory.map(record => (
            <div key={record.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>📅 {new Date(record.date).toLocaleString()}</span>
                <button className="danger" onClick={() => onDeletePilgrimage(record.id)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>기록 삭제</button>
              </div>
              <div style={{ padding: '1rem' }}>
                {record.before && record.deltas ? (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                      {record.deltas.gold !== 0 && (
                        <span style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#fbbf24' }}>
                          골드 {record.deltas.gold > 0 ? '+' : ''}{record.deltas.gold.toLocaleString()}
                        </span>
                      )}
                      {SNAPSHOT_FIELDS.map(([k, label]) => record.deltas[k] ? (
                        <span key={k} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#38bdf8' }}>
                          {label.replace('\n', ' ')} {record.deltas[k] > 0 ? '+' : ''}{record.deltas[k]}
                        </span>
                      ) : null)}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                      <div>귀속 가치: <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{(record.values?.bound || 0).toLocaleString()} G</span></div>
                      <div>교환 가치: <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{(record.values?.tradable || 0).toLocaleString()} G</span></div>
                      <div>순수익(포함): <span style={{ color: (record.values?.profitIncl || 0) >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{(record.values?.profitIncl || 0).toLocaleString()} G</span></div>
                      <div>순수익(제외): <span style={{ color: (record.values?.profitExcl || 0) >= 0 ? '#38bdf8' : '#f87171', fontWeight: 'bold' }}>{(record.values?.profitExcl || 0).toLocaleString()} G</span></div>
                    </div>
                    {record.memo && <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: '#cbd5e1' }}>📝 {record.memo}</div>}
                  </>
                ) : record.details ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    [구버전 기록 · 캐릭터별 정산] {record.details.map(d => d.charName).join(', ')} — 순수익(포함) {(record.sessionTotals?.profit || 0).toLocaleString()} G
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>[구버전 기록] 캐릭터: {record.chars?.join(', ')} / 획득: {record.acquired} / 소모: {record.consumed}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAuctionPricesModal && <AuctionPricesModal auctionPrices={auctionPrices} setAuctionPrices={setAuctionPrices} onClose={() => setShowAuctionPricesModal(false)} />}

      {saveResult && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '440px', width: '95%' }}>
            <h3 style={{ marginTop: 0, color: '#4ade80', fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem' }}>✅ 순례 결과 저장 완료</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>귀속 가치</span><span style={{ color: '#fb923c' }}>{saveResult.values.bound.toLocaleString()} G</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>교환 가치</span><span style={{ color: '#fb923c' }}>{saveResult.values.tradable.toLocaleString()} G</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.4rem', fontWeight: 'bold' }}><span>순수익 (귀속 포함)</span><span style={{ color: saveResult.values.profitIncl >= 0 ? '#4ade80' : '#f87171' }}>{saveResult.values.profitIncl.toLocaleString()} G</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>순수익 (귀속 제외)</span><span style={{ color: saveResult.values.profitExcl >= 0 ? '#38bdf8' : '#f87171' }}>{saveResult.values.profitExcl.toLocaleString()} G</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSaveResult(null)} style={{ padding: '0.5rem 1.5rem', background: '#4ade80', color: '#0f172a', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

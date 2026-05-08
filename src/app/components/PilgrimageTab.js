"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { getSortedCharacters } from '../lib/gameUtils';
import { PILGRIMAGE_BASE_ITEMS, DEFAULT_AUCTION_PRICES } from '../lib/constants';
import LootModal from './LootModal';
import SecretShopModal from './SecretShopModal';

const EMPTY_CHAR_FORM = () => ({
  selected: false, startFatigue: '', pureGold: '',
  seal: '', condensedCore: '', crystal: '', flawlessCore: '', flawlessCrystal: '',
  sealVoucher: '', tradableSeal: '', sealVoucherBox: '', memo: '',
  secretTokens: [], secretRecipes: [], customItems: [], usePotion: false
});

function calcCharValues(form, auctionPrices) {
  const fatigue = Number(form.startFatigue || 0);
  const runs = Math.ceil(fatigue / 8) + (form.usePotion ? 4 : 0);

  const sealValue = Number(form.seal || 0) * 5000;
  const boundCoreValue = Number(form.condensedCore || 0) * (auctionPrices['무결점 라이언 코어'] || 0);
  const boundCrystalValue = Number(form.crystal || 0) * (auctionPrices['무결점 조화의 결정체'] || 0);
  const totalBoundValue = sealValue + boundCoreValue + boundCrystalValue;

  const pureGoldInput = Number(form.pureGold || 0);
  const tradableCoreValue = Number(form.flawlessCore || 0) * (auctionPrices['무결점 라이언 코어'] || 0);
  const tradableCrystalValue = Number(form.flawlessCrystal || 0) * (auctionPrices['무결점 조화의 결정체'] || 0);

  const priceTradableSeal = auctionPrices['순례의 인장(1회 교환 가능)'] || 0;
  const priceVoucherBox = auctionPrices['순례의 인장(1회 교환 가능) 교환권 1개 상자'] || 0;
  const voucherProfitTotal = Number(form.sealVoucher || 0) * Math.max(0, (3 * priceTradableSeal) - 75000);
  const tradableSealValue = Number(form.tradableSeal || 0) * priceTradableSeal;
  const voucherBoxValue = Number(form.sealVoucherBox || 0) * priceVoucherBox;

  const marketTokenPrice = auctionPrices['닳아버린 순례의 증표'] || 0;
  const tokenCost = runs * marketTokenPrice;
  const potionCost = form.usePotion ? (auctionPrices['피로 회복의 영약'] || 0) : 0;

  // 특별상점 구매 지출 역산 (pureGold에 이미 차감되어 있음)
  let tokenSpend = 0;
  let tokenProfit = 0;
  (form.secretTokens || []).forEach(t => {
    const bp = Number(t.buyPrice || 0);
    if (bp > 0) { tokenSpend += bp; tokenProfit += marketTokenPrice; }
  });

  const legendarySoulPrice = auctionPrices['레전더리 소울 결정'] || 0;
  const epicSoulPrice = auctionPrices['에픽 소울 결정'] || 0;

  let recipeSpend = 0;
  let recipeProfit = 0;
  let recipeSealCostValue = 0;  // 귀속: 레시피 인장 소모
  let giftSoulCost = 0;         // 교환: 답례품 소울 결정 기회비용
  (form.secretRecipes || []).forEach(r => {
    const bp = Number(r.buyPrice || 0);
    if (r.type === 'shinyGift') {
      if (bp > 0) {
        recipeSpend += bp;
        recipeProfit += 5 * marketTokenPrice;
        giftSoulCost += legendarySoulPrice; // 레전더리 소울 결정 1개 소모
      }
    } else if (r.type === 'brilliantGift') {
      if (bp > 0) {
        recipeSpend += bp;
        recipeProfit += 20 * marketTokenPrice;
        giftSoulCost += epicSoulPrice; // 에픽 소울 결정 1개 소모
      }
    } else {
      const seals = Number(r.sealCost || 0);
      const sp = Number(r.sellPrice || 0);
      if (bp > 0 || sp > 0) {
        recipeSpend += bp;
        recipeSealCostValue += seals * 5000;
        recipeProfit += sp;
      }
    }
  });

  // 순수 던전 획득 골드 = 입력값 + 특별상점 지출 역산
  const grossPureGold = pureGoldInput + tokenSpend + recipeSpend;

  let customTradableValue = 0;
  (form.customItems || []).forEach(item => {
    customTradableValue += Number(item.quantity || 0) * (Number(item.price || 0) || (auctionPrices[item.name] || 0));
  });

  const totalConsumedValue = tokenCost + potionCost;
  const finalTradableValue = pureGoldInput + tradableCoreValue + tradableCrystalValue + voucherProfitTotal + tradableSealValue + voucherBoxValue + customTradableValue + tokenProfit + recipeProfit - giftSoulCost;
  const finalBoundValue = totalBoundValue - recipeSealCostValue;
  const totalProfit = finalBoundValue + finalTradableValue - totalConsumedValue;

  return {
    runs, sealValue, boundCoreValue, boundCrystalValue, totalBoundValue, tradableCoreValue, tradableCrystalValue,
    voucherProfitTotal, tradableSealValue, voucherBoxValue, tokenCost, potionCost,
    tokenSpend, recipeSpend, grossPureGold,
    tokenProfit, recipeProfit, giftSoulCost,
    customTradableValue, recipeSealCostValue,
    totalConsumedValue, finalTradableValue, finalBoundValue, totalProfit
  };
}

function CalcDetailModal({ calcDetail, onClose }) {
  if (!calcDetail) return null;
  const { charName, items, breakdown, totals, final } = calcDetail;
  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>📊 상세 가치 산출 내역 ({charName})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem' }}>
          {[
            { title: '📦 귀속 가치 (Bound)', color: '#fb923c', rows: [
              [`순례의 인장 (${items.seal}개)`, breakdown.seal],
              [`응축된 라이언 코어 (${items.core}개)`, breakdown.core],
              [`빛나는 조화의 결정체 (${items.crystal}개)`, breakdown.crystal],
              ...(breakdown.recipeSealCost > 0 ? [[`레시피 인장 소모`, -breakdown.recipeSealCost]] : []),
            ], total: ['귀속 합계', totals.bound, '#fb923c'] },
            { title: '💰 교환 가능 가치 (Tradable)', color: '#38bdf8', rows: [
              ['순 골드 (던전 획득, 구매 미포함)', breakdown.grossPureGold ?? items.pureGold],
              ...(breakdown.tokenSpend > 0 ? [['  └ 특별상점 증표 구매 지출', -breakdown.tokenSpend]] : []),
              ...(breakdown.recipeSpend > 0 ? [['  └ 특별상점 레시피/답례품 구매 지출', -breakdown.recipeSpend]] : []),
              [`무결점 라이언 코어 (${items.flawlessCore}개)`, breakdown.flawlessCore],
              [`무결점 조화의 결정체 (${items.flawlessCrystal}개)`, breakdown.flawlessCrystal],
              [`순례의 인장(1회 교환 가능) 교환권 수익 (${items.sealVoucher}개)`, breakdown.sealVoucher],
              [`순례의 인장(1회 교환 가능) 교환권 1개 상자 (${items.sealVoucherBox}개)`, breakdown.sealVoucherBox],
              [`순례의 인장(1회 교환 가능) (${items.tradableSeal}개)`, breakdown.tradableSeal],
              ...(breakdown.tokenProfit ? [['닳아버린 순례의 증표 판매 예정가 (미수령)', breakdown.tokenProfit]] : []),
              ...(breakdown.recipeProfit ? [['레시피/답례품 판매 예정가 (미수령)', breakdown.recipeProfit]] : []),
              ...(breakdown.giftSoulCost > 0 ? [['답례품 소울 결정 소모 (교환 가능)', -breakdown.giftSoulCost]] : []),
              ...(breakdown.customTradable > 0 ? [['커스텀 추가 항목 (교환)', breakdown.customTradable]] : []),
            ], total: ['교환 가능 합계', totals.tradable, '#38bdf8'] },
            { title: '📉 소모 비용 (Costs)', color: '#f87171', rows: [
              [`닳아버린 순례의 증표 소모 (${items.runs}개)`, `-${breakdown.tokenCost.toLocaleString()}`],
              ...(breakdown.potionCost > 0 ? [[`피로 회복의 영약 (1개)`, `-${breakdown.potionCost.toLocaleString()}`]] : []),
            ], total: ['소모 합계', `-${totals.consumed.toLocaleString()}`, '#f87171'] },
          ].map(({ title, color, rows, total }) => (
            <div key={title}>
              <h4 style={{ color, marginBottom: '0.5rem', fontSize: '0.7rem' }}>{title}</h4>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                {rows.map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span>{label}</span>
                    <span>{typeof value === 'number' ? `${value.toLocaleString()} G` : `${value} G`}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: total[2], borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.3rem', marginTop: '0.3rem' }}>
                  <span>{total[0]}</span>
                  <span>{typeof total[1] === 'number' ? `${total[1].toLocaleString()} G` : `${total[1]} G`}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.5rem' }}>
              <span>순수익 (귀속 제외)</span><span>{final.excludingBound.toLocaleString()} G</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', color: '#4ade80' }}>
              <span>순수익 (귀속 포함)</span><span>{final.includingBound.toLocaleString()} G</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>확인</button>
        </div>
      </div>
    </div>
  );
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

// 자동 캡처 인식 대상 (아이콘 구별 가능)
const LOOT_FIELDS_AUTO = [
  ['seal', '순례의 인장'],
  ['condensedCore', '응축된 라이언 코어'], ['flawlessCore', '무결점 라이언 코어'],
  ['crystal', '빛나는 조화의 결정체'], ['flawlessCrystal', '무결점 조화의 결정체'],
];

// 아이콘이 동일해 자동 구별 불가 → 직접 입력
const LOOT_FIELDS_MANUAL = [
  ['tradableSeal', '순례의 인장(1회 교환 가능)'],
  ['sealVoucher', '순례의 인장(1회 교환 가능) 교환권'],
  ['sealVoucherBox', '순례의 인장(1회 교환 가능) 교환권 1개 상자'],
];

const PIP_NORMAL = { w: 560, h: 720 };
const PIP_CROP   = { w: 1280, h: 820 };

function PiPContent({ selectedChars, getCharForm, updateCharForm, auctionPrices, apiKey, addCharToken, updateCharToken, removeCharToken, addCharRecipe, updateCharRecipe, removeCharRecipe, pipWindow }) {
  const [activeCharId, setActiveCharId] = useState(selectedChars[selectedChars.length - 1]?.id || null);
  const [tab, setTab] = useState('loot');
  const [fetchingItemId, setFetchingItemId] = useState(null);
  const [screenshot, setScreenshot] = useState(null); // { dataURL, w, h }
  const [cropRect, setCropRect] = useState(null);     // { x1,y1,x2,y2 } in display coords
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState(null); // { cropDataURL, rawText }
  const [showDebug, setShowDebug] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    if (selectedChars.length > 0 && !selectedChars.find(c => c.id === activeCharId)) {
      setActiveCharId(selectedChars[0].id);
    }
  }, [selectedChars, activeCharId]);

  if (selectedChars.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', background: '#0f172a', height: '100%' }}>
        메인 화면에서 순례 참여 캐릭터를 선택해주세요.
      </div>
    );
  }

  const charId = (activeCharId && selectedChars.find(c => c.id === activeCharId)) ? activeCharId : selectedChars[0].id;
  const form = getCharForm(charId);

  const inp = { width: '100%', padding: '0.35rem 0.4rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', boxSizing: 'border-box' };
  const lbl = { display: 'block', marginBottom: '0.2rem', fontSize: '0.6rem', color: '#94a3b8', lineHeight: '1.3', wordBreak: 'keep-all' };

  const activeChar = selectedChars.find(c => c.id === charId);

  const takeScreenshot = async () => {
    setScreenshot(null);
    setCaptureStatus('');
    setCropRect(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'window' }, audio: false });
      const track = stream.getVideoTracks()[0];
      let bitmap;
      if (typeof ImageCapture !== 'undefined') {
        bitmap = await new ImageCapture(track).grabFrame();
      } else {
        const video = document.createElement('video');
        video.srcObject = new MediaStream([track]);
        await new Promise(res => { video.onloadedmetadata = () => { video.play(); res(); }; });
        const cv = document.createElement('canvas');
        cv.width = video.videoWidth; cv.height = video.videoHeight;
        cv.getContext('2d').drawImage(video, 0, 0);
        video.srcObject = null;
        bitmap = cv;
      }
      stream.getTracks().forEach(t => t.stop());
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      setScreenshot({ dataURL: canvas.toDataURL('image/png'), w: bitmap.width, h: bitmap.height });
      setCaptureStatus('영역을 드래그해서 선택 후 분석 버튼을 누르세요');
    } catch (e) {
      if (e.name !== 'AbortError') setCaptureStatus('❌ 캡처 실패: ' + e.message);
    }
  };

  const onPreviewMouseDown = useCallback((e) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    setDragStart({ x, y });
    setCropRect({ x1: x, y1: y, x2: x, y2: y });
    setIsDragging(true);
  }, []);

  const onPreviewMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCropRect({ x1: dragStart.x, y1: dragStart.y, x2: x, y2: y });
  }, [isDragging, dragStart]);

  const onPreviewMouseUp = useCallback(() => { setIsDragging(false); }, []);

  const analyzeSelection = async () => {
    if (!screenshot || !cropRect) return;
    const { x1, y1, x2, y2 } = cropRect;
    if (Math.abs(x2 - x1) < 5 || Math.abs(y2 - y1) < 5) {
      setCaptureStatus('❌ 영역을 더 크게 선택해주세요');
      return;
    }
    setIsCapturing(true);
    try {
      const preview = previewRef.current;
      const scaleX = screenshot.w / preview.offsetWidth;
      const scaleY = screenshot.h / preview.offsetHeight;
      const rx = Math.round(Math.min(x1, x2) * scaleX);
      const ry = Math.round(Math.min(y1, y2) * scaleY);
      const rw = Math.round(Math.abs(x2 - x1) * scaleX);
      const rh = Math.round(Math.abs(y2 - y1) * scaleY);

      const img = new Image();
      img.src = screenshot.dataURL;
      await new Promise(res => { img.onload = res; });

      // 원본 해상도 크롭 (템플릿 매칭용)
      const origCanvas = document.createElement('canvas');
      origCanvas.width = rw; origCanvas.height = rh;
      origCanvas.getContext('2d').drawImage(img, rx, ry, rw, rh, 0, 0, rw, rh);

      // 2x 업스케일 크롭 (Claude vision 전송용 기반)
      const scaled = document.createElement('canvas');
      scaled.width = rw * 2; scaled.height = rh * 2;
      const sCtx = scaled.getContext('2d');
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(img, rx, ry, rw, rh, 0, 0, rw * 2, rh * 2);

      // ── 1. 격자 분석 + 템플릿 매칭으로 아이콘 위치 탐색 ──────
      setCaptureStatus('아이콘 위치 탐색 중...');
      const { findItemPositions } = await import('../lib/templateMatch.js');
      const ICON_KEYS = ['seal', 'condensedCore', 'flawlessCore', 'crystal', 'flawlessCrystal'];
      const { positions, grid } = await findItemPositions(origCanvas, ICON_KEYS, 0.95);

      // ── 2. 매칭 결과 시각화 (2x 캔버스에 어노테이션) ───────────
      const ITEM_COLORS = {
        seal: '#ff6b6b', condensedCore: '#ffa94d',
        flawlessCore: '#ffd43b', crystal: '#74c0fc', flawlessCrystal: '#b197fc',
      };
      const annotated = document.createElement('canvas');
      annotated.width = rw * 2; annotated.height = rh * 2;
      const aCtx = annotated.getContext('2d');
      aCtx.drawImage(scaled, 0, 0);

      // 격자 오버레이 (초록색 반투명)
      aCtx.strokeStyle = 'rgba(0,255,80,0.55)';
      aCtx.lineWidth = 1;
      const gsx = grid.startX * 2, gsy = grid.startY * 2;
      const gcw = grid.cellW * 2, gch = grid.cellH * 2;
      for (let x = gsx; x <= rw * 2; x += gcw) {
        aCtx.beginPath(); aCtx.moveTo(x, 0); aCtx.lineTo(x, rh * 2); aCtx.stroke();
      }
      for (let y = gsy; y <= rh * 2; y += gch) {
        aCtx.beginPath(); aCtx.moveTo(0, y); aCtx.lineTo(rw * 2, y); aCtx.stroke();
      }

      const positionData = {};
      for (const key of ICON_KEYS) {
        const pos = positions[key];
        if (!pos) continue;
        const ax = pos.cellX * 2, ay = pos.cellY * 2;
        const aw = pos.cellW * 2, ah = pos.cellH * 2;
        const color = ITEM_COLORS[key];
        // 셀 테두리
        aCtx.strokeStyle = color;
        aCtx.lineWidth = 2;
        aCtx.strokeRect(ax + 1, ay + 1, aw - 2, ah - 2);
        // 레이블 (하단 — 숫자 영역인 좌상단을 가리지 않도록)
        aCtx.fillStyle = color + 'cc';
        aCtx.fillRect(ax + 1, ay + ah - 13, aw - 2, 12);
        aCtx.fillStyle = '#000';
        aCtx.font = 'bold 9px monospace';
        aCtx.fillText(key, ax + 3, ay + ah - 3);
        positionData[key] = { x: ax, y: ay, w: aw, h: ah };
      }
      const annotatedDataURL = annotated.toDataURL('image/jpeg', 0.92);
      const base64 = annotatedDataURL.split(',')[1];

      // ── 3. Claude Vision: 숫자 읽기 + 골드 탐지 ──────────────
      setCaptureStatus('숫자 인식 중...');
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, positions: positionData }),
      });
      const data = await res.json();

      const posLog = `격자: cellW=${grid.cellW} cellH=${grid.cellH} startX=${grid.startX} startY=${grid.startY}\n` +
        Object.entries(positions)
          .map(([k, v]) => v ? `${k}: row=${v.row} col=${v.col} sim=${(v.sim * 100).toFixed(1)}%` : `${k}: 미발견`)
          .join('\n');
      setDebugInfo({ cropDataURL: annotatedDataURL, rawText: `[매칭 위치]\n${posLog}\n\n[Claude 응답]\n${data.rawText ?? data.error ?? '(없음)'}` });

      if (!data.success) throw new Error(data.error || '분석 실패');
      const d = data.data;
      ['pureGold', 'seal', 'condensedCore', 'flawlessCore', 'crystal', 'flawlessCrystal']
        .forEach(k => { if (d[k] !== undefined) updateCharForm(charId, k, String(d[k])); });
      setCaptureStatus(`✅ 완료 (${new Date().toLocaleTimeString()})`);
    } catch (e) {
      setCaptureStatus('❌ ' + e.message);
    }
    setIsCapturing(false);
    setScreenshot(null);
    setCropRect(null);
  };

  const fetchCustomItemPrice = async (itemName, itemId) => {
    if (!itemName || !apiKey) return;
    setFetchingItemId(itemId);
    try {
      const res = await fetch('/api/auction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, itemNames: [itemName] }) });
      const data = await res.json();
      if (data.success && data.data[itemName] !== undefined) {
        const items = getCharForm(charId).customItems || [];
        updateCharForm(charId, 'customItems', items.map(i => i.id === itemId ? { ...i, price: data.data[itemName] } : i));
      }
    } catch (e) { console.error(e); }
    setFetchingItemId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', fontSize: '0.8rem' }}>
      {/* 캐릭터 탭 */}
      <div style={{ display: 'flex', overflowX: 'auto', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0.35rem 0.35rem 0', gap: '0.25rem', flexShrink: 0 }}>
        {selectedChars.map(c => (
          <button key={c.id} onClick={() => setActiveCharId(c.id)} style={{ padding: '0.3rem 0.55rem', fontSize: '0.7rem', borderRadius: '4px 4px 0 0', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: c.id === charId ? '#1e293b' : 'transparent', color: c.id === charId ? '#38bdf8' : '#64748b', fontWeight: c.id === charId ? 'bold' : 'normal', borderBottom: c.id === charId ? '2px solid #38bdf8' : '2px solid transparent' }}>
            {c.base.charName}
          </button>
        ))}
      </div>
      {/* 탭 전환 */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        {[['loot', '📦 재화 입력'], ['shop', '🛒 특별상점']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '0.45rem', fontSize: '0.7rem', border: 'none', cursor: 'pointer', background: tab === t ? 'rgba(56,189,248,0.12)' : 'transparent', color: tab === t ? '#38bdf8' : '#64748b', borderBottom: tab === t ? '2px solid #38bdf8' : '2px solid transparent', fontWeight: tab === t ? 'bold' : 'normal' }}>
            {label}
          </button>
        ))}
      </div>
      {/* 내용 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {tab === 'loot' ? (
          <>
            {/* 화면 캡처 자동 입력 */}
            <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '6px', padding: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 'bold', flex: 1 }}>📷 화면 캡처 자동 입력</span>
                <button onClick={() => { pipWindow?.resizeTo(PIP_CROP.w, PIP_CROP.h); takeScreenshot(); }} title="창 선택 창이 열리면 'Dungeon & Fighter' 창을 선택하세요" style={{ padding: '0.25rem 0.6rem', fontSize: '0.65rem', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {screenshot ? '재캡처' : '캡처'}
                </button>
                {screenshot && (
                  <>
                    <button onClick={() => { pipWindow?.resizeTo(PIP_NORMAL.w, PIP_NORMAL.h); analyzeSelection(); }} disabled={isCapturing || !cropRect} style={{ padding: '0.25rem 0.6rem', fontSize: '0.65rem', background: (isCapturing || !cropRect) ? 'rgba(255,255,255,0.05)' : 'rgba(74,222,128,0.2)', color: (isCapturing || !cropRect) ? '#475569' : '#4ade80', border: `1px solid ${(isCapturing || !cropRect) ? 'rgba(255,255,255,0.1)' : 'rgba(74,222,128,0.4)'}`, borderRadius: '4px', cursor: (isCapturing || !cropRect) ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                      {isCapturing ? '⏳' : '분석'}
                    </button>
                    <button onClick={() => { pipWindow?.resizeTo(PIP_NORMAL.w, PIP_NORMAL.h); setScreenshot(null); setCropRect(null); setCaptureStatus(''); }} style={{ padding: '0.25rem 0.4rem', fontSize: '0.65rem', background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                  </>
                )}
              </div>
              {captureStatus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: screenshot ? '0.4rem' : 0 }}>
                  <span style={{ fontSize: '0.6rem', color: captureStatus.startsWith('❌') ? '#f87171' : captureStatus.startsWith('✅') ? '#4ade80' : '#94a3b8', lineHeight: 1.4, flex: 1 }}>{captureStatus}</span>
                  {debugInfo && (
                    <button onClick={() => setShowDebug(v => !v)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.6rem', background: showDebug ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)', color: showDebug ? '#fbbf24' : '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {showDebug ? '디버그 닫기' : '🔍 디버그'}
                    </button>
                  )}
                </div>
              )}
              {showDebug && debugInfo && (() => {
                const raw = debugInfo.rawText || '';
                const jsonMatch = [...raw.matchAll(/\{[^{}]*\}/g)].pop();
                const reasoning = jsonMatch ? raw.slice(0, raw.lastIndexOf(jsonMatch[0])).trim() : raw;
                const jsonPart = jsonMatch ? jsonMatch[0] : '';
                return (
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '4px', padding: '0.5rem', marginBottom: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.3rem' }}>전송된 크롭 이미지</div>
                      <img src={debugInfo.cropDataURL} alt="crop" style={{ width: '100%', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                    {reasoning && (
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#a78bfa', fontWeight: 'bold', marginBottom: '0.2rem' }}>Claude 매칭 과정</div>
                        <pre style={{ fontSize: '0.55rem', color: '#cbd5e1', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: '3px', maxHeight: '200px', overflowY: 'auto' }}>{reasoning}</pre>
                      </div>
                    )}
                    {jsonPart && (
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#4ade80', fontWeight: 'bold', marginBottom: '0.2rem' }}>최종 JSON</div>
                        <pre style={{ fontSize: '0.6rem', color: '#4ade80', margin: 0, whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: '3px' }}>{jsonPart}</pre>
                      </div>
                    )}
                  </div>
                );
              })()}
              {screenshot && (
                <div
                  ref={previewRef}
                  onMouseDown={onPreviewMouseDown}
                  onMouseMove={onPreviewMouseMove}
                  onMouseUp={onPreviewMouseUp}
                  onMouseLeave={onPreviewMouseUp}
                  style={{ position: 'relative', width: '100%', aspectRatio: `${screenshot.w}/${screenshot.h}`, cursor: 'crosshair', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', userSelect: 'none' }}
                >
                  <img src={screenshot.dataURL} alt="capture" style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />
                  {cropRect && (
                    <div style={{
                      position: 'absolute',
                      left: Math.min(cropRect.x1, cropRect.x2),
                      top: Math.min(cropRect.y1, cropRect.y2),
                      width: Math.abs(cropRect.x2 - cropRect.x1),
                      height: Math.abs(cropRect.y2 - cropRect.y1),
                      border: '2px solid #4ade80',
                      background: 'rgba(74,222,128,0.1)',
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              )}
            </div>
            {/* 자동 입력 항목 */}
            <div>
              <div style={{ fontSize: '0.6rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '0.4rem' }}>📷 자동 입력 항목</div>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={lbl}>순 골드 (던전 획득, 구매 미포함)</label>
                <input type="number" style={inp} value={form.pureGold || ''} onChange={e => updateCharForm(charId, 'pureGold', e.target.value)} placeholder="0" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {LOOT_FIELDS_AUTO.map(([key, label]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input type="number" style={inp} value={form[key] || ''} onChange={e => updateCharForm(charId, key, e.target.value)} placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
            {/* 소모품 직접 입력 */}
            <div style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '6px', padding: '0.55rem' }}>
              <div style={{ fontSize: '0.6rem', color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.45rem' }}>✏️ 소모품 (직접 입력)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {LOOT_FIELDS_MANUAL.map(([key, label]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input type="number" style={inp} value={form[key] || ''} onChange={e => updateCharForm(charId, key, e.target.value)} placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
            {/* 커스텀 아이템 */}
            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '0.55rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: 'bold' }}>커스텀 추가 항목</span>
                <button onClick={() => { const items = form.customItems || []; updateCharForm(charId, 'customItems', [...items, { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: '', quantity: '', price: 0 }]); }} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', background: 'rgba(96,165,250,0.18)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '3px', cursor: 'pointer' }}>+ 추가</button>
              </div>
              {(form.customItems || []).map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <input type="text" placeholder="아이템명" style={{ ...inp, flex: 1 }} value={item.name}
                    onChange={e => { const items = form.customItems || []; updateCharForm(charId, 'customItems', items.map(i => i.id === item.id ? { ...i, name: e.target.value } : i)); }}
                    onBlur={e => { if (e.target.value.trim()) fetchCustomItemPrice(e.target.value.trim(), item.id); }}
                  />
                  <input type="number" placeholder="수량" style={{ ...inp, width: '52px', flex: 'none' }} value={item.quantity}
                    onChange={e => { const items = form.customItems || []; updateCharForm(charId, 'customItems', items.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i)); }}
                  />
                  {fetchingItemId === item.id ? <span style={{ fontSize: '0.65rem', color: '#fbbf24' }}>⏳</span> : null}
                  <button onClick={() => { const items = form.customItems || []; updateCharForm(charId, 'customItems', items.filter(i => i.id !== item.id)); }} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0', flexShrink: 0 }}>×</button>
                </div>
              ))}
              {(form.customItems || []).length === 0 && <div style={{ fontSize: '0.65rem', color: '#475569', textAlign: 'center' }}>없음</div>}
            </div>
            {/* 포션 / 메모 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={lbl}>포션 사용:</span>
              <button onClick={() => updateCharForm(charId, 'usePotion', !form.usePotion)} style={{ padding: '0.2rem 0.7rem', fontSize: '0.7rem', background: form.usePotion ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)', border: form.usePotion ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.12)', color: form.usePotion ? '#f87171' : '#64748b', borderRadius: '4px', cursor: 'pointer' }}>
                {form.usePotion ? '사용' : '미사용'}
              </button>
            </div>
            <div>
              <label style={lbl}>메모</label>
              <input type="text" style={inp} value={form.memo || ''} onChange={e => updateCharForm(charId, 'memo', e.target.value)} placeholder="특이사항" />
            </div>
          </>
        ) : (
          <>
            {/* 인장 구매 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold' }}>인장 구매</span>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {[90000, 100000, 110000].map(price => (
                    <button key={price} onClick={() => addCharToken(charId, String(price))} style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '3px', cursor: 'pointer' }}>{price / 10000}만</button>
                  ))}
                  <button onClick={() => addCharToken(charId)} style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem', background: 'rgba(255,255,255,0.07)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', cursor: 'pointer' }}>직접</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {(form.secretTokens || []).map((t, idx) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{ fontSize: '0.6rem', color: '#475569' }}>#{idx + 1}</span>
                    <input type="number" value={t.buyPrice} onChange={e => updateCharToken(charId, t.id, e.target.value)} style={{ width: '68px', padding: '0.2rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', borderRadius: '3px', fontSize: '0.7rem' }} placeholder="골드" />
                    <button onClick={() => removeCharToken(charId, t.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0' }}>×</button>
                  </div>
                ))}
                {(form.secretTokens || []).length === 0 && <div style={{ fontSize: '0.65rem', color: '#475569' }}>없음</div>}
              </div>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            {/* 레시피 / 답례품 */}
            <div>
              <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: '#a78bfa', fontWeight: 'bold' }}>레시피:</span>
                <button onClick={() => addCharRecipe(charId)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.28)', borderRadius: '3px', cursor: 'pointer' }}>+ 일반</button>
                <button onClick={() => { const f = getCharForm(charId); updateCharForm(charId, 'secretRecipes', [...(f.secretRecipes || []), { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, buyPrice: '', type: 'shinyGift' }]); }} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.28)', borderRadius: '3px', cursor: 'pointer' }}>+ 빛나는</button>
                <button onClick={() => { const f = getCharForm(charId); updateCharForm(charId, 'secretRecipes', [...(f.secretRecipes || []), { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, buyPrice: '', type: 'brilliantGift' }]); }} style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.28)', borderRadius: '3px', cursor: 'pointer' }}>+ 화려한</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {(form.secretRecipes || []).map((r, idx) => {
                  const isShiny = r.type === 'shinyGift', isBrilliant = r.type === 'brilliantGift', isGift = isShiny || isBrilliant;
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.65rem', color: isGift ? '#fbbf24' : '#a78bfa', minWidth: '80px', flexShrink: 0 }}>
                        {isShiny ? '🎁 빛나는 답례품' : isBrilliant ? '🎁 화려한 답례품' : `레시피 #${idx + 1}`}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.6rem', color: '#64748b' }}>구매가:</span>
                        <input type="number" value={r.buyPrice} onChange={e => updateCharRecipe(charId, r.id, 'buyPrice', e.target.value)} style={{ width: '70px', padding: '0.2rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', borderRadius: '3px', fontSize: '0.65rem' }} placeholder="골드" />
                      </div>
                      {!isGift && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#64748b' }}>인장:</span>
                            <input type="number" value={r.sealCost} onChange={e => updateCharRecipe(charId, r.id, 'sealCost', e.target.value)} style={{ width: '38px', padding: '0.2rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', borderRadius: '3px', fontSize: '0.65rem' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#64748b' }}>판매가:</span>
                            <input type="number" value={r.sellPrice} onChange={e => updateCharRecipe(charId, r.id, 'sellPrice', e.target.value)} style={{ width: '70px', padding: '0.2rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', borderRadius: '3px', fontSize: '0.65rem' }} />
                          </div>
                        </>
                      )}
                      <button onClick={() => removeCharRecipe(charId, r.id)} style={{ marginLeft: 'auto', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0' }}>×</button>
                    </div>
                  );
                })}
                {(form.secretRecipes || []).length === 0 && <div style={{ fontSize: '0.65rem', color: '#475569' }}>없음</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PilgrimageTab({ characters, pilgrimageHistory, onSavePilgrimage, onDeletePilgrimage, apiKey }) {
  const [pilgrimageForm, setPilgrimageForm] = useState({});
  const [globalStartFatigue, setGlobalStartFatigue] = useState('');
  const [auctionPrices, setAuctionPrices] = useState(DEFAULT_AUCTION_PRICES);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [activeSecretShopModal, setActiveSecretShopModal] = useState(null);
  const [showAuctionPricesModal, setShowAuctionPricesModal] = useState(false);
  const [calcDetail, setCalcDetail] = useState(null);
  const [activeLootModal, setActiveLootModal] = useState(null);
  const [isPipOpen, setIsPipOpen] = useState(false);
  const pipWindowRef = useRef(null);
  const pipRootRef = useRef(null);

  useEffect(() => {
    const draft = localStorage.getItem('DNF_PILGRIMAGE_FORM_DRAFT');
    if (draft) { try { setPilgrimageForm(JSON.parse(draft)); } catch (e) {} }
    const draftFatigue = localStorage.getItem('DNF_PILGRIMAGE_GLOBAL_FATIGUE');
    if (draftFatigue) setGlobalStartFatigue(Number(draftFatigue));
    const draftPrices = localStorage.getItem('DNF_PILGRIMAGE_AUCTION_PRICES');
    if (draftPrices) { try { setAuctionPrices(prev => ({ ...prev, ...JSON.parse(draftPrices) })); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (globalStartFatigue !== '') localStorage.setItem('DNF_PILGRIMAGE_GLOBAL_FATIGUE', globalStartFatigue);
  }, [globalStartFatigue]);

  useEffect(() => {
    localStorage.setItem('DNF_PILGRIMAGE_AUCTION_PRICES', JSON.stringify(auctionPrices));
  }, [auctionPrices]);

  useEffect(() => {
    if (Object.keys(pilgrimageForm).length > 0) localStorage.setItem('DNF_PILGRIMAGE_FORM_DRAFT', JSON.stringify(pilgrimageForm));
  }, [pilgrimageForm]);

  const getCharForm = (id) => pilgrimageForm[id] || EMPTY_CHAR_FORM();
  const updateCharForm = (id, field, value) => setPilgrimageForm(prev => ({ ...prev, [id]: { ...(prev[id] || EMPTY_CHAR_FORM()), [field]: value } }));
  const togglePilgrimageChar = (id) => updateCharForm(id, 'selected', !getCharForm(id).selected);

  // ─── Document PiP ─────────────────────────────────────────────────────────────

  const renderToPip = useCallback((sel, gCF, uCF, ap, ak, aCT, uCT, rCT, aCR, uCR, rCR) => {
    if (!pipRootRef.current || !pipWindowRef.current) return;
    pipRootRef.current.render(
      <PiPContent
        selectedChars={sel}
        getCharForm={gCF}
        updateCharForm={uCF}
        auctionPrices={ap}
        apiKey={ak}
        addCharToken={aCT}
        updateCharToken={uCT}
        removeCharToken={rCT}
        addCharRecipe={aCR}
        updateCharRecipe={uCR}
        removeCharRecipe={rCR}
        pipWindow={pipWindowRef.current}
      />
    );
  }, []);

  const openDocumentPiP = async () => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
      return;
    }
    if (!('documentPictureInPicture' in window)) {
      alert('Chrome 116 이상에서만 지원됩니다.');
      return;
    }
    try {
      const pip = await window.documentPictureInPicture.requestWindow({ width: 560, height: 720 });
      pipWindowRef.current = pip;

      pip.document.body.style.cssText = 'margin:0;padding:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;overflow:hidden;height:100vh;';
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const el = pip.document.createElement('link');
        el.rel = 'stylesheet'; el.href = link.href;
        pip.document.head.appendChild(el);
      });
      document.querySelectorAll('style').forEach(style => {
        const el = pip.document.createElement('style');
        el.textContent = style.textContent;
        pip.document.head.appendChild(el);
      });

      const container = pip.document.createElement('div');
      container.style.cssText = 'height:100vh;display:flex;flex-direction:column;overflow:hidden;';
      pip.document.body.appendChild(container);

      const root = createRoot(container);
      pipRootRef.current = root;
      setIsPipOpen(true);

      pip.addEventListener('pagehide', () => {
        root.unmount();
        pipRootRef.current = null;
        pipWindowRef.current = null;
        setIsPipOpen(false);
      });
    } catch (e) {
      if (e.name !== 'AbortError') alert('PiP 창 열기 실패: ' + e.message);
    }
  };

  const addCharToken = (charId, buyPrice = '') => {
    const form = getCharForm(charId);
    updateCharForm(charId, 'secretTokens', [...(form.secretTokens || []), { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, buyPrice }]);
  };
  const updateCharToken = (charId, tokenId, val) => {
    updateCharForm(charId, 'secretTokens', getCharForm(charId).secretTokens.map(t => t.id === tokenId ? { ...t, buyPrice: val } : t));
  };
  const removeCharToken = (charId, tokenId) => {
    updateCharForm(charId, 'secretTokens', getCharForm(charId).secretTokens.filter(t => t.id !== tokenId));
  };
  const addCharRecipe = (charId) => {
    const form = getCharForm(charId);
    updateCharForm(charId, 'secretRecipes', [...(form.secretRecipes || []), { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, buyPrice: '', sealCost: '', sellPrice: '' }]);
  };
  const updateCharRecipe = (charId, recipeId, field, val) => {
    updateCharForm(charId, 'secretRecipes', getCharForm(charId).secretRecipes.map(r => r.id === recipeId ? { ...r, [field]: val } : r));
  };
  const removeCharRecipe = (charId, recipeId) => {
    updateCharForm(charId, 'secretRecipes', getCharForm(charId).secretRecipes.filter(r => r.id !== recipeId));
  };

  const applyGlobalFatigue = () => {
    const updated = { ...pilgrimageForm };
    characters.forEach(c => { updated[c.id] = { ...getCharForm(c.id), startFatigue: globalStartFatigue }; });
    setPilgrimageForm(updated);
  };

  const fetchAuctionPrices = async () => {
    if (!apiKey) { alert("API 키가 필요합니다."); return; }
    setIsFetchingPrices(true);
    try {
      const customNames = new Set();
      characters.forEach(c => (getCharForm(c.id).customItems || []).forEach(item => { if (item.name?.trim()) customNames.add(item.name.trim()); }));
      const allItemNames = [...PILGRIMAGE_BASE_ITEMS, ...Array.from(customNames)];
      const res = await fetch('/api/auction', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, itemNames: allItemNames }) });
      const data = await res.json();
      if (data.success) {
        setAuctionPrices(prev => ({ ...prev, ...data.data }));
        const updatedForm = { ...pilgrimageForm };
        characters.forEach(c => {
          const form = getCharForm(c.id);
          const items = form.customItems || [];
          if (items.length > 0) updatedForm[c.id] = { ...form, customItems: items.map(item => item.name && data.data[item.name] !== undefined ? { ...item, price: data.data[item.name] } : item) };
        });
        setPilgrimageForm(updatedForm);
        alert("경매장 시세를 성공적으로 불러왔습니다!");
      } else { alert("불러오기 실패: " + data.error); }
    } catch (e) { console.error(e); alert("경매장 API 연동 중 오류가 발생했습니다."); }
    setIsFetchingPrices(false);
  };

  const handleSavePilgrimage = () => {
    const selectedIds = characters.filter(c => getCharForm(c.id).selected).map(c => c.id);
    if (selectedIds.length === 0) { alert('돌 캐릭터를 하나 이상 선택해주세요.'); return; }

    const recordDetails = selectedIds.map(id => {
      const c = characters.find(char => char.id === id);
      const form = getCharForm(id);
      const v = calcCharValues(form, auctionPrices);
      return {
        charId: id,
        charName: c ? c.base.charName : '알 수 없음',
        jobName: c ? c.base.jobGrowName : '',
        startFatigue: form.startFatigue,
        runs: v.runs,
        acquired: { pureGold: form.pureGold, seal: form.seal, condensedCore: form.condensedCore, crystal: form.crystal, flawlessCore: form.flawlessCore, flawlessCrystal: form.flawlessCrystal, sealVoucher: form.sealVoucher, tradableSeal: form.tradableSeal, sealVoucherBox: form.sealVoucherBox },
        consumed: { token: v.runs, potion: form.usePotion ? 1 : 0 },
        memo: form.memo || '',
        customItems: form.customItems || [],
        customTradableValue: v.customTradableValue,
        secretShop: { tokens: form.secretTokens, recipes: form.secretRecipes, tokenProfit: v.tokenProfit, recipeProfit: v.recipeProfit, recipeSealCost: v.recipeSealCostValue },
        values: { bound: v.finalBoundValue, tradable: v.finalTradableValue, consumed: v.totalConsumedValue, potionCost: v.potionCost, profit: v.totalProfit }
      };
    });

    const totalBound = recordDetails.reduce((acc, d) => acc + d.values.bound, 0);
    const totalTradable = recordDetails.reduce((acc, d) => acc + d.values.tradable, 0);
    const totalConsumed = recordDetails.reduce((acc, d) => acc + d.values.consumed, 0);

    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      details: recordDetails,
      sessionTotals: { bound: totalBound, tradable: totalTradable, consumed: totalConsumed, profit: totalBound + totalTradable - totalConsumed }
    };

    onSavePilgrimage(newRecord);

    const resetForm = { ...pilgrimageForm };
    selectedIds.forEach(id => { resetForm[id] = EMPTY_CHAR_FORM(); });
    setPilgrimageForm(resetForm);
  };

  const sortedChars = getSortedCharacters(characters);
  const selectedChars = sortedChars.filter(c => getCharForm(c.id).selected);

  // PiP 상태 동기화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    renderToPip(selectedChars, getCharForm, updateCharForm, auctionPrices, apiKey, addCharToken, updateCharToken, removeCharToken, addCharRecipe, updateCharRecipe, removeCharRecipe);
  }, [pilgrimageForm, auctionPrices, characters, apiKey, isPipOpen]);

  const inputStyle = { width: '55px', padding: '0.2rem 0.1rem', fontSize: '0.7rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };

  let countWithData = 0, sumFatigue = 0, sumRuns = 0, sumPureGold = 0, sumSeal = 0, sumCondensedCore = 0, sumCrystal = 0;
  let sumFlawlessCore = 0, sumFlawlessCrystal = 0, sumSealVoucher = 0, sumTradableSeal = 0, sumSealVoucherBox = 0;
  let sumTokens = 0, sumPotions = 0, sumBoundValue = 0, sumTradableValue = 0, sumTotalProfit = 0, sumProfitExclBound = 0;

  const rows = selectedChars.map((c, idx) => {
    const form = getCharForm(c.id);
    const v = calcCharValues(form, auctionPrices);
    const hasLootData = ['pureGold', 'seal', 'condensedCore', 'crystal', 'flawlessCore', 'flawlessCrystal', 'sealVoucher', 'sealVoucherBox', 'tradableSeal'].some(k => form[k] && form[k] !== '')
      || (form.customItems && form.customItems.length > 0)
      || (form.secretTokens || []).some(t => t.buyPrice !== '')
      || (form.secretRecipes || []).some(r => r.buyPrice !== '' || r.sealCost !== '' || r.sellPrice !== '');
    const rowStyle = { borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.2s' };
    const totalProfitIncl = v.finalBoundValue + v.finalTradableValue - v.totalConsumedValue;
    const profitExclBound = v.finalTradableValue - v.totalConsumedValue;

    if (hasLootData) {
      countWithData++; sumFatigue += Number(form.startFatigue || 0); sumRuns += v.runs;
      sumPureGold += Number(form.pureGold || 0); sumSeal += Number(form.seal || 0); sumCondensedCore += Number(form.condensedCore || 0);
      sumCrystal += Number(form.crystal || 0); sumFlawlessCore += Number(form.flawlessCore || 0);
      sumFlawlessCrystal += Number(form.flawlessCrystal || 0); sumSealVoucher += Number(form.sealVoucher || 0);
      sumTradableSeal += Number(form.tradableSeal || 0); sumSealVoucherBox += Number(form.sealVoucherBox || 0);
      sumTokens += v.runs; sumPotions += (form.usePotion ? 1 : 0);
      sumBoundValue += v.finalBoundValue; sumTradableValue += v.finalTradableValue;
      sumTotalProfit += totalProfitIncl; sumProfitExclBound += profitExclBound;
    }

    const clickDetail = hasLootData ? {
      charName: c.base.charName,
      items: { seal: Number(form.seal || 0), core: Number(form.condensedCore || 0), crystal: Number(form.crystal || 0), pureGold: Number(form.pureGold || 0), flawlessCore: Number(form.flawlessCore || 0), flawlessCrystal: Number(form.flawlessCrystal || 0), sealVoucher: Number(form.sealVoucher || 0), sealVoucherBox: Number(form.sealVoucherBox || 0), tradableSeal: Number(form.tradableSeal || 0), runs: v.runs },
      breakdown: { seal: v.sealValue, core: v.boundCoreValue, crystal: v.boundCrystalValue, flawlessCore: v.tradableCoreValue, flawlessCrystal: v.tradableCrystalValue, sealVoucher: v.voucherProfitTotal, sealVoucherBox: v.voucherBoxValue, tradableSeal: v.tradableSealValue, tokenCost: v.tokenCost, potionCost: v.potionCost, recipeSealCost: v.recipeSealCostValue, customTradable: v.customTradableValue, tokenProfit: v.tokenProfit, recipeProfit: v.recipeProfit, giftSoulCost: v.giftSoulCost, grossPureGold: v.grossPureGold, tokenSpend: v.tokenSpend, recipeSpend: v.recipeSpend },
      totals: { bound: v.finalBoundValue, tradable: v.finalTradableValue, consumed: v.totalConsumedValue },
      final: { includingBound: totalProfitIncl, excludingBound: profitExclBound }
    } : null;

    return (
      <tr key={c.id} style={rowStyle}>
        <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: '#38bdf8', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '72px' }} onClick={() => togglePilgrimageChar(c.id)} title={`${c.base.charName} - 클릭 시 목록에서 제거`}>
          <span style={{ fontSize: '0.7rem' }}>{c.base.charName}</span><span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 'normal' }}>✕</span>
        </td>
        <td style={{ padding: '0.2rem 0.1rem' }}><input type="number" style={inputStyle} value={form.startFatigue} onChange={e => updateCharForm(c.id, 'startFatigue', e.target.value)} /></td>
        <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: '#fbbf24' }}>{v.runs}</td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setActiveLootModal({ charId: c.id })} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', borderRadius: '4px', cursor: 'pointer' }}>재화 입력</button>
        </td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{Number(form.pureGold || 0) > 0 ? Number(form.pureGold).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem' }}>{form.seal > 0 ? Number(form.seal).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem' }}>{form.tradableSeal > 0 ? Number(form.tradableSeal).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem' }}>{form.sealVoucher > 0 ? Number(form.sealVoucher).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem' }}>{form.sealVoucherBox > 0 ? Number(form.sealVoucherBox).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{form.condensedCore > 0 ? Number(form.condensedCore).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem' }}>{form.flawlessCore > 0 ? Number(form.flawlessCore).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{form.crystal > 0 ? Number(form.crystal).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem' }}>{form.flawlessCrystal > 0 ? Number(form.flawlessCrystal).toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5' }}>{v.runs > 0 ? v.runs : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem', color: '#fca5a5' }}>
          <button onClick={() => updateCharForm(c.id, 'usePotion', !form.usePotion)} style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem', background: form.usePotion ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.05)', border: form.usePotion ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.1)', color: form.usePotion ? '#f87171' : '#64748b', borderRadius: '3px', cursor: 'pointer' }}>
            {form.usePotion ? '사용' : '미사용'}
          </button>
        </td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', verticalAlign: 'middle' }}>
          <button onClick={() => setActiveSecretShopModal({ charId: c.id })} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
            특별상점 관리 {((form.secretTokens?.length || 0) + (form.secretRecipes?.length || 0)) > 0 ? `(${(form.secretTokens?.length || 0) + (form.secretRecipes?.length || 0)})` : ''}
          </button>
        </td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', verticalAlign: 'middle' }}>{v.finalBoundValue > 0 ? v.finalBoundValue.toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem', color: '#e2e8f0', verticalAlign: 'middle' }}>{v.finalTradableValue > 0 ? v.finalTradableValue.toLocaleString() : '-'}</td>
        <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: hasLootData ? (totalProfitIncl > 0 ? '#4ade80' : totalProfitIncl < 0 ? '#f87171' : '#cbd5e1') : '#94a3b8', verticalAlign: 'middle', cursor: hasLootData ? 'pointer' : 'default', textDecoration: hasLootData ? 'underline' : 'none' }} onClick={() => clickDetail && setCalcDetail(clickDetail)}>
          {hasLootData ? (totalProfitIncl !== 0 ? totalProfitIncl.toLocaleString() : '-') : '-'}
        </td>
        <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: hasLootData ? (profitExclBound > 0 ? '#38bdf8' : profitExclBound < 0 ? '#f87171' : '#cbd5e1') : '#94a3b8', verticalAlign: 'middle', cursor: hasLootData ? 'pointer' : 'default', textDecoration: hasLootData ? 'underline' : 'none' }} onClick={() => clickDetail && setCalcDetail(clickDetail)}>
          {hasLootData ? (profitExclBound !== 0 ? profitExclBound.toLocaleString() : '-') : '-'}
        </td>
      </tr>
    );
  });

  return (
    <section className="glass-panel" style={{ minHeight: '60vh' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>✨ 광휘의 순례 기록표</h2>

      {/* Global Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>일괄 피로도:</label>
          <input type="number" value={globalStartFatigue} onChange={e => setGlobalStartFatigue(Number(e.target.value))} style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem' }} />
          <button onClick={applyGlobalFatigue} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8' }}>적용</button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={openDocumentPiP} style={{ padding: '0.5rem 1rem', background: isPipOpen ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)', color: isPipOpen ? '#4ade80' : '#cbd5e1', border: isPipOpen ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>
            {isPipOpen ? '📌 PiP 닫기' : '📌 PiP 입력창'}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={fetchAuctionPrices} disabled={isFetchingPrices} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
              {isFetchingPrices ? '불러오는 중...' : '단가 새로고침'}
            </button>
            <button onClick={() => setShowAuctionPricesModal(true)} style={{ padding: '0.5rem 1rem', background: 'rgba(167,139,250,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>단가 확인</button>
          </div>
          <button onClick={handleSavePilgrimage} style={{ padding: '0.5rem 1.5rem', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', borderRadius: '4px', fontSize: '0.7rem' }}>선택 캐릭터 저장</button>
        </div>
      </div>

      {/* 캐릭터 선택 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.8rem' }}>참여 캐릭터 선택 (클릭하여 추가/제거)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {sortedChars.map(c => {
            const isSelected = getCharForm(c.id).selected;
            return (
              <button key={c.id} onClick={() => togglePilgrimageChar(c.id)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', borderRadius: '4px', border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: isSelected ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)', color: isSelected ? '#fff' : '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}>
                {c.base.charName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table */}
      <div style={{ overflowX: 'auto', marginBottom: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'center', whiteSpace: 'nowrap', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '72px' }} />{/* 캐릭터 */}
            <col style={{ width: '52px' }} />{/* 피로도 */}
            <col style={{ width: '32px' }} />{/* 판수 */}
            <col style={{ width: '54px' }} />{/* 재화입력 */}
            <col style={{ width: '72px' }} />{/* 순골드 */}
            <col style={{ width: '28px' }} />{/* 인장 */}
            <col style={{ width: '32px' }} />{/* 교환인장 */}
            <col style={{ width: '32px' }} />{/* 교환권 */}
            <col style={{ width: '42px' }} />{/* 교환권상자 */}
            <col style={{ width: '28px' }} />{/* 응축코어 */}
            <col style={{ width: '28px' }} />{/* 무결점코어 */}
            <col style={{ width: '32px' }} />{/* 빛결정 */}
            <col style={{ width: '32px' }} />{/* 무결점결정 */}
            <col style={{ width: '28px' }} />{/* 증표 */}
            <col style={{ width: '40px' }} />{/* 포션 */}
            <col style={{ width: '76px' }} />{/* 특별상점 */}
            <col style={{ width: '64px' }} />{/* 귀속가치 */}
            <col style={{ width: '64px' }} />{/* 교환가치 */}
            <col style={{ width: '64px' }} />{/* 순수익포함 */}
            <col style={{ width: '64px' }} />{/* 순수익제외 */}
          </colgroup>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
              <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>캐릭터</th>
              <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>시작 피로도</th>
              <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fbbf24', fontSize: '0.7rem' }}>예상 판수</th>
              <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4ade80', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>재화 입력</th>
              <th colSpan="9" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#4ade80', fontSize: '0.7rem' }}>획득 재화 (기록)</th>
              <th colSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5', fontSize: '0.7rem' }}>소모 재화</th>
              <th colSpan="1" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontSize: '0.7rem' }}>특별상점</th>
              <th colSpan="4" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fb923c', fontSize: '0.7rem' }}>가치 산출 (골드)</th>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', lineHeight: '1.2' }}>
              {['순 골드', '인장', '교환 인장', '교환권', '교환권 상자'].map((h, i) => (
                <th key={i} style={{ padding: '0.2rem 0.1rem', ...(i === 0 ? { borderLeft: '1px solid rgba(255,255,255,0.1)' } : {}), fontSize: '0.7rem' }}>{h}</th>
              ))}
              <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>응축<br />코어</th>
              <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>무결점<br />코어</th>
              <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>빛나는<br />결정체</th>
              <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>무결점<br />결정체</th>
              {['증표', '포션'].map((h, i) => (
                <th key={h} style={{ padding: '0.2rem 0.1rem', ...(i === 0 ? { borderLeft: '1px solid rgba(255,255,255,0.1)' } : {}), color: '#fca5a5', fontSize: '0.7rem' }}>{h}</th>
              ))}
              <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontSize: '0.7rem' }}>특별상점 관리</th>
              {['귀속 가치', '교환 가치'].map((h, i) => (
                <th key={h} style={{ padding: '0.2rem 0.1rem', ...(i === 0 ? { borderLeft: '1px solid rgba(255,255,255,0.1)' } : {}), color: '#fb923c', fontSize: '0.7rem' }}>{h}</th>
              ))}
              <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>순수익<br />(귀속 포함)</th>
              <th style={{ padding: '0.2rem 0.1rem', color: '#38bdf8', fontSize: '0.7rem' }}>순수익<br />(귀속 제외)</th>
            </tr>
          </thead>
          <tbody>
            {selectedChars.length === 0 ? (
              <tr><td colSpan="20" style={{ padding: '2rem', color: 'var(--text-muted)' }}>위에서 참여할 캐릭터를 선택해주세요.</td></tr>
            ) : (
              <>
                {rows}
                <tr style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', borderTop: '2px solid rgba(255,255,255,0.2)' }}>
                  <td style={{ padding: '0.5rem', color: '#e2e8f0' }}>총합계 ({countWithData})</td>
                  <td style={{ padding: '0.5rem', color: '#e2e8f0' }}>{sumFatigue > 0 ? sumFatigue : '-'}</td>
                  <td style={{ padding: '0.5rem', color: '#fbbf24' }}>{sumRuns > 0 ? sumRuns : '-'}</td>
                  <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>-</td>
                  <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{sumPureGold > 0 ? sumPureGold.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{sumSeal > 0 ? sumSeal.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{sumTradableSeal > 0 ? sumTradableSeal.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{sumSealVoucher > 0 ? sumSealVoucher.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{sumSealVoucherBox > 0 ? sumSealVoucherBox.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{sumCondensedCore > 0 ? sumCondensedCore.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{sumFlawlessCore > 0 ? sumFlawlessCore.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{sumCrystal > 0 ? sumCrystal.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{sumFlawlessCrystal > 0 ? sumFlawlessCrystal.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5' }}>{sumTokens > 0 ? sumTokens : '-'}</td>
                  <td style={{ padding: '0.5rem', color: '#fca5a5' }}>{sumPotions > 0 ? sumPotions : '-'}</td>
                  <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fb923c' }}>{sumBoundValue > 0 ? sumBoundValue.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem', color: '#fb923c' }}>{sumTradableValue > 0 ? sumTradableValue.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem', color: sumTotalProfit > 0 ? '#4ade80' : sumTotalProfit < 0 ? '#f87171' : '#cbd5e1' }}>{sumTotalProfit !== 0 ? sumTotalProfit.toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.5rem', color: sumProfitExclBound > 0 ? '#38bdf8' : sumProfitExclBound < 0 ? '#f87171' : '#cbd5e1' }}>{sumProfitExclBound !== 0 ? sumProfitExclBound.toLocaleString() : '-'}</td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8' }}>평균 (캐릭터당)</td>
                  <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8' }}>{countWithData > 0 ? Math.round(sumFatigue / countWithData) : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8' }}>{countWithData > 0 ? Math.round(sumRuns / countWithData) : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>-</td>
                  <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{countWithData > 0 ? Math.round(sumPureGold / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem' }}>{countWithData > 0 ? Math.round(sumSeal / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem' }}>{countWithData > 0 ? Math.round(sumTradableSeal / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem' }}>{countWithData > 0 ? Math.round(sumSealVoucher / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem' }}>{countWithData > 0 ? Math.round(sumSealVoucherBox / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{countWithData > 0 ? Math.round(sumCondensedCore / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem' }}>{countWithData > 0 ? Math.round(sumFlawlessCore / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{countWithData > 0 ? Math.round(sumCrystal / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem' }}>{countWithData > 0 ? Math.round(sumFlawlessCrystal / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{countWithData > 0 ? Math.round(sumTokens / countWithData) : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem' }}>{countWithData > 0 ? Math.round(sumPotions / countWithData) : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{countWithData > 0 ? Math.round(sumBoundValue / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem' }}>{countWithData > 0 ? Math.round(sumTradableValue / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem', color: sumTotalProfit > 0 ? '#4ade80' : '#f87171' }}>{countWithData > 0 ? Math.round(sumTotalProfit / countWithData).toLocaleString() : '-'}</td>
                  <td style={{ padding: '0.3rem 0.5rem', color: sumProfitExclBound > 0 ? '#38bdf8' : '#f87171' }}>{countWithData > 0 ? Math.round(sumProfitExclBound / countWithData).toLocaleString() : '-'}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
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
              <div style={{ overflowX: 'auto', padding: '1rem' }}>
                {record.chars ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>[구버전 기록] 캐릭터: {record.chars.join(', ')} / 획득: {record.acquired} / 소모: {record.consumed}</div>
                ) : (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <thead>
                        <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>
                          {['캐릭터', '피로도(판수)', '순 골드', '순례의 인장', '순례의 인장(1회 교환 가능)', '순례의 인장(1회 교환 가능) 교환권', '순례의 인장(1회 교환 가능) 교환권 1개 상자', '응축된 라이언 코어', '무결점 라이언 코어', '빛나는 조화의 결정체', '무결점 조화의 결정체', '귀속 가치', '교환 가치', '순수익(귀속 포함)', '순수익(귀속 제외)', '메모'].map((h, i) => (
                            <th key={i} style={{ padding: '0.2rem 0.1rem', textAlign: i === 0 || i === 15 ? 'left' : 'center', color: [12, 13].includes(i) ? '#4ade80' : [10, 11].includes(i) ? '#fb923c' : [14].includes(i) ? '#38bdf8' : 'inherit', fontSize: '0.7rem' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {record.details.map((d, i) => {
                          let profit = d.values?.profit || 0;
                          let tradable = d.values?.tradable || 0;
                          const consumed = d.values?.consumed || 0;
                          if (d.consumed?.potion > 0 && d.values?.potionCost === undefined) {
                            const pPrice = auctionPrices['피로 회복의 영약'] || 0;
                            tradable -= pPrice; profit -= pPrice;
                          }
                          const profitExclBound = tradable - consumed;
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '0.25rem', color: '#e2e8f0', fontWeight: 'bold', textAlign: 'left', fontSize: '0.7rem' }}>{d.charName}</td>
                              <td style={{ padding: '0.4rem' }}>{d.startFatigue} <span style={{ color: '#fbbf24' }}>({d.runs}판)</span></td>
                              <td style={{ padding: '0.25rem', color: d.acquired.pureGold ? '#fff' : '#64748b' }}>{d.acquired.pureGold ? Number(d.acquired.pureGold).toLocaleString() : '-'}</td>
                              <td style={{ padding: '0.25rem', color: d.acquired.seal ? '#fff' : '#64748b' }}>{d.acquired.seal || '-'}</td>
                              <td style={{ padding: '0.25rem', color: d.acquired.tradableSeal ? '#fff' : '#64748b' }}>{d.acquired.tradableSeal || '-'}</td>
                              <td style={{ padding: '0.25rem', color: d.acquired.sealVoucher ? '#fff' : '#64748b' }}>{d.acquired.sealVoucher || '-'}</td>
                              <td style={{ padding: '0.25rem', color: Number(d.acquired.sealVoucherBox || 0) > 0 ? '#fff' : '#64748b' }}>{d.acquired.sealVoucherBox || '-'}</td>
                              <td style={{ padding: '0.25rem', color: d.acquired.condensedCore ? '#fff' : '#64748b' }}>{d.acquired.condensedCore || '-'}</td>
                              <td style={{ padding: '0.25rem', color: d.acquired.flawlessCore ? '#fff' : '#64748b' }}>{d.acquired.flawlessCore || '-'}</td>
                              <td style={{ padding: '0.25rem', color: d.acquired.crystal ? '#fff' : '#64748b' }}>{d.acquired.crystal || '-'}</td>
                              <td style={{ padding: '0.25rem', color: d.acquired.flawlessCrystal ? '#fff' : '#64748b' }}>{d.acquired.flawlessCrystal || '-'}</td>
                              <td style={{ padding: '0.25rem', color: (d.values?.bound || 0) > 0 ? '#fb923c' : '#64748b' }}>{(d.values?.bound || 0) > 0 ? (d.values.bound).toLocaleString() : '-'}</td>
                              <td style={{ padding: '0.25rem', color: tradable > 0 ? '#fb923c' : '#64748b' }}>{tradable > 0 ? tradable.toLocaleString() : '-'}</td>
                              <td style={{ padding: '0.25rem', fontWeight: 'bold', color: profit > 0 ? '#4ade80' : profit < 0 ? '#f87171' : '#64748b' }}>{profit !== 0 ? profit.toLocaleString() : '-'}</td>
                              <td style={{ padding: '0.25rem', fontWeight: 'bold', color: profitExclBound > 0 ? '#38bdf8' : profitExclBound < 0 ? '#f87171' : '#64748b' }}>{profitExclBound !== 0 ? profitExclBound.toLocaleString() : '-'}</td>
                              <td style={{ padding: '0.4rem', color: '#cbd5e1', textAlign: 'left', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.memo || ''}>{d.memo || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {record.sessionTotals && (() => {
                      let bSum = record.sessionTotals.bound || 0;
                      let tSum = record.sessionTotals.tradable || 0;
                      let pSum = record.sessionTotals.profit || 0;
                      record.details.forEach(d => {
                        if (d.consumed?.potion > 0 && d.values?.potionCost === undefined) {
                          const pPrice = auctionPrices['피로 회복의 영약'] || 0;
                          tSum -= pPrice; pSum -= pPrice;
                        }
                      });
                      return (
                        <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <h5 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.7rem' }}>비밀상점 정산 내역</h5>
                              <div style={{ fontSize: '0.7rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div>- 닳아버린 순례의 증표 판매 예정가: <span style={{ color: '#4ade80' }}>+{record.sessionTotals.tokenProfit?.toLocaleString() || 0}</span></div>
                                <div>- 레시피/답례품 판매 예정가: <span style={{ color: '#4ade80' }}>+{record.sessionTotals.recipeProfit?.toLocaleString() || 0}</span></div>
                                <div>- 레시피 순례의 인장 소모: <span style={{ color: '#f87171' }}>-{record.sessionTotals.recipeSealCost?.toLocaleString() || 0}</span></div>
                              </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'right' }}>
                              <h5 style={{ margin: '0 0 0.2rem 0', color: '#94a3b8', fontSize: '0.7rem' }}>이번 순례 총 결산</h5>
                              <div style={{ fontSize: '0.7rem' }}>총 귀속 가치: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{bSum.toLocaleString()}</span></div>
                              <div style={{ fontSize: '0.7rem' }}>총 교환 가치: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{tSum.toLocaleString()}</span></div>
                              <div style={{ fontSize: '0.7rem', marginTop: '0.3rem' }}>최종 순수익(귀속 포함): <span style={{ color: pSum > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{pSum.toLocaleString()}</span></div>
                              <div style={{ fontSize: '0.7rem' }}>최종 순수익(귀속 제외): <span style={{ color: (tSum - record.sessionTotals.consumed) > 0 ? '#38bdf8' : '#f87171', fontWeight: 'bold' }}>{(tSum - record.sessionTotals.consumed).toLocaleString()}</span></div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SecretShopModal
        activeSecretShopModal={activeSecretShopModal} setActiveSecretShopModal={setActiveSecretShopModal}
        characters={characters} getCharForm={getCharForm}
        addCharToken={addCharToken} updateCharToken={updateCharToken} removeCharToken={removeCharToken}
        addCharRecipe={addCharRecipe} updateCharRecipe={updateCharRecipe} removeCharRecipe={removeCharRecipe}
        updateCharForm={updateCharForm}
      />
      <LootModal
        activeLootModal={activeLootModal ? { ...activeLootModal, _pilgrimageHistory: pilgrimageHistory } : null}
        setActiveLootModal={setActiveLootModal}
        characters={characters} getCharForm={getCharForm} updateCharForm={updateCharForm}
        apiKey={apiKey} auctionPrices={auctionPrices} setAuctionPrices={setAuctionPrices}
      />
      <CalcDetailModal calcDetail={calcDetail} onClose={() => setCalcDetail(null)} />
      {showAuctionPricesModal && <AuctionPricesModal auctionPrices={auctionPrices} setAuctionPrices={setAuctionPrices} onClose={() => setShowAuctionPricesModal(false)} />}
    </section>
  );
}

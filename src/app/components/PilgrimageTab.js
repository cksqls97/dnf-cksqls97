"use client";

import React, { useState, useEffect } from 'react';
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

  const tokenCost = runs * (auctionPrices['닳아버린 순례의 증표'] || 0);
  const potionCost = form.usePotion ? (auctionPrices['피로 회복의 영약'] || 0) : 0;
  const tokenPrice = auctionPrices['닳아버린 순례의 증표'] || 0;

  let customTradableValue = 0;
  (form.customItems || []).forEach(item => {
    customTradableValue += Number(item.quantity || 0) * (Number(item.price || 0) || (auctionPrices[item.name] || 0));
  });

  let secretShopGoldSpent = 0;
  let secretShopRewardValue = 0;
  let secretShopCostValue = 0;
  let recipeSealCostValue = 0;
  let tokenProfit = 0;

  (form.secretTokens || []).forEach(t => {
    const bp = Number(t.buyPrice || 0);
    if (bp > 0) { secretShopGoldSpent += bp; secretShopCostValue += bp; secretShopRewardValue += tokenPrice; tokenProfit += (tokenPrice - bp); }
  });

  let recipeProfit = 0;
  let recipeSoulCrystalCost = 0;
  let recipeGiftRewardValue = 0;

  (form.secretRecipes || []).forEach(r => {
    const bp = Number(r.buyPrice || 0);
    if (r.type === 'shinyGift') {
      const matPrice = auctionPrices['레전더리 소울 결정'] || 0;
      const rewardVal = 5 * tokenPrice;
      if (bp > 0 || matPrice > 0) { secretShopGoldSpent += bp; secretShopCostValue += (bp + matPrice); secretShopRewardValue += rewardVal; recipeSoulCrystalCost += matPrice; recipeGiftRewardValue += rewardVal; recipeProfit += (rewardVal - bp - matPrice); }
    } else if (r.type === 'brilliantGift') {
      const matPrice = auctionPrices['에픽 소울 결정'] || 0;
      const rewardVal = 20 * tokenPrice;
      if (bp > 0 || matPrice > 0) { secretShopGoldSpent += bp; secretShopCostValue += (bp + matPrice); secretShopRewardValue += rewardVal; recipeSoulCrystalCost += matPrice; recipeGiftRewardValue += rewardVal; recipeProfit += (rewardVal - bp - matPrice); }
    } else {
      const seals = Number(r.sealCost || 0);
      const sp = Number(r.sellPrice || 0);
      if (bp > 0 || sp > 0) {
        if (bp > 0) secretShopGoldSpent += bp;
        const sealVal = seals * 5000;
        recipeSealCostValue += sealVal;
        secretShopCostValue += bp;
        secretShopRewardValue += sp;
        recipeProfit += (sp - bp - sealVal);
      }
    }
  });

  const totalConsumedValue = tokenCost + potionCost + secretShopCostValue;
  const restoredPureGold = pureGoldInput;
  const finalTradableValue = restoredPureGold + tradableCoreValue + tradableCrystalValue + voucherProfitTotal + tradableSealValue + voucherBoxValue + secretShopRewardValue + customTradableValue;
  const finalBoundValue = totalBoundValue - recipeSealCostValue;
  const totalProfit = finalBoundValue + finalTradableValue - totalConsumedValue;

  return {
    runs, sealValue, boundCoreValue, boundCrystalValue, totalBoundValue, tradableCoreValue, tradableCrystalValue,
    voucherProfitTotal, tradableSealValue, voucherBoxValue, tokenCost, potionCost,
    customTradableValue, secretShopGoldSpent, secretShopRewardValue, secretShopCostValue,
    recipeSealCostValue, tokenProfit, recipeProfit, recipeSoulCrystalCost, recipeGiftRewardValue,
    totalConsumedValue, restoredPureGold, finalTradableValue, finalBoundValue, totalProfit
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
              ['순 골드 (수령 기준)', items.pureGold],
              [`무결점 라이언 코어 (${items.flawlessCore}개)`, breakdown.flawlessCore],
              [`무결점 조화의 결정체 (${items.flawlessCrystal}개)`, breakdown.flawlessCrystal],
              [`순례의 인장(1회 교환 가능) 교환권 수익 (${items.sealVoucher}개)`, breakdown.sealVoucher],
              [`순례의 인장(1회 교환 가능) 교환권 1개 상자 (${items.sealVoucherBox}개)`, breakdown.sealVoucherBox],
              [`순례의 인장(1회 교환 가능) (${items.tradableSeal}개)`, breakdown.tradableSeal],
              ['비밀상점 레시피 수익', breakdown.recipeProfit],
              ['닳아버린 순례의 증표 단가 이득', breakdown.tokenProfit],
              ...(breakdown.customTradable > 0 ? [['커스텀 추가 항목 (교환)', breakdown.customTradable]] : []),
            ], total: ['교환 가능 합계', totals.tradable, '#38bdf8'] },
            { title: '📉 소모 비용 (Costs)', color: '#f87171', rows: [
              [`닳아버린 순례의 증표 소모 (${items.runs}개)`, `-${breakdown.tokenCost.toLocaleString()}`],
              ...(breakdown.potionCost > 0 ? [[`피로 회복의 영약 (1개)`, `-${breakdown.potionCost.toLocaleString()}`]] : []),
              ...(breakdown.shopGoldCost > 0 ? [[`비밀상점 금 지출`, `-${breakdown.shopGoldCost.toLocaleString()}`]] : []),
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

export default function PilgrimageTab({ characters, pilgrimageHistory, onSavePilgrimage, onDeletePilgrimage, apiKey }) {
  const [pilgrimageForm, setPilgrimageForm] = useState({});
  const [globalStartFatigue, setGlobalStartFatigue] = useState('');
  const [auctionPrices, setAuctionPrices] = useState(DEFAULT_AUCTION_PRICES);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [activeSecretShopModal, setActiveSecretShopModal] = useState(null);
  const [showAuctionPricesModal, setShowAuctionPricesModal] = useState(false);
  const [calcDetail, setCalcDetail] = useState(null);
  const [activeLootModal, setActiveLootModal] = useState(null);

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

  const applyGlobalFatigue = () => {
    const updated = { ...pilgrimageForm };
    characters.forEach(c => { updated[c.id] = { ...getCharForm(c.id), startFatigue: globalStartFatigue }; });
    setPilgrimageForm(updated);
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

  const inputStyle = { width: '55px', padding: '0.2rem 0.1rem', fontSize: '0.7rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };

  let countWithData = 0, sumFatigue = 0, sumRuns = 0, sumPureGold = 0, sumSeal = 0, sumCondensedCore = 0, sumCrystal = 0;
  let sumFlawlessCore = 0, sumFlawlessCrystal = 0, sumSealVoucher = 0, sumTradableSeal = 0, sumSealVoucherBox = 0;
  let sumTokens = 0, sumPotions = 0, sumSecretShopSpent = 0, sumBoundValue = 0, sumTradableValue = 0, sumTotalProfit = 0, sumProfitExclBound = 0;

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
      sumPureGold += v.restoredPureGold; sumSeal += Number(form.seal || 0); sumCondensedCore += Number(form.condensedCore || 0);
      sumCrystal += Number(form.crystal || 0); sumFlawlessCore += Number(form.flawlessCore || 0);
      sumFlawlessCrystal += Number(form.flawlessCrystal || 0); sumSealVoucher += Number(form.sealVoucher || 0);
      sumTradableSeal += Number(form.tradableSeal || 0); sumSealVoucherBox += Number(form.sealVoucherBox || 0);
      sumTokens += v.runs; sumPotions += (form.usePotion ? 1 : 0);
      sumSecretShopSpent += v.secretShopGoldSpent;
      sumBoundValue += v.finalBoundValue; sumTradableValue += v.finalTradableValue;
      sumTotalProfit += totalProfitIncl; sumProfitExclBound += profitExclBound;
    }

    const clickDetail = hasLootData ? {
      charName: c.base.charName,
      items: { seal: Number(form.seal || 0), core: Number(form.condensedCore || 0), crystal: Number(form.crystal || 0), pureGold: Number(form.pureGold || 0), flawlessCore: Number(form.flawlessCore || 0), flawlessCrystal: Number(form.flawlessCrystal || 0), sealVoucher: Number(form.sealVoucher || 0), sealVoucherBox: Number(form.sealVoucherBox || 0), tradableSeal: Number(form.tradableSeal || 0), runs: v.runs },
      breakdown: { seal: v.sealValue, core: v.boundCoreValue, crystal: v.boundCrystalValue, flawlessCore: v.tradableCoreValue, flawlessCrystal: v.tradableCrystalValue, sealVoucher: v.voucherProfitTotal, sealVoucherBox: v.voucherBoxValue, tradableSeal: v.tradableSealValue, recipeProfit: v.recipeProfit, tokenProfit: v.tokenProfit, tokenCost: v.tokenCost, potionCost: v.potionCost, shopGoldCost: v.secretShopCostValue, recipeSealCost: v.recipeSealCostValue, secretShopGoldSpent: v.secretShopGoldSpent, customTradable: v.customTradableValue, recipeSoulCrystalCost: v.recipeSoulCrystalCost, recipeGiftRewardValue: v.recipeGiftRewardValue },
      totals: { bound: v.finalBoundValue, tradable: v.finalTradableValue, consumed: v.totalConsumedValue },
      final: { includingBound: totalProfitIncl, excludingBound: profitExclBound }
    } : null;

    return (
      <tr key={c.id} style={rowStyle}>
        <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: '#38bdf8', cursor: 'pointer' }} onClick={() => togglePilgrimageChar(c.id)} title="클릭 시 목록에서 제거">
          <span style={{ fontSize: '0.7rem' }}>{c.base.charName}</span> <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 'normal' }}>❌</span>
        </td>
        <td style={{ padding: '0.2rem 0.1rem' }}><input type="number" style={inputStyle} value={form.startFatigue} onChange={e => updateCharForm(c.id, 'startFatigue', e.target.value)} /></td>
        <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: '#fbbf24' }}>{v.runs}</td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setActiveLootModal({ charId: c.id })} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', borderRadius: '4px', cursor: 'pointer' }}>재화 입력</button>
        </td>
        <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{v.restoredPureGold > 0 ? v.restoredPureGold.toLocaleString() : '-'}</td>
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
        <td style={{ padding: '0.2rem 0.1rem', color: '#fca5a5' }}>{v.secretShopGoldSpent > 0 ? v.secretShopGoldSpent.toLocaleString() : '-'}</td>
        <td colSpan="2" style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', verticalAlign: 'middle' }}>
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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
              <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>캐릭터</th>
              <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>시작 피로도</th>
              <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fbbf24', fontSize: '0.7rem' }}>예상 판수</th>
              <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4ade80', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>재화 입력</th>
              <th colSpan="9" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#4ade80', fontSize: '0.7rem' }}>획득 재화 (기록)</th>
              <th colSpan="3" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5', fontSize: '0.7rem' }}>소모 재화</th>
              <th colSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontSize: '0.7rem' }}>특별상점 관리</th>
              <th colSpan="4" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fb923c', fontSize: '0.7rem' }}>가치 산출 (골드)</th>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', lineHeight: '1.2' }}>
              {['순 골드', '순례의\n인장', '순례의 인장\n(1회 교환 가능)', '순례의 인장\n(1회 교환 가능)\n교환권', '순례의 인장\n(1회 교환 가능)\n교환권 1개 상자'].map((h, i) => (
                <th key={i} style={{ padding: '0.2rem 0.1rem', ...(i === 0 ? { borderLeft: '1px solid rgba(255,255,255,0.1)' } : {}), fontSize: '0.7rem' }}>{h}</th>
              ))}
              <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>응축된<br />라이언 코어</th>
              <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>무결점<br />라이언 코어</th>
              <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>빛나는 조화의<br />결정체</th>
              <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>무결점 조화의<br />결정체</th>
              {['닳아버린\n순례의 증표', '피로 회복의\n영약', '특별상점\n지출'].map((h, i) => (
                <th key={h} style={{ padding: '0.2rem 0.1rem', ...(i === 0 ? { borderLeft: '1px solid rgba(255,255,255,0.1)' } : {}), color: '#fca5a5', fontSize: '0.7rem' }}>{h}</th>
              ))}
              <th colSpan="2" style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontSize: '0.7rem' }}>특별상점 관리</th>
              {['귀속 가치', '교환 가치'].map((h, i) => (
                <th key={h} style={{ padding: '0.2rem 0.1rem', ...(i === 0 ? { borderLeft: '1px solid rgba(255,255,255,0.1)' } : {}), color: '#fb923c', fontSize: '0.7rem' }}>{h}</th>
              ))}
              <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>순수익<br />(귀속 포함)</th>
              <th style={{ padding: '0.2rem 0.1rem', color: '#38bdf8', fontSize: '0.7rem' }}>순수익<br />(귀속 제외)</th>
            </tr>
          </thead>
          <tbody>
            {selectedChars.length === 0 ? (
              <tr><td colSpan="21" style={{ padding: '2rem', color: 'var(--text-muted)' }}>위에서 참여할 캐릭터를 선택해주세요.</td></tr>
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
                  <td style={{ padding: '0.5rem', color: '#fca5a5' }}>{sumSecretShopSpent > 0 ? sumSecretShopSpent.toLocaleString() : '-'}</td>
                  <td colSpan="2" style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', textAlign: 'center' }}>-</td>
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
                  <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8' }}>{countWithData > 0 ? Math.round(sumSecretShopSpent / countWithData).toLocaleString() : '-'}</td>
                  <td colSpan="2" style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>-</td>
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
                                <div>- 닳아버린 순례의 증표 구매 이득: <span style={{ color: '#4ade80' }}>+{record.sessionTotals.tokenProfit?.toLocaleString() || 0}</span></div>
                                <div>- 레시피 순수익: <span style={{ color: '#4ade80' }}>+{record.sessionTotals.recipeProfit?.toLocaleString() || 0}</span></div>
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

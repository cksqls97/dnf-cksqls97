import React from 'react';
import { BUFFER_KEYWORDS } from './constants';

export const getGradeTier = (pts) => {
  if (!pts) return null;
  if (pts >= 2550) return { rarity: "태초", tier: "" };
  const tiers = [
    { p: 2440, r: "에픽", t: "V" }, { p: 2355, r: "에픽", t: "IV" }, { p: 2270, r: "에픽", t: "III" }, { p: 2185, r: "에픽", t: "II" }, { p: 2100, r: "에픽", t: "I" },
    { p: 1990, r: "레전더리", t: "V" }, { p: 1905, r: "레전더리", t: "IV" }, { p: 1820, r: "레전더리", t: "III" }, { p: 1735, r: "레전더리", t: "II" }, { p: 1650, r: "레전더리", t: "I" },
    { p: 1540, r: "유니크", t: "V" }, { p: 1455, r: "유니크", t: "IV" }, { p: 1370, r: "유니크", t: "III" }, { p: 1285, r: "유니크", t: "II" }, { p: 1200, r: "유니크", t: "I" },
    { p: 1070, r: "레어", t: "V" }, { p: 990, r: "레어", t: "IV" }, { p: 910, r: "레어", t: "III" }, { p: 830, r: "레어", t: "II" }, { p: 750, r: "레어", t: "I" }
  ];
  for (let tier of tiers) { if (pts >= tier.p) return { rarity: tier.r, tier: tier.t }; }
  return { rarity: "등급 없음", tier: "" };
};

export const getTierClass = (rarity) => {
  if (rarity === '태초') return 'tier-태초';
  if (rarity === '에픽') return 'tier-에픽';
  if (rarity === '레전더리') return 'tier-레전더리';
  if (rarity === '유니크') return 'tier-유니크';
  if (rarity === '레어') return 'tier-레어';
  return '';
};

export const GradeBadge = ({ points }) => {
  if (!points) return null;
  const grade = getGradeTier(points);
  if (!grade || grade.rarity === '등급 없음') return null;
  return (
    <span className={getTierClass(grade.rarity)} style={{ fontSize: '0.85rem', marginLeft: '0.2rem' }}>
      ({grade.rarity}{grade.tier ? ` ${grade.tier}` : ''})
    </span>
  );
};

// 서약 등급업 임계 점수(오름차순). getGradeTier의 임계값과 반드시 동일하게 유지.
const TIER_POINTS = [750, 830, 910, 990, 1070, 1200, 1285, 1370, 1455, 1540, 1650, 1735, 1820, 1905, 1990, 2100, 2185, 2270, 2355, 2440, 2550];
const getNextTierThreshold = (pts) => {
  for (const t of TIER_POINTS) { if (pts < t) return t; }
  return null; // 이미 태초(최고 등급)
};

const MUKEON_TYPE_LABEL = { point: '서약 포인트 +25', damage: '최종 데미지 +4%', cooldown: '쿨타임 감소 +8%', unknown: '알 수 없음' };

// 묵언의 진의 단계별 추천: "서약 포인트 25 증가"를 선택했을 때 서약 등급이 실제로 오르는 경우에만
// 그만큼의 단계에 포인트 옵션을 추천한다. 데미지/쿨감 사이의 선택은 딜사이클 등 이 앱이 알 수 없는
// 정보에 좌우되므로 추천하지 않고, 등급업에 필요 없는 단계는 그대로 둔다(recommendedType: null).
// (포인트 옵션은 변경 시 재료 소모가 없으므로, 매 단계 독립적으로 필요 단계 수를 다시 계산한다.)
export const recommendMukeonOptions = (mukeon) => {
  if (!mukeon || !mukeon.stages || mukeon.stages.length === 0) return null;
  const { corePoints, stages } = mukeon;
  const unlockedCount = stages.length;

  // 필요한 단계 수가 실제 해금된 단계 수를 넘어서면(=포인트를 다 몰아도 등급이 오르지 않으면)
  // 포인트 옵션은 의미가 없으므로 절대 추천하지 않는다 (capping해서 억지로 추천하면 안 됨).
  const nextThreshold = getNextTierThreshold(corePoints);
  const needed = nextThreshold !== null ? nextThreshold - corePoints : null;
  const stagesNeeded = needed !== null && needed > 0 ? Math.ceil(needed / 25) : 0;
  const willTierUp = stagesNeeded > 0 && stagesNeeded <= unlockedCount;
  const stagesForPoint = willTierUp ? stagesNeeded : 0;

  // 이미 포인트 옵션을 선택해둔 단계를 우선 배정해 불필요한 "변경 권장"을 줄인다.
  const order = stages.map((s, i) => i).sort((a, b) => (stages[a].currentType === 'point' ? 0 : 1) - (stages[b].currentType === 'point' ? 0 : 1));
  const pointSet = new Set(order.slice(0, stagesForPoint));

  const result = stages.map((s, idx) => {
    const shouldBePoint = pointSet.has(idx);
    return {
      index: idx,
      stepName: s.stepName,
      currentType: s.currentType,
      recommendedType: shouldBePoint ? 'point' : null,
      needsChange: shouldBePoint && s.currentType !== 'point'
    };
  });

  return {
    willTierUp,
    nextThreshold,
    stagesForPoint,
    stages: result,
    needsAnyChange: result.some(s => s.needsChange),
    typeLabel: MUKEON_TYPE_LABEL
  };
};

export const getRole = (c) => {
  if (c.manual?.isManualRoleSet && c.manual?.role) return c.manual.role;
  const jobName = c.base?.jobGrowName || c.base?.jobName || '';
  return BUFFER_KEYWORDS.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
};

export const getSortedCharacters = (chars) => {
  const dAll = [...chars].filter(c => getRole(c) === 'dealer').sort((a, b) => b.base.fame - a.base.fame);
  const bAll = [...chars].filter(c => getRole(c) === 'buffer').sort((a, b) => b.base.fame - a.base.fame);
  const sorted = [];
  const maxG = Math.max(Math.ceil(dAll.length / 3), bAll.length);
  for (let i = 0; i < maxG; i++) {
    if (dAll[i * 3]) sorted.push(dAll[i * 3]);
    if (dAll[i * 3 + 1]) sorted.push(dAll[i * 3 + 1]);
    if (dAll[i * 3 + 2]) sorted.push(dAll[i * 3 + 2]);
    if (bAll[i]) sorted.push(bAll[i]);
  }
  return sorted;
};

export const buildGroups = (characters) => {
  const dealers = characters.filter(c => getRole(c) === 'dealer').sort((a, b) => b.base.fame - a.base.fame);
  const buffers = characters.filter(c => getRole(c) === 'buffer').sort((a, b) => b.base.fame - a.base.fame);
  const maxGroups = Math.max(Math.ceil(dealers.length / 3), buffers.length);
  const groups = [];
  for (let i = 0; i < maxGroups; i++) {
    groups.push([dealers[i * 3] || null, dealers[i * 3 + 1] || null, dealers[i * 3 + 2] || null, buffers[i] || null]);
  }
  return groups;
};

export const formatTimestamp = (ts) => {
  const dt = new Date(ts);
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

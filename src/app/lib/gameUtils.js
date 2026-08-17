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
  const { corePoints, donationNeeded = 0, stages } = mukeon;
  const unlockedCount = stages.length;

  // 장비 세트점수가 2550 미만이면 서약 원점수 중 donationNeeded만큼이 장비 쪽으로 이월되고,
  // 남는 만큼만 서약 자체의 등급에 반영된다(캐릭터 API의 5번 "Point Adjustment"와 동일한 규칙).
  // 진의 포인트를 늘려도 이 이월분을 채우기 전까지는 서약 등급에 전혀 영향을 주지 않으므로,
  // 실제 서약 등급에 쓰이는 점수를 기준으로 등급 상승 여부를 계산해야 한다.
  const oathGradePoints = (n) => donationNeeded > 0 ? Math.max(0, corePoints + 25 * n - donationNeeded) : corePoints + 25 * n;

  const nextThreshold = getNextTierThreshold(oathGradePoints(0));
  let stagesForPoint = 0;
  if (nextThreshold !== null) {
    for (let n = 1; n <= unlockedCount; n++) {
      if (oathGradePoints(n) >= nextThreshold) { stagesForPoint = n; break; }
    }
  }
  // 필요한 단계 수를 다 써도(=포인트를 4단계 다 몰아도) 등급이 오르지 않으면 추천하지 않는다.
  const willTierUp = stagesForPoint > 0;

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

// 캐릭터가 현재 해금한 묵언의 진의 단계를 전부 "서약 포인트 25 증가"로 몰았다고 가정했을 때의
// 서약 원점수(장비 이월 반영 전). 용병단 총합처럼 "다 맞췄다면"을 가정하는 계산에만 쓰고,
// 로스터에 실제로 표시되는 개별 캐릭터의 서약 점수/등급(c.oath.points/gradeDesc)에는 쓰지 않는다.
export const getMaxOathRawPoints = (c) => {
  const current = c.oath?.rawPoints ?? c.oath?.points ?? 0;
  const mukeon = c.oath?.mukeon;
  if (!mukeon || !mukeon.stages || mukeon.stages.length === 0) return current;
  return mukeon.corePoints + 25 * mukeon.stages.length;
};

export const getRole = (c) => {
  if (c.manual?.isManualRoleSet && c.manual?.role) return c.manual.role;
  const jobName = c.base?.jobGrowName || c.base?.jobName || '';
  return BUFFER_KEYWORDS.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
};

// 난이도별 진입 조건이 명성 또는 역할군별(딜러/버퍼) 장비·버프 점수인 레이드 공용 헬퍼
// (미카엘라, 디레지에 등). 난이도를 낮은 순으로 누적 진행한다고 보고, 아직 못 넘은 첫
// 단계를 "다음 목표"로 삼는다. tier.strict가 true면 초과(>), 아니면 이상(>=)으로 비교한다.
export const raidTierValue = (c, tier) => tier.type === 'fame' ? c.base.fame : (c.equipmentScore?.value ?? null);
export const raidTierThreshold = (c, tier) => tier.type === 'fame' ? tier.fame : (getRole(c) === 'buffer' ? tier.buffer : tier.dealer);
export const raidTierMetricLabel = (c, tier) => tier.type === 'fame' ? '명성' : (getRole(c) === 'buffer' ? '버프 점수' : '장비 점수');
export const meetsRaidTier = (c, tier) => {
  const val = raidTierValue(c, tier);
  if (val == null) return false;
  const threshold = raidTierThreshold(c, tier);
  return tier.strict ? val > threshold : val >= threshold;
};
export const raidTierAchievedIdx = (c, tiers) => {
  let idx = -1;
  for (const tier of tiers) {
    if (meetsRaidTier(c, tier)) idx++; else break;
  }
  return idx;
};

// 장비/버프 점수는 최고 명성 갱신 시에만 채워지므로, 아직 못 받아온 캐릭터는 명성으로
// 대체 정렬하고 점수를 받아온 캐릭터보다는 항상 뒤로 보낸다.
const comparePower = (a, b) => {
  const sa = a.equipmentScore?.value, sb = b.equipmentScore?.value;
  if (sa != null && sb != null) return sb - sa;
  if (sa != null) return -1;
  if (sb != null) return 1;
  return b.base.fame - a.base.fame;
};

export const getSortedCharacters = (chars) => {
  const dAll = [...chars].filter(c => getRole(c) === 'dealer').sort(comparePower);
  const bAll = [...chars].filter(c => getRole(c) === 'buffer').sort(comparePower);
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
  const dealers = characters.filter(c => getRole(c) === 'dealer').sort(comparePower);
  const buffers = characters.filter(c => getRole(c) === 'buffer').sort(comparePower);
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

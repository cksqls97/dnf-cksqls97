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

"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SERVER_LIST = [
  { id: "cain", name: "Ïπ¥Ïù∏" },
  { id: "diregie", name: "?îÎ†àÏßÄ?? },
  { id: "siroco", name: "?úÎ°úÏΩ? },
  { id: "prey", name: "?ÑÎ†à?? },
  { id: "casillas", name: "Ïπ¥Ïãú?ºÏä§" },
  { id: "hilder", name: "?êÎçî" },
  { id: "anton", name: "?àÌÜ§" },
  { id: "bakal", name: "Î∞îÏπº" }
];

const getGradeTier = (pts) => {
  if (!pts) return null;
  if (pts >= 2550) return { rarity: "?úÏ¥à", tier: "" };
  const tiers = [
    { p: 2440, r: "?êÌîΩ", t: "V" }, { p: 2355, r: "?êÌîΩ", t: "IV" }, { p: 2270, r: "?êÌîΩ", t: "III" }, { p: 2185, r: "?êÌîΩ", t: "II" }, { p: 2100, r: "?êÌîΩ", t: "I" },
    { p: 1990, r: "?àÏ†Ñ?îÎ¶¨", t: "V" }, { p: 1905, r: "?àÏ†Ñ?îÎ¶¨", t: "IV" }, { p: 1820, r: "?àÏ†Ñ?îÎ¶¨", t: "III" }, { p: 1735, r: "?àÏ†Ñ?îÎ¶¨", t: "II" }, { p: 1650, r: "?àÏ†Ñ?îÎ¶¨", t: "I" },
    { p: 1540, r: "?†Îãà??, t: "V" }, { p: 1455, r: "?†Îãà??, t: "IV" }, { p: 1370, r: "?†Îãà??, t: "III" }, { p: 1285, r: "?†Îãà??, t: "II" }, { p: 1200, r: "?†Îãà??, t: "I" },
    { p: 1070, r: "?àÏñ¥", t: "V" }, { p: 990, r: "?àÏñ¥", t: "IV" }, { p: 910, r: "?àÏñ¥", t: "III" }, { p: 830, r: "?àÏñ¥", t: "II" }, { p: 750, r: "?àÏñ¥", t: "I" }
  ];
  for (let tier of tiers) { if (pts >= tier.p) return { rarity: tier.r, tier: tier.t }; }
  return { rarity: "?±Í∏â ?ÜÏùå", tier: "" };
};

const getTierClass = (rarity) => {
  if(rarity === '?úÏ¥à') return 'tier-?úÏ¥à';
  if(rarity === '?êÌîΩ') return 'tier-?êÌîΩ';
  if(rarity === '?àÏ†Ñ?îÎ¶¨') return 'tier-?àÏ†Ñ?îÎ¶¨';
  if(rarity === '?†Îãà??) return 'tier-?†Îãà??;
  if(rarity === '?àÏñ¥') return 'tier-?àÏñ¥';
  return '';
};

const GradeBadge = ({ points }) => {
  if (!points) return null;
  const grade = getGradeTier(points);
  if (!grade || grade.rarity === '?±Í∏â ?ÜÏùå') return null;
  return (
    <span className={getTierClass(grade.rarity)} style={{ fontSize: '0.85rem', marginLeft: '0.2rem' }}>
      ({grade.rarity}{grade.tier ? ` ${grade.tier}` : ''})
    </span>
  );
};

const ADVANCED_DUNGEONS = [
  { name: 'Î∞∞Íµê?êÏùò ??, fame: 101853 },
  { name: 'Î≥ÑÍ±∞Î∂??Ä?úÍ≥†', fame: 91582 },
  { name: '?¥Î∞©???âÎ™Ω', fame: 71179 },
  { name: 'Ï£ΩÏùå???¨Ïã†??, fame: 55950 },
  { name: '?†Ï???Î©îÏù∏', fame: 44929 },
  { name: '?¨Ïù¥ ?†Í∏¥ ?∏Ïàò', fame: 34749 }
];

const RAIDS = [
  { name: '?¥ÎÇ¥ ?©Ìòº??, fame: 72688 },
  { name: '?îÎ†àÏßÄ???àÏù¥??, fame: 63257 }
];

const APOCALYPSE = [
  { name: '2?®Í≥Ñ', fame: 105881 },
  { name: '1?®Í≥Ñ', fame: 98171 },
  { name: 'Îß§Ïπ≠', fame: 73993 }
];

const getRole = (c) => {
  if (c.manual?.isManualRoleSet && c.manual?.role) return c.manual.role;
  const bufferKeywords = ['?®Îü¨Î©îÎîï', '?¨Î£®?∏Ïù¥??, 'ÎÆ§Ï¶à', '?∏Ï±à?∏Î¶¨??];
  const jobName = c.base?.jobGrowName || c.base?.jobName || '';
  return bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
};

const getSortedCharacters = (chars) => {
  const dAll = [...chars].filter(c => getRole(c) === 'dealer').sort((a,b) => b.base.fame - a.base.fame);
  const bAll = [...chars].filter(c => getRole(c) === 'buffer').sort((a,b) => b.base.fame - a.base.fame);
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

export default function Home() {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const [characters, setCharacters] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  
  const [activeTab, setActiveTabState] = useState('roster');
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('DNF_ACTIVE_TAB', tab);
  };
  const [historyFilterChar, setHistoryFilterChar] = useState('');

  const [editingLogId, setEditingLogId] = useState(null);
  const [editLogForm, setEditLogForm] = useState(null);
  const [chartViewMode, setChartViewMode] = useState('event'); // 'event' | 'daily'
  const [mercLevel, setMercLevel] = useState(1);
  const [mercNextLevelTarget, setMercNextLevelTarget] = useState(0);
  const [mercLevelInput, setMercLevelInput] = useState('');
  const [mercTargetInput, setMercTargetInput] = useState('');
  const [rosterSubTab, setRosterSubTab] = useState('overview'); // 'overview' | 'items'
  const [imminentSubTab, setImminentSubTab] = useState('dungeon'); // 'dungeon' | 'raid' | 'apoc'
  const [dungeonView, setDungeonView] = useState('byDungeon'); // 'overall' | 'byDungeon'
  const [apocView, setApocView] = useState('byTier'); // 'overall' | 'byTier'
  
  const [pilgrimageForm, setPilgrimageForm] = useState({});
  const [globalStartFatigue, setGlobalStartFatigue] = useState('');
  const [pilgrimageHistory, setPilgrimageHistory] = useState([]);
    const [activeSecretShopModal, setActiveSecretShopModal] = useState(null);
  const [showAuctionPricesModal, setShowAuctionPricesModal] = useState(false);
    const [calcDetail, setCalcDetail] = useState(null);
  const [activeLootModal, setActiveLootModal] = useState(null);

  const [auctionPrices, setAuctionPrices] = useState({
     'Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥': 0,
     'Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?: 0,
     '?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú': 0,
     '?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä??': 0,
     '?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?1Í∞??ÅÏûê': 0
  });
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);

  useEffect(() => {
        const draft = localStorage.getItem('DNF_PILGRIMAGE_FORM_DRAFT');
    if (draft) {
      try { setPilgrimageForm(JSON.parse(draft)); } catch(e) {}
    }
    const draftFatigue = localStorage.getItem('DNF_PILGRIMAGE_GLOBAL_FATIGUE');
    if (draftFatigue) setGlobalStartFatigue(Number(draftFatigue));
    const draftPrices = localStorage.getItem('DNF_PILGRIMAGE_AUCTION_PRICES');
    if (draftPrices) {
      try {
        const parsed = JSON.parse(draftPrices);
        setAuctionPrices(parsed);
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (globalStartFatigue !== '') localStorage.setItem('DNF_PILGRIMAGE_GLOBAL_FATIGUE', globalStartFatigue);
  }, [globalStartFatigue]);

  useEffect(() => {
    localStorage.setItem('DNF_PILGRIMAGE_AUCTION_PRICES', JSON.stringify(auctionPrices));
  }, [auctionPrices]);

  useEffect(() => {
    if (Object.keys(pilgrimageForm).length > 0) {
      localStorage.setItem('DNF_PILGRIMAGE_FORM_DRAFT', JSON.stringify(pilgrimageForm));
    }
  }, [pilgrimageForm]);
  
  
  const chartData = React.useMemo(() => {
    // --- ?ºÏûêÎ≥?Î™®Îìú: Îß§Ïùº 06:00 Í∏∞Ï??ºÎ°ú ?πÏùº ÏµúÏã† Î™ÖÏÑ±Í∞íÏùÑ 1?¨Ïù∏?∏Î°ú ÏßëÍ≥Ñ ---
    if (chartViewMode === 'daily') {
      // ?¥Îñ§ Î°úÍ∑∏Î•??Ä?ÅÏúºÎ°??†Ï? Í≤∞Ï†ï
      const relevantLogs = historyLogs
        .filter(l => l.fameChange && (historyFilterChar === '' || l.charId === historyFilterChar))
        .sort((a, b) => a.timestamp - b.timestamp);

      if (relevantLogs.length === 0) {
        if (characters.length > 0) {
          const now = new Date();
          return [{ time: Date.now(), formattedTime: '?ÑÏû¨', fame: historyFilterChar === '' ? characters.reduce((acc, c) => acc + c.base.fame, 0) : (characters.find(c => c.id === historyFilterChar)?.base.fame ?? 0) }];
        }
        return [];
      }

      // Í∞??Ä?ÑÏä§?¨ÌîÑ???Ä??'?ºÏûê ?? Í≥ÑÏÇ∞ (06:00 Í∏∞Ï? ??KST=UTC+9, 06:00 KST = 21:00 UTC ?ÑÎÇ†)
      const getDayKey = (ts) => {
        const d = new Date(ts);
        // 06:00 KST Í∏∞Ï?: UTC ?úÍ∞Ñ?êÏÑú -9+6=-3?úÍ∞Ñ ÎπºÍ∏∞ ??Í∞ôÏ? ?†Î°ú Î¨∂Í∏∞
        const offset = (9 - 6) * 60 * 60 * 1000; // 3?úÍ∞Ñ
        const adjusted = new Date(ts - offset);
        return `${adjusted.getUTCFullYear()}-${String(adjusted.getUTCMonth()+1).padStart(2,'0')}-${String(adjusted.getUTCDate()).padStart(2,'0')}`;
      };

      // Í∞??Ä?ÑÏä§?¨ÌîÑÎ≥??ÑÏ≤¥ Î™ÖÏÑ±Í∞?Í≥ÑÏÇ∞ (?¥Î≤§??Î™®Îìú?Ä ?ôÏùº Î°úÏßÅ)
      const allTimestamps = [...new Set(historyLogs.filter(l => l.fameChange).map(l => l.timestamp))].sort((a,b)=>a-b);
      const computeFameAt = (t) => {
        let total = 0;
        if (historyFilterChar === '') {
          characters.forEach(c => {
            const cLogs = historyLogs.filter(l => l.charId === c.id && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
            if (cLogs.length === 0) { total += c.base.fame; }
            else {
              const past = cLogs.filter(l => l.timestamp <= t);
              total += past.length > 0 ? past[past.length-1].fameChange.new : cLogs[0].fameChange.old;
            }
          });
        } else {
          const cLogs = historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
          const past = cLogs.filter(l => l.timestamp <= t);
          total = past.length > 0 ? past[past.length-1].fameChange.new : (cLogs[0]?.fameChange.old ?? 0);
        }
        return total;
      };

      // Í¥Ä???Ä?ÑÏä§?¨ÌîÑÎß?Ï∂îÏ∂ú
      const targetTimestamps = historyFilterChar === ''
        ? allTimestamps
        : [...new Set(historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).map(l => l.timestamp))].sort((a,b)=>a-b);

      // ?ºÏûêÎ≥ÑÎ°ú Í∞Ä??ÎßàÏ?Îß??Ä?ÑÏä§?¨ÌîÑ ?†ÌÉù
      const dayMap = {};
      targetTimestamps.forEach(t => {
        const key = getDayKey(t);
        dayMap[key] = t; // ??ñ¥?∞Î©¥ ?êÏó∞?§ÎüΩÍ≤??πÏùº ÏµúÏã†Í∞?
      });

      const days = Object.keys(dayMap).sort();
      const dataPoints = days.map(day => {
        const t = dayMap[day];
        const fame = computeFameAt(t);
        const [y, m, d] = day.split('-');
        return { time: t, formattedTime: `${m}/${d}`, fame };
      });

      // ?úÏûë ?¨Ïù∏??Ï∂îÍ?
      if (dataPoints.length > 0) {
        const firstT = targetTimestamps[0];
        let initFame = 0;
        if (historyFilterChar === '') {
          characters.forEach(c => {
            const cLogs = historyLogs.filter(l => l.charId === c.id && l.fameChange).sort((a,b)=>a.timestamp-b.timestamp);
            initFame += cLogs.length > 0 ? cLogs[0].fameChange.old : c.base.fame;
          });
        } else {
          const cLogs = historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).sort((a,b)=>a.timestamp-b.timestamp);
          initFame = cLogs.length > 0 ? cLogs[0].fameChange.old : (characters.find(c=>c.id===historyFilterChar)?.base.fame ?? 0);
        }
        const firstDay = getDayKey(firstT);
        const [y,m,d] = firstDay.split('-');
        dataPoints.unshift({ time: firstT - 1, formattedTime: `${m}/${d} ?¥Ï†Ñ`, fame: initFame });
      }

      // ?ÑÏû¨ ?¨Ïù∏??Ï∂îÍ?
      const now = Date.now();
      const lastT = targetTimestamps[targetTimestamps.length - 1];
      if (now - lastT > 60000) {
        let curFame = historyFilterChar === ''
          ? characters.reduce((acc,c) => acc+c.base.fame, 0)
          : (characters.find(c=>c.id===historyFilterChar)?.base.fame ?? (() => { const cl = historyLogs.filter(l=>l.charId===historyFilterChar&&l.fameChange).sort((a,b)=>a.timestamp-b.timestamp); return cl.length>0?cl[cl.length-1].fameChange.new:0; })());
        dataPoints.push({ time: now, formattedTime: '?ÑÏû¨', fame: curFame });
      }

      return dataPoints;
    }

    // --- ?¥Î≤§??Î™®Îìú (Í∏∞Ï°¥ Î°úÏßÅ) ---
    const timestamps = new Set();
    historyLogs.forEach(log => {
        if (log.fameChange) timestamps.add(log.timestamp);
    });
    
    const sortedTimes = Array.from(timestamps).sort((a,b) => a - b);
    
    if (sortedTimes.length === 0) {
        if (characters.length > 0) {
            return [{
                time: Date.now(),
                formattedTime: '?ÑÏû¨',
                fame: characters.reduce((acc, c) => acc + c.base.fame, 0)
            }];
        }
        return [];
    }

    const dataPoints = [];
    
    let targetTimes = sortedTimes;
    if (historyFilterChar !== '') {
        const charTimes = new Set();
        historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).forEach(l => charTimes.add(l.timestamp));
        targetTimes = Array.from(charTimes).sort((a,b) => a - b);
        if (targetTimes.length === 0) {
            const char = characters.find(c => c.id === historyFilterChar);
            if (char) {
                return [{ time: Date.now(), formattedTime: '?ÑÏû¨', fame: char.base.fame }];
            }
            return [];
        }
    }

    targetTimes.forEach(t => {
        let totalFame = 0;
        
        if (historyFilterChar === '') {
            characters.forEach(c => {
                const cLogs = historyLogs.filter(l => l.charId === c.id && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
                if (cLogs.length === 0) {
                    totalFame += c.base.fame;
                } else {
                    const pastLogs = cLogs.filter(l => l.timestamp <= t);
                    if (pastLogs.length > 0) {
                        totalFame += pastLogs[pastLogs.length - 1].fameChange.new;
                    } else {
                        totalFame += cLogs[0].fameChange.old;
                    }
                }
            });
        } else {
            const c = characters.find(char => char.id === historyFilterChar);
            if (c) {
                const cLogs = historyLogs.filter(l => l.charId === c.id && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
                const pastLogs = cLogs.filter(l => l.timestamp <= t);
                if (pastLogs.length > 0) {
                    totalFame = pastLogs[pastLogs.length - 1].fameChange.new;
                } else {
                    totalFame = cLogs[0].fameChange.old;
                }
            } else {
                const cLogs = historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
                const pastLogs = cLogs.filter(l => l.timestamp <= t);
                if (pastLogs.length > 0) {
                    totalFame = pastLogs[pastLogs.length - 1].fameChange.new;
                } else {
                    totalFame = cLogs[0].fameChange.old;
                }
            }
        }

        const dt = new Date(t);
        dataPoints.push({
            time: t,
            formattedTime: `${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`,
            fame: totalFame
        });
    });

    const now = Date.now();
    const lastTime = targetTimes[targetTimes.length - 1];
    
    if (targetTimes.length > 0) {
       const firstTime = targetTimes[0];
       let initialTotalFame = 0;
       if (historyFilterChar === '') {
           characters.forEach(c => {
               const cLogs = historyLogs.filter(l => l.charId === c.id && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
               if (cLogs.length === 0) {
                   initialTotalFame += c.base.fame;
               } else {
                   initialTotalFame += cLogs[0].fameChange.old;
               }
           });
       } else {
           const cLogs = historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
           if (cLogs.length > 0) initialTotalFame = cLogs[0].fameChange.old;
           else if (characters.find(char => char.id === historyFilterChar)) initialTotalFame = characters.find(char => char.id === historyFilterChar).base.fame;
       }
       
       dataPoints.unshift({
           time: firstTime - 1,
           formattedTime: `?úÏûë`, 
           fame: initialTotalFame
       });
    }

    if (now - lastTime > 60000) {
        let currentTotal = 0;
        if (historyFilterChar === '') {
            currentTotal = characters.reduce((acc, c) => acc + c.base.fame, 0);
        } else {
            const c = characters.find(char => char.id === historyFilterChar);
            if (c) currentTotal = c.base.fame;
            else {
                const cLogs = historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
                if (cLogs.length > 0) currentTotal = cLogs[cLogs.length - 1].fameChange.new;
            }
        }
        
        dataPoints.push({
            time: now,
            formattedTime: '?ÑÏû¨',
            fame: currentTotal
        });
    }

    return dataPoints;
  }, [historyLogs, characters, historyFilterChar, chartViewMode]);
  
  const [server, setServer] = useState('cain');
  const [charName, setCharName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [apiKey, setApiKeyState] = useState('');

  const [expandedSpecs, setExpandedSpecs] = useState({});
  const toggleExpandedSpec = (id) => setExpandedSpecs(prev => ({ ...prev, [id]: !prev[id] }));

  const [manualModalChar, setManualModalChar] = useState(null);
  const [manualForm, setManualForm] = useState({ 
    role: 'dealer',
    enchant: '', title: '', 
    creature: '', creatureArtifact: '',
    buffLevel: '', buffAbyss: '',
    avatar: '', emblem: '', platEmblem: '', skinAvatar: '', skinSocket: '', skinEmblem: '', weaponAvatar: '', weaponSocket: '', weaponEmblem: '', aura: '', auraEmblem: '' 
  });
  
  const [customOptions, setCustomOptions] = useState({
    enchant: ['Í∏∞Î≥∏', 'Í∞Ä?±ÎπÑ', 'Ï§ÄÏ¢ÖÍ≤∞', 'Ï¢ÖÍ≤∞'],
    title: ['Í∏∞Î≥∏', 'Í∞Ä?±ÎπÑ', 'Ï§ÄÏ¢ÖÍ≤∞', 'Ï¢ÖÍ≤∞'],
    creature: ['Í∏∞Î≥∏', 'Í∞Ä?±ÎπÑ', 'Ï§ÄÏ¢ÖÍ≤∞', 'Ï¢ÖÍ≤∞'],
    creatureArtifact: ['?ÜÏùå', '?∏Ïª§Î®?, '?àÏñ¥', '?†Îãà??],
    avatar: ['Í∏∞Î≥∏', '?¥Î≤§??, '?àÏïï', '?¥Î†à??, '?îÎìú'],
    emblem: ['?ÜÏùå', '?îÎ†§', 'Ï∞¨Î?', '?§Î∞ú'],
    platEmblem: ['?ÜÏùå', '?°Ìîå??, '?†Ìö®', 'Ï¢ÖÍ≤∞'],
    skinAvatar: ['?ÜÏùå', 'Í∏∞Î≥∏', '?πÌåê', '?ÑÎ¶¨ÎØ∏ÏóÑ'],
    skinSocket: ['ÎßâÌûò', '?´Î¶º'],
    skinEmblem: ['?ÜÏùå', '?îÎ†§', 'Ï∞¨Î?'],
    weaponAvatar: ['?ÜÏùå', 'Í∏∞Î≥∏', '?àÏñ¥'],
    weaponSocket: ['ÎßâÌûò', '?´Î¶º'],
    weaponEmblem: ['?ÜÏùå', '?îÎ†§', 'Ï∞¨Î?'],
    aura: ['Í∏∞Î≥∏', 'Í∞Ä?±ÎπÑ', 'Ï§ÄÏ¢ÖÍ≤∞', 'Ï¢ÖÍ≤∞'],
    auraEmblem: ['?ÜÏùå', '?îÎ†§', 'Ï∞¨Î?']
  });

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsFormText, setOptionsFormText] = useState({});

  const autoRefreshDone = React.useRef(false);

  // Stale Closure Î∞©Ï???ÏµúÏã† ?ÅÌÉú ?ÑÎ°ù??Ref
  const charsRef = React.useRef(characters);
  const logsRef = React.useRef(historyLogs);
  const optsRef = React.useRef(customOptions);
  const mercRef = React.useRef({ level: mercLevel, target: mercNextLevelTarget });
  useEffect(() => { mercRef.current = { level: mercLevel, target: mercNextLevelTarget }; }, [mercLevel, mercNextLevelTarget]);
  
  const pilgrimageRef = React.useRef(pilgrimageHistory);
  useEffect(() => { pilgrimageRef.current = pilgrimageHistory; }, [pilgrimageHistory]);
  
  // ?¥Îùº?∞Îìú Î≤ÑÏ†Ñ Í¥ÄÎ¶¨Î? ?ÑÌïú Ref (?§Ï§ë ????ñ¥?∞Í∏∞ ?êÏ≤ú Ï∞®Îã®??
  const lastCloudUpdateAtRef = React.useRef(0);

  useEffect(() => { charsRef.current = characters; }, [characters]);
  useEffect(() => { logsRef.current = historyLogs; }, [historyLogs]);
  useEffect(() => { optsRef.current = customOptions; }, [customOptions]);

  // --- ?¥Îùº?∞Îìú ?ôÍ∏∞???îÏßÑ ---
  const syncUpCloudData = async (key, updatedCharacters, updatedLogs, updatedOpts, updatedMerc, forceOverride = false, updatedPilgrimage = null) => {
    if(!key) return;
    try {
      const pilgrimageData = updatedPilgrimage || pilgrimageRef.current;
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          characters: updatedCharacters,
          historyLogs: updatedLogs,
          customOptions: updatedOpts,
          merc: updatedMerc,
          pilgrimage: pilgrimageData,
          clientUpdateAt: lastCloudUpdateAtRef.current,
          forceOverride
        })
      });
      const resData = await res.json();
      
      if (resData.conflict) {
          console.warn("?§Ï§ë ??Ï∂©Îèå Í∞êÏ?! ?¥Îùº?∞Îìú????ÏµúÏã† ?∞Ïù¥?∞Í? Ï°¥Ïû¨?òÏó¨ ?ÑÏû¨ Íµ¨Ìòï Î∑∞Ïùò ??ñ¥?∞Í∏∞Î•?Ï∞®Îã®?òÍ≥† ?¥Îùº?∞ÎìúÎ•??¥Î†§Î∞õÏäµ?àÎã§.");
          await syncDownCloudData(key, updatedCharacters, updatedLogs, updatedOpts);
          return;
      }
      
      if (resData.success && resData.newUpdateAt) {
          lastCloudUpdateAtRef.current = resData.newUpdateAt; // ??Î≤ÑÏ†Ñ?ºÎ°ú ÏßÄ??Í∞±Ïã†
      }
    } catch(e) { console.error(e) }
  };

  const handleManualCloudSync = async () => {
    if (!apiKey) {
       alert("API ?§Î? Î®ºÏ? ?§Ï†ï?¥Ïïº ?©Îãà??");
       return;
    }
    setIsCloudSyncing(true);
    // Î≤ÑÌäº ?±ÏùÑ ?µÌïú ?òÎèô ?ôÍ∏∞???úÏóê???µÏ?Î°úÎùº????ñ¥?åÏ? (forceOverride = true)
    await syncUpCloudData(apiKey, characters, historyLogs, customOptions, mercRef.current, true);
    setIsCloudSyncing(false);
    alert("?ÑÏû¨ Í∏∞Í∏∞??ÏµúÏã† ?∞Ïù¥?∞Í? ?¥Îùº?∞Îìú ?úÎ≤Ñ???òÎèô?ºÎ°ú Î∞±ÏóÖ?òÏóà?µÎãà??");
  };

  const syncDownCloudData = async (targetKey, localChars, localLogs, localOpts) => {
    if(!targetKey) return;
    setIsCloudSyncing(true);
    try {
      const res = await fetch(`/api/sync?apiKey=${targetKey}`).then(r => r.json());
      if (res.success && res.data) {
         const cData = res.data;
         
         // ?¥Îùº?∞Îìú Î≤ÑÏ†Ñ Í∏∞Î°ù ?°Ïàò
         if (cData.lastUpdateAt) {
             lastCloudUpdateAtRef.current = cData.lastUpdateAt;
         }
         
         let modified = false;
         
         if (cData.characters && cData.characters.length > 0) {
            setCharacters(cData.characters);
            localStorage.setItem('DNF_CHARACTERS', JSON.stringify(cData.characters));
            modified = true;
         }
         if (cData.historyLogs && cData.historyLogs.length > 0) {
            setHistoryLogs(cData.historyLogs);
            localStorage.setItem('DNF_HISTORY', JSON.stringify(cData.historyLogs));
            modified = true;
         }
         if (cData.customOptions) {
            setCustomOptions(cData.customOptions);
            localStorage.setItem('DNF_OPTIONS', JSON.stringify(cData.customOptions));
            modified = true;
         }
         if (cData.pilgrimage) {
            setPilgrimageHistory(cData.pilgrimage);
            localStorage.setItem('DNF_PILGRIMAGE_HISTORY', JSON.stringify(cData.pilgrimage));
            modified = true;
         }
         
         // ?¥Îùº?∞ÎìúÍ∞Ä ??ÎπÑÏñ¥?àÍ≥†, Î°úÏª¨?êÎäî Í∏∞Ï°¥ ?∞Ïù¥?∞Í? Í∞Ä?ùÌïò?§Î©¥ (Ï≤??¥Ï£º, Migration)
         if (!modified && (localChars?.length > 0 || localLogs?.length > 0)) {
            await syncUpCloudData(targetKey, localChars, localLogs, localOpts, mercRef.current);
         }
         
         if (modified) {
             setIsCloudSyncing(false);
             return true;
         }
      } else if (res.success && (!res.data)) {
         // ?¥Îùº?∞ÎìúÍ∞Ä ?ÑÏòà null (?§Í? Ï≤òÏùå ?ùÏÑ±???ÅÌÉú)
         if (localChars?.length > 0 || localLogs?.length > 0) {
            await syncUpCloudData(targetKey, localChars, localLogs, localOpts, mercRef.current);
         }
      }
    } catch(e) { console.error("Cloud Sync Failed:", e) }
    setIsCloudSyncing(false);
    return false;
  };

  useEffect(() => {
    if (!apiKey || characters.length === 0) return;
    const timer = setInterval(() => {
      // ÏµúÏã† RefÎ•??ÑÎã¨?¥ÏÑú Stale Closure ?∞Ìöå
      handleRefreshAll(charsRef.current, apiKey);
    }, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]); // charactersÍ∞Ä ?ÖÎç∞?¥Ìä∏ ???åÎßà??Interval????ñ¥ÏßÄ??Í≤ÉÎèÑ Î∞©Ï?

  useEffect(() => {
    const key = localStorage.getItem("DNF_API_KEY") || "";
    setApiKeyState(key);
    if (!key) setShowSettings(true);
    setApiKeyInput(key);

    let loadedChars = [];
    const saved = localStorage.getItem('DNF_CHARACTERS');
    if (saved) {
      try {
        loadedChars = JSON.parse(saved);
        setCharacters(loadedChars);
      } catch(e) {}
    }

    const savedOpts = localStorage.getItem('DNF_OPTIONS');
    if (savedOpts) {
      try {
        const parsed = JSON.parse(savedOpts);
        setCustomOptions({
          enchant: ['Í∏∞Î≥∏', 'Í∞Ä?±ÎπÑ', 'Ï§ÄÏ¢ÖÍ≤∞', 'Ï¢ÖÍ≤∞'],
          title: ['Í∏∞Î≥∏', 'Í∞Ä?±ÎπÑ', 'Ï§ÄÏ¢ÖÍ≤∞', 'Ï¢ÖÍ≤∞'],
          aura: ['Í∏∞Î≥∏', 'Í∞Ä?±ÎπÑ', 'Ï§ÄÏ¢ÖÍ≤∞', 'Ï¢ÖÍ≤∞'],
          creature: ['Í∏∞Î≥∏', 'Í∞Ä?±ÎπÑ', 'Ï§ÄÏ¢ÖÍ≤∞', 'Ï¢ÖÍ≤∞'],
          avatar: ['Í∏∞Î≥∏', '?¥Î≤§??, '?àÏïï', '?¥Î†à??, 'Ï∞¨Ïûë', '?îÎìú'],
          emblem: ['Í∏∞Î≥∏', '?îÎ†§', 'Ï∞¨Î?', '?§Î∞ú', 'Ï¢ÖÍ≤∞?åÌã∞'],
          ...parsed
        });
      } catch(e) {}
    }

    let loadedOpts = customOptions;
    let loadedLogs = [];

    const savedHistory = localStorage.getItem('DNF_HISTORY');
    if (savedHistory) {
      try { 
        loadedLogs = JSON.parse(savedHistory);
        setHistoryLogs(loadedLogs); 
      } catch(e) {}
    }

    const savedTab = localStorage.getItem('DNF_ACTIVE_TAB');
    if (savedTab) {
      setActiveTabState(savedTab);
    }

    const savedMerc = localStorage.getItem('DNF_MERC');
    if (savedMerc) {
      try {
        const m = JSON.parse(savedMerc);
        if (m.level) setMercLevel(m.level);
        if (m.target) setMercNextLevelTarget(m.target);
        if (m.level) setMercLevelInput(String(m.level));
        if (m.target) setMercTargetInput(String(m.target));
      } catch(e) {}
    }
    
    const savedPilgrimage = localStorage.getItem('DNF_PILGRIMAGE_HISTORY');
    if (savedPilgrimage) {
      try {
        setPilgrimageHistory(JSON.parse(savedPilgrimage));
      } catch(e) {}
    }
    
    const triggerLocalMountRefresh = () => {
      if (loadedChars.length > 0 && key && !autoRefreshDone.current) {
        autoRefreshDone.current = true;
        setIsRefreshing(true);
        Promise.all(loadedChars.map(async (c) => {
           const res = await fetch('/api/character', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ server: c.base.server, charName: c.base.charName, apiKey: key })
           }).then(r => r.json());
           if (res.success) {
              if (res.base.fame < (c.base.fame || 0)) return c;
              return { ...res, manual: c.manual };
           }
           return c;
        })).then((updatedList) => {
           setCharacters(updatedList);
           localStorage.setItem('DNF_CHARACTERS', JSON.stringify(updatedList));
           setIsRefreshing(false);
        });
      }
    };

    // ÎßàÏö¥?????¥Îùº?∞Îìú ?ôÍ∏∞???òÌñâ
    if (key) {
      syncDownCloudData(key, loadedChars, loadedLogs, loadedOpts).then((cloudHydrated) => {
         // ?ôÍ∏∞?îÍ? ?ùÎÇú ?? ?¥Î? ?¥Îùº?∞Îìú ?∞Ïù¥?∞Î? Î∞õÏïò?¥ÎèÑ ?êÎèôÍ∞±Ïã† Î°úÏßÅ?Ä ?òÌñâ??Í∂åÏû• (?§Îßå ?¥Îùº?∞ÎìúÍ∞Ä ??ÏµúÏã†?¥Î?Î°?Ï∂©Îèå Í∞Ä?•ÏÑ± ?àÏùå)
         // ?ÑÏû¨ ÏµúÏ†Å??Î∞©Ïãù?ºÎ°†, ?¥Îùº?∞Îìú ?∞Ïù¥?∞Î? ?§Ïö¥Î∞õÏ? ??Í∑∏ÎÉ• polling ?êÏóê Îß°Í∏∞??Í≤ÉÏù¥ ?àÏ†Ñ??
         if (!cloudHydrated) {
             triggerLocalMountRefresh();
         }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("DNF_API_KEY", apiKeyInput);
    setApiKeyState(apiKeyInput);
    setShowSettings(false);
    syncDownCloudData(apiKeyInput, characters, historyLogs, customOptions);
  };

  const fetchCharacterData = async (srv, name) => {
    const res = await fetch('/api/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server: srv, charName: name, apiKey: apiKey })
    });
    return res.json();
  };



  const handleAdd = async (e) => {
    e.preventDefault();
    if (!charName.trim()) return;
    if (!apiKey) {
      alert("API KEYÎ•?Î®ºÏ? ?§Ï†ï?¥Ï£º?∏Ïöî.");
      setShowSettings(true);
      return;
    }

    setIsAdding(true);
    const data = await fetchCharacterData(server, charName.trim());
    setIsAdding(false);

    if (!data.success) {
      alert(data.error);
      return;
    }

    const bufferKeywords = ['?®Îü¨Î©îÎîï', '?¨Î£®?∏Ïù¥??, 'ÎÆ§Ï¶à', '?∏Ï±à?∏Î¶¨??];
    const jobName = data.base?.jobGrowName || data.base?.jobName || '';
    const autoRole = bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
    data.manual = { role: autoRole };

    // Check duplicate
    if (characters.some(c => c.id === data.id)) {
      alert("?¥Î? ?±Î°ù??Ï∫êÎ¶≠?∞ÏûÖ?àÎã§.");
      return;
    }

    const newList = [...characters, data];
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    setCharName('');
    
    // Cloud Sync (?†Ï? ?∏ÌÑ∞?ôÏÖò = forceOverride true)
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, mercRef.current, true);
  };

  async function handleRefreshAll(charsToRefresh = characters, overrideKey = null) {
    const targetChars = Array.isArray(charsToRefresh) ? charsToRefresh : characters;
    const keyToUse = overrideKey || apiKey;
    if (targetChars.length === 0 || !keyToUse) return;
    
    setIsRefreshing(true);
    let newLogs = [];

    const updatedList = await Promise.all(
      targetChars.map(async (c) => {
        const res = await fetchCharacterData(c.base.server, c.base.charName, keyToUse);
        if (res.success) {
           if (res.base.fame < (c.base.fame || 0)) return c;
           
           let changed = false;
           let logEntry = {
              id: Date.now() + Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
              charId: c.id,
              charName: c.base.charName,
              job: c.base.jobGrowName,
              server: c.base.server,
              fameChange: null,
              equipChange: null,
              oathChange: null,
              beforeSnapshot: JSON.parse(JSON.stringify(c)),
              afterSnapshot: JSON.parse(JSON.stringify(res))
           };

           if (c.base.fame !== res.base.fame) {
              logEntry.fameChange = { old: c.base.fame, new: res.base.fame };
              changed = true;
           }
           if (c.equipment.points !== res.equipment.points || c.equipment.setName !== res.equipment.setName) {
              logEntry.equipChange = { 
                  old: c.equipment.points, new: res.equipment.points,
                  oldSet: c.equipment.setName, newSet: res.equipment.setName
              };
              changed = true;
           }
           if (c.oath.points !== res.oath.points || c.oath.setName !== res.oath.setName) {
              logEntry.oathChange = { 
                  old: c.oath.points, new: res.oath.points,
                  oldSet: c.oath.setName, newSet: res.oath.setName
              };
              changed = true;
           }

           if (changed) {
              newLogs.push(logEntry);
           }
           
           // manual ??ãú Í≥ºÍ±∞ 1Î∂????ÅÌÉúÍ∞Ä ?ÑÎãà??Í∞Ä??ÏµúÏã† ?ÅÌÉú??charsRef.current?êÏÑú Í∞Ä?∏Ï????àÏù¥??Ïª®Îîî?òÏùÑ Î∞©Ï???
           const latestManual = charsRef.current.find(x => x.id === c.id)?.manual || c.manual;
           return { ...res, manual: latestManual };
        }
        return c;
      })
    );
    
    setCharacters(updatedList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(updatedList));

    if (newLogs.length > 0) {
       setHistoryLogs(prev => {
          const merged = [...newLogs, ...prev].slice(0, 1000); // ÏµúÎ? 1000Í∞?Í∏∞Î°ù ?úÌïú
          localStorage.setItem('DNF_HISTORY', JSON.stringify(merged));
          
          // Î¨¥Ï°∞Í±?ÏµúÏã† optsRef.currentÎ•??ÑÎã¨?òÏó¨ Í≥ºÍ±∞ Ïª§Ïä§?Ä?µÏÖò???¥Îùº?∞Îìú????ñ¥?åÏõåÏßÄ???ÄÏ∞∏ÏÇ¨(Stale) Î∞©Ï?
          if (keyToUse) syncUpCloudData(keyToUse, updatedList, merged, optsRef.current, mercRef.current);
          
          return merged;
       });
    }

    setIsRefreshing(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm("?ïÎßêÎ°???Ï∫êÎ¶≠?∞Î? ??†ú?òÏãúÍ≤†Ïäµ?àÍπå?")) return;
    const newList = characters.filter(c => c.id !== id);
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, mercRef.current, true);
  };

  const openManualModal = (char) => {
    const existingManual = char.manual || {};
    
    let defaultRole = 'dealer';
    const bufferKeywords = ['?®Îü¨Î©îÎîï', '?¨Î£®?∏Ïù¥??, 'ÎÆ§Ï¶à', '?∏Ï±à?∏Î¶¨??];
    const jobName = char.base?.jobGrowName || char.base?.jobName || '';
    if (bufferKeywords.some(kw => jobName.includes(kw))) {
        defaultRole = 'buffer';
    }

    setManualForm({ 
      enchant: '', title: '', 
      creature: '', creatureArtifact: '',
      buffLevel: '', buffAbyss: '',
      avatar: '', emblem: '', platEmblem: '', skinAvatar: '', skinSocket: '', skinEmblem: '', weaponAvatar: '', weaponSocket: '', weaponEmblem: '', aura: '', auraEmblem: '',
      ...existingManual,
      role: existingManual.isManualRoleSet ? existingManual.role : defaultRole
    });
    setManualModalChar(char);
  };

  const handleSaveManual = () => {
    if(!manualModalChar) return;
    const formToSave = { ...manualForm, isManualRoleSet: true };
    const newList = characters.map(c => c.id === manualModalChar.id ? { ...c, manual: formToSave } : c);
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    setManualModalChar(null);
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, mercRef.current, true);
  };

  const ALL_KEYS = [
    'enchant', 'title', 'creature', 'creatureArtifact', 
    'avatar', 'emblem', 'platEmblem', 
    'skinAvatar', 'skinSocket', 'skinEmblem', 'weaponAvatar', 'weaponSocket', 'weaponEmblem', 'aura', 'auraEmblem'
  ];
  const openOptionsModal = () => {
    const textFormat = {};
    for(const key of ALL_KEYS) {
      textFormat[key] = (customOptions[key] || []).join(', ');
    }
    setOptionsFormText(textFormat);
    setShowOptionsModal(true);
  };

  const handleSaveOptions = () => {
    const newOpts = {};
    for(const key of ALL_KEYS) {
      if(!optionsFormText[key]) {
         newOpts[key] = [];
      } else {
         newOpts[key] = optionsFormText[key].split(',').map(s => s.trim()).filter(s => s);
      }
    }
    setCustomOptions(newOpts);
    localStorage.setItem('DNF_OPTIONS', JSON.stringify(newOpts));
    setShowOptionsModal(false);
    if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, newOpts, mercRef.current, true);
  };

  const deleteLog = (id) => {
    if (!window.confirm("???±Ïû• Í∏∞Î°ù???ïÎßê ??†ú?òÏãúÍ≤†Ïäµ?àÍπå?")) return;
    setHistoryLogs(prev => {
      const updated = prev.filter(L => L.id !== id);
      localStorage.setItem('DNF_HISTORY', JSON.stringify(updated));
      if (apiKey) syncUpCloudData(apiKey, charsRef.current, updated, optsRef.current, mercRef.current, true);
      return updated;
    });
  };

  const openEditLog = (log) => {
    setEditingLogId(log.id);
    setEditLogForm(JSON.parse(JSON.stringify(log)));
  };

  const saveEditLog = () => {
    setHistoryLogs(prev => {
      const updated = prev.map(L => L.id === editingLogId ? editLogForm : L);
      localStorage.setItem('DNF_HISTORY', JSON.stringify(updated));
      if (apiKey) syncUpCloudData(apiKey, charsRef.current, updated, optsRef.current, mercRef.current, true);
      return updated;
    });
    setEditingLogId(null);
    setEditLogForm(null);
  };

  return (
    <div>
      <header className="app-header">
        <h1 className="title">DNF Info Manager</h1>
        <div style={{display:'flex', gap:'0.5rem'}}>
          <button onClick={handleManualCloudSync} disabled={isCloudSyncing} style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
            {isCloudSyncing ? '?ÅÔ∏è ?ôÍ∏∞??Ï§?..' : '?ÅÔ∏è ?òÎèô ?¥Îùº?∞Îìú Î∞±ÏóÖ'}
          </button>
          <button onClick={openOptionsModal}>?õ†Ô∏??µÏÖò ?∏Ïßë</button>
          <button onClick={() => setShowSettings(true)}>?ôÔ∏è API ?§Ï†ï</button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
         <button className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`} onClick={() => setActiveTab('roster')}>?ë• Ï∫êÎ¶≠??Î°úÏä§??/button>
         <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>?ìú ?±Ïû• ?ºÏ? Í∏∞Î°ù</button>
         <button className={`tab-btn ${activeTab === 'imminent' ? 'active' : ''}`} onClick={() => setActiveTab('imminent')}>?éØ ?§Ïùå ?òÏ†Ñ Î™©Ìëú ?ÑÌô©</button>
         <button className={`tab-btn ${activeTab === 'merc' ? 'active' : ''}`} onClick={() => setActiveTab('merc')}>?îÔ∏è ?©Î≥ë???àÎ≤®</button>
         <button className={`tab-btn ${activeTab === 'pilgrimage' ? 'active' : ''}`} onClick={() => setActiveTab('pilgrimage')}>??Í¥ëÌúò???úÎ?</button>
      </div>

      {activeTab === 'roster' && (
      <>
        {/* Î°úÏä§???úÎ∏å??*/}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
          <button
            className={`tab-btn ${rosterSubTab === 'overview' ? 'active' : ''}`}
            onClick={() => setRosterSubTab('overview')}
            style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}
          >?ìã Ï∫êÎ¶≠??Ï¢ÖÌï© ?ïÎ≥¥</button>
          <button
            className={`tab-btn ${rosterSubTab === 'items' ? 'active' : ''}`}
            onClick={() => setRosterSubTab('items')}
            style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}
          >?éΩ Ï∫êÎ¶≠???ÑÏù¥???ÑÌô©</button>
        </div>
        {rosterSubTab === 'overview' && (
        <section className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form className="add-form" onSubmit={handleAdd}>
          <select value={server} onChange={e => setServer(e.target.value)}>
            {SERVER_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="Ï∫êÎ¶≠?∞Î™Ö ?ÖÎ†•" 
            value={charName} 
            onChange={e => setCharName(e.target.value)} 
          />
          <button type="submit" disabled={isAdding}>
            {isAdding ? <div className="loader"/> : "Ï∫êÎ¶≠??Ï∂îÍ?"}
          </button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>

             <button type="button" onClick={() => handleRefreshAll()} disabled={isRefreshing || characters.length === 0} style={{ background: '#475569' }}>
               {isRefreshing ? <div className="loader"/> : "?îÑ ?ÑÏ≤¥ Í∞±Ïã†"}
             </button>
          </div>
        </form>
      </section>
      )}

      {rosterSubTab === 'overview' && (
      <section className="glass-panel table-wrapper">
        {characters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            ?ÅÎã®???ºÏùÑ ?¥Ïö©??Í¥ÄÎ¶¨Ìï† Ï∫êÎ¶≠?∞Î? Ï∂îÍ??¥Ï£º?∏Ïöî.
          </div>
        ) : (
          (() => {
            const dealers = characters.filter(c => getRole(c) === 'dealer').sort((a,b) => b.base.fame - a.base.fame);
            const buffers = characters.filter(c => getRole(c) === 'buffer').sort((a,b) => b.base.fame - a.base.fame);
            const maxGroups = Math.max(Math.ceil(dealers.length / 3), buffers.length);
            const groups = [];
            for (let i = 0; i < maxGroups; i++) {
              groups.push([dealers[i * 3] || null, dealers[i * 3 + 1] || null, dealers[i * 3 + 2] || null, buffers[i] || null]);
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {groups.map((group, gIdx) => (
                  <div key={gIdx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#38bdf8', fontSize: '1.1rem', paddingLeft: '0.5rem', borderLeft: '3px solid #38bdf8' }}>Í∑∏Î£π {gIdx + 1}</h3>
                    <table style={{ tableLayout: 'fixed', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '5%', textAlign: 'center' }}>?úÎ≤Ñ</th>
                          <th style={{ width: '8%', textAlign: 'center' }}>ÏßÅÏóÖ</th>
                          <th style={{ width: '16%', textAlign: 'center' }}>Ï∫êÎ¶≠?∞Î™Ö</th>
                          <th style={{ width: '6%', textAlign: 'center' }}>Î™ÖÏÑ±</th>
                          <th style={{ width: '11%', textAlign: 'center' }}>?ÅÍ∏â?òÏ†Ñ</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>?àÏù¥??/th>
                          <th style={{ width: '10%', textAlign: 'center' }}>?ÑÌè¨ÏπºÎ¶Ω??/th>
                          <th style={{ width: '12%', textAlign: 'center' }}>?•ÎπÑ (?êÏàò)</th>
                          <th style={{ width: '8%', textAlign: 'center' }}>?úÏïΩ (?êÏàò)</th>
                          <th style={{ width: '7%', textAlign: 'center' }}>?òÎã¥</th>
                          <th style={{ width: '7%', textAlign: 'center' }}>Í¥ÄÎ¶?/th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((c, mIdx) => {
                          if (!c) {
                            return (
                              <tr key={`empty-${mIdx}`}>
                                <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                                  {mIdx < 3 ? '?úÎü¨ ?êÎ¶¨ ÎπÑÏñ¥?àÏùå' : 'Î≤ÑÌçº ?êÎ¶¨ ÎπÑÏñ¥?àÏùå'}
                                </td>
                              </tr>
                            );
                          }
                          const idx = characters.findIndex(char => char.id === c.id);
                          return (
                            <React.Fragment key={c.id}>
                              <tr 
                                style={{ 
                                  verticalAlign: 'middle',
                                  background: mIdx === 3 ? 'rgba(167, 139, 250, 0.05)' : 'transparent',
                                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}
                              >
                                <td data-label="?úÎ≤Ñ" style={{ textAlign: 'center' }}>{SERVER_LIST.find(s => s.id === c.base.server)?.name || c.base.server}</td>
                  <td data-label="ÏßÅÏóÖ" style={{ textAlign: 'center' }}>{c.base.jobGrowName}</td>
                    <td data-label="Ï∫êÎ¶≠?∞Î™Ö" style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{c.base.charName}</div>
                    </td>
                  <td data-label="Î™ÖÏÑ±" style={{ textAlign: 'center' }}>
                    {(() => {
                        const filteredRaids = RAIDS.filter(r => r.name !== '?¥ÎÇ¥ ?©Ìòº?? || gIdx < 2);
                        const nextDungeon = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > c.base.fame);
                        const nextRaid = [...filteredRaids].reverse().find(r => r.fame > c.base.fame);
                        const diffD = nextDungeon ? nextDungeon.fame - c.base.fame : null;
                        const diffR = nextRaid ? nextRaid.fame - c.base.fame : null;
                        const isImminent = (diffD !== null && diffD < 1000) || (diffR !== null && diffR < 1000);
                        return (
                          <div style={{ color: isImminent ? '#fef08a' : '#fbbf24', fontWeight: 'bold', fontSize: '1.05rem', textShadow: isImminent ? '0 0 10px rgba(234, 179, 8, 0.6)' : 'none' }}>
                            {isImminent && <span style={{ marginRight: '3px' }}>?î•</span>}
                            {c.base.fame.toLocaleString()}
                          </div>
                        );
                    })()}
                  </td>
                  <td data-label="?ÅÍ∏â?òÏ†Ñ" style={{ textAlign: 'center' }}>
                    {(() => {
                      const nextDungeon = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > c.base.fame);
                      const diff = nextDungeon ? nextDungeon.fame - c.base.fame : null;
                      const isImminent = diff !== null && diff < 1000;
                      const cleared = ADVANCED_DUNGEONS.filter(d => c.base.fame >= d.fame).slice(0, 2);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          {nextDungeon && (
                            <div style={{
                              fontSize: '0.7rem',
                              color: isImminent ? '#fef08a' : '#fca5a5',
                              background: isImminent ? 'rgba(234, 179, 8, 0.15)' : 'rgba(248, 113, 113, 0.08)',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              border: isImminent ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(248, 113, 113, 0.2)',
                              whiteSpace: 'nowrap',
                              fontWeight: isImminent ? 'bold' : 'normal',
                              boxShadow: isImminent ? '0 0 6px rgba(234, 179, 8, 0.3)' : 'none'
                            }}>
                              {isImminent ? '?î•' : '??'} {nextDungeon.name}ÍπåÏ? <strong style={{ color: isImminent ? '#fde047' : '#f87171' }}>{diff.toLocaleString()}</strong>
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                            {cleared.map((dungeon) => (
                              <span key={dungeon.name} style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '3px',
                                fontSize: '0.7rem',
                                border: '1px solid rgba(56,189,248,0.2)'
                              }}>
                                {dungeon.name}
                              </span>
                            ))}
                          </div>
                          {!nextDungeon && cleared.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>-</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td data-label="?àÏù¥?? style={{ textAlign: 'center' }}>
                    {(() => {
                      const filteredRaids = RAIDS.filter(r => r.name !== '?¥ÎÇ¥ ?©Ìòº?? || gIdx < 2);
                      const nextRaid = [...filteredRaids].reverse().find(r => r.fame > c.base.fame);
                      const raidDiff = nextRaid ? nextRaid.fame - c.base.fame : null;
                      const isImminent = raidDiff !== null && raidDiff < 1000;
                      const clearedRaids = filteredRaids.filter(r => c.base.fame >= r.fame);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          {nextRaid && (
                            <div style={{
                              fontSize: '0.7rem',
                              color: isImminent ? '#fef08a' : '#c084fc',
                              background: isImminent ? 'rgba(234, 179, 8, 0.15)' : 'rgba(192, 132, 252, 0.08)',
                              padding: '0.2rem 0.4rem',
                              borderRadius: '4px',
                              border: isImminent ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(192, 132, 252, 0.2)',
                              whiteSpace: 'nowrap',
                              fontWeight: isImminent ? 'bold' : 'normal',
                              boxShadow: isImminent ? '0 0 6px rgba(234, 179, 8, 0.3)' : 'none'
                            }}>
                              {isImminent ? '?î•' : '?îÔ∏è'} {nextRaid.name}ÍπåÏ? <strong style={{ color: isImminent ? '#fde047' : '#a855f7' }}>{raidDiff.toLocaleString()}</strong>
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
                            {clearedRaids.map((raid) => (
                              <span key={raid.name} style={{
                                background: 'rgba(192, 132, 252, 0.15)',
                                color: '#d8b4fe',
                                padding: '0.1rem 0.3rem',
                                borderRadius: '3px',
                                fontSize: '0.7rem',
                                border: '1px solid rgba(192, 132, 252, 0.2)'
                              }}>
                                {raid.name}
                              </span>
                            ))}
                          </div>
                          {!nextRaid && clearedRaids.length === 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>-</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td data-label="?ÑÌè¨ÏπºÎ¶Ω?? style={{ textAlign: 'center' }}>
                    {(() => {
                      // state: 0=ÏßÑÏûÖÎ∂àÍ?, 1=Îß§Ïπ≠Í∞Ä?? 2=1?®Í≥ÑÍ∞Ä?? 3=2?®Í≥ÑÍ∞Ä??
                      const fame = c.base.fame;
                      const state = fame >= 105881 ? 3 : fame >= 98171 ? 2 : fame >= 73993 ? 1 : 0;
                      const stateLabels = ['', 'Îß§Ïπ≠', '1?®Í≥Ñ', '2?®Í≥Ñ'];
                      const nextTargets = [{ name: 'Îß§Ïπ≠', fame: 73993 }, { name: '1?®Í≥Ñ', fame: 98171 }, { name: '2?®Í≥Ñ', fame: 105881 }, null];
                      const currentLabel = stateLabels[state];
                      const nextTarget = state < 3 ? nextTargets[state] : null;
                      const diff = nextTarget ? nextTarget.fame - fame : null;
                      const isImminent = diff !== null && diff < 1000;
                      if (state === 0) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>-</span>
                            <div style={{ fontSize: '0.7rem', color: isImminent ? '#fef08a' : '#fb923c', background: isImminent ? 'rgba(234,179,8,0.15)' : 'rgba(251,146,60,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: isImminent ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(251,146,60,0.25)', whiteSpace: 'nowrap', fontWeight: isImminent ? 'bold' : 'normal' }}>
                              {isImminent ? '?î•' : '??'} Îß§Ïπ≠ÍπåÏ? <strong style={{ color: isImminent ? '#fde047' : '#f97316' }}>{diff.toLocaleString()}</strong>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid rgba(251,146,60,0.35)' }}>
                            ?? {currentLabel}
                          </span>
                          {nextTarget && (
                            <div style={{ fontSize: '0.7rem', color: isImminent ? '#fef08a' : '#fb923c', background: isImminent ? 'rgba(234,179,8,0.15)' : 'rgba(251,146,60,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: isImminent ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(251,146,60,0.2)', whiteSpace: 'nowrap', fontWeight: isImminent ? 'bold' : 'normal' }}>
                              {isImminent ? '?î•' : '??} {nextTarget.name}ÍπåÏ? <strong style={{ color: isImminent ? '#fde047' : '#f97316' }}>{diff.toLocaleString()}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td data-label="?•ÎπÑ" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '-0.3px' }}>{c.equipment.setName}</div>
                    <div className={getTierClass(c.equipment.rarity)} style={{ fontSize: '0.7rem', letterSpacing: '-0.3px', marginTop: '2px' }}>
                      {c.equipment.gradeDesc} ({c.equipment.points})
                    </div>
                  </td>
                  <td data-label="?úÏïΩ" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '-0.3px' }}>{c.oath.setName}</div>
                    <div className={getTierClass(c.oath.rarity)} style={{ fontSize: '0.7rem', letterSpacing: '-0.3px', marginTop: '2px' }}>
                      {c.oath.gradeDesc} ({c.oath.points})
                    </div>
                  </td>
                  <td data-label="?òÎã¥" style={{ textAlign: 'center' }}>
                    {c.charId ? (
                      <a 
                        href={`https://dundam.xyz/character?server=${c.base.server}&key=${c.charId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        Ï°∞Ìöå ?îó
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td data-label="Í¥ÄÎ¶? style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button type="button" className="danger" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }} onClick={() => handleDelete(c.id)}>
                        ?óëÔ∏?
                      </button>
                    </div>
                  </td>
                </tr>

                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </section>
      )}

      {/* Ï∫êÎ¶≠???ÑÏù¥???ÑÌô© ?úÎ∏å??*/}
      {rosterSubTab === 'items' && (
        <section className="glass-panel" style={{ overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.5rem' }}>
            ?éΩ Ï∫êÎ¶≠???ÑÏù¥???ÑÌô©
            <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.6rem', fontWeight: 'normal' }}>?òÎèô ?ÖÎ†• ?ïÎ≥¥ Í∏∞Ï?</span>
          </h3>
          {characters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Ï∫êÎ¶≠?∞Î? Î®ºÏ? Ï∂îÍ??¥Ï£º?∏Ïöî.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', color: '#cbd5e1', tableLayout: 'auto', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#e2e8f0', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>Ï∫êÎ¶≠?∞Î™Ö</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#e2e8f0', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>ÏßÅÏóÖ</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>Ïπ?ò∏</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#f472b6', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>?§Îùº</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#10b981', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>?¨Î¶¨Ï≥?/th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#a78bfa', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>ÎßàÎ?</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#fb923c', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>?§ÏúÑÏπ?/th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#818cf8', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>?ÑÎ∞î?Ä</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#e879f9', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>?ºÎ?</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#ef4444', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>Î¨¥Í∏∞??/th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>?òÎèô?§Ï†ï</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const dealers = characters.filter(c => getRole(c) === 'dealer').sort((a,b) => b.base.fame - a.base.fame);
                  const buffers = characters.filter(c => getRole(c) === 'buffer').sort((a,b) => b.base.fame - a.base.fame);
                  const maxGroups = Math.max(Math.ceil(dealers.length / 3), buffers.length);
                  const groups = [];
                  for (let i = 0; i < maxGroups; i++) {
                    groups.push([dealers[i * 3] || null, dealers[i * 3 + 1] || null, dealers[i * 3 + 2] || null, buffers[i] || null]);
                  }
                  
                  return groups.flatMap((group, gIdx) => [
                    <tr key={`group-${gIdx}-header`} style={{ background: 'rgba(56,189,248,0.1)', borderBottom: '1px solid rgba(56,189,248,0.3)' }}>
                       <td colSpan="11" style={{ textAlign: 'left', fontWeight: 'bold', color: '#38bdf8', padding: '0.4rem 1rem' }}>Í∑∏Î£π {gIdx + 1}</td>
                    </tr>,
                    ...group.map((c, mIdx) => {
                      if (!c) {
                        return (
                          <tr key={`group-${gIdx}-empty-${mIdx}`}>
                            <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.2)' }}>
                              {mIdx < 3 ? '?úÎü¨ ?êÎ¶¨ ÎπÑÏñ¥?àÏùå' : 'Î≤ÑÌçº ?êÎ¶¨ ÎπÑÏñ¥?àÏùå'}
                            </td>
                          </tr>
                        );
                      }
                      const m = c.manual || {};
                      const idx = characters.findIndex(char => char.id === c.id);
                      const cell = (content) => (
                        <td style={{ padding: '0.5rem 0.7rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle', background: mIdx === 3 ? 'rgba(167, 139, 250, 0.05)' : 'transparent' }}>
                          {content}
                        </td>
                      );
                      const dash = <span style={{ color: '#475569' }}>-</span>;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = mIdx === 3 ? 'rgba(167, 139, 250, 0.1)' : 'rgba(56,189,248,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                      {/* Ï∫êÎ¶≠?∞Î™Ö */}
                      {cell(<span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{c.base.charName}</span>)}
                      {/* ÏßÅÏóÖ */}
                      {cell(<span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{c.base.jobGrowName}</span>)}
                      {/* Ïπ?ò∏ */}
                      {cell(m.title ? <span style={{ color: '#38bdf8' }}>{m.title}</span> : dash)}
                      {/* ?§Îùº: Ï¢ÖÎ•ò + ?†Î∏î??*/}
                      {cell(
                        (m.aura || m.auraEmblem) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.aura && <span style={{ color: '#f472b6' }}>{m.aura}</span>}
                            {m.auraEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.auraEmblem}]</span>}
                          </div>
                        ) : dash
                      )}
                      {/* ?¨Î¶¨Ï≥? Ï¢ÖÎ•ò + ?ÑÌã∞?©Ìä∏ */}
                      {cell(
                        (m.creature || m.creatureArtifact) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.creature && <span style={{ color: '#10b981' }}>{m.creature}</span>}
                            {m.creatureArtifact && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.creatureArtifact}]</span>}
                          </div>
                        ) : dash
                      )}
                      {/* ÎßàÎ? */}
                      {cell(m.enchant ? <span style={{ color: '#a78bfa' }}>{m.enchant}</span> : dash)}
                      {/* ?§ÏúÑÏπ? Î≤ÑÌîÑ?àÎ≤® + ?∏Î¶∞ */}
                      {cell(
                        (m.buffLevel || m.buffAbyss) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.buffLevel && <span style={{ color: '#fb923c' }}>Î≤ÑÌîÑ {String(m.buffLevel).includes('?àÎ≤®') ? m.buffLevel : `${m.buffLevel}?àÎ≤®`}</span>}
                            {m.buffAbyss && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>?∏Î¶∞ {String(m.buffAbyss).includes('Í∞?) ? m.buffAbyss : `${m.buffAbyss}Í∞?}</span>}
                          </div>
                        ) : dash
                      )}
                      {/* ?ÑÎ∞î?Ä: Ï¢ÖÎ•ò + ?åÏó† + ?†Î∏î??*/}
                      {cell(
                        (m.avatar || m.platEmblem || m.emblem) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.avatar && <span style={{ color: '#818cf8' }}>{m.avatar}</span>}
                            {m.platEmblem && <span style={{ color: 'rgba(56,189,248,0.7)', fontSize: '0.7rem' }}>??{m.platEmblem}</span>}
                            {m.emblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>??{m.emblem}</span>}
                          </div>
                        ) : dash
                      )}
                      {/* ?ºÎ?: Ï¢ÖÎ•ò + ?åÏºì + ?†Î∏î??*/}
                      {cell(
                        (m.skinAvatar || m.skinSocket || m.skinEmblem) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.skinAvatar && <span style={{ color: '#e879f9' }}>{m.skinAvatar}</span>}
                            {m.skinSocket && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>?åÏºì: {m.skinSocket}</span>}
                            {m.skinEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.skinEmblem}]</span>}
                          </div>
                        ) : dash
                      )}
                      {/* Î¨¥Í∏∞?? Ï¢ÖÎ•ò + ?åÏºì + ?†Î∏î??*/}
                      {cell(
                        (m.weaponAvatar || m.weaponSocket || m.weaponEmblem) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.weaponAvatar && <span style={{ color: '#ef4444' }}>{m.weaponAvatar}</span>}
                            {m.weaponSocket && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>?åÏºì: {m.weaponSocket}</span>}
                            {m.weaponEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.weaponEmblem}]</span>}
                          </div>
                        ) : dash
                      )}
                      {/* ?òÎèô?§Ï†ï Î≤ÑÌäº */}
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <button type="button" onClick={() => openManualModal(c)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', background: '#3b82f6', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>
                          ?ôÔ∏è
                        </button>
                      </td>
                    </tr>
                  );
                })]);
              })()}
            </tbody>
          </table>
          )}
        </section>
      )}
      </>
      )}



      {activeTab === 'history' && (
        <section className="glass-panel" style={{ minHeight: '60vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap:'wrap', gap:'1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>?±Ïû• ?ºÏ?</h2>
              {(() => {
                let currentFame = 0;
                if (historyFilterChar === '') {
                  currentFame = characters.reduce((acc, c) => acc + c.base.fame, 0);
                } else {
                  const char = characters.find(c => c.id === historyFilterChar);
                  if (char) {
                    currentFame = char.base.fame;
                  } else {
                    const charLogs = historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).sort((a,b) => a.timestamp - b.timestamp);
                    if (charLogs.length > 0) currentFame = charLogs[charLogs.length - 1].fameChange.new;
                  }
                }
                return currentFame > 0 ? (
                  <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', color: '#38bdf8', fontWeight: 'bold' }}>
                    ?ÑÏû¨ Î™ÖÏÑ±: <span style={{ color: '#fff' }}>{currentFame.toLocaleString()}</span>
                  </div>
                ) : null;
              })()}
            </div>
            <select value={historyFilterChar} onChange={e => setHistoryFilterChar(e.target.value)} style={{ padding: '0.2rem 0.1rem', minWidth: '200px' }}>
              <option value="">?ÑÏ≤¥ Ï∫êÎ¶≠??Î≥¥Í∏∞</option>
              {getSortedCharacters(characters).map(c => <option key={c.id} value={c.id}>{c.base.charName} ({c.base.jobGrowName})</option>)}
            </select>
          </div>

          {/* Í∑∏Îûò??Î∑?Î™®Îìú ?†Í? */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Í∑∏Îûò??Í∏∞Ï?:</span>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setChartViewMode('event')}
                style={{
                  padding: '0.3rem 0.8rem', fontSize: '0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: chartViewMode === 'event' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: chartViewMode === 'event' ? '#38bdf8' : '#94a3b8',
                  fontWeight: chartViewMode === 'event' ? 'bold' : 'normal',
                  boxShadow: chartViewMode === 'event' ? '0 0 8px rgba(56,189,248,0.2)' : 'none'
                }}
              >???¥Î≤§??Î∞úÏÉù Í∏∞Ï?</button>
              <button
                onClick={() => setChartViewMode('daily')}
                style={{
                  padding: '0.3rem 0.8rem', fontSize: '0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: chartViewMode === 'daily' ? 'rgba(167, 139, 250, 0.25)' : 'transparent',
                  color: chartViewMode === 'daily' ? '#a78bfa' : '#94a3b8',
                  fontWeight: chartViewMode === 'daily' ? 'bold' : 'normal',
                  boxShadow: chartViewMode === 'daily' ? '0 0 8px rgba(167,139,250,0.2)' : 'none'
                }}
              >?ìÖ ?ºÏûêÎ≥?(Îß§Ïùº 06:00 Í∏∞Ï?)</button>
            </div>
          </div>

          {chartData.length > 0 && (
            <div style={{ width: '100%', height: 300, marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="formattedTime" stroke="#94a3b8" fontSize={11} tickMargin={10} minTickGap={20} />
                  <YAxis domain={['dataMin', 'dataMax']} stroke="#94a3b8" fontSize={11} width={50} tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(1)}Îß? : v.toLocaleString()} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                     itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                     formatter={(value) => [value.toLocaleString(), historyFilterChar === '' ? 'Î™®Ìóò??Ï¥?Î™ÖÏÑ±' : 'Î™ÖÏÑ±']}
                     labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Line type={chartViewMode === 'daily' ? 'linear' : 'stepAfter'} dataKey="fame" stroke={chartViewMode === 'daily' ? '#a78bfa' : '#38bdf8'} strokeWidth={2} dot={{ r: 3, strokeWidth: 1, fill: '#0f172a' }} activeDot={{ r: 5 }} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {historyLogs.filter(L => historyFilterChar === '' || L.charId === historyFilterChar).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
              ?ÑÏßÅ Î≥Ä??Í∏∞Î°ù???ÜÏäµ?àÎã§.<br/>?úÎ≤Ñ?êÏÑú ?àÎ°ú???§Ìéô???ïÎ≥¥Í∞Ä Í∞êÏ??òÎ©¥ ?êÎèô?ºÎ°ú ?¥Í≥≥???ÑÏ†Å Í∏∞Î°ù?©Îãà??
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {historyLogs.filter(L => historyFilterChar === '' || L.charId === historyFilterChar).map(log => {
                 const dt = new Date(log.timestamp);
                 const timeStr = `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
                 
                 return (
                   <div key={log.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'center' }}>
                       <div>
                         <strong style={{ fontSize: '1.15rem', color: '#60a5fa' }}>{log.charName} <span style={{fontSize: '0.7rem', color:'var(--text-muted)'}}>{log.job}</span></strong>
                         <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.5rem' }}>?ïí {timeStr}</span>
                       </div>
                       <div style={{ display: 'flex', gap: '0.4rem' }}>
                         <button type="button" onClick={() => openEditLog(log)} style={{ padding: '0.2rem 0.4rem', background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>?èÔ∏è ?òÏ†ï</button>
                         <button type="button" onClick={() => deleteLog(log.id)} className="danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>????†ú</button>
                       </div>
                     </div>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                       {log.fameChange && (
                          <div className="log-pill" style={{ borderColor: log.fameChange.new > log.fameChange.old ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)' }}>
                             <strong>Î™ÖÏÑ±:</strong> {log.fameChange.old.toLocaleString()} ?°Ô∏è <span style={{color: log.fameChange.new > log.fameChange.old ? '#4ade80' : '#f87171', fontWeight:'bold'}}>{log.fameChange.new.toLocaleString()} ({log.fameChange.new > log.fameChange.old ? '+' : ''}{(log.fameChange.new - log.fameChange.old).toLocaleString()})</span>
                          </div>
                       )}
                       {log.equipChange && (
                          <div className="log-pill" style={{ borderColor: log.equipChange.new > log.equipChange.old ? 'rgba(74, 222, 128, 0.4)' : (log.equipChange.new < log.equipChange.old ? 'rgba(248, 113, 113, 0.4)' : 'rgba(255,255,255,0.2)') }}>
                             <strong>?•ÎπÑ:</strong> {log.equipChange.oldSet ? `[${log.equipChange.oldSet}] ` : ''}{log.equipChange.old}<GradeBadge points={log.equipChange.old}/> ?°Ô∏è {log.equipChange.newSet ? `[${log.equipChange.newSet}] ` : ''}<span style={{color: log.equipChange.new > log.equipChange.old ? '#4ade80' : (log.equipChange.new < log.equipChange.old ? '#f87171' : '#fff'), fontWeight:'bold'}}>{log.equipChange.new}<GradeBadge points={log.equipChange.new}/> ({log.equipChange.new > log.equipChange.old ? '+' : ''}{(log.equipChange.new - log.equipChange.old)})</span>
                          </div>
                       )}
                       {log.oathChange && (
                          <div className="log-pill" style={{ borderColor: log.oathChange.new > log.oathChange.old ? 'rgba(74, 222, 128, 0.4)' : (log.oathChange.new < log.oathChange.old ? 'rgba(248, 113, 113, 0.4)' : 'rgba(255,255,255,0.2)') }}>
                             <strong>?úÏïΩ:</strong> {log.oathChange.oldSet ? `[${log.oathChange.oldSet}] ` : ''}{log.oathChange.old}<GradeBadge points={log.oathChange.old}/> ?°Ô∏è {log.oathChange.newSet ? `[${log.oathChange.newSet}] ` : ''}<span style={{color: log.oathChange.new > log.oathChange.old ? '#4ade80' : (log.oathChange.new < log.oathChange.old ? '#f87171' : '#fff'), fontWeight:'bold'}}>{log.oathChange.new}<GradeBadge points={log.oathChange.new}/> ({log.oathChange.new > log.oathChange.old ? '+' : ''}{(log.oathChange.new - log.oathChange.old)})</span>
                          </div>
                       )}
                     </div>
                   </div>
                 );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'imminent' && (() => {
        // Í≥µÌÜµ Ïπ¥Îìú ?åÎçî??
        const renderCard = (c, target, diff, emoji = '??', accentColor = '#38bdf8', currentBadge = null) => {
          const isImminent = diff < 1000;
          return (
            <div key={c.id} style={{
              background: isImminent ? 'rgba(234, 179, 8, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              border: isImminent ? '1px solid rgba(234, 179, 8, 0.4)' : `1px solid rgba(255,255,255,0.1)`,
              borderRadius: '8px', padding: '1.2rem',
              boxShadow: isImminent ? '0 0 12px rgba(234, 179, 8, 0.1)' : 'none',
              display: 'flex', flexDirection: 'column', gap: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isImminent ? '#fef08a' : '#e2e8f0' }}>{c.base.charName}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.base.jobGrowName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Î™ÖÏÑ±: <span style={{ color: isImminent ? '#fbbf24' : accentColor, fontWeight: 'bold' }}>{c.base.fame.toLocaleString()}</span></div>
                {currentBadge && <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>{currentBadge}</span>}
              </div>
              <div style={{
                background: isImminent ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                padding: '0.5rem', borderRadius: '6px', fontSize: '0.7rem',
                color: isImminent ? '#fef08a' : '#cbd5e1', textAlign: 'center', marginTop: 'auto',
                border: isImminent ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {isImminent ? '?î•' : emoji} <strong>{target.name}</strong> Ïª∑ÍπåÏßÄ <strong style={{ color: '#fff', fontSize: '1.15em' }}>{diff.toLocaleString()}</strong> ?®Ïùå{isImminent ? '!' : ''}
              </div>
            </div>
          );
        };

        const emptyMsg = (msg = 'Î™®Îì† Ï°∞Í±¥???¨ÏÑ±?àÍ±∞???Ä??Ï∫êÎ¶≠?∞Í? ?ÜÏäµ?àÎã§.') => (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', gridColumn: '1 / -1', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>{msg}</div>
        );

        return (
          <section className="glass-panel" style={{ minHeight: '60vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0 }}>?éØ ?§Ïùå ?òÏ†Ñ Î™©Ìëú ?ÑÌô©</h2>
              {/* ?ÅÍ∏â?òÏ†Ñ Î∑??†Í? - ?ÅÍ∏â?òÏ†Ñ ??ùº ?åÎßå ?úÏãú */}
              {imminentSubTab === 'dungeon' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setDungeonView('byDungeon')} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: dungeonView === 'byDungeon' ? 'rgba(147,197,253,0.2)' : 'rgba(255,255,255,0.04)', border: dungeonView === 'byDungeon' ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(255,255,255,0.1)', color: dungeonView === 'byDungeon' ? '#93c5fd' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>?óÇÔ∏??òÏ†ÑÎ≥??ïÎ†¨</button>
                  <button onClick={() => setDungeonView('overall')} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: dungeonView === 'overall' ? 'rgba(147,197,253,0.2)' : 'rgba(255,255,255,0.04)', border: dungeonView === 'overall' ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(255,255,255,0.1)', color: dungeonView === 'overall' ? '#93c5fd' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>?ìä ?ÑÏ≤¥ ?ïÎ†¨</button>
                </div>
              )}
              {imminentSubTab === 'apoc' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setApocView('byTier')} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: apocView === 'byTier' ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)', border: apocView === 'byTier' ? '1px solid rgba(251,146,60,0.4)' : '1px solid rgba(255,255,255,0.1)', color: apocView === 'byTier' ? '#fb923c' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>?óÇÔ∏??®Í≥ÑÎ≥??ïÎ†¨</button>
                  <button onClick={() => setApocView('overall')} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: apocView === 'overall' ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)', border: apocView === 'overall' ? '1px solid rgba(251,146,60,0.4)' : '1px solid rgba(255,255,255,0.1)', color: apocView === 'overall' ? '#fb923c' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>?ìä ?ÑÏ≤¥ ?ïÎ†¨</button>
                </div>
              )}
            </div>

            {/* ?úÎ∏å??Î≤ÑÌäº */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <button className={`tab-btn ${imminentSubTab === 'dungeon' ? 'active' : ''}`} onClick={() => setImminentSubTab('dungeon')} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>?? ?ÅÍ∏â?òÏ†Ñ</button>
              <button className={`tab-btn ${imminentSubTab === 'raid' ? 'active' : ''}`} onClick={() => setImminentSubTab('raid')} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>?îÔ∏è ?àÏù¥??/button>
              <button className={`tab-btn ${imminentSubTab === 'apoc' ? 'active' : ''}`} onClick={() => setImminentSubTab('apoc')} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>?? ?ÑÌè¨ÏπºÎ¶Ω??/button>
            </div>

            {/* ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä ?ÅÍ∏â?òÏ†Ñ ???Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */}
            {imminentSubTab === 'dungeon' && (() => {
              // ?òÏ†Ñ ?úÏÑú: ????íÎÜí?Ä fame ??(ascending)
              const dungeons = [...ADVANCED_DUNGEONS].reverse(); // ??? Î™ÖÏÑ±Î∂Ä??

              if (dungeonView === 'overall') {
                // ?ÑÏ≤¥ ?ïÎ†¨: ?§Ïùå ?òÏ†Ñ ?®Ï? Î™ÖÏÑ± ?§Î¶ÑÏ∞®Ïàú
                const items = characters.map(c => {
                  const next = dungeons.find(d => d.fame > c.base.fame);
                  return { c, next };
                }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {items.length === 0 ? emptyMsg('Î™®Îì† Ï∫êÎ¶≠?∞Í? ÏµúÍ≥† ?ÅÍ∏â?òÏ†Ñ??ÏßÑÏûÖ Í∞Ä?•Ìï©?àÎã§.') : items.map(({ c, next }) => renderCard(c, next, next.fame - c.base.fame, '??', '#93c5fd'))}
                  </div>
                );
              }

              // ?òÏ†ÑÎ≥??ïÎ†¨: ?íÏ? Î™ÖÏÑ±(Î∞∞Íµê?êÏùò ?? ????? Î™ÖÏÑ±(?¨Ïù¥ ?†Í∏¥ ?∏Ïàò) ???úÏãú
              return (
                <div>
                  {ADVANCED_DUNGEONS.map((target) => {
                    // dungeons(?§Î¶ÑÏ∞®Ïàú)?êÏÑú target???∏Îç±?§Î? Ï∞æÏïÑ ?¥Ï†Ñ ?òÏ†Ñ??Í≥ÑÏÇ∞
                    const targetIdx = dungeons.findIndex(d => d.name === target.name);
                    const prevDungeon = targetIdx > 0 ? dungeons[targetIdx - 1] : null;
                    // ???òÏ†Ñ???ÑÏßÅ Î™??§Ïñ¥Í∞ÄÍ≥?(fame < target.fame)
                    // Í∑∏Î¶¨Í≥??¥Ï†Ñ ?òÏ†Ñ?Ä ?¥Î¶¨?¥ÌñàÍ±∞ÎÇò(fame >= prevDungeon.fame) ?¥Ï†Ñ ?òÏ†Ñ ?êÏ≤¥Í∞Ä ?ÜÎäî Í≤ΩÏö∞
                    const eligible = characters.filter(c =>
                      c.base.fame < target.fame &&
                      (prevDungeon == null || c.base.fame >= prevDungeon.fame)
                    ).sort((a, b) => (target.fame - a.base.fame) - (target.fame - b.base.fame));

                    const currentDungeonName = prevDungeon ? prevDungeon.name : 'ÏßÑÏûÖ Í∞Ä???òÏ†Ñ ?ÜÏùå';

                    return (
                      <div key={target.name} style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid rgba(147,197,253,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#93c5fd', fontSize: '0.7rem' }}>
                          ?? {target.name} ÏßÑÏûÖ Î™©Ìëú
                          <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>?ÑÏû¨ ÏµúÍ≥†: {currentDungeonName} | ?îÏó¨ {eligible.length}Î™?/span>
                        </h3>
                        {eligible.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '8px', textAlign: 'center' }}>?¥Îãπ Ï∫êÎ¶≠???ÜÏùå</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                            {eligible.map(c => renderCard(c, target, target.fame - c.base.fame, '??', '#93c5fd', `?ÑÏû¨: ${currentDungeonName}`))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä ?àÏù¥?????Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */}
            {imminentSubTab === 'raid' && (() => {
              const getRole = (char) => {
                if (char.manual?.isManualRoleSet && char.manual?.role) return char.manual.role;
                const bufferKeywords = ['?®Îü¨Î©îÎîï', '?¨Î£®?∏Ïù¥??, 'ÎÆ§Ï¶à', '?∏Ï±à?∏Î¶¨??];
                const jobName = char.base?.jobGrowName || char.base?.jobName || '';
                return bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
              };
              const dealers = characters.filter(c => getRole(c) === 'dealer').sort((a,b) => b.base.fame - a.base.fame);
              const buffers = characters.filter(c => getRole(c) === 'buffer').sort((a,b) => b.base.fame - a.base.fame);

              const raidItems = characters.map((c) => {
                const role = getRole(c);
                const rank = role === 'dealer' ? dealers.findIndex(x => x.id === c.id) : buffers.findIndex(x => x.id === c.id);
                const gIdx = rank === -1 ? 999 : (role === 'dealer' ? Math.floor(rank / 3) : rank);
                
                const filtered = RAIDS.filter(r => r.name !== '?¥ÎÇ¥ ?©Ìòº?? || gIdx < 2);
                const next = [...filtered].reverse().find(r => r.fame > c.base.fame);
                return { c, next };
              }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {raidItems.length === 0 ? emptyMsg('Î™®Îì† ?àÏù¥??Ï°∞Í±¥???¨ÏÑ±?àÍ±∞???Ä??Ï∫êÎ¶≠?∞Í? ?ÜÏäµ?àÎã§.') : raidItems.map(({ c, next }) => renderCard(c, next, next.fame - c.base.fame, '?îÔ∏è', '#d8b4fe'))}
                </div>
              );
            })()}

            {/* ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä ?ÑÌè¨ÏπºÎ¶Ω?????Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä */}
            {imminentSubTab === 'apoc' && (() => {
              const apocTiers = [{ name: 'Îß§Ïπ≠', fame: 73993 }, { name: '1?®Í≥Ñ', fame: 98171 }, { name: '2?®Í≥Ñ', fame: 105881 }];

              if (apocView === 'overall') {
                const apocItems = characters.map(c => {
                  const fame = c.base.fame;
                  const state = fame >= 105881 ? 3 : fame >= 98171 ? 2 : fame >= 73993 ? 1 : 0;
                  const currentLabel = ['?ÜÏùå', 'Îß§Ïπ≠', '1?®Í≥Ñ', '2?®Í≥Ñ'][state];
                  const next = state < 3 ? apocTiers[state] : null;
                  return { c, state, currentLabel, next };
                }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {apocItems.length === 0 ? emptyMsg('Î™®Îì† Ï∫êÎ¶≠?∞Í? ?ÑÌè¨ÏπºÎ¶Ω??2?®Í≥Ñ??ÏßÑÏûÖ Í∞Ä?•Ìï©?àÎã§.') : apocItems.map(({ c, state, currentLabel, next }) => renderCard(c, next, next.fame - c.base.fame, '??', '#fb923c', state > 0 ? `?ÑÏû¨: ${currentLabel}` : 'ÎØ∏ÏßÑ??))}
                  </div>
                );
              }

              // ?®Í≥ÑÎ≥??ïÎ†¨: 2?®Í≥Ñ ??1?®Í≥Ñ ??Îß§Ïπ≠ ?úÏÑúÎ°??úÏãú
              // Í∞??®Í≥ÑÎ•?Î™©ÌëúÎ°??òÎäî Ï∫êÎ¶≠???ÑÏû¨ state = Î™©Ìëú state - 1)Îß??úÏãú
              const tierGroups = [
                { target: apocTiers[2], currentLabel: '1?®Í≥Ñ', minFame: 98171, maxFame: 105881 },  // 2?®Í≥Ñ Î™©Ìëú: ?ÑÏû¨ 1?®Í≥Ñ
                { target: apocTiers[1], currentLabel: 'Îß§Ïπ≠',  minFame: 73993, maxFame: 98171  },  // 1?®Í≥Ñ Î™©Ìëú: ?ÑÏû¨ Îß§Ïπ≠
                { target: apocTiers[0], currentLabel: 'ÎØ∏ÏßÑ??, minFame: 0,     maxFame: 73993  },  // Îß§Ïπ≠ Î™©Ìëú: ?ÑÏû¨ ÎØ∏ÏßÑ??
              ];
              return (
                <div>
                  {tierGroups.map(({ target, currentLabel, minFame, maxFame }) => {
                    const eligible = characters.filter(c =>
                      c.base.fame >= minFame && c.base.fame < maxFame
                    ).sort((a, b) => (target.fame - a.base.fame) - (target.fame - b.base.fame));
                    return (
                      <div key={target.name} style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid rgba(251,146,60,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#fb923c', fontSize: '0.7rem' }}>
                          ?? {target.name} ÏßÑÏûÖ Î™©Ìëú
                          <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>?ÑÏû¨: {currentLabel} | ?îÏó¨ {eligible.length}Î™?/span>
                        </h3>
                        {eligible.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '8px', textAlign: 'center' }}>?¥Îãπ Ï∫êÎ¶≠???ÜÏùå</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                            {eligible.map(c => renderCard(c, target, target.fame - c.base.fame, '??', '#fb923c', `?ÑÏû¨: ${currentLabel}`))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        );
      })()}




      {activeTab === 'merc' && (() => {
        const top20 = [...characters].sort((a,b) => (b.oath.rawPoints ?? b.oath.points ?? 0) - (a.oath.rawPoints ?? a.oath.points ?? 0)).slice(0, 20);
        const totalOath = top20.reduce((acc, c) => acc + (c.oath.rawPoints ?? c.oath.points ?? 0), 0);
        const hasTarget = mercNextLevelTarget > 0;
        const progress = hasTarget ? Math.min(totalOath / mercNextLevelTarget * 100, 100) : 0;
        const remaining = hasTarget ? Math.max(mercNextLevelTarget - totalOath, 0) : null;
        const isNearTarget = remaining !== null && remaining < 500;
        const handleSaveMerc = () => {
          const lv = parseInt(mercLevelInput) || 1;
          const tgt = parseInt(mercTargetInput.replace(/,/g, '')) || 0;
          setMercLevel(lv);
          setMercNextLevelTarget(tgt);
          const newMerc = { level: lv, target: tgt };
          localStorage.setItem('DNF_MERC', JSON.stringify(newMerc));
          if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, optsRef.current, newMerc, true);
        };
        return (
          <section className='glass-panel' style={{ minHeight: '60vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>?îÔ∏è ?©Î≥ë???àÎ≤®</h2>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1rem 1.2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem' }}>?ÑÏû¨ ?àÎ≤®</div>
                  <input type='number' min='1' value={mercLevelInput} onChange={e => setMercLevelInput(e.target.value)} placeholder='?? 6' style={{ width: '80px', padding: '0.4rem 0.6rem', textAlign: 'center' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem' }}>?§Ïùå ?àÎ≤® Î™©Ìëú ?¨Ïù∏??/div>
                  <input type='text' value={mercTargetInput} onChange={e => setMercTargetInput(e.target.value)} placeholder='?? 30000' style={{ width: '130px', padding: '0.4rem 0.6rem', textAlign: 'center' }} />
                </div>
                <button onClick={handleSaveMerc} style={{ padding: '0.4rem 1rem', background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer' }}>?Ä??/button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(234,179,8,0.1))', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '12px', padding: '1.2rem 2rem', textAlign: 'center', minWidth: '140px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.4rem' }}>?ÑÏû¨ ?àÎ≤®</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fb923c', lineHeight: 1 }}>Lv.{mercLevel}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem' }}>??Lv.{mercLevel + 1} ?ÑÏ†Ñ Ï§?/div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.2rem 1.5rem', minWidth: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>?úÏïΩ Ï¥ùÌï©</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: isNearTarget ? '#fef08a' : '#e2e8f0', marginLeft: '0.6rem' }}>{totalOath.toLocaleString()}</span>
                    {hasTarget && <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.4rem' }}>/ {mercNextLevelTarget.toLocaleString()}</span>}
                  </div>
                  {remaining !== null && (
                    <div style={{ fontSize: '0.7rem', color: isNearTarget ? '#fef08a' : '#fb923c', fontWeight: isNearTarget ? 'bold' : 'normal' }}>
                      {isNearTarget ? '?î•' : '?ìà'} {remaining === 0 ? 'Î™©Ìëú ?¨ÏÑ±!' : `${remaining.toLocaleString()} Î∂ÄÏ°?}
                    </div>
                  )}
                </div>
                {hasTarget && (
                  <div>
                    <div style={{ height: '18px', background: 'rgba(255,255,255,0.07)', borderRadius: '9px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ height: '100%', width: `${progress}%`, borderRadius: '9px', background: progress >= 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : isNearTarget ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#fb923c,#f97316)', transition: 'width 0.6s ease', boxShadow: isNearTarget ? '0 0 10px rgba(251,191,36,0.5)' : '0 0 8px rgba(251,146,60,0.4)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.7rem', color: '#64748b' }}>
                      <span>Lv.{mercLevel}</span>
                      <span style={{ color: isNearTarget ? '#fbbf24' : '#fb923c', fontWeight: 'bold' }}>{progress.toFixed(1)}%</span>
                      <span>Lv.{mercLevel + 1}</span>
                    </div>
                  </div>
                )}
                {!hasTarget && <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>?∞Ï∏° ?ÅÎã® ?§Ï†ï?êÏÑú ?ÑÏû¨ ?àÎ≤®Í≥??§Ïùå ?àÎ≤® Î™©Ìëú ?¨Ïù∏?∏Î? ?ÖÎ†•?òÏÑ∏??</p>}
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                Ï∫êÎ¶≠?∞Î≥Ñ ?úÏïΩ Í∏∞Ïó¨??<span style={{ fontSize: '0.7rem', color: '#64748b' }}>(?±Î°ù???ÅÏúÑ 20Í∞?</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {top20.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Ï∫êÎ¶≠?∞Î? Î®ºÏ? Ï∂îÍ??¥Ï£º?∏Ïöî.</div>
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
              {characters.length > 20 && <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.8rem', textAlign: 'center' }}>* ?±Î°ù??{characters.length}Í∞?Ï∫êÎ¶≠??Ï§??ÅÏúÑ 20Í∞úÎßå Í≥ÑÏÇ∞???¨Ìï®?©Îãà??</p>}
            </div>
          </section>
        );
      })()}

      {activeTab === 'pilgrimage' && (() => {
        const getCharForm = (id) => pilgrimageForm[id] || { 
          selected: false, startFatigue: '', pureGold: '',
          seal: '', condensedCore: '', crystal: '', flawlessCore: '', flawlessCrystal: '',
          sealVoucher: '', tradableSeal: '', sealVoucherBox: '', memo: '',
          secretTokens: [],
          secretRecipes: [],
          customItems: [],
          usePotion: false
        };
        
        const updateCharForm = (id, field, value) => {
          setPilgrimageForm(prev => ({
            ...prev,
            [id]: { ...getCharForm(id), [field]: value }
          }));
        };

        const togglePilgrimageChar = (id) => {
          updateCharForm(id, 'selected', !getCharForm(id).selected);
        };

        const applyGlobalFatigue = () => {
          const updated = { ...pilgrimageForm };
          characters.forEach(c => {
             updated[c.id] = { ...getCharForm(c.id), startFatigue: globalStartFatigue };
          });
          setPilgrimageForm(updated);
        };
        
        const fetchAuctionPrices = async () => {
           if (!apiKey) { alert("API ?§Í? ?ÑÏöî?©Îãà??"); return; }
           setIsFetchingPrices(true);
           try {
             // Collect custom item names from all characters
             const customNames = new Set();
             characters.forEach(c => {
               const form = getCharForm(c.id);
               (form.customItems || []).forEach(item => {
                 if (item.name && item.name.trim()) customNames.add(item.name.trim());
               });
             });
             const baseItems = ['Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥', 'Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?, '?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú', '?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä??', '?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?1Í∞??ÅÏûê', '?ºÎ°ú ?åÎ≥µ???ÅÏïΩ', '?àÏ†Ñ?îÎ¶¨ ?åÏö∏ Í≤∞Ï†ï', '?êÌîΩ ?åÏö∏ Í≤∞Ï†ï'];
             const allItemNames = [...baseItems, ...Array.from(customNames)];
             const res = await fetch('/api/auction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey, itemNames: allItemNames })
             });
             const data = await res.json();
             if (data.success) {
                setAuctionPrices(prev => ({ ...prev, ...data.data }));
                // Update custom item prices in all character forms
                const updatedForm = { ...pilgrimageForm };
                characters.forEach(c => {
                  const form = getCharForm(c.id);
                  const items = form.customItems || [];
                  if (items.length > 0) {
                    const updatedItems = items.map(item => {
                      if (item.name && data.data[item.name] !== undefined) {
                        return { ...item, price: data.data[item.name] };
                      }
                      return item;
                    });
                    updatedForm[c.id] = { ...form, customItems: updatedItems };
                  }
                });
                setPilgrimageForm(updatedForm);
                alert("Í≤ΩÎß§???úÏÑ∏Î•??±Í≥µ?ÅÏúºÎ°?Î∂àÎü¨?îÏäµ?àÎã§!");
             } else {
                alert("Î∂àÎü¨?§Í∏∞ ?§Ìå®: " + data.error);
             }
           } catch(e) {
             console.error(e);
             alert("Í≤ΩÎß§??API ?∞Îèô Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
           }
           setIsFetchingPrices(false);
        };
         const addCharToken = (charId, initialPrice = '') => {
            const form = getCharForm(charId);
            const mPrice = auctionPrices['?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú'] || 0;
            updateCharForm(charId, 'secretTokens', [...form.secretTokens, { id: Date.now(), buyPrice: initialPrice, sellPrice: mPrice }]);
         };
        const updateCharToken = (charId, tokenId, field, val) => {
            const form = getCharForm(charId);
            updateCharForm(charId, 'secretTokens', form.secretTokens.map(t => t.id === tokenId ? { ...t, [field]: val } : t));
         };
        const removeCharToken = (charId, tokenId) => {
           const form = getCharForm(charId);
           updateCharForm(charId, 'secretTokens', form.secretTokens.filter(t => t.id !== tokenId));
        };

        const addCharRecipe = (charId) => {
           const form = getCharForm(charId);
           updateCharForm(charId, 'secretRecipes', [...form.secretRecipes, { id: Date.now(), buyPrice: '', sealCost: '', sellPrice: '' }]);
        };
        const updateCharRecipe = (charId, recipeId, field, val) => {
           const form = getCharForm(charId);
           updateCharForm(charId, 'secretRecipes', form.secretRecipes.map(r => r.id === recipeId ? { ...r, [field]: val } : r));
        };
        const removeCharRecipe = (charId, recipeId) => {
           const form = getCharForm(charId);
           updateCharForm(charId, 'secretRecipes', form.secretRecipes.filter(r => r.id !== recipeId));
        };

        const handleSavePilgrimage = () => {
          const selectedIds = characters.filter(c => getCharForm(c.id).selected).map(c => c.id);
          if (selectedIds.length === 0) {
            alert('??Ï∫êÎ¶≠?∞Î? ?òÎÇò ?¥ÏÉÅ ?†ÌÉù?¥Ï£º?∏Ïöî.');
            return;
          }
          
          const recordDetails = selectedIds.map(id => {
            const c = characters.find(char => char.id === id);
            const form = getCharForm(id);
            const fatigue = Number(form.startFatigue || 0);
            const runs = fatigue > 0 ? Math.ceil(fatigue / 8) + (form.usePotion ? 4 : 0) : 0;
            
            // Í∑Ä?çÏû¨??Í∞ÄÏπ??∞Ï∂ú
            const sealValue = Number(form.seal || 0) * 5000;
            const boundCoreValue = Number(form.condensedCore || 0) * (auctionPrices['Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥'] || 0);
            const boundCrystalValue = Number(form.crystal || 0) * (auctionPrices['Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?] || 0);
            
            let customTradableValue = 0;
            (form.customItems || []).forEach(item => {
              const price = Number(item.price || 0) || (auctionPrices[item.name] || 0);
              customTradableValue += Number(item.quantity || 0) * price;
            });

            const totalBoundValue = sealValue + boundCoreValue + boundCrystalValue;
            
            // ÍµêÌôò Í∞Ä?•Ïû¨??Í∞ÄÏπ??∞Ï∂ú (Î≥¥Ï†ï ??
            const pureGoldInput = Number(form.pureGold || 0);
            const tradableCoreValue = Number(form.flawlessCore || 0) * (auctionPrices['Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥'] || 0);
            const tradableCrystalValue = Number(form.flawlessCrystal || 0) * (auctionPrices['Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?] || 0);
            
            // ?∏Ïû• ÍµêÌôòÍ∂?Î∞?ÍµêÌôò Í∞Ä???∏Ïû• Í∞ÄÏπ??∞Ï∂ú
            const priceTradableSeal = auctionPrices['?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä??'] || 0;
            const priceVoucherBox = auctionPrices['?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?1Í∞??ÅÏûê'] || 0;
            const voucherProfitPerItem = Math.max(0, (3 * priceTradableSeal) - 75000);
            const voucherProfitTotal = Number(form.sealVoucher || 0) * voucherProfitPerItem;
            const tradableSealValue = Number(form.tradableSeal || 0) * priceTradableSeal;
            const voucherBoxValue = Number(form.sealVoucherBox || 0) * priceVoucherBox;

            // ?åÎ™®?¨Ìôî ÎπÑÏö© ?∞Ï∂ú
            const tokenCost = runs * (auctionPrices['?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú'] || 0);
            const potionCost = form.usePotion ? (auctionPrices['?ºÎ°ú ?åÎ≥µ???ÅÏïΩ'] || 0) : 0;
            const totalConsumedValue = tokenCost + potionCost + recipeSealCost + recipeSoulCrystalCost;
            
            // ÎπÑÎ??ÅÏ†ê Í∞ÄÏπ??∞Ï∂ú (Ï∫êÎ¶≠?∞Î≥Ñ)
            const tokenPrice = auctionPrices['?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú'] || 0;
            let tokenProfit = 0;
            let secretShopGoldSpent = 0;
            let secretShopRewardValue = 0;

            (form.secretTokens || []).forEach(t => {
                       const bp = Number(t.buyPrice || 0);
                       const sp = Number(t.sellPrice || 0);
                       if (bp > 0 || sp > 0) {
                          secretShopGoldSpent += bp;
                          secretShopRewardValue += sp;
                          tokenProfit += (sp - bp);
                       }
                     });

            let recipeProfit = 0;
            let recipeSealCost = 0;
            let recipeSoulCrystalCost = 0;
            let recipeGiftRewardValue = 0;
            
            (form.secretRecipes || []).forEach(r => {
                        const bp = Number(r.buyPrice || 0);
                        if (r.type === 'shinyGift') {
                           const matPrice = auctionPrices['?àÏ†Ñ?îÎ¶¨ ?åÏö∏ Í≤∞Ï†ï'] || 0;
                           const rewardVal = 5 * tokenPrice;
                           if (bp > 0 || matPrice > 0) {
                              secretShopGoldSpent += bp;
                              recipeSoulCrystalCost += matPrice;
                              recipeGiftRewardValue += rewardVal;
                              secretShopRewardValue += rewardVal;
                              recipeProfit += (rewardVal - bp - matPrice);
                           }
                        } else if (r.type === 'brilliantGift') {
                           const matPrice = auctionPrices['?êÌîΩ ?åÏö∏ Í≤∞Ï†ï'] || 0;
                           const rewardVal = 20 * tokenPrice;
                           if (bp > 0 || matPrice > 0) {
                              secretShopGoldSpent += bp;
                              recipeSoulCrystalCost += matPrice;
                              recipeGiftRewardValue += rewardVal;
                              secretShopRewardValue += rewardVal;
                              recipeProfit += (rewardVal - bp - matPrice);
                           }
                        } else {
                           const seals = Number(r.sealCost || 0);
                           const sp = Number(r.sellPrice || 0);
                           if (bp > 0 || sp > 0) {
                             if (bp > 0) secretShopGoldSpent += bp;
                             const sealVal = seals * 5000;
                             recipeSealCostValue += sealVal;
                             secretShopRewardValue += sp;
                             recipeProfit += (sp - bp - sealVal);
                           }
                        }
                     });

            // ??Í≥®Îìú Î≥¥Ï†ï (?ÅÏ†ê ÏßÄÏ∂úÏï° Î≥µÏõê)
            const restoredPureGold = pureGoldInput;

            // ÏµúÏ¢Ö ÍµêÌôò Í∞Ä?•Ïû¨??Í∞ÄÏπ?(Î≥¥Ï†ï???úÍ≥®??+ ÏΩîÏñ¥/Í≤∞Ï†ïÏ≤?+ ?∏Ïû•Î•??òÏùµ + ?ÅÏ†ê ?úÏàò??+ Ïª§Ïä§?Ä)
            const finalTradableValue = restoredPureGold + tradableCoreValue + tradableCrystalValue + voucherProfitTotal + tradableSealValue + voucherBoxValue + secretShopRewardValue + customTradableValue;
            const finalBoundValue = totalBoundValue - recipeSealCost;
            const totalProfit = finalBoundValue + finalTradableValue - totalConsumedValue;

            return {
              charId: id,
              charName: c ? c.base.charName : '?????ÜÏùå',
              jobName: c ? c.base.jobGrowName : '',
              startFatigue: form.startFatigue,
              runs,
              acquired: {
                pureGold: form.pureGold,
                seal: form.seal,
                                condensedCore: form.condensedCore,
                crystal: form.crystal,
                flawlessCore: form.flawlessCore,
                flawlessCrystal: form.flawlessCrystal,
                sealVoucher: form.sealVoucher,
                tradableSeal: form.tradableSeal,
                sealVoucherBox: form.sealVoucherBox
              },
              consumed: {
                token: runs,
                potion: form.usePotion === true ? 1 : 0
              },
              memo: form.memo || '',
              customItems: form.customItems || [],
              customTradableValue,
              secretShop: {
                tokens: form.secretTokens,
                recipes: form.secretRecipes,
                tokenProfit,
                recipeProfit,
                recipeSealCost
              },
              values: {
                bound: finalBoundValue,
                tradable: finalTradableValue,
                consumed: totalConsumedValue,
                potionCost: potionCost,
                profit: totalProfit
              }
            };
          });

          let totalBound = recordDetails.reduce((acc, d) => acc + d.values.bound, 0);
          let totalTradable = recordDetails.reduce((acc, d) => acc + d.values.tradable, 0);
          const totalConsumed = recordDetails.reduce((acc, d) => acc + d.values.consumed, 0);
          const sessionProfit = totalBound + totalTradable - totalConsumed;

          const newRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            details: recordDetails,
            sessionTotals: {
              bound: totalBound,
              tradable: totalTradable,
              consumed: totalConsumed,
              profit: sessionProfit
            }
          };
          
          const updated = [newRecord, ...pilgrimageHistory];
          setPilgrimageHistory(updated);
          localStorage.setItem('DNF_PILGRIMAGE_HISTORY', JSON.stringify(updated));
          
          // ?†ÌÉù??Ï∫êÎ¶≠?∞Îì§ Ï¥àÍ∏∞??(?∞Ïù¥??Î¶¨ÏÖã Î∞??†ÌÉù ?¥Ï†ú)
          const resetForm = { ...pilgrimageForm };
          selectedIds.forEach(id => {
            resetForm[id] = {
              selected: false, 
              startFatigue: '', pureGold: '',
              seal: '', condensedCore: '', crystal: '', flawlessCore: '', flawlessCrystal: '',
              sealVoucher: '', tradableSeal: '', sealVoucherBox: '', memo: '',
              secretTokens: [],
              secretRecipes: [],
              customItems: [],
              usePotion: false
            };
          });
          setPilgrimageForm(resetForm);
          
          if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, optsRef.current, mercRef.current, true, updated);
        };

        const handleDeletePilgrimage = (id) => {
          if (!window.confirm("??Í∏∞Î°ù????†ú?òÏãúÍ≤†Ïäµ?àÍπå?")) return;
          const updated = pilgrimageHistory.filter(r => r.id !== id);
          setPilgrimageHistory(updated);
          localStorage.setItem('DNF_PILGRIMAGE_HISTORY', JSON.stringify(updated));
          
          if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, optsRef.current, mercRef.current, true, updated);
        };

        return (
          <section className='glass-panel' style={{ minHeight: '60vh' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>??Í¥ëÌúò???úÎ? Í∏∞Î°ù??/h2>
            
            {/* Global Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>?ºÍ¥Ñ ?ºÎ°ú??</label>
                  <input type="number" value={globalStartFatigue} onChange={e => setGlobalStartFatigue(Number(e.target.value))} style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem' }} />
                  <button onClick={applyGlobalFatigue} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8' }}>?ÅÏö©</button>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={fetchAuctionPrices} disabled={isFetchingPrices} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                      {isFetchingPrices ? 'Î∂àÎü¨?§Îäî Ï§?..' : '?®Í? ?àÎ°úÍ≥†Ïπ®'}
                    </button>
                    <button onClick={() => setShowAuctionPricesModal(true)} style={{ padding: '0.5rem 1rem', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                      ?®Í? ?ïÏù∏
                    </button>
                  </div>
                  <button onClick={handleSavePilgrimage} style={{ padding: '0.5rem 1.5rem', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', borderRadius: '4px', fontSize: '0.7rem' }}>?†ÌÉù Ï∫êÎ¶≠???Ä??/button>
                </div>
            </div>

            {/* Character Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
<h3 style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.8rem' }}>Ï∞∏Ïó¨ Ï∫êÎ¶≠???†ÌÉù (?¥Î¶≠?òÏó¨ Ï∂îÍ?/?úÍ±∞)</h3>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {getSortedCharacters(characters).map(c => {
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
                    <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>Ï∫êÎ¶≠??/th>
                    <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>?úÏûë ?ºÎ°ú??/th>
                    <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fbbf24', fontSize: '0.7rem' }}>?àÏÉÅ ?êÏàò</th>
                    <th rowSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4ade80', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>?¨Ìôî ?ÖÎ†•</th>
                    <th colSpan="9" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#4ade80', fontSize: '0.7rem' }}>?çÎìù ?¨Ìôî (Í∏∞Î°ù)</th>
                    <th colSpan="3" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5', fontSize: '0.7rem' }}>?åÎ™® ?¨Ìôî</th>
                    <th colSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontSize: '0.7rem' }}>?πÎ≥Ñ?ÅÏ†ê Í¥ÄÎ¶?/th>
                    <th colSpan="4" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fb923c', fontSize: '0.7rem' }}>Í∞ÄÏπ??∞Ï∂ú (Í≥®Îìú)</th>
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', lineHeight: '1.2' }}>
                    {/* ?çÎìù ?¨Ìôî (9) */}
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>??Í≥®Îìú</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>?úÎ???br/>?∏Ïû•</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>?úÎ????∏Ïû•<br/>(1??ÍµêÌôò Í∞Ä??</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>?úÎ????∏Ïû•<br/>(1??ÍµêÌôò Í∞Ä??<br/>ÍµêÌôòÍ∂?/th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>?úÎ????∏Ïû•<br/>(1??ÍµêÌôò Í∞Ä??<br/>ÍµêÌôòÍ∂?1Í∞??ÅÏûê</th>
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>?ëÏ∂ï??br/>?ºÏù¥??ÏΩîÏñ¥</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>Î¨¥Í≤∞??br/>?ºÏù¥??ÏΩîÏñ¥</th>
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>ÎπõÎÇò??Ï°∞Ìôî??br/>Í≤∞Ï†ïÏ≤?/th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>Î¨¥Í≤∞??Ï°∞Ìôî??br/>Í≤∞Ï†ïÏ≤?/th>
                    {/* ?åÎ™® ?¨Ìôî (3) */}
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5', fontSize: '0.7rem' }}>?≥ÏïÑÎ≤ÑÎ¶∞<br/>?úÎ???Ï¶ùÌëú</th>
                    <th style={{ padding: '0.2rem 0.1rem', color: '#fca5a5', fontSize: '0.7rem' }}>?ºÎ°ú ?åÎ≥µ??br/>?ÅÏïΩ</th>
                    <th style={{ padding: '0.2rem 0.1rem', color: '#fca5a5', fontSize: '0.7rem' }}>?πÎ≥Ñ?ÅÏ†ê<br/>ÏßÄÏ∂?/th>
                    {/* ?πÎ≥Ñ?ÅÏ†ê Í¥ÄÎ¶?(1 cell w/ cs2) */}
                    <th colSpan="2" style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontSize: '0.7rem' }}>?πÎ≥Ñ?ÅÏ†ê Í¥ÄÎ¶?/th>
                    {/* Í∞ÄÏπ??∞Ï∂ú (4) */}
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fb923c', fontSize: '0.7rem' }}>Í∑Ä??Í∞ÄÏπ?/th>
                    <th style={{ padding: '0.2rem 0.1rem', color: '#fb923c', fontSize: '0.7rem' }}>ÍµêÌôò Í∞ÄÏπ?/th>
                    <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>?úÏàò??br/>(Í∑Ä???¨Ìï®)</th>
                    <th style={{ padding: '0.2rem 0.1rem', color: '#38bdf8', fontSize: '0.7rem' }}>?úÏàò??br/>(Í∑Ä???úÏô∏)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const sortedAll = getSortedCharacters(characters);
                    const selectedChars = sortedAll.filter(c => getCharForm(c.id).selected);
                     if (selectedChars.length === 0) {
                       return (
                         <tr>
                           <td colSpan="21" style={{ padding: '2rem', color: 'var(--text-muted)' }}>?ÑÏóê??Ï∞∏Ïó¨??Ï∫êÎ¶≠?∞Î? ?†ÌÉù?¥Ï£º?∏Ïöî.</td>
                         </tr>
                       );
                     }

                     let countWithData = 0;
                     let sumFatigue = 0, sumRuns = 0;
                     let sumPureGold = 0, sumSeal = 0, sumCondensedCore = 0, sumCrystal = 0, sumFlawlessCore = 0, sumFlawlessCrystal = 0;
                     let sumSealVoucher = 0, sumTradableSeal = 0, sumSealVoucherBox = 0;
                     let sumTokens = 0, sumPotions = 0, sumSecretShopSpent = 0;
                     let sumBoundValue = 0, sumTradableValue = 0, sumTotalProfit = 0, sumProfitExclBound = 0;

                    const rows = selectedChars.map((c, idx) => {
                      const form = getCharForm(c.id);
                      
                      const hasLootData = (
                        (form.pureGold && form.pureGold !== '') ||
                        (form.seal && form.seal !== '') ||
                        (form.condensedCore && form.condensedCore !== '') ||
                        (form.crystal && form.crystal !== '') ||
                        (form.flawlessCore && form.flawlessCore !== '') ||
                        (form.flawlessCrystal && form.flawlessCrystal !== '') ||
                        (form.sealVoucher && form.sealVoucher !== '') ||
                        (form.sealVoucherBox && form.sealVoucherBox !== '') ||
                        (form.tradableSeal && form.tradableSeal !== '') ||
                        (form.customItems && form.customItems.length > 0)
                      );

                    const fatigue = Number(form.startFatigue || 0);
                    const runs = fatigue > 0 ? Math.ceil(fatigue / 8) + (form.usePotion ? 4 : 0) : 0;
                    const isSelected = form.selected;
                    const rowStyle = { borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(56, 189, 248, 0.08)' : (idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'), transition: 'background 0.2s' };
                    const inputStyle = { width: '55px', padding: '0.2rem 0.1rem', fontSize: '0.7rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };
                    
                    const sealValue = Number(form.seal || 0) * 5000;
                    const boundCoreValue = Number(form.condensedCore || 0) * (auctionPrices['Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥'] || 0);
                    const boundCrystalValue = Number(form.crystal || 0) * (auctionPrices['Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?] || 0);
                    
                    let customTradableValue = 0;
                    (form.customItems || []).forEach(item => {
                      const price = Number(item.price || 0) || (auctionPrices[item.name] || 0);
                      customTradableValue += Number(item.quantity || 0) * price;
                    });

                    const totalBoundValue = sealValue + boundCoreValue + boundCrystalValue;
                    
                    const pureGoldInput = Number(form.pureGold || 0);
                    const tradableCoreValue = Number(form.flawlessCore || 0) * (auctionPrices['Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥'] || 0);
                    const tradableCrystalValue = Number(form.flawlessCrystal || 0) * (auctionPrices['Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?] || 0);
                    
                    const priceTradableSeal = auctionPrices['?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä??'] || 0;
                    const priceVoucherBox = auctionPrices['?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?1Í∞??ÅÏûê'] || 0;
                    const voucherProfitPerItem = Math.max(0, (3 * priceTradableSeal) - 75000);
                    const voucherProfitTotal = Number(form.sealVoucher || 0) * voucherProfitPerItem;
                    const tradableSealValue = Number(form.tradableSeal || 0) * priceTradableSeal;
                    const voucherBoxValue = Number(form.sealVoucherBox || 0) * priceVoucherBox;
                    
                    const tokenCost = runs * (auctionPrices['?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú'] || 0);
                    const potionCost = form.usePotion ? (auctionPrices['?ºÎ°ú ?åÎ≥µ???ÅÏïΩ'] || 0) : 0;

                    const tokenPrice = auctionPrices['?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú'] || 0;
                    let secretShopGoldSpent = 0;
                     let secretShopRewardValue = 0;
                     let secretShopCostValue = 0;
                     let recipeSealCostValue = 0;
                     let tokenProfit = 0;
                     let recipeProfit = 0;
                     let recipeSoulCrystalCost = 0;
                     let recipeGiftRewardValue = 0;
                    
                    (form.secretTokens || []).forEach(t => {
                       const bp = Number(t.buyPrice || 0);
                       const sp = Number(t.sellPrice || 0);
                       if (bp > 0 || sp > 0) {
                          secretShopGoldSpent += bp;
                          secretShopRewardValue += sp;
                          tokenProfit += (sp - bp);
                       }
                     });

                    (form.secretRecipes || []).forEach(r => {
                        const bp = Number(r.buyPrice || 0);
                        if (r.type === 'shinyGift') {
                           const matPrice = auctionPrices['?àÏ†Ñ?îÎ¶¨ ?åÏö∏ Í≤∞Ï†ï'] || 0;
                           const rewardVal = 5 * tokenPrice;
                           if (bp > 0 || matPrice > 0) {
                              secretShopGoldSpent += bp;
                              recipeSoulCrystalCost += matPrice;
                              recipeGiftRewardValue += rewardVal;
                              secretShopRewardValue += rewardVal;
                              recipeProfit += (rewardVal - bp - matPrice);
                           }
                        } else if (r.type === 'brilliantGift') {
                           const matPrice = auctionPrices['?êÌîΩ ?åÏö∏ Í≤∞Ï†ï'] || 0;
                           const rewardVal = 20 * tokenPrice;
                           if (bp > 0 || matPrice > 0) {
                              secretShopGoldSpent += bp;
                              recipeSoulCrystalCost += matPrice;
                              recipeGiftRewardValue += rewardVal;
                              secretShopRewardValue += rewardVal;
                              recipeProfit += (rewardVal - bp - matPrice);
                           }
                        } else {
                           const seals = Number(r.sealCost || 0);
                           const sp = Number(r.sellPrice || 0);
                           if (bp > 0 || sp > 0) {
                             if (bp > 0) secretShopGoldSpent += bp;
                             const sealVal = seals * 5000;
                             recipeSealCostValue += sealVal;
                             secretShopRewardValue += sp;
                             recipeProfit += (sp - bp - sealVal);
                           }
                        }
                     });

                    const totalConsumedValue = tokenCost + potionCost + recipeSealCostValue + recipeSoulCrystalCost;
                    const restoredPureGold = pureGoldInput;

                    // ÏµúÏ¢Ö ÍµêÌôò Í∞Ä?•Ïû¨??Í∞ÄÏπ?
                    const finalTradableValue = restoredPureGold + tradableCoreValue + tradableCrystalValue + voucherProfitTotal + tradableSealValue + voucherBoxValue + secretShopRewardValue + customTradableValue;
                    const finalBoundValue = totalBoundValue - recipeSealCostValue;
                    const totalProfit = finalBoundValue + finalTradableValue - totalConsumedValue;
                    
                    // ?©Í≥Ñ ?ÑÏ†Å (?ÖÎ†• ?∞Ïù¥?∞Í? ?àÏùÑ Í≤ΩÏö∞?êÎßå ?¨Ìï®)
                    if (hasLootData) {
                        countWithData++;
                        sumFatigue += fatigue;
                        sumRuns += runs;
                        sumPureGold += restoredPureGold;
                        sumSeal += Number(form.seal || 0);
                        sumCondensedCore += Number(form.condensedCore || 0);
                        sumCrystal += Number(form.crystal || 0);
                        sumFlawlessCore += Number(form.flawlessCore || 0);
                        sumFlawlessCrystal += Number(form.flawlessCrystal || 0);
                        sumSealVoucher += Number(form.sealVoucher || 0);
                        sumTradableSeal += Number(form.tradableSeal || 0);
                        sumSealVoucherBox += Number(form.sealVoucherBox || 0);
                        sumTokens += runs;
                        sumPotions += (form.usePotion === true ? 1 : 0);
                        sumBoundValue += finalBoundValue;
                        sumTradableValue += finalTradableValue;
                        sumTotalProfit += totalProfit;
                        sumProfitExclBound += (finalTradableValue - totalConsumedValue);
                    }

                        return (
                          <tr key={c.id} style={rowStyle}>
                            {/* 1 */} <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: '#38bdf8', cursor: 'pointer' }} onClick={() => togglePilgrimageChar(c.id)} title="?¥Î¶≠ ??Î™©Î°ù?êÏÑú ?úÍ±∞">
                              <span style={{ fontSize: '0.7rem' }}>{c.base.charName}</span> <span style={{fontSize: '0.7rem', color:'rgba(255,255,255,0.3)', fontWeight:'normal'}}>??/span>
                            </td>
                            {/* 2 */} <td style={{ padding: '0.2rem 0.1rem' }}><input type="number" style={inputStyle} value={form.startFatigue} onChange={e => updateCharForm(c.id, 'startFatigue', e.target.value)} /></td>
                            {/* 3 */} <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: '#fbbf24' }}>{runs}</td>
                            {/* 4 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                              <button onClick={() => setActiveLootModal({ charId: c.id })} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'rgba(74, 222, 128, 0.2)', border: '1px solid rgba(74, 222, 128, 0.4)', color: '#4ade80', borderRadius: '4px', cursor: 'pointer' }}>?¨Ìôî ?ÖÎ†•</button>
                            </td>
                            {/* 5 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }} title={secretShopGoldSpent > 0 ? `?í° ?ÅÏ†ê ÏßÄÏ∂úÏï°(${secretShopGoldSpent.toLocaleString()})??Î≥¥Ï†ï???§Ï†ú ?úÎûç Í≥®Îìú: ${restoredPureGold.toLocaleString()}` : ''}>{restoredPureGold > 0 ? restoredPureGold.toLocaleString() : '-'}</td>
                            {/* 6 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.seal > 0 ? Number(form.seal).toLocaleString() : '-'}</td>
                            {/* 7 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.tradableSeal > 0 ? Number(form.tradableSeal).toLocaleString() : '-'}</td>
                            {/* 8 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.sealVoucher > 0 ? Number(form.sealVoucher).toLocaleString() : '-'}</td>
                            {/* 9 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.sealVoucherBox > 0 ? Number(form.sealVoucherBox).toLocaleString() : '-'}</td>
                            {/* 10 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{form.condensedCore > 0 ? Number(form.condensedCore).toLocaleString() : '-'}</td>
                            {/* 11 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.flawlessCore > 0 ? Number(form.flawlessCore).toLocaleString() : '-'}</td>
                            {/* 12 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{form.crystal > 0 ? Number(form.crystal).toLocaleString() : '-'}</td>
                            {/* 13 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.flawlessCrystal > 0 ? Number(form.flawlessCrystal).toLocaleString() : '-'}</td>
                            
                            {/* 14 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5' }}>{runs > 0 ? runs : '-'}</td>
                            {/* 15 */} <td style={{ padding: '0.2rem 0.1rem', color: '#fca5a5' }}>
                              <button 
                                onClick={() => updateCharForm(c.id, 'usePotion', !form.usePotion)}
                                style={{ 
                                  padding: '0.1rem 0.3rem', 
                                  fontSize: '0.65rem', 
                                  background: form.usePotion ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255,255,255,0.05)', 
                                  border: form.usePotion ? '1px solid rgba(248, 113, 113, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                  color: form.usePotion ? '#f87171' : '#64748b',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                {form.usePotion ? '?¨Ïö©' : 'ÎØ∏ÏÇ¨??}
                              </button>
                            </td>
                            {/* 16 */} <td style={{ padding: '0.2rem 0.1rem', color: '#fca5a5' }}>{secretShopGoldSpent > 0 ? secretShopGoldSpent.toLocaleString() : '-'}</td>
                            
                             {/* 17-18 ?πÎ≥Ñ?ÅÏ†ê */} 
                             <td colSpan="2" style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', verticalAlign: 'middle' }}>
                               <button 
                                 onClick={() => setActiveSecretShopModal({ charId: c.id })} 
                                 style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'rgba(167, 139, 250, 0.2)', border: '1px solid rgba(167, 139, 250, 0.4)', color: '#a78bfa', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                               >
                                 ?πÎ≥Ñ?ÅÏ†ê Í¥ÄÎ¶?{((form.secretTokens?.length || 0) + (form.secretRecipes?.length || 0)) > 0 ? `(${(form.secretTokens?.length || 0) + (form.secretRecipes?.length || 0)})` : ''}
                               </button>
                             </td>


                            {/* 18 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', verticalAlign: 'middle' }}>{finalBoundValue > 0 ? finalBoundValue.toLocaleString() : '-'}</td>
                            {/* 19 */} <td style={{ padding: '0.2rem 0.1rem', color: '#e2e8f0', verticalAlign: 'middle' }}>{finalTradableValue > 0 ? finalTradableValue.toLocaleString() : '-'}</td>
                            {/* 20 */} <td 
                              style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: hasLootData ? ((finalBoundValue + finalTradableValue - totalConsumedValue) > 0 ? '#4ade80' : ((finalBoundValue + finalTradableValue - totalConsumedValue) < 0 ? '#f87171' : '#cbd5e1')) : '#94a3b8', verticalAlign: 'middle', cursor: hasLootData ? 'pointer' : 'default', textDecoration: hasLootData ? 'underline' : 'none' }}
                              onClick={() => hasLootData && setCalcDetail({
                                charName: c.base.charName,
                                items: {
                                  seal: Number(form.seal || 0),
                                  core: Number(form.condensedCore || 0),
                                  crystal: Number(form.crystal || 0),
                                  pureGold: Number(form.pureGold || 0),
                                  flawlessCore: Number(form.flawlessCore || 0),
                                  flawlessCrystal: Number(form.flawlessCrystal || 0),
                                  sealVoucher: Number(form.sealVoucher || 0),
                                  sealVoucherBox: Number(form.sealVoucherBox || 0),
                                  tradableSeal: Number(form.tradableSeal || 0),
                                  runs: runs
                                },
                                breakdown: {
                                  seal: sealValue,
                                  core: boundCoreValue,
                                  crystal: boundCrystalValue,
                                  flawlessCore: tradableCoreValue,
                                  flawlessCrystal: tradableCrystalValue,
                                  sealVoucher: voucherProfitTotal,
                                  sealVoucherBox: voucherBoxValue,
                                  tradableSeal: tradableSealValue,
                                  recipeProfit: recipeProfit,
                                  tokenProfit: tokenProfit,
                                  tokenCost: tokenCost,
                                  secretShopGoldSpent: secretShopGoldSpent,
                                  customTradable: customTradableValue,
                                  recipeSoulCrystalCost: recipeSoulCrystalCost,
                                  recipeGiftRewardValue: recipeGiftRewardValue
                                },
                                totals: {
                                  bound: finalBoundValue,
                                  tradable: finalTradableValue,
                                  consumed: totalConsumedValue
                                },
                                final: {
                                  includingBound: finalBoundValue + finalTradableValue - totalConsumedValue,
                                  excludingBound: finalTradableValue - totalConsumedValue
                                }
                              })}
                            >
                              {hasLootData ? ((finalBoundValue + finalTradableValue - totalConsumedValue) !== 0 ? (finalBoundValue + finalTradableValue - totalConsumedValue).toLocaleString() : '-') : '-'}
                            </td>
                            {/* 21 */} <td 
                              style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: hasLootData ? ((finalTradableValue - totalConsumedValue) > 0 ? '#38bdf8' : ((finalTradableValue - totalConsumedValue) < 0 ? '#f87171' : '#cbd5e1')) : '#94a3b8', verticalAlign: 'middle', cursor: hasLootData ? 'pointer' : 'default', textDecoration: hasLootData ? 'underline' : 'none' }}
                              onClick={() => hasLootData && setCalcDetail({
                                charName: c.base.charName,
                                items: {
                                  seal: Number(form.seal || 0),
                                  core: Number(form.condensedCore || 0),
                                  crystal: Number(form.crystal || 0),
                                  pureGold: Number(form.pureGold || 0),
                                  flawlessCore: Number(form.flawlessCore || 0),
                                  flawlessCrystal: Number(form.flawlessCrystal || 0),
                                  sealVoucher: Number(form.sealVoucher || 0),
                                  sealVoucherBox: Number(form.sealVoucherBox || 0),
                                  tradableSeal: Number(form.tradableSeal || 0),
                                  runs: runs
                                },
                                breakdown: {
                                  seal: sealValue,
                                  core: boundCoreValue,
                                  crystal: boundCrystalValue,
                                  flawlessCore: tradableCoreValue,
                                  flawlessCrystal: tradableCrystalValue,
                                  sealVoucher: voucherProfitTotal,
                                  sealVoucherBox: voucherBoxValue,
                                  tradableSeal: tradableSealValue,
                                  recipeProfit: recipeProfit,
                                  tokenProfit: tokenProfit,
                                  tokenCost: tokenCost,
                                  secretShopGoldSpent: secretShopGoldSpent,
                                  customTradable: customTradableValue,
                                  recipeSoulCrystalCost: recipeSoulCrystalCost,
                                  recipeGiftRewardValue: recipeGiftRewardValue
                                },
                                totals: {
                                  bound: finalBoundValue,
                                  tradable: finalTradableValue,
                                  consumed: totalConsumedValue
                                },
                                final: {
                                  includingBound: finalBoundValue + finalTradableValue - totalConsumedValue,
                                  excludingBound: finalTradableValue - totalConsumedValue
                                }
                              })}
                            >
                              {hasLootData ? ((finalTradableValue - totalConsumedValue) !== 0 ? (finalTradableValue - totalConsumedValue).toLocaleString() : '-') : '-'}
                            </td>
                            
                          </tr>
                        );
                     });

                     return (
                        <>
                          {rows}
                          <tr style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', borderTop: '2px solid rgba(255,255,255,0.2)' }}>
                            {/* 1 */} <td style={{ padding: '0.5rem', color: '#e2e8f0' }}>Ï¥ùÌï©Í≥?({countWithData})</td>
                            {/* 2 */} <td style={{ padding: '0.5rem', color: '#e2e8f0' }}>{sumFatigue > 0 ? sumFatigue : '-'}</td>
                            {/* 3 */} <td style={{ padding: '0.5rem', color: '#fbbf24' }}>{sumRuns > 0 ? sumRuns : '-'}</td>
                            {/* 4 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>-</td>
                            {/* 5 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }} title="ÎπÑÎ??ÅÏ†ê ÏßÄÏ∂úÏï°??Î≥¥Ï†ï???§Ï†ú ?úÎûç Í≥®Îìú??Ï¥ùÌï©">{sumPureGold > 0 ? sumPureGold.toLocaleString() : '-'}</td>
                            {/* 6 */} <td style={{ padding: '0.5rem' }}>{sumSeal > 0 ? sumSeal.toLocaleString() : '-'}</td>
                            {/* 7 */} <td style={{ padding: '0.5rem' }}>{sumTradableSeal > 0 ? sumTradableSeal.toLocaleString() : '-'}</td>
                            {/* 8 */} <td style={{ padding: '0.5rem' }}>{sumSealVoucher > 0 ? sumSealVoucher.toLocaleString() : '-'}</td>
                            {/* 9 */} <td style={{ padding: '0.5rem' }}>{sumSealVoucherBox > 0 ? sumSealVoucherBox.toLocaleString() : '-'}</td>
                            {/* 10 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{sumCondensedCore > 0 ? sumCondensedCore.toLocaleString() : '-'}</td>
                            {/* 11 */} <td style={{ padding: '0.5rem' }}>{sumFlawlessCore > 0 ? sumFlawlessCore.toLocaleString() : '-'}</td>
                            {/* 12 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{sumCrystal > 0 ? sumCrystal.toLocaleString() : '-'}</td>
                            {/* 13 */} <td style={{ padding: '0.5rem' }}>{sumFlawlessCrystal > 0 ? sumFlawlessCrystal.toLocaleString() : '-'}</td>
                            {/* ?åÎ™® ?¨Ìôî (3) */}
                            <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5' }}>{sumTokens > 0 ? sumTokens : '-'}</td>
                            <td style={{ padding: '0.5rem', color: '#fca5a5' }}>{sumPotions > 0 ? sumPotions : '-'}</td>
                            <td style={{ padding: '0.5rem', color: '#fca5a5' }}>{sumSecretShopSpent > 0 ? sumSecretShopSpent.toLocaleString() : '-'}</td>
                            {/* ?πÎ≥Ñ?ÅÏ†ê Í¥ÄÎ¶?(1 cell w/ cs2) */}
                            <td colSpan="2" style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', textAlign: 'center' }}>-</td>
                            {/* Í∞ÄÏπ??∞Ï∂ú (4) */}
                            <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fb923c' }}>{sumBoundValue > 0 ? sumBoundValue.toLocaleString() : '-'}</td>
                            <td style={{ padding: '0.5rem', color: '#fb923c' }}>{sumTradableValue > 0 ? sumTradableValue.toLocaleString() : '-'}</td>
                            <td style={{ padding: '0.5rem', color: sumTotalProfit > 0 ? '#4ade80' : (sumTotalProfit < 0 ? '#f87171' : '#cbd5e1') }}>{sumTotalProfit !== 0 ? sumTotalProfit.toLocaleString() : '-'}</td>
                            <td style={{ padding: '0.5rem', color: sumProfitExclBound > 0 ? '#38bdf8' : (sumProfitExclBound < 0 ? '#f87171' : '#cbd5e1') }}>{sumProfitExclBound !== 0 ? sumProfitExclBound.toLocaleString() : '-'}</td>
                            
                          </tr>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                              <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8' }}>?âÍ∑† (Ï∫êÎ¶≠?∞Îãπ)</td>
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
                     );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Secret Shop Modal */}
            
            <SecretShopModalComponent activeSecretShopModal={activeSecretShopModal} setActiveSecretShopModal={setActiveSecretShopModal} characters={characters} getCharForm={getCharForm} addCharToken={addCharToken} updateCharToken={updateCharToken} removeCharToken={removeCharToken} addCharRecipe={addCharRecipe} updateCharRecipe={updateCharRecipe} removeCharRecipe={removeCharRecipe} updateCharForm={updateCharForm} />

            {/* Auction Prices Modal */}
            
            <LootModalComponent activeLootModal={activeLootModal ? { ...activeLootModal, _pilgrimageHistory: pilgrimageHistory } : null} setActiveLootModal={setActiveLootModal} characters={characters} getCharForm={getCharForm} updateCharForm={updateCharForm} apiKey={apiKey} auctionPrices={auctionPrices} setAuctionPrices={setAuctionPrices} />
            
            
            {calcDetail && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
                    ?ìä ?ÅÏÑ∏ Í∞ÄÏπ??∞Ï∂ú ?¥Ïó≠ ({calcDetail.charName})
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem' }}>
                    {/* Bound Section */}
                    <div>
                      <h4 style={{ color: '#fb923c', marginBottom: '0.5rem', fontSize: '0.7rem' }}>?ì¶ Í∑Ä??Í∞ÄÏπ?(Bound)</h4>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>?úÎ????∏Ïû• ({calcDetail.items.seal}Í∞?</span>
                          <span>{calcDetail.breakdown.seal.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>?ëÏ∂ï???ºÏù¥??ÏΩîÏñ¥ ({calcDetail.items.core}Í∞?</span>
                          <span>{calcDetail.breakdown.core.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                          <span>ÎπõÎÇò??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?({calcDetail.items.crystal}Í∞?</span>
                          <span>{calcDetail.breakdown.crystal.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fb923c' }}>
                          <span>Í∑Ä???©Í≥Ñ</span>
                          <span>{calcDetail.totals.bound.toLocaleString()} G</span>
                        </div>
                      </div>
                    </div>

                    {/* Tradable Section */}
                    <div>
                      <h4 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontSize: '0.7rem' }}>?í∞ ÍµêÌôò Í∞Ä??Í∞ÄÏπ?(Tradable)</h4>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span title="?†Ï? ?ÖÎ†•Í∞?>??Í≥®Îìú (?ÖÎ†•Í∞?</span>
                          <span>{calcDetail.items.pureGold.toLocaleString()} G</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥ ({calcDetail.items.flawlessCore}Í∞?</span>
                          <span>{calcDetail.breakdown.flawlessCore.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?({calcDetail.items.flawlessCrystal}Í∞?</span>
                          <span>{calcDetail.breakdown.flawlessCrystal.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂??òÏùµ ({calcDetail.items.sealVoucher}Í∞?</span>
                          <span>{calcDetail.breakdown.sealVoucher.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?1Í∞??ÅÏûê ({calcDetail.items.sealVoucherBox}Í∞?</span>
                          <span>{calcDetail.breakdown.sealVoucherBox.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ({calcDetail.items.tradableSeal}Í∞?</span>
                          <span>{calcDetail.breakdown.tradableSeal.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>ÎπÑÎ??ÅÏ†ê ?àÏãú???òÏùµ</span>
                                          <span>{calcDetail.breakdown.recipeProfit.toLocaleString()} G</span>
                                        </div>
                                        {(calcDetail.breakdown.recipeSoulCrystalCost > 0 || calcDetail.breakdown.recipeGiftRewardValue > 0) && (
                                          <div style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', marginTop: '0.2rem', marginBottom: '0.5rem', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                              <span>???µÎ????åÏö∏ Í≤∞Ï†ï ?åÎ™®</span>
                                              <span>-{calcDetail.breakdown.recipeSoulCrystalCost.toLocaleString()} G</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                              <span>???µÎ???Ï¶ùÌëú Î≥¥ÏÉÅ Í∞ÄÏπ?/span>
                                              <span>+{calcDetail.breakdown.recipeGiftRewardValue.toLocaleString()} G</span>
                                            </div>
                                          </div>
                                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                          <span>ÎπÑÎ??ÅÏ†ê ?∏Ïû• Íµ¨Îß§ ?¥Îìù (?êÎß§Í∞Ä - Íµ¨Îß§Í∞Ä)</span>
                           <span>{calcDetail.breakdown.tokenProfit.toLocaleString()} G</span>
                        </div>
                        {calcDetail.breakdown.customTradable > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                            <span>Ïª§Ïä§?Ä Ï∂îÍ? ??™© (ÍµêÌôò)</span>
                            <span>{calcDetail.breakdown.customTradable.toLocaleString()} G</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#38bdf8' }}>
                          <span>ÍµêÌôò Í∞Ä???©Í≥Ñ</span>
                          <span>{calcDetail.totals.tradable.toLocaleString()} G</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Section */}
                    <div>
                      <h4 style={{ color: '#f87171', marginBottom: '0.5rem', fontSize: '0.7rem' }}>?ìâ ?åÎ™® ÎπÑÏö© (Costs)</h4>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                          <span>?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú ?åÎ™® ({calcDetail.items.runs}Í∞?</span>
                          <span>-{calcDetail.breakdown.tokenCost.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#f87171' }}>
                          <span>?åÎ™® ?©Í≥Ñ</span>
                          <span>-{calcDetail.totals.consumed.toLocaleString()} G</span>
                        </div>
                      </div>
                    </div>

                    {/* Final Results */}
                    <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.5rem' }}>
                        <span>?úÏàò??(Í∑Ä???úÏô∏)</span>
                        <span>{calcDetail.final.excludingBound.toLocaleString()} G</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', color: '#4ade80' }}>
                        <span>?úÏàò??(Í∑Ä???¨Ìï®)</span>
                        <span>{calcDetail.final.includingBound.toLocaleString()} G</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.8rem', fontStyle: 'italic', textAlign: 'right' }}>
                        * ?úÏàò??Í∑Ä???úÏô∏) = ÍµêÌôò Í∞Ä???©Í≥Ñ - ?åÎ™® ?©Í≥Ñ (ÎπÑÎ??ÅÏ†ê Íµ¨Îß§ ÎπÑÏö©?Ä ?¥Î? ??Í≥®Îìú??Î∞òÏòÅ?òÏñ¥ ?àÏäµ?àÎã§)<br/>
                        * ?úÏàò??Í∑Ä???¨Ìï®) = Í∑Ä???©Í≥Ñ + ÍµêÌôò Í∞Ä???©Í≥Ñ - ?åÎ™® ?©Í≥Ñ
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setCalcDetail(null)} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>?ïÏù∏</button>
                  </div>
                </div>
              </div>
            )}
            {showAuctionPricesModal && (() => {
              const baseItems = ['Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥', 'Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?, '?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú', '?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä??', '?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?1Í∞??ÅÏûê', '?ºÎ°ú ?åÎ≥µ???ÅÏïΩ', '?àÏ†Ñ?îÎ¶¨ ?åÏö∏ Í≤∞Ï†ï', '?êÌîΩ ?åÏö∏ Í≤∞Ï†ï'];
              return (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '500px', width: '90%' }}>
                   <h3 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     ?ñÔ∏è ?ÑÏû¨ ?ÅÏö©??Í≤ΩÎß§???®Í?
                   </h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                     {Object.entries(auctionPrices).map(([name, price]) => {
                       const isBase = baseItems.includes(name);
                       return (
                        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                          <span style={{ flex: 1, color: '#cbd5e1', fontSize: '0.75rem' }}>{name}</span>
                          <input type="number" value={price} onChange={e => {
                            setAuctionPrices(prev => ({ ...prev, [name]: Number(e.target.value) || 0 }));
                          }} style={{ width: '90px', padding: '0.3rem 0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fbbf24', borderRadius: '4px', textAlign: 'right', fontWeight: 'bold' }} />
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>G</span>
                          {!isBase && (
                            <button onClick={() => {
                              setAuctionPrices(prev => {
                                const next = { ...prev };
                                delete next[name];
                                return next;
                              });
                            }} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 0.2rem', flexShrink: 0 }} title="Î™©Î°ù?êÏÑú ??†ú">√ó</button>
                          )}
                          {isBase && <span style={{ width: '1.2rem' }}></span>}
                        </div>
                       );
                     })}
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowAuctionPricesModal(false)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>?´Í∏∞</button>
                   </div>
                </div>
              </div>
              );
            })()}

            <h3 style={{ fontSize: '1.1rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>?àÏä§?†Î¶¨</h3>
            {pilgrimageHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>?ÑÏßÅ ?±Î°ù??Í∏∞Î°ù???ÜÏäµ?àÎã§.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pilgrimageHistory.map(record => (
                  <div key={record.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>?ìÖ {new Date(record.date).toLocaleString()}</span>
                      <button className="danger" onClick={() => handleDeletePilgrimage(record.id)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>Í∏∞Î°ù ??†ú</button>
                    </div>
                    <div style={{ overflowX: 'auto', padding: '1rem' }}>
                       {record.chars ? (
                         <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                           [Íµ¨Î≤Ñ??Í∏∞Î°ù] Ï∫êÎ¶≠?? {record.chars.join(', ')} / ?çÎìù: {record.acquired} / ?åÎ™®: {record.consumed}
                         </div>
                       ) : (
                         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                           <thead>
                             <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>
                               <th style={{ padding: '0.2rem 0.1rem', textAlign: 'left', fontSize: '0.7rem' }}>Ï∫êÎ¶≠??/th>
                               <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>?ºÎ°ú???êÏàò)</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>??Í≥®Îìú</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>?úÎ????∏Ïû•</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä??</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?/th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?1Í∞??ÅÏûê</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>?ëÏ∂ï???ºÏù¥??ÏΩîÏñ¥</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>ÎπõÎÇò??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?/th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?/th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#fb923c', fontSize: '0.7rem' }}>Í∑Ä??Í∞ÄÏπ?/th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#fb923c', fontSize: '0.7rem' }}>ÍµêÌôò Í∞ÄÏπ?/th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>?úÏàò??br/>(Í∑Ä???¨Ìï®)</th>
                                <th style={{ padding: '0.2rem 0.1rem', color: '#38bdf8', fontSize: '0.7rem' }}>?úÏàò??br/>(Í∑Ä???úÏô∏)</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#94a3b8', fontSize: '0.7rem' }}>Î©îÎ™®</th>
                             </tr>
                           </thead>
                           <tbody>
                             {record.details.map((d, i) => {
                               let profit = d.values?.profit || 0;
                               let bound = d.values?.bound || 0;
                               let tradable = d.values?.tradable || 0;
                               const consumed = d.values?.consumed || 0;
                               
                               // Íµ¨Î≤Ñ??Í∏∞Î°ù Î≥¥Ï†ï: ?ÅÏïΩ ?åÎ™® ÎπÑÏö©???ÑÎùΩ??Í≤ΩÏö∞ ?ÑÏû¨ ?®Í?Î°?Ï∞®Í∞ê
                               if (d.consumed?.potion > 0 && d.values?.potionCost === undefined) {
                                 const pPrice = auctionPrices['?ºÎ°ú ?åÎ≥µ???ÅÏïΩ'] || 0;
                                 tradable -= pPrice;
                                 profit -= pPrice;
                               }
                               
                               const profitExclBound = tradable - consumed;
                               
                               return (
                                 <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                   <td style={{ padding: '0.25rem', color: '#e2e8f0', fontWeight: 'bold', textAlign: 'left', fontSize: '0.7rem' }}>{d.charName}</td>
                                   <td style={{ padding: '0.4rem' }}>{d.startFatigue} <span style={{ color: '#fbbf24' }}>({d.runs}??</span></td>
                                   <td style={{ padding: '0.25rem', color: d.acquired.pureGold ? '#fff' : '#64748b' }}>{d.acquired.pureGold ? Number(d.acquired.pureGold).toLocaleString() : '-'}</td>
                                   <td style={{ padding: '0.25rem', color: d.acquired.seal ? '#fff' : '#64748b' }}>{d.acquired.seal || '-'}</td>
                                   <td style={{ padding: '0.25rem', color: d.acquired.tradableSeal ? '#fff' : '#64748b' }}>{d.acquired.tradableSeal || '-'}</td>
                                   <td style={{ padding: '0.25rem', color: d.acquired.sealVoucher ? '#fff' : '#64748b' }}>{d.acquired.sealVoucher || '-'}</td>
                                   <td style={{ padding: '0.25rem', color: Number(d.acquired.sealVoucherBox || 0) > 0 ? '#fff' : '#64748b' }}>{d.acquired.sealVoucherBox || '-'}</td>
                                   <td style={{ padding: '0.25rem', color: d.acquired.condensedCore ? '#fff' : '#64748b' }}>{d.acquired.condensedCore || '-'}</td>
                                   <td style={{ padding: '0.25rem', color: d.acquired.flawlessCore ? '#fff' : '#64748b' }}>{d.acquired.flawlessCore || '-'}</td>
                                   <td style={{ padding: '0.25rem', color: d.acquired.crystal ? '#fff' : '#64748b' }}>{d.acquired.crystal || '-'}</td>
                                   <td style={{ padding: '0.25rem', color: d.acquired.flawlessCrystal ? '#fff' : '#64748b' }}>{d.acquired.flawlessCrystal || '-'}</td>
                                   <td style={{ padding: '0.25rem', color: bound > 0 ? '#fb923c' : '#64748b' }}>{bound > 0 ? bound.toLocaleString() : '-'}</td>
                                   <td style={{ padding: '0.25rem', color: tradable > 0 ? '#fb923c' : '#64748b' }}>{tradable > 0 ? tradable.toLocaleString() : '-'}</td>
                                   <td style={{ padding: '0.25rem', fontWeight: 'bold', color: profit > 0 ? '#4ade80' : (profit < 0 ? '#f87171' : '#64748b') }}>{profit !== 0 ? profit.toLocaleString() : '-'}</td>
                                   <td style={{ padding: '0.25rem', fontWeight: 'bold', color: profitExclBound > 0 ? '#38bdf8' : (profitExclBound < 0 ? '#f87171' : '#64748b') }}>{profitExclBound !== 0 ? profitExclBound.toLocaleString() : '-'}</td>
                                   <td style={{ padding: '0.4rem', color: '#cbd5e1', textAlign: 'left', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.memo || ''}>{d.memo || '-'}</td>
                                 </tr>
                               );
                             })}
                           </tbody>
                         </table>
                       )}
                       {record.sessionTotals && (
                         <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
                             <div style={{ flex: 1, minWidth: '200px' }}>
                               <h5 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.7rem' }}>ÎπÑÎ??ÅÏ†ê ?ïÏÇ∞ ?¥Ïó≠</h5>
                               <div style={{ fontSize: '0.7rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                 <div>- ?≥ÏïÑÎ≤ÑÎ¶∞ ?úÎ???Ï¶ùÌëú Íµ¨Îß§ ?¥Îìù (ÍµêÌôò Í∞ÄÏπ?Î∞òÏòÅ): <span style={{ color: '#4ade80' }}>+{record.sessionTotals.tokenProfit?.toLocaleString() || 0}</span></div>
                                 <div>- ?àÏãú???úÏàò??(ÍµêÌôò Í∞ÄÏπ?Î∞òÏòÅ): <span style={{ color: '#4ade80' }}>+{record.sessionTotals.recipeProfit?.toLocaleString() || 0}</span></div>
                                 <div>- ?àÏãú???úÎ????∏Ïû• ?åÎ™® ÎπÑÏö© (Í∑Ä??Í∞ÄÏπ?Ï∞®Í∞ê): <span style={{ color: '#f87171' }}>-{record.sessionTotals.recipeSealCost?.toLocaleString() || 0}</span></div>
                               </div>
                             </div>
                             <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'right' }}>
                               <h5 style={{ margin: '0 0 0.2rem 0', color: '#94a3b8', fontSize: '0.7rem' }}>?¥Î≤à ?úÎ? Ï¥?Í≤∞ÏÇ∞</h5>
                               {(() => {
                                 let bSum = record.sessionTotals.bound || 0;
                                 let tSum = record.sessionTotals.tradable || 0;
                                 let pSum = record.sessionTotals.profit || 0;
                                 
                                 // Íµ¨Î≤Ñ??Í∏∞Î°ù Î≥¥Ï†ï (?∏ÏÖò ?©Í≥Ñ)
                                 record.details.forEach(d => {
                                   if (d.consumed?.potion > 0 && d.values?.potionCost === undefined) {
                                      const pPrice = auctionPrices['?ºÎ°ú ?åÎ≥µ???ÅÏïΩ'] || 0;
                                      tSum -= pPrice;
                                      pSum -= pPrice;
                                   }
                                 });

                                 return (
                                   <>
                                     <div style={{ fontSize: '0.7rem' }}>Ï¥?Í∑Ä??Í∞ÄÏπ? <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{bSum.toLocaleString()}</span></div>
                                     <div style={{ fontSize: '0.7rem' }}>Ï¥?ÍµêÌôò Í∞ÄÏπ? <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{tSum.toLocaleString()}</span></div>
                                     <div style={{ fontSize: '0.7rem', marginTop: '0.3rem' }}>
                                       ÏµúÏ¢Ö ?úÏàò??Í∑Ä???¨Ìï®): <span style={{ color: pSum > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{pSum.toLocaleString()}</span>
                                     </div>
                                     <div style={{ fontSize: '0.7rem' }}>
                                       ÏµúÏ¢Ö ?úÏàò??Í∑Ä???úÏô∏): <span style={{ color: (tSum - record.sessionTotals.consumed) > 0 ? '#38bdf8' : '#f87171', fontWeight: 'bold' }}>{(tSum - record.sessionTotals.consumed).toLocaleString()}</span>
                                     </div>
                                   </>
                                 );
                               })()}
                             </div>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {editingLogId && editLogForm && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
            <h2 style={{marginTop: 0}}>?±Ïû• ?ºÏ? ?òÎèô ÍµêÏ†ï</h2>
            
            {editLogForm.fameChange && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Î™ÖÏÑ±Ïπ??òÏ†ï</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="number" style={{ width: '100%' }} value={editLogForm.fameChange.old} onChange={e => setEditLogForm({...editLogForm, fameChange: {...editLogForm.fameChange, old: Number(e.target.value)}})} />
                  <span>?°Ô∏è</span>
                  <input type="number" style={{ width: '100%' }} value={editLogForm.fameChange.new} onChange={e => setEditLogForm({...editLogForm, fameChange: {...editLogForm.fameChange, new: Number(e.target.value)}})} />
                </div>
              </div>
            )}

            {editLogForm.equipChange && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>?•ÎπÑ?êÏàò Î∞??∏Ìä∏ ?òÏ†ï</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom:'0.5rem' }}>
                  <input type="text" style={{ width: '45%' }} value={editLogForm.equipChange.oldSet || ''} placeholder="?¥Ï†Ñ?∏Ìä∏" onChange={e => setEditLogForm({...editLogForm, equipChange: {...editLogForm.equipChange, oldSet: e.target.value}})} />
                  <span>?°Ô∏è</span>
                  <input type="text" style={{ width: '45%' }} value={editLogForm.equipChange.newSet || ''} placeholder="?†Í∑ú?∏Ìä∏" onChange={e => setEditLogForm({...editLogForm, equipChange: {...editLogForm.equipChange, newSet: e.target.value}})} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="number" style={{ width: '45%' }} value={editLogForm.equipChange.old} placeholder="?¥Ï†Ñ?êÏàò" onChange={e => setEditLogForm({...editLogForm, equipChange: {...editLogForm.equipChange, old: Number(e.target.value)}})} />
                  <span>?°Ô∏è</span>
                  <input type="number" style={{ width: '45%' }} value={editLogForm.equipChange.new} placeholder="?†Í∑ú?êÏàò" onChange={e => setEditLogForm({...editLogForm, equipChange: {...editLogForm.equipChange, new: Number(e.target.value)}})} />
                </div>
              </div>
            )}

            {editLogForm.oathChange && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>?úÏïΩ?êÏàò Î∞??∏Ìä∏ ?òÏ†ï</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom:'0.5rem' }}>
                  <input type="text" style={{ width: '45%' }} value={editLogForm.oathChange.oldSet || ''} placeholder="?¥Ï†Ñ?úÏïΩ" onChange={e => setEditLogForm({...editLogForm, oathChange: {...editLogForm.oathChange, oldSet: e.target.value}})} />
                  <span>?°Ô∏è</span>
                  <input type="text" style={{ width: '45%' }} value={editLogForm.oathChange.newSet || ''} placeholder="?†Í∑ú?úÏïΩ" onChange={e => setEditLogForm({...editLogForm, oathChange: {...editLogForm.oathChange, newSet: e.target.value}})} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="number" style={{ width: '45%' }} value={editLogForm.oathChange.old} placeholder="?¥Ï†Ñ?êÏàò" onChange={e => setEditLogForm({...editLogForm, oathChange: {...editLogForm.oathChange, old: Number(e.target.value)}})} />
                  <span>?°Ô∏è</span>
                  <input type="number" style={{ width: '45%' }} value={editLogForm.oathChange.new} placeholder="?†Í∑ú?êÏàò" onChange={e => setEditLogForm({...editLogForm, oathChange: {...editLogForm.oathChange, new: Number(e.target.value)}})} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={() => setEditingLogId(null)} className="danger">Ï∑®ÏÜå</button>
              <button type="button" onClick={saveEditLog}>?Ä??/button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2 style={{ marginTop: 0 }}>API ???§Ï†ï</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              ?§Ïò§???§Ìîà API ?§Î? ?ÖÎ†•?¥Ï£º?∏Ïöî.<br/>???§Îäî Î∏åÎùº?∞Ï? ?Ä?•ÏÜå?êÎßå ?®ÏúºÎ©?Îß?Ï°∞Ìöå ??Î∞±Ïóî?úÎ°ú ?àÏ†Ñ?òÍ≤å ?ÑÎã¨?©Îãà??
            </p>
            <input 
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: '1.5rem' }}
              type="password" 
              placeholder="API KEY" 
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              {apiKey && (
                <button type="button" onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>
                  Ï∑®ÏÜå
                </button>
              )}
              <button type="button" onClick={handleSaveSettings}>?Ä??/button>
            </div>
          </div>
        </div>
      )}

      {manualModalChar && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '650px', width: '95%' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>[{manualModalChar.base.charName}] ?òÎèô ?úÏõê ?§Ï†ï</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.5rem' }}>?ÅÎã® ?õ†Ô∏???óê??Íµ¨ÏÑ±??Î™©Î°ù?êÏÑúÎß??†ÌÉù Í∞Ä?•Ìï©?àÎã§.</p>
            <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <h3 style={{ fontSize: '0.7rem', margin: '0 0 1rem 0', color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>Í∏∞Î≥∏ ?§Ï†ï</h3>
               <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', color: '#cbd5e1' }}>??ï†Íµ?(Î°úÏä§???∏ÏÑ±???¨Ïö©??</label>
               <select 
                 style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem' }}
                 value={manualForm.role || 'dealer'}
                 onChange={e => setManualForm({...manualForm, role: e.target.value})}
               >
                 <option value="dealer">?úÎü¨</option>
                 <option value="buffer">Î≤ÑÌçº</option>
               </select>
            </div>
            <div className="manual-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
              {[
                 { title: '?•ÎπÑ ?ÅÏó≠', keys: ['enchant', 'title'], labels: { enchant: 'ÎßàÎ? ?ÅÌÉú', title: 'Ïπ?ò∏ ?ÑÌô©' } },
                 { title: '?¨Î¶¨Ï≥??ÅÏó≠', keys: ['creature', 'creatureArtifact'], labels: { creature: '?¨Î¶¨Ï≥??ÑÌô©', creatureArtifact: '?¨Î¶¨Ï≥??ÑÌã∞?©Ìä∏' } },
                 { title: '?§ÏúÑÏπ??ÅÏó≠', keys: ['buffLevel', 'buffAbyss'], labels: { buffLevel: 'Î≤ÑÌîÑ ?àÎ≤®', buffAbyss: '?¨Ïó∞???∏Î¶∞ Í∞úÏàò' } },
                 { title: '?ÑÎ∞î?Ä ?ÅÏó≠', keys: ['avatar', 'emblem', 'platEmblem', 'skinAvatar', 'skinSocket', 'skinEmblem', 'weaponAvatar', 'weaponSocket', 'weaponEmblem', 'aura', 'auraEmblem'], 
                   labels: { avatar: '?ÑÎ∞î?Ä ?ÑÌô©', emblem: '?ºÎ∞ò ?†Î∏î??, platEmblem: '?ÅÌïò???åÎûò?∞ÎÑò', skinAvatar: '?ºÎ? ?ÑÎ∞î?Ä', skinSocket: '?ºÎ? ?åÏºì ?¨Î?', skinEmblem: '?ºÎ? ?†Î∏î??, weaponAvatar: 'Î¨¥Í∏∞ ?ÑÎ∞î?Ä', weaponSocket: 'Î¨¥Í∏∞ ?åÏºì ?¨Î?', weaponEmblem: 'Î¨¥Í∏∞ ?†Î∏î??, aura: '?§Îùº ?ÑÌô©', auraEmblem: '?§Îùº ?†Î∏î?? } }
              ].map(group => (
                 <div key={group.title} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '0.7rem', margin: '0 0 1rem 0', color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>{group.title}</h3>
                    {group.keys.map(k => (
                      <div key={k} style={{ marginBottom: '0.8rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', color: '#cbd5e1' }}>{group.labels[k]}</label>
                        {(k === 'buffAbyss' || k === 'buffLevel') ? (
                          <input 
                            type="number"
                            min="0"
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem' }}
                            value={manualForm[k] || ''}
                            placeholder="?ëÏùò ?ïÏàò ?ÖÎ†•"
                            onChange={e => setManualForm({...manualForm, [k]: e.target.value})}
                          />
                        ) : (
                          <select 
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem' }}
                            value={manualForm[k] || ''}
                            onChange={e => setManualForm({...manualForm, [k]: e.target.value})}
                          >
                            <option value="">- ?†ÌÉù ????-</option>
                            {customOptions[k]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                 </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setManualModalChar(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Ï∑®ÏÜå</button>
              <button type="button" onClick={handleSaveManual}>?Ä??/button>
            </div>
          </div>
        </div>
      )}

      {showOptionsModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '650px', width: '95%' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>?õ†Ô∏??úÎ°≠?§Ïö¥ ?ÑÏ≤¥ ??™© ?∏Ïßë</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.5rem' }}>
              Í∞?Ïπ¥ÌÖåÍ≥†Î¶¨Î≥ÑÎ°ú ÏΩ§Îßà(,)Î•??¨Ïö©???†ÌÉùÏßÄÎ•??êÏú†Î°?≤å ?ÖÎ†•?òÏÑ∏?? 
            </p>
            <div className="options-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
              {[
                 { title: '?•ÎπÑ ?ÅÏó≠', keys: ['enchant', 'title'], labels: { enchant: 'ÎßàÎ? ?ÅÌÉú', title: 'Ïπ?ò∏ ?ÑÌô©' } },
                 { title: '?¨Î¶¨Ï≥??ÅÏó≠', keys: ['creature', 'creatureArtifact'], labels: { creature: '?¨Î¶¨Ï≥??ÑÌô©', creatureArtifact: '?¨Î¶¨Ï≥??ÑÌã∞?©Ìä∏' } },
                 { title: '?§ÏúÑÏπ??ÅÏó≠', keys: ['buffLevel', 'buffAbyss'], labels: { buffLevel: 'Î≤ÑÌîÑ ?àÎ≤®', buffAbyss: '?¨Ïó∞???∏Î¶∞ Í∞úÏàò' } },
                 { title: '?ÑÎ∞î?Ä ?ÅÏó≠', keys: ['avatar', 'emblem', 'platEmblem', 'skinAvatar', 'skinSocket', 'skinEmblem', 'weaponAvatar', 'weaponSocket', 'weaponEmblem', 'aura', 'auraEmblem'], 
                   labels: { avatar: '?ÑÎ∞î?Ä ?ÑÌô©', emblem: '?ºÎ∞ò ?†Î∏î??, platEmblem: '?ÅÌïò???åÎûò?∞ÎÑò ?†Î∏î??Î≥¥Ïú† ?¨Î?', skinAvatar: '?ºÎ? ?ÑÎ∞î?Ä', skinSocket: '?ºÎ? ?åÏºì ?¨Î?', skinEmblem: '?ºÎ? ?†Î∏î??, weaponAvatar: 'Î¨¥Í∏∞ ?ÑÎ∞î?Ä', weaponSocket: 'Î¨¥Í∏∞ ?åÏºì ?¨Î?', weaponEmblem: 'Î¨¥Í∏∞ ?†Î∏î??, aura: '?§Îùº ?ÑÌô©', auraEmblem: '?§Îùº ?†Î∏î?? } }
              ].map(group => (
                 <div key={group.title} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '0.7rem', margin: '0 0 1rem 0', color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>{group.title}</h3>
                    {group.keys.map(k => (
                      <div key={k} style={{ marginBottom: '0.8rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', color: '#cbd5e1' }}>{group.labels[k]}</label>
                        {(k === 'buffAbyss' || k === 'buffLevel') ? (
                          <div style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '0.6rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem', textAlign: 'center' }}>
                            (Í∞?Ï∫êÎ¶≠??Í∞úÎ≥Ñ ?ïÏàò ?ÖÎ†•)
                          </div>
                        ) : (
                          <textarea 
                            rows={2}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', resize: 'vertical', fontSize: '0.7rem' }}
                            value={optionsFormText[k] || ''}
                            placeholder="Ï¢ÖÍ≤∞, Í∞Ä?±ÎπÑ, ?îÎ†§..."
                            onChange={e => setOptionsFormText({...optionsFormText, [k]: e.target.value})}
                          />
                        )}
                      </div>
                    ))}
                 </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowOptionsModal(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Ï∑®ÏÜå</button>
              <button type="button" onClick={handleSaveOptions}>?Ä??/button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function LootModalComponent({ activeLootModal, setActiveLootModal, getCharForm, updateCharForm, characters, apiKey, auctionPrices, setAuctionPrices }) {
  const [fetchingItemId, setFetchingItemId] = useState(null);
  const [focusedItemId, setFocusedItemId] = useState(null);

  // Collect all custom item names from all characters and history, count frequency
  const getSuggestions = () => {
    const freq = {};
    // From current form
    characters.forEach(c => {
      const form = getCharForm(c.id);
      (form.customItems || []).forEach(item => {
        if (item.name && item.name.trim()) {
          const n = item.name.trim();
          freq[n] = (freq[n] || 0) + 1;
        }
      });
    });
    // From history
    (activeLootModal._pilgrimageHistory || []).forEach(record => {
      (record.details || []).forEach(d => {
        (d.customItems || []).forEach(item => {
          if (item.name && item.name.trim()) {
            const n = item.name.trim();
            freq[n] = (freq[n] || 0) + 1;
          }
        });
      });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([name]) => name);
  };

  const fetchCustomItemPrice = async (itemName, itemId) => {
    if (!itemName || !apiKey) return;
    setFetchingItemId(itemId);
    try {
      const res = await fetch('/api/auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, itemNames: [itemName] })
      });
      const data = await res.json();
      if (data.success && data.data[itemName] !== undefined) {
        const price = data.data[itemName];
        // Update the item's price in the form only (auctionPrices is updated on close)
        const charId = activeLootModal.charId;
        const items = getCharForm(charId).customItems || [];
        updateCharForm(charId, 'customItems', items.map(i => i.id === itemId ? { ...i, price: price } : i));
      }
    } catch (e) {
      console.error('Custom item price fetch error:', e);
    }
    setFetchingItemId(null);
  };

  const handleClose = () => {
    // Register custom item prices into auctionPrices on close
    const items = getCharForm(activeLootModal.charId).customItems || [];
    const newPrices = {};
    items.forEach(item => {
      if (item.name && item.name.trim() && Number(item.price || 0) > 0) {
        newPrices[item.name.trim()] = Number(item.price);
      }
    });
    if (Object.keys(newPrices).length > 0) {
      setAuctionPrices(prev => ({ ...prev, ...newPrices }));
    }
    setActiveLootModal(null);
  };

  if (!activeLootModal) return null;
  const charName = characters.find(c => c.id === activeLootModal.charId)?.base.charName || '?????ÜÏùå';
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
       <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '12px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
           <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#4ade80' }}>
             ?ì¶ {charName} - ?¨Ìôî Î∞?Î©îÎ™® ?ÖÎ†•
           </h3>
           <div style={{ marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>??Í≥®Îìú</label>
                <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).pureGold || ''} onChange={e => updateCharForm(activeLootModal.charId, 'pureGold', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>?úÎ????∏Ïû•</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).seal || ''} onChange={e => updateCharForm(activeLootModal.charId, 'seal', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä??</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).tradableSeal || ''} onChange={e => updateCharForm(activeLootModal.charId, 'tradableSeal', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>?ëÏ∂ï???ºÏù¥??ÏΩîÏñ¥</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).condensedCore || ''} onChange={e => updateCharForm(activeLootModal.charId, 'condensedCore', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>Î¨¥Í≤∞???ºÏù¥??ÏΩîÏñ¥</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).flawlessCore || ''} onChange={e => updateCharForm(activeLootModal.charId, 'flawlessCore', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>ÎπõÎÇò??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?/label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).crystal || ''} onChange={e => updateCharForm(activeLootModal.charId, 'crystal', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>Î¨¥Í≤∞??Ï°∞Ìôî??Í≤∞Ï†ïÏ≤?/label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).flawlessCrystal || ''} onChange={e => updateCharForm(activeLootModal.charId, 'flawlessCrystal', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?/label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).sealVoucher || ''} onChange={e => updateCharForm(activeLootModal.charId, 'sealVoucher', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>?úÎ????∏Ïû•(1??ÍµêÌôò Í∞Ä?? ÍµêÌôòÍ∂?1Í∞??ÅÏûê</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).sealVoucherBox || ''} onChange={e => updateCharForm(activeLootModal.charId, 'sealVoucherBox', e.target.value)} />
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 'bold' }}>Ïª§Ïä§?Ä Ï∂îÍ? ??™© (ÍµêÌôò Í∞Ä??</label>
                  <button onClick={() => {
                    const items = getCharForm(activeLootModal.charId).customItems || [];
                    updateCharForm(activeLootModal.charId, 'customItems', [...items, { id: Date.now().toString(), name: '', quantity: '', price: 0, isBound: false }]);
                  }} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ ??™© Ï∂îÍ?</button>
                </div>
                {(getCharForm(activeLootModal.charId).customItems || []).length === 0 && (
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>??™©???ÜÏäµ?àÎã§. ??Î≤ÑÌäº?ºÎ°ú Ï∂îÍ??òÏÑ∏??</div>
                )}
                {(getCharForm(activeLootModal.charId).customItems || []).map((item) => (
                  <div key={item.id} style={{ marginBottom: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input type="text" placeholder="?ÑÏù¥???¥Î¶Ñ ?ÖÎ†•" style={{ width: '100%', padding: '0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} value={item.name} onChange={e => {
                          const items = getCharForm(activeLootModal.charId).customItems || [];
                          updateCharForm(activeLootModal.charId, 'customItems', items.map(i => i.id === item.id ? { ...i, name: e.target.value } : i));
                        }} onFocus={() => setFocusedItemId(item.id)} onBlur={e => {
                          setTimeout(() => setFocusedItemId(null), 150);
                          if (e.target.value.trim()) fetchCustomItemPrice(e.target.value.trim(), item.id);
                        }} />
                        {focusedItemId === item.id && (() => {
                          const all = getSuggestions().filter(s => s !== item.name && (!item.name || s.toLowerCase().includes(item.name.toLowerCase())));
                          if (all.length === 0) return null;
                          return (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', maxHeight: '120px', overflowY: 'auto', marginTop: '2px' }}>
                              {all.map(name => (
                                <div key={name} style={{ padding: '0.3rem 0.5rem', fontSize: '0.65rem', color: '#cbd5e1', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }} onMouseDown={() => {
                                  const items = getCharForm(activeLootModal.charId).customItems || [];
                                  updateCharForm(activeLootModal.charId, 'customItems', items.map(i => i.id === item.id ? { ...i, name } : i));
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
                      <input type="number" placeholder="?òÎüâ" style={{ width: '60px', padding: '0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', textAlign: 'center' }} value={item.quantity} onChange={e => {
                        const items = getCharForm(activeLootModal.charId).customItems || [];
                        updateCharForm(activeLootModal.charId, 'customItems', items.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i));
                      }} />
                      <button onClick={() => {
                        const items = getCharForm(activeLootModal.charId).customItems || [];
                        updateCharForm(activeLootModal.charId, 'customItems', items.filter(i => i.id !== item.id));
                      }} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 0.3rem', flexShrink: 0 }}>√ó</button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#94a3b8', paddingLeft: '0.2rem' }}>
                      {fetchingItemId === item.id ? (
                        <span style={{ color: '#fbbf24' }}>???®Í? Ï°∞Ìöå Ï§?..</span>
                      ) : (
                        <span>?®Í?: <span style={{ color: Number(item.price || 0) > 0 ? '#fbbf24' : '#64748b', fontWeight: 'bold' }}>{Number(item.price || 0) > 0 ? `${Number(item.price).toLocaleString()} G` : 'ÎØ∏Ï°∞??}</span></span>
                      )}
                      {item.name && Number(item.quantity || 0) > 0 && Number(item.price || 0) > 0 && (
                        <span style={{ color: '#4ade80' }}>= {(Number(item.quantity) * Number(item.price)).toLocaleString()} G</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#94a3b8' }}>Í∏∞Ì? Î©îÎ™®</label>
                <input type="text" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).memo || ''} onChange={e => updateCharForm(activeLootModal.charId, 'memo', e.target.value)} placeholder="?πÏù¥?¨Ìï≠ Î©îÎ™® ?ÖÎ†•" />
              </div>
           </div>
           <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={handleClose} style={{ padding: '0.6rem 1.2rem', background: '#4ade80', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>?ÑÎ£å Î∞??´Í∏∞</button>
           </div>
       </div>
     </div>
  );
}


function SecretShopModalComponent({ activeSecretShopModal, setActiveSecretShopModal, characters, getCharForm, addCharToken, updateCharToken, removeCharToken, addCharRecipe, updateCharRecipe, removeCharRecipe, updateCharForm }) {
  useEffect(() => {
    if (activeSecretShopModal) {
      const charId = activeSecretShopModal.charId;
      const form = getCharForm(charId);
      
      // Initialize with one empty field if empty
      if ((form.secretTokens || []).length === 0) addCharToken(charId);
      if ((form.secretRecipes || []).length === 0) addCharRecipe(charId);
    }
  }, [activeSecretShopModal]);

  const handleClose = () => {
    if (activeSecretShopModal) {
      const charId = activeSecretShopModal.charId;
      const form = getCharForm(charId);

      const cleanedTokens = (form.secretTokens || []).filter(t => t.buyPrice !== '' || t.sellPrice !== '');
      updateCharForm(charId, 'secretTokens', cleanedTokens);
      const cleanedRecipes = (form.secretRecipes || []).filter(r => r.buyPrice !== '' || r.sealCost !== '' || r.sellPrice !== '');
      updateCharForm(charId, 'secretRecipes', cleanedRecipes);
    }
    setActiveSecretShopModal(null);
  };

  if (!activeSecretShopModal) return null;
  const charName = characters.find(c => c.id === activeSecretShopModal.charId)?.base.charName || '?????ÜÏùå';
  
  return (
    <div className="modal-overlay">
       <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
            ?õí {charName} - ?πÎ≥Ñ?ÅÏ†ê ?µÌï© Í¥ÄÎ¶?
          </h3>
          <div style={{ marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* ?∏Ïû• Íµ¨Îß§ ?πÏÖò */}
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                     <button onClick={() => addCharToken(activeSecretShopModal.charId)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ Íµ¨Îß§ ?¥Ïó≠ Ï∂îÍ?</button>
                     <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginLeft: '0.5rem' }}>
                       <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Îπ†Î•∏ Ï∂îÍ?:</span>
                       {[90000, 100000, 110000].map(price => (
                         <button 
                           key={price}
                           onClick={() => addCharToken(activeSecretShopModal.charId, String(price))}
                           style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer' }}
                         >
                           {price / 10000}Îß?
                         </button>
                       ))}
                     </div>
                   </div>
                   {(getCharForm(activeSecretShopModal.charId).secretTokens || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Íµ¨Îß§ ?¥Ïó≠???ÜÏäµ?àÎã§.</div> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(getCharForm(activeSecretShopModal.charId).secretTokens || []).map((t, idx) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold', minWidth: '90px' }}>?∏Ïû• Íµ¨Îß§ #{idx+1}</div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                               <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Íµ¨Îß§Í∞Ä:</span>
                               <input type="number" value={t.buyPrice} onChange={e => updateCharToken(activeSecretShopModal.charId, t.id, 'buyPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="Í≥®Îìú" />
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                               <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>?êÎß§Í∞Ä:</span>
                               <input type="number" value={t.sellPrice} onChange={e => updateCharToken(activeSecretShopModal.charId, t.id, 'sellPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="?úÏû•Í∞Ä" />
                             </div>
                             <div style={{ fontSize: '0.7rem', color: (Number(t.sellPrice||0) - Number(t.buyPrice||0)) >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold', marginLeft: 'auto', marginRight: '1rem' }}>
                               ?òÏùµ: {(Number(t.sellPrice||0) - Number(t.buyPrice||0)).toLocaleString()} G
                             </div>
                             <button onClick={() => removeCharToken(activeSecretShopModal.charId, t.id)} style={{ padding: '0.2rem 0.4rem', background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>??†ú</button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                {/* ?àÏãú???úÏûë ?πÏÖò */}
                <div>
                   <h4 style={{ fontSize: '0.75rem', color: '#a78bfa', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>?îπ ?àÏãú??/ ?µÎ????úÏûë</h4>
                   <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <button onClick={() => addCharRecipe(activeSecretShopModal.charId)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ ?ºÎ∞ò ?àÏãú??/button>
                      <button onClick={() => {
                         const charId = activeSecretShopModal.charId;
                         const form = getCharForm(charId);
                         updateCharForm(charId, 'secretRecipes', [...(form.secretRecipes || []), { id: Date.now(), buyPrice: '', type: 'shinyGift' }]);
                      }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ ÎπõÎÇò???µÎ???/button>
                      <button onClick={() => {
                         const charId = activeSecretShopModal.charId;
                         const form = getCharForm(charId);
                         updateCharForm(charId, 'secretRecipes', [...(form.secretRecipes || []), { id: Date.now(), buyPrice: '', type: 'brilliantGift' }]);
                      }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ ?îÎ†§???µÎ???/button>
                   </div>
                   
                   {(getCharForm(activeSecretShopModal.charId).secretRecipes || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>?úÏûë ?¥Ïó≠???ÜÏäµ?àÎã§.</div> : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {(getCharForm(activeSecretShopModal.charId).secretRecipes || []).map((r, idx) => {
                         const isShiny = r.type === 'shinyGift';
                         const isBrilliant = r.type === 'brilliantGift';
                         const isGift = isShiny || isBrilliant;
                         
                         return (
                           <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ fontSize: '0.7rem', color: isGift ? '#fbbf24' : '#a78bfa', fontWeight: 'bold', minWidth: '110px' }}>
                                {isShiny ? '?éÅ ÎπõÎÇò???µÎ??? : isBrilliant ? '?éÅ ?îÎ†§???µÎ??? : `?àÏãú??#${idx+1}`}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Íµ¨Îß§Í∞Ä:</span>
                                <input type="number" value={r.buyPrice} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'buyPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="Í≥®Îìú" />
                              </div>
                              {isGift ? (
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', flex: 1 }}>
                                  [?åÎ™®] {isShiny ? '?àÏ†Ñ?îÎ¶¨' : '?êÌîΩ'} ?åÏö∏ 1 / [Î≥¥ÏÉÅ] Ï¶ùÌëú {isShiny ? '5' : '20'}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>?∏Ïû•:</span>
                                    <input type="number" value={r.sealCost} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'sealCost', e.target.value)} style={{ width: '40px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>?êÎß§Í∞Ä:</span>
                                    <input type="number" value={r.sellPrice} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'sellPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} />
                                  </div>
                                </div>
                              )}
                              <button onClick={() => removeCharRecipe(activeSecretShopModal.charId, r.id)} style={{ marginLeft: 'auto', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.3rem' }}>√ó</button>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={handleClose} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>?´Í∏∞</button>
          </div>
       </div>
    </div>
  );
}

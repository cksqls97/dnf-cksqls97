"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SERVER_LIST = [
  { id: "cain", name: "카인" },
  { id: "diregie", name: "디레지에" },
  { id: "siroco", name: "시로코" },
  { id: "prey", name: "프레이" },
  { id: "casillas", name: "카시야스" },
  { id: "hilder", name: "힐더" },
  { id: "anton", name: "안톤" },
  { id: "bakal", name: "바칼" }
];

const getGradeTier = (pts) => {
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

const getTierClass = (rarity) => {
  if(rarity === '태초') return 'tier-태초';
  if(rarity === '에픽') return 'tier-에픽';
  if(rarity === '레전더리') return 'tier-레전더리';
  if(rarity === '유니크') return 'tier-유니크';
  if(rarity === '레어') return 'tier-레어';
  return '';
};

const GradeBadge = ({ points }) => {
  if (!points) return null;
  const grade = getGradeTier(points);
  if (!grade || grade.rarity === '등급 없음') return null;
  return (
    <span className={getTierClass(grade.rarity)} style={{ fontSize: '0.85rem', marginLeft: '0.2rem' }}>
      ({grade.rarity}{grade.tier ? ` ${grade.tier}` : ''})
    </span>
  );
};

const ADVANCED_DUNGEONS = [
  { name: '배교자의 성', fame: 101853 },
  { name: '별거북 대서고', fame: 91582 },
  { name: '해방된 흉몽', fame: 71179 },
  { name: '죽음의 여신전', fame: 55950 },
  { name: '애쥬어 메인', fame: 44929 },
  { name: '달이 잠긴 호수', fame: 34749 }
];

const RAIDS = [
  { name: '이내 황혼전', fame: 72688 },
  { name: '디레지에 레이드', fame: 63257 }
];

const APOCALYPSE = [
  { name: '2단계', fame: 105881 },
  { name: '1단계', fame: 98171 },
  { name: '매칭', fame: 73993 }
];

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
     '무결점 라이언 코어': 0,
     '무결점 조화의 결정체': 0,
     '닳아버린 순례의 증표': 0,
     '순례의 인장(1회 교환 가능)': 0,
     '순례의 인장(1회 교환 가능) 교환권 1개 상자': 0
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
    // --- 일자별 모드: 매일 06:00 기준으로 당일 최신 명성값을 1포인트로 집계 ---
    if (chartViewMode === 'daily') {
      // 어떤 로그를 대상으로 할지 결정
      const relevantLogs = historyLogs
        .filter(l => l.fameChange && (historyFilterChar === '' || l.charId === historyFilterChar))
        .sort((a, b) => a.timestamp - b.timestamp);

      if (relevantLogs.length === 0) {
        if (characters.length > 0) {
          const now = new Date();
          return [{ time: Date.now(), formattedTime: '현재', fame: historyFilterChar === '' ? characters.reduce((acc, c) => acc + c.base.fame, 0) : (characters.find(c => c.id === historyFilterChar)?.base.fame ?? 0) }];
        }
        return [];
      }

      // 각 타임스탬프에 대해 '일자 키' 계산 (06:00 기준 → KST=UTC+9, 06:00 KST = 21:00 UTC 전날)
      const getDayKey = (ts) => {
        const d = new Date(ts);
        // 06:00 KST 기준: UTC 시간에서 -9+6=-3시간 빼기 → 같은 날로 묶기
        const offset = (9 - 6) * 60 * 60 * 1000; // 3시간
        const adjusted = new Date(ts - offset);
        return `${adjusted.getUTCFullYear()}-${String(adjusted.getUTCMonth()+1).padStart(2,'0')}-${String(adjusted.getUTCDate()).padStart(2,'0')}`;
      };

      // 각 타임스탬프별 전체 명성값 계산 (이벤트 모드와 동일 로직)
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

      // 관련 타임스탬프만 추출
      const targetTimestamps = historyFilterChar === ''
        ? allTimestamps
        : [...new Set(historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).map(l => l.timestamp))].sort((a,b)=>a-b);

      // 일자별로 가장 마지막 타임스탬프 선택
      const dayMap = {};
      targetTimestamps.forEach(t => {
        const key = getDayKey(t);
        dayMap[key] = t; // 덮어쓰면 자연스럽게 당일 최신값
      });

      const days = Object.keys(dayMap).sort();
      const dataPoints = days.map(day => {
        const t = dayMap[day];
        const fame = computeFameAt(t);
        const [y, m, d] = day.split('-');
        return { time: t, formattedTime: `${m}/${d}`, fame };
      });

      // 시작 포인트 추가
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
        dataPoints.unshift({ time: firstT - 1, formattedTime: `${m}/${d} 이전`, fame: initFame });
      }

      // 현재 포인트 추가
      const now = Date.now();
      const lastT = targetTimestamps[targetTimestamps.length - 1];
      if (now - lastT > 60000) {
        let curFame = historyFilterChar === ''
          ? characters.reduce((acc,c) => acc+c.base.fame, 0)
          : (characters.find(c=>c.id===historyFilterChar)?.base.fame ?? (() => { const cl = historyLogs.filter(l=>l.charId===historyFilterChar&&l.fameChange).sort((a,b)=>a.timestamp-b.timestamp); return cl.length>0?cl[cl.length-1].fameChange.new:0; })());
        dataPoints.push({ time: now, formattedTime: '현재', fame: curFame });
      }

      return dataPoints;
    }

    // --- 이벤트 모드 (기존 로직) ---
    const timestamps = new Set();
    historyLogs.forEach(log => {
        if (log.fameChange) timestamps.add(log.timestamp);
    });
    
    const sortedTimes = Array.from(timestamps).sort((a,b) => a - b);
    
    if (sortedTimes.length === 0) {
        if (characters.length > 0) {
            return [{
                time: Date.now(),
                formattedTime: '현재',
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
                return [{ time: Date.now(), formattedTime: '현재', fame: char.base.fame }];
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
           formattedTime: `시작`, 
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
            formattedTime: '현재',
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
    enchant: ['기본', '가성비', '준종결', '종결'],
    title: ['기본', '가성비', '준종결', '종결'],
    creature: ['기본', '가성비', '준종결', '종결'],
    creatureArtifact: ['없음', '언커먼', '레어', '유니크'],
    avatar: ['기본', '이벤압', '레압', '클레압', '엔드'],
    emblem: ['없음', '화려', '찬란', '다발'],
    platEmblem: ['없음', '잡플티', '유효', '종결'],
    skinAvatar: ['없음', '기본', '특판', '프리미엄'],
    skinSocket: ['막힘', '뚫림'],
    skinEmblem: ['없음', '화려', '찬란'],
    weaponAvatar: ['없음', '기본', '레어'],
    weaponSocket: ['막힘', '뚫림'],
    weaponEmblem: ['없음', '화려', '찬란'],
    aura: ['기본', '가성비', '준종결', '종결'],
    auraEmblem: ['없음', '화려', '찬란']
  });

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsFormText, setOptionsFormText] = useState({});

  const autoRefreshDone = React.useRef(false);

  // Stale Closure 방지용 최신 상태 프록시 Ref
  const charsRef = React.useRef(characters);
  const logsRef = React.useRef(historyLogs);
  const optsRef = React.useRef(customOptions);
  const mercRef = React.useRef({ level: mercLevel, target: mercNextLevelTarget });
  useEffect(() => { mercRef.current = { level: mercLevel, target: mercNextLevelTarget }; }, [mercLevel, mercNextLevelTarget]);
  
  const pilgrimageRef = React.useRef(pilgrimageHistory);
  useEffect(() => { pilgrimageRef.current = pilgrimageHistory; }, [pilgrimageHistory]);
  
  // 클라우드 버전 관리를 위한 Ref (다중 탭 덮어쓰기 원천 차단용)
  const lastCloudUpdateAtRef = React.useRef(0);

  useEffect(() => { charsRef.current = characters; }, [characters]);
  useEffect(() => { logsRef.current = historyLogs; }, [historyLogs]);
  useEffect(() => { optsRef.current = customOptions; }, [customOptions]);

  // --- 클라우드 동기화 엔진 ---
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
          console.warn("다중 탭 충돌 감지! 클라우드에 더 최신 데이터가 존재하여 현재 구형 뷰의 덮어쓰기를 차단하고 클라우드를 내려받습니다.");
          await syncDownCloudData(key, updatedCharacters, updatedLogs, updatedOpts);
          return;
      }
      
      if (resData.success && resData.newUpdateAt) {
          lastCloudUpdateAtRef.current = resData.newUpdateAt; // 새 버전으로 지식 갱신
      }
    } catch(e) { console.error(e) }
  };

  const handleManualCloudSync = async () => {
    if (!apiKey) {
       alert("API 키를 먼저 설정해야 합니다.");
       return;
    }
    setIsCloudSyncing(true);
    // 버튼 등을 통한 수동 동기화 시에는 억지로라도 덮어씌움 (forceOverride = true)
    await syncUpCloudData(apiKey, characters, historyLogs, customOptions, mercRef.current, true);
    setIsCloudSyncing(false);
    alert("현재 기기의 최신 데이터가 클라우드 서버에 수동으로 백업되었습니다!");
  };

  const syncDownCloudData = async (targetKey, localChars, localLogs, localOpts) => {
    if(!targetKey) return;
    setIsCloudSyncing(true);
    try {
      const res = await fetch(`/api/sync?apiKey=${targetKey}`).then(r => r.json());
      if (res.success && res.data) {
         const cData = res.data;
         
         // 클라우드 버전 기록 흡수
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
         
         // 클라우드가 텅 비어있고, 로컬에는 기존 데이터가 가득하다면 (첫 이주, Migration)
         if (!modified && (localChars?.length > 0 || localLogs?.length > 0)) {
            await syncUpCloudData(targetKey, localChars, localLogs, localOpts, mercRef.current);
         }
         
         if (modified) {
             setIsCloudSyncing(false);
             return true;
         }
      } else if (res.success && (!res.data)) {
         // 클라우드가 아예 null (키가 처음 생성된 상태)
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
      // 최신 Ref를 전달해서 Stale Closure 우회
      handleRefreshAll(charsRef.current, apiKey);
    }, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]); // characters가 업데이트 될 때마다 Interval이 뜯어지는 것도 방지

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
          enchant: ['기본', '가성비', '준종결', '종결'],
          title: ['기본', '가성비', '준종결', '종결'],
          aura: ['기본', '가성비', '준종결', '종결'],
          creature: ['기본', '가성비', '준종결', '종결'],
          avatar: ['기본', '이벤압', '레압', '클레압', '찬작', '엔드'],
          emblem: ['기본', '화려', '찬란', '다발', '종결플티'],
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

    // 마운트 시 클라우드 동기화 수행
    if (key) {
      syncDownCloudData(key, loadedChars, loadedLogs, loadedOpts).then((cloudHydrated) => {
         // 동기화가 끝난 후, 이미 클라우드 데이터를 받았어도 자동갱신 로직은 수행을 권장 (다만 클라우드가 더 최신이므로 충돌 가능성 있음)
         // 현재 최적화 방식으론, 클라우드 데이터를 다운받은 후 그냥 polling 큐에 맡기는 것이 안전함.
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
      alert("API KEY를 먼저 설정해주세요.");
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

    const bufferKeywords = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];
    const jobName = data.base?.jobGrowName || data.base?.jobName || '';
    const autoRole = bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
    data.manual = { role: autoRole };

    // Check duplicate
    if (characters.some(c => c.id === data.id)) {
      alert("이미 등록된 캐릭터입니다.");
      return;
    }

    const newList = [...characters, data];
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    setCharName('');
    
    // Cloud Sync (유저 인터랙션 = forceOverride true)
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
           
           // manual 역시 과거 1분 전 상태가 아니라 가장 최신 상태인 charsRef.current에서 가져와야 레이스 컨디션을 방지함
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
          const merged = [...newLogs, ...prev].slice(0, 1000); // 최대 1000개 기록 제한
          localStorage.setItem('DNF_HISTORY', JSON.stringify(merged));
          
          // 무조건 최신 optsRef.current를 전달하여 과거 커스텀옵션이 클라우드에 덮어씌워지는 대참사(Stale) 방지
          if (keyToUse) syncUpCloudData(keyToUse, updatedList, merged, optsRef.current, mercRef.current);
          
          return merged;
       });
    }

    setIsRefreshing(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm("정말로 이 캐릭터를 삭제하시겠습니까?")) return;
    const newList = characters.filter(c => c.id !== id);
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, mercRef.current, true);
  };

  const openManualModal = (char) => {
    const existingManual = char.manual || {};
    
    let defaultRole = 'dealer';
    const bufferKeywords = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];
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
    if (!window.confirm("이 성장 기록을 정말 삭제하시겠습니까?")) return;
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
            {isCloudSyncing ? '☁️ 동기화 중...' : '☁️ 수동 클라우드 백업'}
          </button>
          <button onClick={openOptionsModal}>🛠️ 옵션 편집</button>
          <button onClick={() => setShowSettings(true)}>⚙️ API 설정</button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
         <button className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`} onClick={() => setActiveTab('roster')}>👥 캐릭터 로스터</button>
         <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📜 성장 일지 기록</button>
         <button className={`tab-btn ${activeTab === 'imminent' ? 'active' : ''}`} onClick={() => setActiveTab('imminent')}>🎯 다음 던전 목표 현황</button>
         <button className={`tab-btn ${activeTab === 'merc' ? 'active' : ''}`} onClick={() => setActiveTab('merc')}>⚔️ 용병단 레벨</button>
         <button className={`tab-btn ${activeTab === 'pilgrimage' ? 'active' : ''}`} onClick={() => setActiveTab('pilgrimage')}>✨ 광휘의 순례</button>
      </div>

      {activeTab === 'roster' && (
      <>
        {/* 로스터 서브탭 */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
          <button
            className={`tab-btn ${rosterSubTab === 'overview' ? 'active' : ''}`}
            onClick={() => setRosterSubTab('overview')}
            style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}
          >📋 캐릭터 종합 정보</button>
          <button
            className={`tab-btn ${rosterSubTab === 'items' ? 'active' : ''}`}
            onClick={() => setRosterSubTab('items')}
            style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}
          >🎽 캐릭터 아이템 현황</button>
        </div>
        {rosterSubTab === 'overview' && (
        <section className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form className="add-form" onSubmit={handleAdd}>
          <select value={server} onChange={e => setServer(e.target.value)}>
            {SERVER_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="캐릭터명 입력" 
            value={charName} 
            onChange={e => setCharName(e.target.value)} 
          />
          <button type="submit" disabled={isAdding}>
            {isAdding ? <div className="loader"/> : "캐릭터 추가"}
          </button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>

             <button type="button" onClick={() => handleRefreshAll()} disabled={isRefreshing || characters.length === 0} style={{ background: '#475569' }}>
               {isRefreshing ? <div className="loader"/> : "🔄 전체 갱신"}
             </button>
          </div>
        </form>
      </section>
      )}

      {rosterSubTab === 'overview' && (
      <section className="glass-panel table-wrapper">
        {characters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            상단의 폼을 이용해 관리할 캐릭터를 추가해주세요.
          </div>
        ) : (
          (() => {
            const getRole = (c) => {
              if (c.manual?.isManualRoleSet && c.manual?.role) return c.manual.role;
              const bufferKeywords = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];
              const jobName = c.base?.jobGrowName || c.base?.jobName || '';
              return bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
            };
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
                    <h3 style={{ marginBottom: '1rem', color: '#38bdf8', fontSize: '1.1rem', paddingLeft: '0.5rem', borderLeft: '3px solid #38bdf8' }}>그룹 {gIdx + 1}</h3>
                    <table style={{ tableLayout: 'fixed', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '5%', textAlign: 'center' }}>서버</th>
                          <th style={{ width: '8%', textAlign: 'center' }}>직업</th>
                          <th style={{ width: '16%', textAlign: 'center' }}>캐릭터명</th>
                          <th style={{ width: '6%', textAlign: 'center' }}>명성</th>
                          <th style={{ width: '11%', textAlign: 'center' }}>상급던전</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>레이드</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>아포칼립스</th>
                          <th style={{ width: '12%', textAlign: 'center' }}>장비 (점수)</th>
                          <th style={{ width: '8%', textAlign: 'center' }}>서약 (점수)</th>
                          <th style={{ width: '7%', textAlign: 'center' }}>던담</th>
                          <th style={{ width: '7%', textAlign: 'center' }}>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.map((c, mIdx) => {
                          if (!c) {
                            return (
                              <tr key={`empty-${mIdx}`}>
                                <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                                  {mIdx < 3 ? '딜러 자리 비어있음' : '버퍼 자리 비어있음'}
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
                                <td data-label="서버" style={{ textAlign: 'center' }}>{SERVER_LIST.find(s => s.id === c.base.server)?.name || c.base.server}</td>
                  <td data-label="직업" style={{ textAlign: 'center' }}>{c.base.jobGrowName}</td>
                    <td data-label="캐릭터명" style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{c.base.charName}</div>
                    </td>
                  <td data-label="명성" style={{ textAlign: 'center' }}>
                    {(() => {
                        const filteredRaids = RAIDS.filter(r => r.name !== '이내 황혼전' || gIdx < 2);
                        const nextDungeon = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > c.base.fame);
                        const nextRaid = [...filteredRaids].reverse().find(r => r.fame > c.base.fame);
                        const diffD = nextDungeon ? nextDungeon.fame - c.base.fame : null;
                        const diffR = nextRaid ? nextRaid.fame - c.base.fame : null;
                        const isImminent = (diffD !== null && diffD < 1000) || (diffR !== null && diffR < 1000);
                        return (
                          <div style={{ color: isImminent ? '#fef08a' : '#fbbf24', fontWeight: 'bold', fontSize: '1.05rem', textShadow: isImminent ? '0 0 10px rgba(234, 179, 8, 0.6)' : 'none' }}>
                            {isImminent && <span style={{ marginRight: '3px' }}>🔥</span>}
                            {c.base.fame.toLocaleString()}
                          </div>
                        );
                    })()}
                  </td>
                  <td data-label="상급던전" style={{ textAlign: 'center' }}>
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
                              {isImminent ? '🔥' : '🚀'} {nextDungeon.name}까지 <strong style={{ color: isImminent ? '#fde047' : '#f87171' }}>{diff.toLocaleString()}</strong>
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
                  <td data-label="레이드" style={{ textAlign: 'center' }}>
                    {(() => {
                      const filteredRaids = RAIDS.filter(r => r.name !== '이내 황혼전' || gIdx < 2);
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
                              {isImminent ? '🔥' : '⚔️'} {nextRaid.name}까지 <strong style={{ color: isImminent ? '#fde047' : '#a855f7' }}>{raidDiff.toLocaleString()}</strong>
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
                  <td data-label="아포칼립스" style={{ textAlign: 'center' }}>
                    {(() => {
                      // state: 0=진입불가, 1=매칭가능, 2=1단계가능, 3=2단계가능
                      const fame = c.base.fame;
                      const state = fame >= 105881 ? 3 : fame >= 98171 ? 2 : fame >= 73993 ? 1 : 0;
                      const stateLabels = ['', '매칭', '1단계', '2단계'];
                      const nextTargets = [{ name: '매칭', fame: 73993 }, { name: '1단계', fame: 98171 }, { name: '2단계', fame: 105881 }, null];
                      const currentLabel = stateLabels[state];
                      const nextTarget = state < 3 ? nextTargets[state] : null;
                      const diff = nextTarget ? nextTarget.fame - fame : null;
                      const isImminent = diff !== null && diff < 1000;
                      if (state === 0) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>-</span>
                            <div style={{ fontSize: '0.7rem', color: isImminent ? '#fef08a' : '#fb923c', background: isImminent ? 'rgba(234,179,8,0.15)' : 'rgba(251,146,60,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: isImminent ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(251,146,60,0.25)', whiteSpace: 'nowrap', fontWeight: isImminent ? 'bold' : 'normal' }}>
                              {isImminent ? '🔥' : '💀'} 매칭까지 <strong style={{ color: isImminent ? '#fde047' : '#f97316' }}>{diff.toLocaleString()}</strong>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid rgba(251,146,60,0.35)' }}>
                            💀 {currentLabel}
                          </span>
                          {nextTarget && (
                            <div style={{ fontSize: '0.7rem', color: isImminent ? '#fef08a' : '#fb923c', background: isImminent ? 'rgba(234,179,8,0.15)' : 'rgba(251,146,60,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: isImminent ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(251,146,60,0.2)', whiteSpace: 'nowrap', fontWeight: isImminent ? 'bold' : 'normal' }}>
                              {isImminent ? '🔥' : '▶'} {nextTarget.name}까지 <strong style={{ color: isImminent ? '#fde047' : '#f97316' }}>{diff.toLocaleString()}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td data-label="장비" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '-0.3px' }}>{c.equipment.setName}</div>
                    <div className={getTierClass(c.equipment.rarity)} style={{ fontSize: '0.7rem', letterSpacing: '-0.3px', marginTop: '2px' }}>
                      {c.equipment.gradeDesc} ({c.equipment.points})
                    </div>
                  </td>
                  <td data-label="서약" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '-0.3px' }}>{c.oath.setName}</div>
                    <div className={getTierClass(c.oath.rarity)} style={{ fontSize: '0.7rem', letterSpacing: '-0.3px', marginTop: '2px' }}>
                      {c.oath.gradeDesc} ({c.oath.points})
                    </div>
                  </td>
                  <td data-label="던담" style={{ textAlign: 'center' }}>
                    {c.charId ? (
                      <a 
                        href={`https://dundam.xyz/character?server=${c.base.server}&key=${c.charId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        조회 🔗
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td data-label="관리" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button type="button" className="danger" style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem' }} onClick={() => handleDelete(c.id)}>
                        🗑️
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

      {/* 캐릭터 아이템 현황 서브탭 */}
      {rosterSubTab === 'items' && (
        <section className="glass-panel" style={{ overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.5rem' }}>
            🎽 캐릭터 아이템 현황
            <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.6rem', fontWeight: 'normal' }}>수동 입력 정보 기준</span>
          </h3>
          {characters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>캐릭터를 먼저 추가해주세요.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', color: '#cbd5e1', tableLayout: 'auto', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#e2e8f0', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>캐릭터명</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#e2e8f0', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>직업</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>칭호</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#f472b6', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>오라</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#10b981', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>크리쳐</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#a78bfa', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>마부</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#fb923c', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>스위칭</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#818cf8', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>아바타</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#e879f9', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>피부</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#ef4444', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>무기압</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.07)' }}>수동설정</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const getRole = (c) => {
                    if (c.manual?.isManualRoleSet && c.manual?.role) return c.manual.role;
                    const bufferKeywords = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];
                    const jobName = c.base?.jobGrowName || c.base?.jobName || '';
                    return bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
                  };
                  const dealers = characters.filter(c => getRole(c) === 'dealer').sort((a,b) => b.base.fame - a.base.fame);
                  const buffers = characters.filter(c => getRole(c) === 'buffer').sort((a,b) => b.base.fame - a.base.fame);
                  const maxGroups = Math.max(Math.ceil(dealers.length / 3), buffers.length);
                  const groups = [];
                  for (let i = 0; i < maxGroups; i++) {
                    groups.push([dealers[i * 3] || null, dealers[i * 3 + 1] || null, dealers[i * 3 + 2] || null, buffers[i] || null]);
                  }
                  
                  return groups.flatMap((group, gIdx) => [
                    <tr key={`group-${gIdx}-header`} style={{ background: 'rgba(56,189,248,0.1)', borderBottom: '1px solid rgba(56,189,248,0.3)' }}>
                       <td colSpan="11" style={{ textAlign: 'left', fontWeight: 'bold', color: '#38bdf8', padding: '0.4rem 1rem' }}>그룹 {gIdx + 1}</td>
                    </tr>,
                    ...group.map((c, mIdx) => {
                      if (!c) {
                        return (
                          <tr key={`group-${gIdx}-empty-${mIdx}`}>
                            <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.2)' }}>
                              {mIdx < 3 ? '딜러 자리 비어있음' : '버퍼 자리 비어있음'}
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
                      {/* 캐릭터명 */}
                      {cell(<span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{c.base.charName}</span>)}
                      {/* 직업 */}
                      {cell(<span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{c.base.jobGrowName}</span>)}
                      {/* 칭호 */}
                      {cell(m.title ? <span style={{ color: '#38bdf8' }}>{m.title}</span> : dash)}
                      {/* 오라: 종류 + 엠블렘 */}
                      {cell(
                        (m.aura || m.auraEmblem) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.aura && <span style={{ color: '#f472b6' }}>{m.aura}</span>}
                            {m.auraEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.auraEmblem}]</span>}
                          </div>
                        ) : dash
                      )}
                      {/* 크리쳐: 종류 + 아티팩트 */}
                      {cell(
                        (m.creature || m.creatureArtifact) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.creature && <span style={{ color: '#10b981' }}>{m.creature}</span>}
                            {m.creatureArtifact && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.creatureArtifact}]</span>}
                          </div>
                        ) : dash
                      )}
                      {/* 마부 */}
                      {cell(m.enchant ? <span style={{ color: '#a78bfa' }}>{m.enchant}</span> : dash)}
                      {/* 스위칭: 버프레벨 + 편린 */}
                      {cell(
                        (m.buffLevel || m.buffAbyss) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.buffLevel && <span style={{ color: '#fb923c' }}>버프 {String(m.buffLevel).includes('레벨') ? m.buffLevel : `${m.buffLevel}레벨`}</span>}
                            {m.buffAbyss && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>편린 {String(m.buffAbyss).includes('개') ? m.buffAbyss : `${m.buffAbyss}개`}</span>}
                          </div>
                        ) : dash
                      )}
                      {/* 아바타: 종류 + 플엠 + 엠블렘 */}
                      {cell(
                        (m.avatar || m.platEmblem || m.emblem) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.avatar && <span style={{ color: '#818cf8' }}>{m.avatar}</span>}
                            {m.platEmblem && <span style={{ color: 'rgba(56,189,248,0.7)', fontSize: '0.7rem' }}>플:{m.platEmblem}</span>}
                            {m.emblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>일:{m.emblem}</span>}
                          </div>
                        ) : dash
                      )}
                      {/* 피부: 종류 + 소켓 + 엠블렘 */}
                      {cell(
                        (m.skinAvatar || m.skinSocket || m.skinEmblem) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.skinAvatar && <span style={{ color: '#e879f9' }}>{m.skinAvatar}</span>}
                            {m.skinSocket && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>소켓: {m.skinSocket}</span>}
                            {m.skinEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.skinEmblem}]</span>}
                          </div>
                        ) : dash
                      )}
                      {/* 무기압: 종류 + 소켓 + 엠블렘 */}
                      {cell(
                        (m.weaponAvatar || m.weaponSocket || m.weaponEmblem) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                            {m.weaponAvatar && <span style={{ color: '#ef4444' }}>{m.weaponAvatar}</span>}
                            {m.weaponSocket && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>소켓: {m.weaponSocket}</span>}
                            {m.weaponEmblem && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>[{m.weaponEmblem}]</span>}
                          </div>
                        ) : dash
                      )}
                      {/* 수동설정 버튼 */}
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'middle', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <button type="button" onClick={() => openManualModal(c)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', background: '#3b82f6', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>
                          ⚙️
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
              <h2 style={{ margin: 0 }}>성장 일지</h2>
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
                    현재 명성: <span style={{ color: '#fff' }}>{currentFame.toLocaleString()}</span>
                  </div>
                ) : null;
              })()}
            </div>
            <select value={historyFilterChar} onChange={e => setHistoryFilterChar(e.target.value)} style={{ padding: '0.2rem 0.1rem', minWidth: '200px' }}>
              <option value="">전체 캐릭터 보기</option>
              {characters.map(c => <option key={c.id} value={c.id}>{c.base.charName} ({c.base.jobGrowName})</option>)}
            </select>
          </div>

          {/* 그래프 뷰 모드 토글 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>그래프 기준:</span>
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
              >⚡ 이벤트 발생 기준</button>
              <button
                onClick={() => setChartViewMode('daily')}
                style={{
                  padding: '0.3rem 0.8rem', fontSize: '0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: chartViewMode === 'daily' ? 'rgba(167, 139, 250, 0.25)' : 'transparent',
                  color: chartViewMode === 'daily' ? '#a78bfa' : '#94a3b8',
                  fontWeight: chartViewMode === 'daily' ? 'bold' : 'normal',
                  boxShadow: chartViewMode === 'daily' ? '0 0 8px rgba(167,139,250,0.2)' : 'none'
                }}
              >📅 일자별 (매일 06:00 기준)</button>
            </div>
          </div>

          {chartData.length > 0 && (
            <div style={{ width: '100%', height: 300, marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="formattedTime" stroke="#94a3b8" fontSize={11} tickMargin={10} minTickGap={20} />
                  <YAxis domain={['dataMin', 'dataMax']} stroke="#94a3b8" fontSize={11} width={50} tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(1)}만` : v.toLocaleString()} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                     itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                     formatter={(value) => [value.toLocaleString(), historyFilterChar === '' ? '모험단 총 명성' : '명성']}
                     labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Line type={chartViewMode === 'daily' ? 'linear' : 'stepAfter'} dataKey="fame" stroke={chartViewMode === 'daily' ? '#a78bfa' : '#38bdf8'} strokeWidth={2} dot={{ r: 3, strokeWidth: 1, fill: '#0f172a' }} activeDot={{ r: 5 }} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {historyLogs.filter(L => historyFilterChar === '' || L.charId === historyFilterChar).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
              아직 변동 기록이 없습니다.<br/>서버에서 새로운 스펙업 정보가 감지되면 자동으로 이곳에 누적 기록됩니다!
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
                         <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '0.5rem' }}>🕒 {timeStr}</span>
                       </div>
                       <div style={{ display: 'flex', gap: '0.4rem' }}>
                         <button type="button" onClick={() => openEditLog(log)} style={{ padding: '0.2rem 0.4rem', background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>✏️ 수정</button>
                         <button type="button" onClick={() => deleteLog(log.id)} className="danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>❌ 삭제</button>
                       </div>
                     </div>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                       {log.fameChange && (
                          <div className="log-pill" style={{ borderColor: log.fameChange.new > log.fameChange.old ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)' }}>
                             <strong>명성:</strong> {log.fameChange.old.toLocaleString()} ➡️ <span style={{color: log.fameChange.new > log.fameChange.old ? '#4ade80' : '#f87171', fontWeight:'bold'}}>{log.fameChange.new.toLocaleString()} ({log.fameChange.new > log.fameChange.old ? '+' : ''}{(log.fameChange.new - log.fameChange.old).toLocaleString()})</span>
                          </div>
                       )}
                       {log.equipChange && (
                          <div className="log-pill" style={{ borderColor: log.equipChange.new > log.equipChange.old ? 'rgba(74, 222, 128, 0.4)' : (log.equipChange.new < log.equipChange.old ? 'rgba(248, 113, 113, 0.4)' : 'rgba(255,255,255,0.2)') }}>
                             <strong>장비:</strong> {log.equipChange.oldSet ? `[${log.equipChange.oldSet}] ` : ''}{log.equipChange.old}<GradeBadge points={log.equipChange.old}/> ➡️ {log.equipChange.newSet ? `[${log.equipChange.newSet}] ` : ''}<span style={{color: log.equipChange.new > log.equipChange.old ? '#4ade80' : (log.equipChange.new < log.equipChange.old ? '#f87171' : '#fff'), fontWeight:'bold'}}>{log.equipChange.new}<GradeBadge points={log.equipChange.new}/> ({log.equipChange.new > log.equipChange.old ? '+' : ''}{(log.equipChange.new - log.equipChange.old)})</span>
                          </div>
                       )}
                       {log.oathChange && (
                          <div className="log-pill" style={{ borderColor: log.oathChange.new > log.oathChange.old ? 'rgba(74, 222, 128, 0.4)' : (log.oathChange.new < log.oathChange.old ? 'rgba(248, 113, 113, 0.4)' : 'rgba(255,255,255,0.2)') }}>
                             <strong>서약:</strong> {log.oathChange.oldSet ? `[${log.oathChange.oldSet}] ` : ''}{log.oathChange.old}<GradeBadge points={log.oathChange.old}/> ➡️ {log.oathChange.newSet ? `[${log.oathChange.newSet}] ` : ''}<span style={{color: log.oathChange.new > log.oathChange.old ? '#4ade80' : (log.oathChange.new < log.oathChange.old ? '#f87171' : '#fff'), fontWeight:'bold'}}>{log.oathChange.new}<GradeBadge points={log.oathChange.new}/> ({log.oathChange.new > log.oathChange.old ? '+' : ''}{(log.oathChange.new - log.oathChange.old)})</span>
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
        // 공통 카드 렌더러
        const renderCard = (c, target, diff, emoji = '🚀', accentColor = '#38bdf8', currentBadge = null) => {
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
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>명성: <span style={{ color: isImminent ? '#fbbf24' : accentColor, fontWeight: 'bold' }}>{c.base.fame.toLocaleString()}</span></div>
                {currentBadge && <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>{currentBadge}</span>}
              </div>
              <div style={{
                background: isImminent ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                padding: '0.5rem', borderRadius: '6px', fontSize: '0.7rem',
                color: isImminent ? '#fef08a' : '#cbd5e1', textAlign: 'center', marginTop: 'auto',
                border: isImminent ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {isImminent ? '🔥' : emoji} <strong>{target.name}</strong> 컷까지 <strong style={{ color: '#fff', fontSize: '1.15em' }}>{diff.toLocaleString()}</strong> 남음{isImminent ? '!' : ''}
              </div>
            </div>
          );
        };

        const emptyMsg = (msg = '모든 조건을 달성했거나 대상 캐릭터가 없습니다.') => (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', gridColumn: '1 / -1', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>{msg}</div>
        );

        return (
          <section className="glass-panel" style={{ minHeight: '60vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0 }}>🎯 다음 던전 목표 현황</h2>
              {/* 상급던전 뷰 토글 - 상급던전 탭일 때만 표시 */}
              {imminentSubTab === 'dungeon' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setDungeonView('byDungeon')} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: dungeonView === 'byDungeon' ? 'rgba(147,197,253,0.2)' : 'rgba(255,255,255,0.04)', border: dungeonView === 'byDungeon' ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(255,255,255,0.1)', color: dungeonView === 'byDungeon' ? '#93c5fd' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>🗂️ 던전별 정렬</button>
                  <button onClick={() => setDungeonView('overall')} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: dungeonView === 'overall' ? 'rgba(147,197,253,0.2)' : 'rgba(255,255,255,0.04)', border: dungeonView === 'overall' ? '1px solid rgba(147,197,253,0.4)' : '1px solid rgba(255,255,255,0.1)', color: dungeonView === 'overall' ? '#93c5fd' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>📊 전체 정렬</button>
                </div>
              )}
              {imminentSubTab === 'apoc' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setApocView('byTier')} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: apocView === 'byTier' ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)', border: apocView === 'byTier' ? '1px solid rgba(251,146,60,0.4)' : '1px solid rgba(255,255,255,0.1)', color: apocView === 'byTier' ? '#fb923c' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>🗂️ 단계별 정렬</button>
                  <button onClick={() => setApocView('overall')} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem', background: apocView === 'overall' ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.04)', border: apocView === 'overall' ? '1px solid rgba(251,146,60,0.4)' : '1px solid rgba(255,255,255,0.1)', color: apocView === 'overall' ? '#fb923c' : '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>📊 전체 정렬</button>
                </div>
              )}
            </div>

            {/* 서브탭 버튼 */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <button className={`tab-btn ${imminentSubTab === 'dungeon' ? 'active' : ''}`} onClick={() => setImminentSubTab('dungeon')} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>🚀 상급던전</button>
              <button className={`tab-btn ${imminentSubTab === 'raid' ? 'active' : ''}`} onClick={() => setImminentSubTab('raid')} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>⚔️ 레이드</button>
              <button className={`tab-btn ${imminentSubTab === 'apoc' ? 'active' : ''}`} onClick={() => setImminentSubTab('apoc')} style={{ fontSize: '0.7rem', padding: '0.4rem 1.1rem' }}>💀 아포칼립스</button>
            </div>

            {/* ────────────── 상급던전 탭 ────────────── */}
            {imminentSubTab === 'dungeon' && (() => {
              // 던전 순서: 낮은→높은 fame 순 (ascending)
              const dungeons = [...ADVANCED_DUNGEONS].reverse(); // 낮은 명성부터

              if (dungeonView === 'overall') {
                // 전체 정렬: 다음 던전 남은 명성 오름차순
                const items = characters.map(c => {
                  const next = dungeons.find(d => d.fame > c.base.fame);
                  return { c, next };
                }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {items.length === 0 ? emptyMsg('모든 캐릭터가 최고 상급던전에 진입 가능합니다.') : items.map(({ c, next }) => renderCard(c, next, next.fame - c.base.fame, '🚀', '#93c5fd'))}
                  </div>
                );
              }

              // 던전별 정렬: 높은 명성(배교자의 성) → 낮은 명성(달이 잠긴 호수) 순 표시
              return (
                <div>
                  {ADVANCED_DUNGEONS.map((target) => {
                    // dungeons(오름차순)에서 target의 인덱스를 찾아 이전 던전을 계산
                    const targetIdx = dungeons.findIndex(d => d.name === target.name);
                    const prevDungeon = targetIdx > 0 ? dungeons[targetIdx - 1] : null;
                    // 이 던전에 아직 못 들어가고 (fame < target.fame)
                    // 그리고 이전 던전은 클리어했거나(fame >= prevDungeon.fame) 이전 던전 자체가 없는 경우
                    const eligible = characters.filter(c =>
                      c.base.fame < target.fame &&
                      (prevDungeon == null || c.base.fame >= prevDungeon.fame)
                    ).sort((a, b) => (target.fame - a.base.fame) - (target.fame - b.base.fame));

                    const currentDungeonName = prevDungeon ? prevDungeon.name : '진입 가능 던전 없음';

                    return (
                      <div key={target.name} style={{ marginBottom: '2rem' }}>
                        <h3 style={{ borderBottom: '1px solid rgba(147,197,253,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#93c5fd', fontSize: '0.7rem' }}>
                          🚀 {target.name} 진입 목표
                          <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>현재 최고: {currentDungeonName} | 잔여 {eligible.length}명</span>
                        </h3>
                        {eligible.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '8px', textAlign: 'center' }}>해당 캐릭터 없음</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                            {eligible.map(c => renderCard(c, target, target.fame - c.base.fame, '🚀', '#93c5fd', `현재: ${currentDungeonName}`))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ────────────── 레이드 탭 ────────────── */}
            {imminentSubTab === 'raid' && (() => {
              const getRole = (char) => {
                if (char.manual?.isManualRoleSet && char.manual?.role) return char.manual.role;
                const bufferKeywords = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];
                const jobName = char.base?.jobGrowName || char.base?.jobName || '';
                return bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
              };
              const dealers = characters.filter(c => getRole(c) === 'dealer').sort((a,b) => b.base.fame - a.base.fame);
              const buffers = characters.filter(c => getRole(c) === 'buffer').sort((a,b) => b.base.fame - a.base.fame);

              const raidItems = characters.map((c) => {
                const role = getRole(c);
                const rank = role === 'dealer' ? dealers.findIndex(x => x.id === c.id) : buffers.findIndex(x => x.id === c.id);
                const gIdx = rank === -1 ? 999 : (role === 'dealer' ? Math.floor(rank / 3) : rank);
                
                const filtered = RAIDS.filter(r => r.name !== '이내 황혼전' || gIdx < 2);
                const next = [...filtered].reverse().find(r => r.fame > c.base.fame);
                return { c, next };
              }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {raidItems.length === 0 ? emptyMsg('모든 레이드 조건을 달성했거나 대상 캐릭터가 없습니다.') : raidItems.map(({ c, next }) => renderCard(c, next, next.fame - c.base.fame, '⚔️', '#d8b4fe'))}
                </div>
              );
            })()}

            {/* ────────────── 아포칼립스 탭 ────────────── */}
            {imminentSubTab === 'apoc' && (() => {
              const apocTiers = [{ name: '매칭', fame: 73993 }, { name: '1단계', fame: 98171 }, { name: '2단계', fame: 105881 }];

              if (apocView === 'overall') {
                const apocItems = characters.map(c => {
                  const fame = c.base.fame;
                  const state = fame >= 105881 ? 3 : fame >= 98171 ? 2 : fame >= 73993 ? 1 : 0;
                  const currentLabel = ['없음', '매칭', '1단계', '2단계'][state];
                  const next = state < 3 ? apocTiers[state] : null;
                  return { c, state, currentLabel, next };
                }).filter(x => x.next).sort((a, b) => (a.next.fame - a.c.base.fame) - (b.next.fame - b.c.base.fame));
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {apocItems.length === 0 ? emptyMsg('모든 캐릭터가 아포칼립스 2단계에 진입 가능합니다.') : apocItems.map(({ c, state, currentLabel, next }) => renderCard(c, next, next.fame - c.base.fame, '💀', '#fb923c', state > 0 ? `현재: ${currentLabel}` : '미진입'))}
                  </div>
                );
              }

              // 단계별 정렬: 2단계 → 1단계 → 매칭 순서로 표시
              // 각 단계를 목표로 하는 캐릭터(현재 state = 목표 state - 1)만 표시
              const tierGroups = [
                { target: apocTiers[2], currentLabel: '1단계', minFame: 98171, maxFame: 105881 },  // 2단계 목표: 현재 1단계
                { target: apocTiers[1], currentLabel: '매칭',  minFame: 73993, maxFame: 98171  },  // 1단계 목표: 현재 매칭
                { target: apocTiers[0], currentLabel: '미진입', minFame: 0,     maxFame: 73993  },  // 매칭 목표: 현재 미진입
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
                          💀 {target.name} 진입 목표
                          <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>현재: {currentLabel} | 잔여 {eligible.length}명</span>
                        </h3>
                        {eligible.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '1rem', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '8px', textAlign: 'center' }}>해당 캐릭터 없음</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.8rem' }}>
                            {eligible.map(c => renderCard(c, target, target.fame - c.base.fame, '💀', '#fb923c', `현재: ${currentLabel}`))}
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
              <h2 style={{ margin: 0 }}>⚔️ 용병단 레벨</h2>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1rem 1.2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem' }}>현재 레벨</div>
                  <input type='number' min='1' value={mercLevelInput} onChange={e => setMercLevelInput(e.target.value)} placeholder='예: 6' style={{ width: '80px', padding: '0.4rem 0.6rem', textAlign: 'center' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.3rem' }}>다음 레벨 목표 포인트</div>
                  <input type='text' value={mercTargetInput} onChange={e => setMercTargetInput(e.target.value)} placeholder='예: 30000' style={{ width: '130px', padding: '0.4rem 0.6rem', textAlign: 'center' }} />
                </div>
                <button onClick={handleSaveMerc} style={{ padding: '0.4rem 1rem', background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer' }}>저장</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(234,179,8,0.1))', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '12px', padding: '1.2rem 2rem', textAlign: 'center', minWidth: '140px' }}>
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
                      <div style={{ height: '100%', width: `${progress}%`, borderRadius: '9px', background: progress >= 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : isNearTarget ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#fb923c,#f97316)', transition: 'width 0.6s ease', boxShadow: isNearTarget ? '0 0 10px rgba(251,191,36,0.5)' : '0 0 8px rgba(251,146,60,0.4)' }} />
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
      })()}

      {activeTab === 'pilgrimage' && (() => {
        const getCharForm = (id) => pilgrimageForm[id] || { 
          selected: false, startFatigue: '', pureGold: '',
          seal: '', condensedCore: '', crystal: '', flawlessCore: '', flawlessCrystal: '',
          sealVoucher: '', tradableSeal: '', sealVoucherBox: '', memo: '',
          secretTokens: [],
          secretRecipes: [],
          customItems: []
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
           if (!apiKey) { alert("API 키가 필요합니다."); return; }
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
             const baseItems = ['무결점 라이언 코어', '무결점 조화의 결정체', '닳아버린 순례의 증표', '순례의 인장(1회 교환 가능)', '순례의 인장(1회 교환 가능) 교환권 1개 상자'];
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
                alert("경매장 시세를 성공적으로 불러왔습니다!");
             } else {
                alert("불러오기 실패: " + data.error);
             }
           } catch(e) {
             console.error(e);
             alert("경매장 API 연동 중 오류가 발생했습니다.");
           }
           setIsFetchingPrices(false);
        };
        const addCharToken = (charId) => {
           const form = getCharForm(charId);
           updateCharForm(charId, 'secretTokens', [...form.secretTokens, { id: Date.now(), buyPrice: '' }]);
        };
        const updateCharToken = (charId, tokenId, val) => {
           const form = getCharForm(charId);
           updateCharForm(charId, 'secretTokens', form.secretTokens.map(t => t.id === tokenId ? { ...t, buyPrice: val } : t));
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
            alert('돌 캐릭터를 하나 이상 선택해주세요.');
            return;
          }
          
          const recordDetails = selectedIds.map(id => {
            const c = characters.find(char => char.id === id);
            const form = getCharForm(id);
            const fatigue = Number(form.startFatigue || 0);
            const runs = fatigue > 0 ? Math.ceil(fatigue / 8) + 4 : 0;
            
            // 귀속재화 가치 산출
            const sealValue = Number(form.seal || 0) * 5000;
            const boundCoreValue = Number(form.condensedCore || 0) * (auctionPrices['무결점 라이언 코어'] || 0);
            const boundCrystalValue = Number(form.crystal || 0) * (auctionPrices['무결점 조화의 결정체'] || 0);
            
            let customTradableValue = 0;
            (form.customItems || []).forEach(item => {
              const price = Number(item.price || 0) || (auctionPrices[item.name] || 0);
              customTradableValue += Number(item.quantity || 0) * price;
            });

            const totalBoundValue = sealValue + boundCoreValue + boundCrystalValue;
            
            // 교환 가능재화 가치 산출 (보정 전)
            const pureGoldInput = Number(form.pureGold || 0);
            const tradableCoreValue = Number(form.flawlessCore || 0) * (auctionPrices['무결점 라이언 코어'] || 0);
            const tradableCrystalValue = Number(form.flawlessCrystal || 0) * (auctionPrices['무결점 조화의 결정체'] || 0);
            
            // 인장 교환권 및 교환 가능 인장 가치 산출
            const priceTradableSeal = auctionPrices['순례의 인장(1회 교환 가능)'] || 0;
            const priceVoucherBox = auctionPrices['순례의 인장(1회 교환 가능) 교환권 1개 상자'] || 0;
            const voucherProfitPerItem = Math.max(0, (3 * priceTradableSeal) - 75000);
            const voucherProfitTotal = Number(form.sealVoucher || 0) * voucherProfitPerItem;
            const tradableSealValue = Number(form.tradableSeal || 0) * priceTradableSeal;
            const voucherBoxValue = Number(form.sealVoucherBox || 0) * priceVoucherBox;

            // 소모재화 비용 산출
            const tokenCost = runs * (auctionPrices['닳아버린 순례의 증표'] || 0);
            const potionCost = 0; // 영약 가치는 변동/불가로 0 처리
            const totalConsumedValue = tokenCost + potionCost;
            
            // 비밀상점 가치 산출 (캐릭터별)
            const tokenPrice = auctionPrices['닳아버린 순례의 증표'] || 0;
            let tokenProfit = 0;
            let secretShopGoldSpent = 0;

            (form.secretTokens || []).forEach(t => {
              const bp = Number(t.buyPrice || 0);
              if (bp > 0) {
                 secretShopGoldSpent += bp;
                 tokenProfit += (tokenPrice - bp);
              }
            });

            let recipeProfit = 0;
            let recipeSealCost = 0;
            (form.secretRecipes || []).forEach(r => {
               const bp = Number(r.buyPrice || 0);
               const seals = Number(r.sealCost || 0);
               const sp = Number(r.sellPrice || 0);
               if (bp > 0 || sp > 0) {
                 if (bp > 0) secretShopGoldSpent += bp;
                 const sealVal = seals * 5000;
                 recipeSealCost += sealVal;
                 recipeProfit += (sp - bp - sealVal);
               }
            });

            // 순 골드 보정 (상점 지출액 복원)
            const restoredPureGold = pureGoldInput + secretShopGoldSpent;

            // 최종 교환 가능재화 가치 (보정된 순골드 + 코어/결정체 + 인장류 수익 + 상점 순수익 + 커스텀)
            const finalTradableValue = restoredPureGold + tradableCoreValue + tradableCrystalValue + voucherProfitTotal + tradableSealValue + voucherBoxValue + tokenProfit + recipeProfit + customTradableValue;
            const finalBoundValue = totalBoundValue - recipeSealCost;
            const totalProfit = finalBoundValue + finalTradableValue - totalConsumedValue;

            return {
              charId: id,
              charName: c ? c.base.charName : '알 수 없음',
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
                potion: 1
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
          
          // 선택된 캐릭터들 초기화
          const resetForm = { ...pilgrimageForm };
          selectedIds.forEach(id => { resetForm[id] = { ...getCharForm(id), selected: false }; });
          setPilgrimageForm(resetForm);
          
          if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, optsRef.current, mercRef.current, true, updated);
        };

        const handleDeletePilgrimage = (id) => {
          if (!window.confirm("이 기록을 삭제하시겠습니까?")) return;
          const updated = pilgrimageHistory.filter(r => r.id !== id);
          setPilgrimageHistory(updated);
          localStorage.setItem('DNF_PILGRIMAGE_HISTORY', JSON.stringify(updated));
          
          if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, optsRef.current, mercRef.current, true, updated);
        };

        return (
          <section className='glass-panel' style={{ minHeight: '60vh' }}>
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
                    <button onClick={() => setShowAuctionPricesModal(true)} style={{ padding: '0.5rem 1rem', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                      단가 확인
                    </button>
                  </div>
                  <button onClick={handleSavePilgrimage} style={{ padding: '0.5rem 1.5rem', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', borderRadius: '4px', fontSize: '0.7rem' }}>선택 캐릭터 저장</button>
                </div>
            </div>

            {/* Character Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
               <h3 style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.8rem' }}>참여 캐릭터 선택 (클릭하여 추가/제거)</h3>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {characters.map(c => {
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
                    <th colSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#f87171', fontSize: '0.7rem' }}>소모 재화</th>
                    <th colSpan="2" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', fontSize: '0.7rem' }}>비밀 상점 구매</th>
                    <th colSpan="4" style={{ padding: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fb923c', fontSize: '0.7rem' }}>가치 산출 (골드)</th>
                    
                  </tr>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', lineHeight: '1.2' }}>
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>순 골드</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>순례의<br/>인장</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>순례의 인장<br/>(1회 교환 가능)</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>순례의 인장<br/>(1회 교환 가능)<br/>교환권</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>순례의 인장<br/>(1회 교환 가능)<br/>교환권 1개 상자</th>
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>응축된<br/>라이언 코어</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>무결점<br/>라이언 코어</th>
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>빛나는 조화의<br/>결정체</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>무결점 조화의<br/>결정체</th>
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>닳아버린<br/>순례의 증표</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>피로 회복의<br/>영약</th>
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>닳아버린<br/>순례의 증표 (단가)</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>레시피 (구매/순례의 인장/판매)</th>
                    <th style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>귀속<br/>가치</th>
                    <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>교환<br/>가치</th>
                    <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>순수익<br/>(귀속 포함)</th>
                    <th style={{ padding: '0.2rem 0.1rem', color: '#38bdf8', fontSize: '0.7rem' }}>순수익<br/>(귀속 제외)</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                     
                      const getRole = (c) => {
                        if (c.manual?.isManualRoleSet && c.manual?.role) return c.manual.role;
                        const bufferKeywords = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];
                        const jobName = c.base?.jobGrowName || c.base?.jobName || '';
                        return bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer';
                      };
                      const dealersAll = characters.filter(c => getRole(c) === 'dealer').sort((a,b) => b.base.fame - a.base.fame);
                      const buffersAll = characters.filter(c => getRole(c) === 'buffer').sort((a,b) => b.base.fame - a.base.fame);
                      const sortedAll = [];
                      const mMaxGroups = Math.max(Math.ceil(dealersAll.length / 3), buffersAll.length);
                      for (let i = 0; i < mMaxGroups; i++) {
                        if (dealersAll[i * 3]) sortedAll.push(dealersAll[i * 3]);
                      if (dealersAll[i * 3 + 1]) sortedAll.push(dealersAll[i * 3 + 1]);
                        if (dealersAll[i * 3 + 2]) sortedAll.push(dealersAll[i * 3 + 2]);
                        if (buffersAll[i]) sortedAll.push(buffersAll[i]);
                      }
                      const selectedChars = sortedAll.filter(c => getCharForm(c.id).selected);
                     if (selectedChars.length === 0) {
                       return (
                         <tr>
                           <td colSpan="21" style={{ padding: '2rem', color: 'var(--text-muted)' }}>위에서 참여할 캐릭터를 선택해주세요.</td>
                         </tr>
                       );
                     }

                     let sumFatigue = 0, sumRuns = 0;
                     let sumPureGold = 0, sumSeal = 0, sumCondensedCore = 0, sumCrystal = 0, sumFlawlessCore = 0, sumFlawlessCrystal = 0;
                     let sumSealVoucher = 0, sumTradableSeal = 0, sumSealVoucherBox = 0;
                     let sumTokens = 0, sumPotions = 0;
                     let sumBoundValue = 0, sumTradableValue = 0, sumTotalProfit = 0, sumProfitExclBound = 0;

                     const rows = selectedChars.map((c, idx) => {
                       const form = getCharForm(c.id);
                    const fatigue = Number(form.startFatigue || 0);
                    const runs = fatigue > 0 ? Math.ceil(fatigue / 8) + 4 : 0;
                    const isSelected = form.selected;
                    const rowStyle = { borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(56, 189, 248, 0.08)' : (idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'), transition: 'background 0.2s' };
                    const inputStyle = { width: '55px', padding: '0.2rem 0.1rem', fontSize: '0.7rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' };
                    
                    const sealValue = Number(form.seal || 0) * 5000;
                    const boundCoreValue = Number(form.condensedCore || 0) * (auctionPrices['무결점 라이언 코어'] || 0);
                    const boundCrystalValue = Number(form.crystal || 0) * (auctionPrices['무결점 조화의 결정체'] || 0);
                    
                    let customTradableValue = 0;
                    (form.customItems || []).forEach(item => {
                      const price = Number(item.price || 0) || (auctionPrices[item.name] || 0);
                      customTradableValue += Number(item.quantity || 0) * price;
                    });

                    const totalBoundValue = sealValue + boundCoreValue + boundCrystalValue;
                    
                    const pureGoldInput = Number(form.pureGold || 0);
                    const tradableCoreValue = Number(form.flawlessCore || 0) * (auctionPrices['무결점 라이언 코어'] || 0);
                    const tradableCrystalValue = Number(form.flawlessCrystal || 0) * (auctionPrices['무결점 조화의 결정체'] || 0);
                    
                    // 인장 교환권 및 교환 가능 인장 가치 산출
                    const priceTradableSeal = auctionPrices['순례의 인장(1회 교환 가능)'] || 0;
                    const priceVoucherBox = auctionPrices['순례의 인장(1회 교환 가능) 교환권 1개 상자'] || 0;
                    const voucherProfitPerItem = Math.max(0, (3 * priceTradableSeal) - 75000);
                    const voucherProfitTotal = Number(form.sealVoucher || 0) * voucherProfitPerItem;
                    const tradableSealValue = Number(form.tradableSeal || 0) * priceTradableSeal;
                    const voucherBoxValue = Number(form.sealVoucherBox || 0) * priceVoucherBox;
                    
                    const tokenCost = runs * (auctionPrices['닳아버린 순례의 증표'] || 0);
                    const totalConsumedValue = tokenCost;

                    // 캐릭터별 비밀상점 가치 산출
                    const tokenPrice = auctionPrices['닳아버린 순례의 증표'] || 0;
                    let tokenProfit = 0;
                    let secretShopGoldSpent = 0;
                    
                    (form.secretTokens || []).forEach(t => {
                      const bp = Number(t.buyPrice || 0);
                      if (bp > 0) {
                         secretShopGoldSpent += bp;
                         tokenProfit += (tokenPrice - bp);
                      }
                    });

                    let recipeProfit = 0;
                    let recipeSealCost = 0;
                    (form.secretRecipes || []).forEach(r => {
                       const bp = Number(r.buyPrice || 0);
                       const seals = Number(r.sealCost || 0);
                       const sp = Number(r.sellPrice || 0);
                       if (bp > 0 || sp > 0) {
                         if (bp > 0) secretShopGoldSpent += bp;
                         const sealVal = seals * 5000;
                         recipeSealCost += sealVal;
                         recipeProfit += (sp - bp - sealVal);
                       }
                    });

                    // 순 골드 보정 (상점 지출액 복원)
                    const restoredPureGold = pureGoldInput + secretShopGoldSpent;

                    // 최종 교환 가능재화 가치
                    const finalTradableValue = restoredPureGold + tradableCoreValue + tradableCrystalValue + voucherProfitTotal + tradableSealValue + voucherBoxValue + tokenProfit + recipeProfit + customTradableValue;
                    const finalBoundValue = totalBoundValue - recipeSealCost;
                    const totalProfit = finalBoundValue + finalTradableValue - totalConsumedValue;
                    
                    // 합계 누적
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
                        sumPotions += 1;
                        sumBoundValue += finalBoundValue;
                        sumTradableValue += finalTradableValue;
                        sumTotalProfit += totalProfit;
                        sumProfitExclBound += (finalTradableValue - totalConsumedValue);

                        return (
                          <tr key={c.id} style={rowStyle}>
                            {/* 1 */} <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: '#38bdf8', cursor: 'pointer' }} onClick={() => togglePilgrimageChar(c.id)} title="클릭 시 목록에서 제거">
                              <span style={{ fontSize: '0.7rem' }}>{c.base.charName}</span> <span style={{fontSize: '0.7rem', color:'rgba(255,255,255,0.3)', fontWeight:'normal'}}>❌</span>
                            </td>
                            {/* 2 */} <td style={{ padding: '0.2rem 0.1rem' }}><input type="number" style={inputStyle} value={form.startFatigue} onChange={e => updateCharForm(c.id, 'startFatigue', e.target.value)} /></td>
                            {/* 3 */} <td style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: '#fbbf24' }}>{runs}</td>
                            {/* 4 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                              <button onClick={() => setActiveLootModal({ charId: c.id })} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: 'rgba(74, 222, 128, 0.2)', border: '1px solid rgba(74, 222, 128, 0.4)', color: '#4ade80', borderRadius: '4px', cursor: 'pointer' }}>재화 입력</button>
                            </td>
                            {/* 5 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }} title={secretShopGoldSpent > 0 ? `💡 상점 지출액(${secretShopGoldSpent.toLocaleString()})이 보정된 실제 드랍 골드: ${restoredPureGold.toLocaleString()}` : ''}>{restoredPureGold ? Number(restoredPureGold).toLocaleString() : '-'}</td>
                            {/* 6 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.seal ? Number(form.seal).toLocaleString() : '-'}</td>
                            {/* 7 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.tradableSeal ? Number(form.tradableSeal).toLocaleString() : '-'}</td>
                            {/* 8 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.sealVoucher ? Number(form.sealVoucher).toLocaleString() : '-'}</td>
                            {/* 9 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.sealVoucherBox ? Number(form.sealVoucherBox).toLocaleString() : '-'}</td>
                            {/* 10 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{form.condensedCore ? Number(form.condensedCore).toLocaleString() : '-'}</td>
                            {/* 11 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.flawlessCore ? Number(form.flawlessCore).toLocaleString() : '-'}</td>
                            {/* 12 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{form.crystal ? Number(form.crystal).toLocaleString() : '-'}</td>
                            {/* 13 */} <td style={{ padding: '0.2rem 0.1rem' }}>{form.flawlessCrystal ? Number(form.flawlessCrystal).toLocaleString() : '-'}</td>
                            
                            {/* 14 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5' }}>{runs}</td>
                            {/* 15 */} <td style={{ padding: '0.2rem 0.1rem', color: '#fca5a5' }}>1</td>
                            
                            {/* 16 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', verticalAlign: 'middle', minWidth: '80px' }}>
                              <button onClick={() => setActiveSecretShopModal({ charId: c.id, type: 'token' })} style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: 'rgba(167, 139, 250, 0.2)', border: '1px solid rgba(167, 139, 250, 0.4)', color: '#a78bfa', borderRadius: '4px', cursor: 'pointer' }}>
                                + 순례의 인장 {form.secretTokens?.length > 0 ? `(${form.secretTokens.length})` : ''}
                              </button>
                            </td>
                            {/* 17 */} <td style={{ padding: '0.2rem 0.1rem', verticalAlign: 'middle', minWidth: '80px' }}>
                              <button onClick={() => setActiveSecretShopModal({ charId: c.id, type: 'recipe' })} style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: 'rgba(167, 139, 250, 0.2)', border: '1px solid rgba(167, 139, 250, 0.4)', color: '#a78bfa', borderRadius: '4px', cursor: 'pointer' }}>
                                + 레시피 {form.secretRecipes?.length > 0 ? `(${form.secretRecipes.length})` : ''}
                              </button>
                            </td>

                            {/* 18 */} <td style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', verticalAlign: 'middle' }}>{finalBoundValue > 0 ? finalBoundValue.toLocaleString() : '-'}</td>
                            {/* 19 */} <td style={{ padding: '0.2rem 0.1rem', color: '#e2e8f0', verticalAlign: 'middle' }}>{finalTradableValue > 0 ? finalTradableValue.toLocaleString() : '-'}</td>
                            {/* 20 */} <td 
                              style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: (finalBoundValue + finalTradableValue - totalConsumedValue) > 0 ? '#4ade80' : ((finalBoundValue + finalTradableValue - totalConsumedValue) < 0 ? '#f87171' : '#cbd5e1'), verticalAlign: 'middle', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => setCalcDetail({
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
                                  customTradable: customTradableValue
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
                              {(finalBoundValue + finalTradableValue - totalConsumedValue) !== 0 ? (finalBoundValue + finalTradableValue - totalConsumedValue).toLocaleString() : '-'}
                            </td>
                            {/* 21 */} <td 
                              style={{ padding: '0.2rem 0.1rem', fontWeight: 'bold', color: (finalTradableValue - totalConsumedValue) > 0 ? '#38bdf8' : ((finalTradableValue - totalConsumedValue) < 0 ? '#f87171' : '#cbd5e1'), verticalAlign: 'middle', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => setCalcDetail({
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
                                  customTradable: customTradableValue
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
                              {(finalTradableValue - totalConsumedValue) !== 0 ? (finalTradableValue - totalConsumedValue).toLocaleString() : '-'}
                            </td>
                            
                          </tr>
                        );
                     });

                     return (
                        <>
                          {rows}
                          <tr style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', borderTop: '2px solid rgba(255,255,255,0.2)' }}>
                            {/* 1 */} <td style={{ padding: '0.5rem', color: '#e2e8f0' }}>총합계 ({selectedChars.length})</td>
                            {/* 2 */} <td style={{ padding: '0.5rem', color: '#e2e8f0' }}>{sumFatigue > 0 ? sumFatigue : '-'}</td>
                            {/* 3 */} <td style={{ padding: '0.5rem', color: '#fbbf24' }}>{sumRuns > 0 ? sumRuns : '-'}</td>
                            {/* 4 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>-</td>
                            {/* 5 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }} title="비밀상점 지출액이 보정된 실제 드랍 골드의 총합">{sumPureGold > 0 ? sumPureGold.toLocaleString() : '-'}</td>
                            {/* 6 */} <td style={{ padding: '0.5rem' }}>{sumSeal > 0 ? sumSeal.toLocaleString() : '-'}</td>
                            {/* 7 */} <td style={{ padding: '0.5rem' }}>{sumTradableSeal > 0 ? sumTradableSeal.toLocaleString() : '-'}</td>
                            {/* 8 */} <td style={{ padding: '0.5rem' }}>{sumSealVoucher > 0 ? sumSealVoucher.toLocaleString() : '-'}</td>
                            {/* 9 */} <td style={{ padding: '0.5rem' }}>{sumSealVoucherBox > 0 ? sumSealVoucherBox.toLocaleString() : '-'}</td>
                            {/* 10 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{sumCondensedCore > 0 ? sumCondensedCore.toLocaleString() : '-'}</td>
                            {/* 11 */} <td style={{ padding: '0.5rem' }}>{sumFlawlessCore > 0 ? sumFlawlessCore.toLocaleString() : '-'}</td>
                            {/* 12 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{sumCrystal > 0 ? sumCrystal.toLocaleString() : '-'}</td>
                            {/* 13 */} <td style={{ padding: '0.5rem' }}>{sumFlawlessCrystal > 0 ? sumFlawlessCrystal.toLocaleString() : '-'}</td>
                            {/* 14 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fca5a5' }}>{sumTokens > 0 ? sumTokens : '-'}</td>
                            {/* 15 */} <td style={{ padding: '0.5rem', color: '#fca5a5' }}>{sumPotions > 0 ? sumPotions : '-'}</td>
                            {/* 16,17 */} <td colSpan="2" style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa', textAlign: 'center' }}>-</td>
                            {/* 18 */} <td style={{ padding: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', color: '#fb923c' }}>{sumBoundValue > 0 ? sumBoundValue.toLocaleString() : '-'}</td>
                            {/* 19 */} <td style={{ padding: '0.5rem', color: '#fb923c' }}>{sumTradableValue > 0 ? sumTradableValue.toLocaleString() : '-'}</td>
                            {/* 20 */} <td style={{ padding: '0.5rem', color: sumTotalProfit > 0 ? '#4ade80' : (sumTotalProfit < 0 ? '#f87171' : '#cbd5e1') }}>{sumTotalProfit !== 0 ? sumTotalProfit.toLocaleString() : '-'}</td>
                            {/* 21 */} <td style={{ padding: '0.5rem', color: sumProfitExclBound > 0 ? '#38bdf8' : (sumProfitExclBound < 0 ? '#f87171' : '#cbd5e1') }}>{sumProfitExclBound !== 0 ? sumProfitExclBound.toLocaleString() : '-'}</td>
                            
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
            
            <LootModalComponent activeLootModal={activeLootModal} setActiveLootModal={setActiveLootModal} characters={characters} getCharForm={getCharForm} updateCharForm={updateCharForm} apiKey={apiKey} auctionPrices={auctionPrices} setAuctionPrices={setAuctionPrices} />
            
            
            {calcDetail && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
                    📊 상세 가치 산출 내역 ({calcDetail.charName})
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem' }}>
                    {/* Bound Section */}
                    <div>
                      <h4 style={{ color: '#fb923c', marginBottom: '0.5rem', fontSize: '0.7rem' }}>📦 귀속 가치 (Bound)</h4>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>순례의 인장 ({calcDetail.items.seal}개)</span>
                          <span>{calcDetail.breakdown.seal.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>응축된 라이언 코어 ({calcDetail.items.core}개)</span>
                          <span>{calcDetail.breakdown.core.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                          <span>빛나는 조화의 결정체 ({calcDetail.items.crystal}개)</span>
                          <span>{calcDetail.breakdown.crystal.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fb923c' }}>
                          <span>귀속 합계</span>
                          <span>{calcDetail.totals.bound.toLocaleString()} G</span>
                        </div>
                      </div>
                    </div>

                    {/* Tradable Section */}
                    <div>
                      <h4 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontSize: '0.7rem' }}>💰 교환 가능 가치 (Tradable)</h4>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span title="유저 입력값">순 골드 (입력값)</span>
                          <span>{calcDetail.items.pureGold.toLocaleString()} G</span>
                        </div>
                        {calcDetail.breakdown.secretShopGoldSpent > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <span title="비밀상점 구매로 인해 줄어든 순골드 수치를 복구한 값입니다.">비밀상점 지출액 보정</span>
                            <span>+{calcDetail.breakdown.secretShopGoldSpent.toLocaleString()} G</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>무결점 라이언 코어 ({calcDetail.items.flawlessCore}개)</span>
                          <span>{calcDetail.breakdown.flawlessCore.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>무결점 조화의 결정체 ({calcDetail.items.flawlessCrystal}개)</span>
                          <span>{calcDetail.breakdown.flawlessCrystal.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>순례의 인장(1회 교환 가능) 교환권 수익 ({calcDetail.items.sealVoucher}개)</span>
                          <span>{calcDetail.breakdown.sealVoucher.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>순례의 인장(1회 교환 가능) 교환권 1개 상자 ({calcDetail.items.sealVoucherBox}개)</span>
                          <span>{calcDetail.breakdown.sealVoucherBox.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>순례의 인장(1회 교환 가능) ({calcDetail.items.tradableSeal}개)</span>
                          <span>{calcDetail.breakdown.tradableSeal.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span>비밀상점 레시피 수익</span>
                          <span>{calcDetail.breakdown.recipeProfit.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                          <span>닳아버린 순례의 증표 단가 이득</span>
                          <span>{calcDetail.breakdown.tokenProfit.toLocaleString()} G</span>
                        </div>
                        {calcDetail.breakdown.customTradable > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                            <span>커스텀 추가 항목 (교환)</span>
                            <span>{calcDetail.breakdown.customTradable.toLocaleString()} G</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#38bdf8' }}>
                          <span>교환 가능 합계</span>
                          <span>{calcDetail.totals.tradable.toLocaleString()} G</span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Section */}
                    <div>
                      <h4 style={{ color: '#f87171', marginBottom: '0.5rem', fontSize: '0.7rem' }}>📉 소모 비용 (Costs)</h4>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.7rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem', marginBottom: '0.3rem' }}>
                          <span>닳아버린 순례의 증표 소모 ({calcDetail.items.runs}개)</span>
                          <span>-{calcDetail.breakdown.tokenCost.toLocaleString()} G</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#f87171' }}>
                          <span>소모 합계</span>
                          <span>-{calcDetail.totals.consumed.toLocaleString()} G</span>
                        </div>
                      </div>
                    </div>

                    {/* Final Results */}
                    <div style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.5rem' }}>
                        <span>순수익 (귀속 제외)</span>
                        <span>{calcDetail.final.excludingBound.toLocaleString()} G</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', color: '#4ade80' }}>
                        <span>순수익 (귀속 포함)</span>
                        <span>{calcDetail.final.includingBound.toLocaleString()} G</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.8rem', fontStyle: 'italic', textAlign: 'right' }}>
                        * 순수익(귀속 제외) = 교환 가능 합계 - 소모 합계<br/>
                        * 순수익(귀속 포함) = 귀속 합계 + 교환 가능 합계 - 소모 합계
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setCalcDetail(null)} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>확인</button>
                  </div>
                </div>
              </div>
            )}
            {showAuctionPricesModal && (() => {
              const baseItems = ['\ubb34\uacb0\uc810 \ub77c\uc774\uc5b8 \ucf54\uc5b4', '\ubb34\uacb0\uc810 \uc870\ud654\uc758 \uacb0\uc815\uccb4', '\ub2f3\uc544\ubc84\ub9b0 \uc21c\ub840\uc758 \uc99d\ud45c', '\uc21c\ub840\uc758 \uc778\uc7a5(1\ud68c \uad50\ud658 \uac00\ub2a5)', '\uc21c\ub840\uc758 \uc778\uc7a5(1\ud68c \uad50\ud658 \uac00\ub2a5) \uad50\ud658\uad8c 1\uac1c \uc0c1\uc790'];
              return (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '500px', width: '90%' }}>
                   <h3 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     ⚖️ 현재 적용된 경매장 단가
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
                            }} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 0.2rem', flexShrink: 0 }} title="목록에서 삭제">×</button>
                          )}
                          {isBase && <span style={{ width: '1.2rem' }}></span>}
                        </div>
                       );
                     })}
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowAuctionPricesModal(false)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>닫기</button>
                   </div>
                </div>
              </div>
              );
            })()}

            <h3 style={{ fontSize: '1.1rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>히스토리</h3>
            {pilgrimageHistory.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>아직 등록된 기록이 없습니다.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pilgrimageHistory.map(record => (
                  <div key={record.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>📅 {new Date(record.date).toLocaleString()}</span>
                      <button className="danger" onClick={() => handleDeletePilgrimage(record.id)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>기록 삭제</button>
                    </div>
                    <div style={{ overflowX: 'auto', padding: '1rem' }}>
                       {record.chars ? (
                         <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                           [구버전 기록] 캐릭터: {record.chars.join(', ')} / 획득: {record.acquired} / 소모: {record.consumed}
                         </div>
                       ) : (
                         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                           <thead>
                             <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>
                               <th style={{ padding: '0.2rem 0.1rem', textAlign: 'left', fontSize: '0.7rem' }}>캐릭터</th>
                               <th style={{ padding: '0.2rem 0.1rem', fontSize: '0.7rem' }}>피로도(판수)</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>순 골드</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>순례의 인장</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>순례의 인장(1회 교환 가능)</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>순례의 인장(1회 교환 가능) 교환권</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>순례의 인장(1회 교환 가능) 교환권 1개 상자</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>응축된 라이언 코어</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>무결점 라이언 코어</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>빛나는 조화의 결정체</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#4ade80', fontSize: '0.7rem' }}>무결점 조화의 결정체</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#fb923c', fontSize: '0.7rem' }}>귀속 가치</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#fb923c', fontSize: '0.7rem' }}>교환 가치</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#fb923c', fontSize: '0.7rem' }}>총 수익</th>
                               <th style={{ padding: '0.2rem 0.1rem', color: '#94a3b8', fontSize: '0.7rem' }}>메모</th>
                             </tr>
                           </thead>
                           <tbody>
                             {record.details.map((d, i) => {
                               const profit = d.values?.profit || 0;
                               const bound = d.values?.bound || 0;
                               const tradable = d.values?.tradable || 0;
                               
                               return (
                                 <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                   <td style={{ padding: '0.25rem', color: '#e2e8f0', fontWeight: 'bold', textAlign: 'left', fontSize: '0.7rem' }}>{d.charName} <span style={{fontSize: '0.7rem', color:'#64748b', fontWeight:'normal'}}>({d.jobName})</span></td>
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
                                   <td style={{ padding: '0.25rem', color: bound > 0 ? '#fb923c' : '#64748b' }}>{bound > 0 ? bound.toLocaleString() : '-'}</td>
                                   <td style={{ padding: '0.25rem', color: tradable > 0 ? '#fb923c' : '#64748b' }}>{tradable > 0 ? tradable.toLocaleString() : '-'}</td>
                                   <td style={{ padding: '0.25rem', fontWeight: 'bold', color: profit > 0 ? '#4ade80' : (profit < 0 ? '#f87171' : '#64748b') }}>{profit !== 0 ? profit.toLocaleString() : '-'}</td>
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
                               <h5 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.7rem' }}>비밀상점 정산 내역</h5>
                               <div style={{ fontSize: '0.7rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                 <div>- 닳아버린 순례의 증표 구매 이득 (교환 가치 반영): <span style={{ color: '#4ade80' }}>+{record.sessionTotals.tokenProfit?.toLocaleString() || 0}</span></div>
                                 <div>- 레시피 순수익 (교환 가치 반영): <span style={{ color: '#4ade80' }}>+{record.sessionTotals.recipeProfit?.toLocaleString() || 0}</span></div>
                                 <div>- 레시피 순례의 인장 소모 비용 (귀속 가치 차감): <span style={{ color: '#f87171' }}>-{record.sessionTotals.recipeSealCost?.toLocaleString() || 0}</span></div>
                               </div>
                             </div>
                             <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'right' }}>
                               <h5 style={{ margin: '0 0 0.2rem 0', color: '#94a3b8', fontSize: '0.7rem' }}>이번 순례 총 결산</h5>
                               <div style={{ fontSize: '0.7rem' }}>총 귀속 가치: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{record.sessionTotals.bound?.toLocaleString()}</span></div>
                               <div style={{ fontSize: '0.7rem' }}>총 교환 가치: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{record.sessionTotals.tradable?.toLocaleString()}</span></div>
                               <div style={{ fontSize: '0.7rem', marginTop: '0.3rem' }}>
                                 최종 순수익: <span style={{ color: record.sessionTotals.profit > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{record.sessionTotals.profit?.toLocaleString()}</span>
                               </div>
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
            <h2 style={{marginTop: 0}}>성장 일지 수동 교정</h2>
            
            {editLogForm.fameChange && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>명성치 수정</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="number" style={{ width: '100%' }} value={editLogForm.fameChange.old} onChange={e => setEditLogForm({...editLogForm, fameChange: {...editLogForm.fameChange, old: Number(e.target.value)}})} />
                  <span>➡️</span>
                  <input type="number" style={{ width: '100%' }} value={editLogForm.fameChange.new} onChange={e => setEditLogForm({...editLogForm, fameChange: {...editLogForm.fameChange, new: Number(e.target.value)}})} />
                </div>
              </div>
            )}

            {editLogForm.equipChange && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>장비점수 및 세트 수정</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom:'0.5rem' }}>
                  <input type="text" style={{ width: '45%' }} value={editLogForm.equipChange.oldSet || ''} placeholder="이전세트" onChange={e => setEditLogForm({...editLogForm, equipChange: {...editLogForm.equipChange, oldSet: e.target.value}})} />
                  <span>➡️</span>
                  <input type="text" style={{ width: '45%' }} value={editLogForm.equipChange.newSet || ''} placeholder="신규세트" onChange={e => setEditLogForm({...editLogForm, equipChange: {...editLogForm.equipChange, newSet: e.target.value}})} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="number" style={{ width: '45%' }} value={editLogForm.equipChange.old} placeholder="이전점수" onChange={e => setEditLogForm({...editLogForm, equipChange: {...editLogForm.equipChange, old: Number(e.target.value)}})} />
                  <span>➡️</span>
                  <input type="number" style={{ width: '45%' }} value={editLogForm.equipChange.new} placeholder="신규점수" onChange={e => setEditLogForm({...editLogForm, equipChange: {...editLogForm.equipChange, new: Number(e.target.value)}})} />
                </div>
              </div>
            )}

            {editLogForm.oathChange && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>서약점수 및 세트 수정</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom:'0.5rem' }}>
                  <input type="text" style={{ width: '45%' }} value={editLogForm.oathChange.oldSet || ''} placeholder="이전서약" onChange={e => setEditLogForm({...editLogForm, oathChange: {...editLogForm.oathChange, oldSet: e.target.value}})} />
                  <span>➡️</span>
                  <input type="text" style={{ width: '45%' }} value={editLogForm.oathChange.newSet || ''} placeholder="신규서약" onChange={e => setEditLogForm({...editLogForm, oathChange: {...editLogForm.oathChange, newSet: e.target.value}})} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="number" style={{ width: '45%' }} value={editLogForm.oathChange.old} placeholder="이전점수" onChange={e => setEditLogForm({...editLogForm, oathChange: {...editLogForm.oathChange, old: Number(e.target.value)}})} />
                  <span>➡️</span>
                  <input type="number" style={{ width: '45%' }} value={editLogForm.oathChange.new} placeholder="신규점수" onChange={e => setEditLogForm({...editLogForm, oathChange: {...editLogForm.oathChange, new: Number(e.target.value)}})} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={() => setEditingLogId(null)} className="danger">취소</button>
              <button type="button" onClick={saveEditLog}>저장</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2 style={{ marginTop: 0 }}>API 키 설정</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              네오플 오픈 API 키를 입력해주세요.<br/>이 키는 브라우저 저장소에만 남으며 매 조회 시 백엔드로 안전하게 전달됩니다.
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
                  취소
                </button>
              )}
              <button type="button" onClick={handleSaveSettings}>저장</button>
            </div>
          </div>
        </div>
      )}

      {manualModalChar && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '650px', width: '95%' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>[{manualModalChar.base.charName}] 수동 제원 설정</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.5rem' }}>상단 🛠️ 탭에서 구성한 목록에서만 선택 가능합니다.</p>
            <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <h3 style={{ fontSize: '0.7rem', margin: '0 0 1rem 0', color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>기본 설정</h3>
               <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', color: '#cbd5e1' }}>역할군 (로스터 편성에 사용됨)</label>
               <select 
                 style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem' }}
                 value={manualForm.role || 'dealer'}
                 onChange={e => setManualForm({...manualForm, role: e.target.value})}
               >
                 <option value="dealer">딜러</option>
                 <option value="buffer">버퍼</option>
               </select>
            </div>
            <div className="manual-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
              {[
                 { title: '장비 영역', keys: ['enchant', 'title'], labels: { enchant: '마부 상태', title: '칭호 현황' } },
                 { title: '크리쳐 영역', keys: ['creature', 'creatureArtifact'], labels: { creature: '크리쳐 현황', creatureArtifact: '크리쳐 아티팩트' } },
                 { title: '스위칭 영역', keys: ['buffLevel', 'buffAbyss'], labels: { buffLevel: '버프 레벨', buffAbyss: '심연의 편린 개수' } },
                 { title: '아바타 영역', keys: ['avatar', 'emblem', 'platEmblem', 'skinAvatar', 'skinSocket', 'skinEmblem', 'weaponAvatar', 'weaponSocket', 'weaponEmblem', 'aura', 'auraEmblem'], 
                   labels: { avatar: '아바타 현황', emblem: '일반 엠블렘', platEmblem: '상하의 플래티넘', skinAvatar: '피부 아바타', skinSocket: '피부 소켓 여부', skinEmblem: '피부 엠블렘', weaponAvatar: '무기 아바타', weaponSocket: '무기 소켓 여부', weaponEmblem: '무기 엠블렘', aura: '오라 현황', auraEmblem: '오라 엠블렘' } }
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
                            placeholder="양의 정수 입력"
                            onChange={e => setManualForm({...manualForm, [k]: e.target.value})}
                          />
                        ) : (
                          <select 
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem' }}
                            value={manualForm[k] || ''}
                            onChange={e => setManualForm({...manualForm, [k]: e.target.value})}
                          >
                            <option value="">- 선택 안 함 -</option>
                            {customOptions[k]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                 </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setManualModalChar(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
              <button type="button" onClick={handleSaveManual}>저장</button>
            </div>
          </div>
        </div>
      )}

      {showOptionsModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '650px', width: '95%' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>🛠️ 드롭다운 전체 항목 편집</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '1.5rem' }}>
              각 카테고리별로 콤마(,)를 사용해 선택지를 자유롭게 입력하세요. 
            </p>
            <div className="options-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
              {[
                 { title: '장비 영역', keys: ['enchant', 'title'], labels: { enchant: '마부 상태', title: '칭호 현황' } },
                 { title: '크리쳐 영역', keys: ['creature', 'creatureArtifact'], labels: { creature: '크리쳐 현황', creatureArtifact: '크리쳐 아티팩트' } },
                 { title: '스위칭 영역', keys: ['buffLevel', 'buffAbyss'], labels: { buffLevel: '버프 레벨', buffAbyss: '심연의 편린 개수' } },
                 { title: '아바타 영역', keys: ['avatar', 'emblem', 'platEmblem', 'skinAvatar', 'skinSocket', 'skinEmblem', 'weaponAvatar', 'weaponSocket', 'weaponEmblem', 'aura', 'auraEmblem'], 
                   labels: { avatar: '아바타 현황', emblem: '일반 엠블렘', platEmblem: '상하의 플래티넘 엠블렘 보유 여부', skinAvatar: '피부 아바타', skinSocket: '피부 소켓 여부', skinEmblem: '피부 엠블렘', weaponAvatar: '무기 아바타', weaponSocket: '무기 소켓 여부', weaponEmblem: '무기 엠블렘', aura: '오라 현황', auraEmblem: '오라 엠블렘' } }
              ].map(group => (
                 <div key={group.title} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '0.7rem', margin: '0 0 1rem 0', color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>{group.title}</h3>
                    {group.keys.map(k => (
                      <div key={k} style={{ marginBottom: '0.8rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.7rem', color: '#cbd5e1' }}>{group.labels[k]}</label>
                        {(k === 'buffAbyss' || k === 'buffLevel') ? (
                          <div style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '0.6rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.7rem', textAlign: 'center' }}>
                            (각 캐릭터 개별 정수 입력)
                          </div>
                        ) : (
                          <textarea 
                            rows={2}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', resize: 'vertical', fontSize: '0.7rem' }}
                            value={optionsFormText[k] || ''}
                            placeholder="종결, 가성비, 화려..."
                            onChange={e => setOptionsFormText({...optionsFormText, [k]: e.target.value})}
                          />
                        )}
                      </div>
                    ))}
                 </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowOptionsModal(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
              <button type="button" onClick={handleSaveOptions}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function LootModalComponent({ activeLootModal, setActiveLootModal, getCharForm, updateCharForm, characters, apiKey, auctionPrices, setAuctionPrices }) {
  const [fetchingItemId, setFetchingItemId] = useState(null);

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
  const charName = characters.find(c => c.id === activeLootModal.charId)?.base.charName || '알 수 없음';
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
       <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '12px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
           <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#4ade80' }}>
             📦 {charName} - 재화 및 메모 입력
           </h3>
           <div style={{ marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>순 골드</label>
                <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).pureGold || ''} onChange={e => updateCharForm(activeLootModal.charId, 'pureGold', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>순례의 인장</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).seal || ''} onChange={e => updateCharForm(activeLootModal.charId, 'seal', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>순례의 인장(1회 교환 가능)</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).tradableSeal || ''} onChange={e => updateCharForm(activeLootModal.charId, 'tradableSeal', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>응축된 라이언 코어</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).condensedCore || ''} onChange={e => updateCharForm(activeLootModal.charId, 'condensedCore', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>무결점 라이언 코어</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).flawlessCore || ''} onChange={e => updateCharForm(activeLootModal.charId, 'flawlessCore', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>빛나는 조화의 결정체</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).crystal || ''} onChange={e => updateCharForm(activeLootModal.charId, 'crystal', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>무결점 조화의 결정체</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).flawlessCrystal || ''} onChange={e => updateCharForm(activeLootModal.charId, 'flawlessCrystal', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>순례의 인장(1회 교환 가능) 교환권</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).sealVoucher || ''} onChange={e => updateCharForm(activeLootModal.charId, 'sealVoucher', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#cbd5e1' }}>순례의 인장(1회 교환 가능) 교환권 1개 상자</label>
                  <input type="number" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).sealVoucherBox || ''} onChange={e => updateCharForm(activeLootModal.charId, 'sealVoucherBox', e.target.value)} />
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 'bold' }}>커스텀 추가 항목 (교환 가능)</label>
                  <button onClick={() => {
                    const items = getCharForm(activeLootModal.charId).customItems || [];
                    updateCharForm(activeLootModal.charId, 'customItems', [...items, { id: Date.now().toString(), name: '', quantity: '', price: 0, isBound: false }]);
                  }} style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ 항목 추가</button>
                </div>
                {(getCharForm(activeLootModal.charId).customItems || []).length === 0 && (
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>항목이 없습니다. 위 버튼으로 추가하세요.</div>
                )}
                {(getCharForm(activeLootModal.charId).customItems || []).map((item) => (
                  <div key={item.id} style={{ marginBottom: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <input type="text" placeholder="아이템 이름 입력" style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} value={item.name} onChange={e => {
                        const items = getCharForm(activeLootModal.charId).customItems || [];
                        updateCharForm(activeLootModal.charId, 'customItems', items.map(i => i.id === item.id ? { ...i, name: e.target.value } : i));
                      }} onBlur={e => {
                        if (e.target.value.trim()) fetchCustomItemPrice(e.target.value.trim(), item.id);
                      }} />
                      <input type="number" placeholder="수량" style={{ width: '60px', padding: '0.4rem', fontSize: '0.7rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', textAlign: 'center' }} value={item.quantity} onChange={e => {
                        const items = getCharForm(activeLootModal.charId).customItems || [];
                        updateCharForm(activeLootModal.charId, 'customItems', items.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i));
                      }} />
                      <button onClick={() => {
                        const items = getCharForm(activeLootModal.charId).customItems || [];
                        updateCharForm(activeLootModal.charId, 'customItems', items.filter(i => i.id !== item.id));
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
                ))}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', color: '#94a3b8' }}>기타 메모</label>
                <input type="text" style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} value={getCharForm(activeLootModal.charId).memo || ''} onChange={e => updateCharForm(activeLootModal.charId, 'memo', e.target.value)} placeholder="특이사항 메모 입력" />
              </div>
           </div>
           <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={handleClose} style={{ padding: '0.6rem 1.2rem', background: '#4ade80', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>완료 및 닫기</button>
           </div>
       </div>
     </div>
  );
}


function SecretShopModalComponent({ activeSecretShopModal, setActiveSecretShopModal, characters, getCharForm, addCharToken, updateCharToken, removeCharToken, addCharRecipe, updateCharRecipe, removeCharRecipe, updateCharForm }) {
  useEffect(() => {
    if (activeSecretShopModal) {
      const charId = activeSecretShopModal.charId;
      const type = activeSecretShopModal.type;
      const form = getCharForm(charId);
      
      if (type === 'token') {
        const tokens = form.secretTokens || [];
        if (tokens.length === 0) {
          addCharToken(charId);
        }
      } else if (type === 'recipe') {
        const recipes = form.secretRecipes || [];
        if (recipes.length === 0) {
          addCharRecipe(charId);
        }
      }
    }
  }, [activeSecretShopModal]);

  const handleClose = () => {
    if (activeSecretShopModal) {
      const charId = activeSecretShopModal.charId;
      const type = activeSecretShopModal.type;
      const form = getCharForm(charId);

      if (type === 'token') {
        const cleanedTokens = (form.secretTokens || []).filter(t => t.buyPrice !== '');
        updateCharForm(charId, 'secretTokens', cleanedTokens);
      } else if (type === 'recipe') {
        const cleanedRecipes = (form.secretRecipes || []).filter(r => r.buyPrice !== '' || r.sealCost !== '' || r.sellPrice !== '');
        updateCharForm(charId, 'secretRecipes', cleanedRecipes);
      }
    }
    setActiveSecretShopModal(null);
  };

  if (!activeSecretShopModal) return null;
  const charName = characters.find(c => c.id === activeSecretShopModal.charId)?.base.charName || '알 수 없음';
  
  return (
    <div className="modal-overlay">
       <div className="modal-content glass-panel" style={{ maxWidth: activeSecretShopModal.type === 'token' ? '400px' : '500px' }}>
          <h3 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛒 {charName} - {activeSecretShopModal.type === 'token' ? '비밀상점 순례의 인장 구매' : '비밀상점 레시피 제작'}
          </h3>
          <div style={{ marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
             {activeSecretShopModal.type === 'token' && (
                <div>
                   <button onClick={() => addCharToken(activeSecretShopModal.charId)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '4px', marginBottom: '1rem', cursor: 'pointer' }}>+ 순례의 인장 구매 추가</button>
                   {(getCharForm(activeSecretShopModal.charId).secretTokens || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>구매 내역이 없습니다.</div> : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {(getCharForm(activeSecretShopModal.charId).secretTokens || []).map((t, idx) => (
                         <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>#{idx+1} 단가:</span>
                            <input type="number" value={t.buyPrice} onChange={e => updateCharToken(activeSecretShopModal.charId, t.id, e.target.value)} style={{ flex: 1, padding: '0.4rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} placeholder="골드" />
                            <button onClick={() => removeCharToken(activeSecretShopModal.charId, t.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>×</button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
             )}
             {activeSecretShopModal.type === 'recipe' && (
                <div>
                   <button onClick={() => addCharRecipe(activeSecretShopModal.charId)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '4px', marginBottom: '1rem', cursor: 'pointer' }}>+ 레시피 제작 추가</button>
                   {(getCharForm(activeSecretShopModal.charId).secretRecipes || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>제작 내역이 없습니다.</div> : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {(getCharForm(activeSecretShopModal.charId).secretRecipes || []).map((r, idx) => (
                         <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 'bold' }}>레시피 #{idx+1}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>구매가:</span>
                              <input type="number" value={r.buyPrice} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'buyPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} placeholder="골드" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>소모 순례의 인장:</span>
                              <input type="number" value={r.sealCost} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'sealCost', e.target.value)} style={{ width: '60px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} placeholder="개수" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>판매가:</span>
                              <input type="number" value={r.sellPrice} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'sellPrice', e.target.value)} style={{ width: '90px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} placeholder="골드" />
                            </div>
                            <button onClick={() => removeCharRecipe(activeSecretShopModal.charId, r.id)} style={{ marginLeft: 'auto', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>×</button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
             )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={handleClose} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>닫기</button>
          </div>
       </div>
    </div>
  );
}

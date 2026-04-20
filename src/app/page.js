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
  
  // 클라우드 버전 관리를 위한 Ref (다중 탭 덮어쓰기 원천 차단용)
  const lastCloudUpdateAtRef = React.useRef(0);

  useEffect(() => { charsRef.current = characters; }, [characters]);
  useEffect(() => { logsRef.current = historyLogs; }, [historyLogs]);
  useEffect(() => { optsRef.current = customOptions; }, [customOptions]);

  // --- 클라우드 동기화 엔진 ---
  const syncUpCloudData = async (key, updatedCharacters, updatedLogs, updatedOpts, forceOverride = false) => {
    if(!key) return;
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          characters: updatedCharacters,
          historyLogs: updatedLogs,
          customOptions: updatedOpts,
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
    await syncUpCloudData(apiKey, characters, historyLogs, customOptions, true);
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
         
         // 클라우드가 텅 비어있고, 로컬에는 기존 데이터가 가득하다면 (첫 이주, Migration)
         if (!modified && (localChars?.length > 0 || localLogs?.length > 0)) {
            await syncUpCloudData(targetKey, localChars, localLogs, localOpts);
         }
         
         if (modified) {
             setIsCloudSyncing(false);
             return true;
         }
      } else if (res.success && (!res.data)) {
         // 클라우드가 아예 null (키가 처음 생성된 상태)
         if (localChars?.length > 0 || localLogs?.length > 0) {
            await syncUpCloudData(targetKey, localChars, localLogs, localOpts);
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
           return res.success ? { ...res, manual: c.manual } : c;
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
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, true);
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
          if (keyToUse) syncUpCloudData(keyToUse, updatedList, merged, optsRef.current);
          
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
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, true);
  };

  const openManualModal = (char) => {
    setManualForm(char.manual || { 
      enchant: '', title: '', 
      creature: '', creatureArtifact: '',
      buffLevel: '', buffAbyss: '',
      avatar: '', emblem: '', platEmblem: '', skinAvatar: '', skinSocket: '', skinEmblem: '', weaponAvatar: '', weaponSocket: '', weaponEmblem: '', aura: '', auraEmblem: ''
    });
    setManualModalChar(char);
  };

  const handleSaveManual = () => {
    if(!manualModalChar) return;
    const newList = characters.map(c => c.id === manualModalChar.id ? { ...c, manual: manualForm } : c);
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    setManualModalChar(null);
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, true);
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
    if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, newOpts, true);
  };

  const deleteLog = (id) => {
    if (!window.confirm("이 성장 기록을 정말 삭제하시겠습니까?")) return;
    setHistoryLogs(prev => {
      const updated = prev.filter(L => L.id !== id);
      localStorage.setItem('DNF_HISTORY', JSON.stringify(updated));
      if (apiKey) syncUpCloudData(apiKey, charsRef.current, updated, optsRef.current, true);
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
      if (apiKey) syncUpCloudData(apiKey, charsRef.current, updated, optsRef.current, true);
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

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
         <button className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`} onClick={() => setActiveTab('roster')}>👥 캐릭터 로스터</button>
         <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📜 성장 일지 기록</button>
         <button className={`tab-btn ${activeTab === 'imminent' ? 'active' : ''}`} onClick={() => setActiveTab('imminent')}>🎯 다음 던전 목표 현황</button>
         <button className={`tab-btn ${activeTab === 'merc' ? 'active' : ''}`} onClick={() => setActiveTab('merc')}>⚔️ 용병단 레벨</button>
      </div>

      {activeTab === 'roster' && (
      <>
        {/* 로스터 서브탭 */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
          <button
            className={`tab-btn ${rosterSubTab === 'overview' ? 'active' : ''}`}
            onClick={() => setRosterSubTab('overview')}
            style={{ fontSize: '0.9rem', padding: '0.4rem 1.1rem' }}
          >📋 캐릭터 종합 정보</button>
          <button
            className={`tab-btn ${rosterSubTab === 'items' ? 'active' : ''}`}
            onClick={() => setRosterSubTab('items')}
            style={{ fontSize: '0.9rem', padding: '0.4rem 1.1rem' }}
          >🎽 캐릭터 아이템 현황</button>
        </div>
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
          
          <div style={{ marginLeft: 'auto' }}>
             <button type="button" onClick={() => handleRefreshAll()} disabled={isRefreshing || characters.length === 0} style={{ background: '#475569' }}>
               {isRefreshing ? <div className="loader"/> : "🔄 전체 갱신"}
             </button>
          </div>
        </form>
      </section>

      <section className="glass-panel table-wrapper">
        {characters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            상단의 폼을 이용해 관리할 캐릭터를 추가해주세요.
          </div>
        ) : (
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
              {characters.map((c, idx) => (
                <React.Fragment key={c.id}>
                  <tr style={{ verticalAlign: 'middle' }}>
                  <td data-label="서버" style={{ textAlign: 'center' }}>{SERVER_LIST.find(s => s.id === c.base.server)?.name || c.base.server}</td>
                  <td data-label="직업" style={{ textAlign: 'center' }}>{c.base.jobGrowName}</td>
                    <td data-label="캐릭터명" style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{c.base.charName}</div>
                    </td>
                  <td data-label="명성" style={{ textAlign: 'center' }}>
                    {(() => {
                        const filteredRaids = RAIDS.filter(r => r.name !== '이내 황혼전' || idx < 8);
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
                              fontSize: '0.72rem',
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
                                fontSize: '0.65rem',
                                border: '1px solid rgba(56,189,248,0.2)'
                              }}>
                                {dungeon.name}
                              </span>
                            ))}
                          </div>
                          {!nextDungeon && cleared.length === 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>-</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td data-label="레이드" style={{ textAlign: 'center' }}>
                    {(() => {
                      const filteredRaids = RAIDS.filter(r => r.name !== '이내 황혼전' || idx < 8);
                      const nextRaid = [...filteredRaids].reverse().find(r => r.fame > c.base.fame);
                      const raidDiff = nextRaid ? nextRaid.fame - c.base.fame : null;
                      const isImminent = raidDiff !== null && raidDiff < 1000;
                      const clearedRaids = filteredRaids.filter(r => c.base.fame >= r.fame);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          {nextRaid && (
                            <div style={{
                              fontSize: '0.72rem',
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
                                fontSize: '0.65rem',
                                border: '1px solid rgba(192, 132, 252, 0.2)'
                              }}>
                                {raid.name}
                              </span>
                            ))}
                          </div>
                          {!nextRaid && clearedRaids.length === 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>-</span>}
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
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>-</span>
                            <div style={{ fontSize: '0.65rem', color: isImminent ? '#fef08a' : '#fb923c', background: isImminent ? 'rgba(234,179,8,0.15)' : 'rgba(251,146,60,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: isImminent ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(251,146,60,0.25)', whiteSpace: 'nowrap', fontWeight: isImminent ? 'bold' : 'normal' }}>
                              {isImminent ? '🔥' : '💀'} 매칭까지 <strong style={{ color: isImminent ? '#fde047' : '#f97316' }}>{diff.toLocaleString()}</strong>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          <span style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(251,146,60,0.35)' }}>
                            💀 {currentLabel}
                          </span>
                          {nextTarget && (
                            <div style={{ fontSize: '0.65rem', color: isImminent ? '#fef08a' : '#fb923c', background: isImminent ? 'rgba(234,179,8,0.15)' : 'rgba(251,146,60,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: isImminent ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(251,146,60,0.2)', whiteSpace: 'nowrap', fontWeight: isImminent ? 'bold' : 'normal' }}>
                              {isImminent ? '🔥' : '▶'} {nextTarget.name}까지 <strong style={{ color: isImminent ? '#fde047' : '#f97316' }}>{diff.toLocaleString()}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td data-label="장비" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{c.equipment.setName}</div>
                    <div className={getTierClass(c.equipment.rarity)}>
                      {c.equipment.gradeDesc} ({c.equipment.points})
                    </div>
                  </td>
                  <td data-label="서약" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{c.oath.setName}</div>
                    <div className={getTierClass(c.oath.rarity)}>
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
                      <button type="button" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6' }} onClick={() => openManualModal(c)}>
                        ⚙️
                      </button>
                      <button type="button" className="danger" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(c.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>

                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 캐릭터 아이템 현황 서브탭 */}
      {rosterSubTab === 'items' && (
        <section className="glass-panel">
          {characters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>캐릭터를 먼저 추가해주세요.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {characters.map((c) => (
                <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* 캐릭터 헤더 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.2rem', background: 'rgba(56,189,248,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e2e8f0' }}>{c.base.charName}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{c.base.jobGrowName}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({SERVER_LIST.find(s => s.id === c.base.server)?.name || c.base.server})</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 'bold' }}>명성 {c.base.fame.toLocaleString()}</span>
                    </div>
                  </div>
                  {/* 스펙 상세 */}
                  {c.manual && Object.values(c.manual).some(v => v) ? (
                    <div style={{ padding: '1rem 1.2rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#cbd5e1', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <tbody>
                          {(c.manual.title || c.manual.aura || c.manual.creature || c.manual.creatureArtifact) && (
                            <tr>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#38bdf8', padding: '0.5rem', width: '10%', fontWeight: 'bold' }}>칭호</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', width: '23%', color: '#e2e8f0' }}>{c.manual.title || '-'}</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f472b6', padding: '0.5rem', width: '10%', fontWeight: 'bold' }}>오라</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: 0, width: '23%', color: '#e2e8f0' }}>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', padding: '0.5rem' }}>
                                  {c.manual.aura && <span>종류: {c.manual.aura}</span>}
                                  {c.manual.auraEmblem && <span style={{ color: '#94a3b8' }}>|</span>}
                                  {c.manual.auraEmblem && <span>엠블렘: {c.manual.auraEmblem}</span>}
                                  {(!c.manual.aura && !c.manual.auraEmblem) && <span>-</span>}
                                </div>
                              </td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#10b981', padding: '0.5rem', width: '10%', fontWeight: 'bold' }}>크리쳐</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: 0, width: '24%', color: '#e2e8f0' }}>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', padding: '0.5rem' }}>
                                  {c.manual.creature && <span>종류: {c.manual.creature}</span>}
                                  {c.manual.creatureArtifact && <span style={{ color: '#94a3b8' }}>|</span>}
                                  {c.manual.creatureArtifact && <span>아티팩트: {c.manual.creatureArtifact}</span>}
                                  {(!c.manual.creature && !c.manual.creatureArtifact) && <span>-</span>}
                                </div>
                              </td>
                            </tr>
                          )}
                          {(c.manual.enchant || c.manual.buffLevel || c.manual.buffAbyss) && (
                            <tr>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#a78bfa', padding: '0.5rem', fontWeight: 'bold' }}>마부</td>
                              <td colSpan={2} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', color: '#e2e8f0' }}>{c.manual.enchant || '-'}</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fb923c', padding: '0.5rem', fontWeight: 'bold' }}>스위칭</td>
                              <td colSpan={2} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', color: '#e2e8f0' }}>
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                  {c.manual.buffLevel && <span>버프: {String(c.manual.buffLevel).includes('레벨') ? c.manual.buffLevel : `${c.manual.buffLevel}레벨`}</span>}
                                  {c.manual.buffAbyss && <span style={{ color: '#94a3b8' }}>|</span>}
                                  {c.manual.buffAbyss && <span>편린: {String(c.manual.buffAbyss).includes('개') ? c.manual.buffAbyss : `${c.manual.buffAbyss}개`}</span>}
                                  {(!c.manual.buffLevel && !c.manual.buffAbyss) && <span>-</span>}
                                </div>
                              </td>
                            </tr>
                          )}
                          {(c.manual.avatar || c.manual.skinAvatar || c.manual.weaponAvatar) && (
                            <tr>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#818cf8', padding: '0.5rem', fontWeight: 'bold' }}>아바타</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', color: '#e2e8f0' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                  <span>{c.manual.avatar || '-'}</span>
                                  {c.manual.platEmblem && <span style={{ color: 'rgba(56,189,248,0.6)' }}>[{c.manual.platEmblem}]</span>}
                                  {c.manual.emblem && <span style={{ color: '#94a3b8' }}>({c.manual.emblem})</span>}
                                </div>
                              </td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e879f9', padding: '0.5rem', fontWeight: 'bold' }}>피부</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', color: '#e2e8f0' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <span>{c.manual.skinAvatar || '-'}</span>
                                  {c.manual.skinSocket && <span style={{ color: '#94a3b8' }}>|</span>}
                                  {c.manual.skinSocket && <span>소켓: {c.manual.skinSocket}</span>}
                                  {c.manual.skinEmblem && <span style={{ color: '#94a3b8' }}>({c.manual.skinEmblem})</span>}
                                </div>
                              </td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#ef4444', padding: '0.5rem', fontWeight: 'bold' }}>무기압</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', color: '#e2e8f0' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <span>{c.manual.weaponAvatar || '-'}</span>
                                  {c.manual.weaponSocket && <span style={{ color: '#94a3b8' }}>|</span>}
                                  {c.manual.weaponSocket && <span>소켓: {c.manual.weaponSocket}</span>}
                                  {c.manual.weaponEmblem && <span style={{ color: '#94a3b8' }}>({c.manual.weaponEmblem})</span>}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                      ⚙️ 수동 스펙 정보 없음 — 캐릭터 관리(⚙️)에서 입력해주세요.
                    </div>
                  )}
                </div>
              ))}
            </div>
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
            <select value={historyFilterChar} onChange={e => setHistoryFilterChar(e.target.value)} style={{ padding: '0.5rem', minWidth: '200px' }}>
              <option value="">전체 캐릭터 보기</option>
              {characters.map(c => <option key={c.id} value={c.id}>{c.base.charName} ({c.base.jobGrowName})</option>)}
            </select>
          </div>

          {/* 그래프 뷰 모드 토글 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>그래프 기준:</span>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setChartViewMode('event')}
                style={{
                  padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: chartViewMode === 'event' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: chartViewMode === 'event' ? '#38bdf8' : '#94a3b8',
                  fontWeight: chartViewMode === 'event' ? 'bold' : 'normal',
                  boxShadow: chartViewMode === 'event' ? '0 0 8px rgba(56,189,248,0.2)' : 'none'
                }}
              >⚡ 이벤트 발생 기준</button>
              <button
                onClick={() => setChartViewMode('daily')}
                style={{
                  padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
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
                         <strong style={{ fontSize: '1.15rem', color: '#60a5fa' }}>{log.charName} <span style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>{log.job}</span></strong>
                         <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '0.5rem' }}>🕒 {timeStr}</span>
                       </div>
                       <div style={{ display: 'flex', gap: '0.4rem' }}>
                         <button type="button" onClick={() => openEditLog(log)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>✏️ 수정</button>
                         <button type="button" onClick={() => deleteLog(log.id)} className="danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>❌ 삭제</button>
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

      {activeTab === 'imminent' && (
        <section className="glass-panel" style={{ minHeight: '60vh' }}>
          <h2 style={{ margin: '0 0 1.5rem 0' }}>🎯 다음 던전 목표 현황</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>모든 캐릭터의 다음 상급던전 진입까지 남은 명성을 적게 남은 순서대로 한눈에 확인합니다.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {(() => {
               const imminentChars = characters.filter(c => {
                   const nextDungeon = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > c.base.fame);
                   return nextDungeon != null;
               }).sort((a, b) => {
                   const diffA = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > a.base.fame).fame - a.base.fame;
                   const diffB = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > b.base.fame).fame - b.base.fame;
                   return diffA - diffB;
               });

               const raidChars = characters.map((c, i) => {
                   const filteredRaids = RAIDS.filter(r => r.name !== '이내 황혼전' || i < 8);
                   const nextRaid = [...filteredRaids].reverse().find(r => r.fame > c.base.fame);
                   return { char: c, nextRaid, originalIndex: i };
               }).filter(item => item.nextRaid != null).sort((a, b) => {
                   const diffA = a.nextRaid.fame - a.char.base.fame;
                   const diffB = b.nextRaid.fame - b.char.base.fame;
                   return diffA - diffB;
               });

               const renderCards = (items, type) => {
                 if (items.length === 0) {
                   return (
                     <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', gridColumn: '1 / -1', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                       모든 {type} 조건을 달성했거나 대상 캐릭터가 없습니다.
                     </div>
                   );
                 }
                 return items.map(item => {
                   const c = item.char;
                   const target = item.nextRaid || (type === '상급던전' ? [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > c.base.fame) : null);
                   if (!target) return null;
                   const diff = target.fame - c.base.fame;
                   const isImminent = diff < 1000;
                   return (
                     <div key={c.id} style={{ 
                       background: isImminent ? 'rgba(234, 179, 8, 0.05)' : 'rgba(255, 255, 255, 0.02)', 
                       border: isImminent ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)', 
                       borderRadius: '8px', 
                       padding: '1.2rem', 
                       boxShadow: isImminent ? '0 0 12px rgba(234, 179, 8, 0.1)' : 'none', 
                       display: 'flex', 
                       flexDirection: 'column', 
                       gap: '0.8rem' 
                     }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isImminent ? '#fef08a' : '#e2e8f0' }}>{c.base.charName}</span>
                         <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{c.base.jobGrowName}</span>
                       </div>
                       <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>현재 명성: <span style={{ color: isImminent ? '#fbbf24' : '#38bdf8', fontWeight: 'bold' }}>{c.base.fame.toLocaleString()}</span></div>
                       <div style={{ 
                         background: isImminent ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                         padding: '0.8rem', 
                         borderRadius: '6px', 
                         fontSize: '1rem', 
                         color: isImminent ? '#fef08a' : '#cbd5e1', 
                         textAlign: 'center', 
                         marginTop: 'auto', 
                         border: isImminent ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)' 
                       }}>
                         {isImminent ? '🔥' : (type === '상급던전' ? '🚀' : '⚔️')} <strong>{target.name}</strong> 컷까지 <strong style={{ color: '#fff', fontSize: '1.15em' }}>{diff.toLocaleString()}</strong> 남음{isImminent ? '!' : ''}
                       </div>
                     </div>
                   );
                 });
               };

               const imminentItems = characters.map((c, i) => {
                 const nextDungeon = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > c.base.fame);
                 return { char: c, nextDungeon, originalIndex: i };
               }).filter(item => item.nextDungeon != null).sort((a, b) => {
                 const diffA = a.nextDungeon.fame - a.char.base.fame;
                 const diffB = b.nextDungeon.fame - b.char.base.fame;
                 return diffA - diffB;
               });

               return (
                 <div style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#93c5fd' }}>■ 상급 던전 편</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                       {renderCards(imminentItems, '상급던전')}
                    </div>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#d8b4fe' }}>■ 레이드 편 (입장컷 기준)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                       {renderCards(raidChars, '레이드')}
                    </div>
                     <h3 style={{ borderBottom: '1px solid rgba(251,146,60,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#fb923c' }}>■ 아포칼립스 던전 편</h3>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {(() => {
                          const apocItems = characters.map((c) => {
                            const fame = c.base.fame;
                            const state = fame >= 105881 ? 3 : fame >= 98171 ? 2 : fame >= 73993 ? 1 : 0;
                            const currentLabel = ['없음', '매칭', '1단계', '2단계'][state];
                            const apocTiers = [{ name: '매칭', fame: 73993 }, { name: '1단계', fame: 98171 }, { name: '2단계', fame: 105881 }];
                            const nextTarget = state < 3 ? apocTiers[state] : null;
                            return { char: c, state, currentLabel, nextTarget };
                          }).filter(item => item.nextTarget != null).sort((a, b) =>
                            (a.nextTarget.fame - a.char.base.fame) - (b.nextTarget.fame - b.char.base.fame)
                          );
                          if (apocItems.length === 0) return (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', gridColumn: '1 / -1', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                              모든 아포칼립스 조건을 달성했거나 대상 캐릭터가 없습니다.
                            </div>
                          );
                          return apocItems.map(({ char: c, state, currentLabel, nextTarget: target }) => {
                            const diff = target.fame - c.base.fame;
                            const isImminent = diff < 1000;
                            return (
                              <div key={c.id} style={{
                                background: isImminent ? 'rgba(234, 179, 8, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                border: isImminent ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(251, 146, 60, 0.2)',
                                borderRadius: '8px', padding: '1.2rem',
                                boxShadow: isImminent ? '0 0 12px rgba(234, 179, 8, 0.1)' : '0 0 6px rgba(251,146,60,0.05)',
                                display: 'flex', flexDirection: 'column', gap: '0.8rem'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isImminent ? '#fef08a' : '#e2e8f0' }}>{c.base.charName}</span>
                                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{c.base.jobGrowName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>현재 명성: <span style={{ color: isImminent ? '#fbbf24' : '#fb923c', fontWeight: 'bold' }}>{c.base.fame.toLocaleString()}</span></div>
                                  {state > 0 && <span style={{ fontSize: '0.75rem', background: 'rgba(251,146,60,0.2)', color: '#fb923c', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(251,146,60,0.3)' }}>현재: {currentLabel}</span>}
                                  {state === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.15rem 0.5rem' }}>미진입</span>}
                                </div>
                                <div style={{
                                  background: isImminent ? 'rgba(234, 179, 8, 0.15)' : 'rgba(251, 146, 60, 0.08)',
                                  padding: '0.8rem', borderRadius: '6px', fontSize: '1rem',
                                  color: isImminent ? '#fef08a' : '#fb923c', textAlign: 'center', marginTop: 'auto',
                                  border: isImminent ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(251,146,60,0.25)'
                                }}>
                                  {isImminent ? '🔥' : '💀'} <strong>{target.name}</strong> 컷까지 <strong style={{ color: '#fff', fontSize: '1.15em' }}>{diff.toLocaleString()}</strong> 남음{isImminent ? '!' : ''}
                                </div>
                              </div>
                            );
                          });
                        })()}
                     </div>
                 </div>
               );
            })()}
          </div>
        </section>
      )}

      {activeTab === 'merc' && (() => {
        const top20 = characters.slice(0, 20);
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
          localStorage.setItem('DNF_MERC', JSON.stringify({ level: lv, target: tgt }));
        };
        return (
          <section className='glass-panel' style={{ minHeight: '60vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>⚔️ 용병단 레벨</h2>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '1rem 1.2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>현재 레벨</div>
                  <input type='number' min='1' value={mercLevelInput} onChange={e => setMercLevelInput(e.target.value)} placeholder='예: 6' style={{ width: '80px', padding: '0.4rem 0.6rem', textAlign: 'center' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem' }}>다음 레벨 목표 포인트</div>
                  <input type='text' value={mercTargetInput} onChange={e => setMercTargetInput(e.target.value)} placeholder='예: 30000' style={{ width: '130px', padding: '0.4rem 0.6rem', textAlign: 'center' }} />
                </div>
                <button onClick={handleSaveMerc} style={{ padding: '0.4rem 1rem', background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer' }}>저장</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(234,179,8,0.1))', border: '1px solid rgba(251,146,60,0.3)', borderRadius: '12px', padding: '1.2rem 2rem', textAlign: 'center', minWidth: '140px' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>현재 레벨</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fb923c', lineHeight: 1 }}>Lv.{mercLevel}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>→ Lv.{mercLevel + 1} 도전 중</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.2rem 1.5rem', minWidth: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>서약 총합</span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: isNearTarget ? '#fef08a' : '#e2e8f0', marginLeft: '0.6rem' }}>{totalOath.toLocaleString()}</span>
                    {hasTarget && <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: '0.4rem' }}>/ {mercNextLevelTarget.toLocaleString()}</span>}
                  </div>
                  {remaining !== null && (
                    <div style={{ fontSize: '0.9rem', color: isNearTarget ? '#fef08a' : '#fb923c', fontWeight: isNearTarget ? 'bold' : 'normal' }}>
                      {isNearTarget ? '🔥' : '📈'} {remaining === 0 ? '목표 달성!' : `${remaining.toLocaleString()} 부족`}
                    </div>
                  )}
                </div>
                {hasTarget && (
                  <div>
                    <div style={{ height: '18px', background: 'rgba(255,255,255,0.07)', borderRadius: '9px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ height: '100%', width: `${progress}%`, borderRadius: '9px', background: progress >= 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : isNearTarget ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#fb923c,#f97316)', transition: 'width 0.6s ease', boxShadow: isNearTarget ? '0 0 10px rgba(251,191,36,0.5)' : '0 0 8px rgba(251,146,60,0.4)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <span>Lv.{mercLevel}</span>
                      <span style={{ color: isNearTarget ? '#fbbf24' : '#fb923c', fontWeight: 'bold' }}>{progress.toFixed(1)}%</span>
                      <span>Lv.{mercLevel + 1}</span>
                    </div>
                  </div>
                )}
                {!hasTarget && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>우측 상단 설정에서 현재 레벨과 다음 레벨 목표 포인트를 입력하세요.</p>}
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                캐릭터별 서약 기여도 <span style={{ fontSize: '0.8rem', color: '#64748b' }}>(등록순 상위 20개)</span>
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
                      <span style={{ width: '1.4rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ width: '130px', flexShrink: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.base.charName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.base.jobGrowName}</div>
                      </div>
                      <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${relPct}%`, background: 'linear-gradient(90deg,#fb923c,#f97316)', borderRadius: '5px', transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ width: '70px', textAlign: 'right', fontWeight: 'bold', color: '#fb923c', fontSize: '0.9rem', flexShrink: 0 }}>{pts.toLocaleString()}</span>
                      <span style={{ width: '45px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
              {characters.length > 20 && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.8rem', textAlign: 'center' }}>* 등록된 {characters.length}개 캐릭터 중 상위 20개만 계산에 포함됩니다.</p>}
            </div>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>상단 🛠️ 탭에서 구성한 목록에서만 선택 가능합니다.</p>
            <div className="manual-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
              {[
                 { title: '장비 영역', keys: ['enchant', 'title'], labels: { enchant: '마부 상태', title: '칭호 현황' } },
                 { title: '크리쳐 영역', keys: ['creature', 'creatureArtifact'], labels: { creature: '크리쳐 현황', creatureArtifact: '크리쳐 아티팩트' } },
                 { title: '스위칭 영역', keys: ['buffLevel', 'buffAbyss'], labels: { buffLevel: '버프 레벨', buffAbyss: '심연의 편린 개수' } },
                 { title: '아바타 영역', keys: ['avatar', 'emblem', 'platEmblem', 'skinAvatar', 'skinSocket', 'skinEmblem', 'weaponAvatar', 'weaponSocket', 'weaponEmblem', 'aura', 'auraEmblem'], 
                   labels: { avatar: '아바타 현황', emblem: '일반 엠블렘', platEmblem: '상하의 플래티넘', skinAvatar: '피부 아바타', skinSocket: '피부 소켓 여부', skinEmblem: '피부 엠블렘', weaponAvatar: '무기 아바타', weaponSocket: '무기 소켓 여부', weaponEmblem: '무기 엠블렘', aura: '오라 현황', auraEmblem: '오라 엠블렘' } }
              ].map(group => (
                 <div key={group.title} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>{group.title}</h3>
                    {group.keys.map(k => (
                      <div key={k} style={{ marginBottom: '0.8rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#cbd5e1' }}>{group.labels[k]}</label>
                        {(k === 'buffAbyss' || k === 'buffLevel') ? (
                          <input 
                            type="number"
                            min="0"
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.85rem' }}
                            value={manualForm[k] || ''}
                            placeholder="양의 정수 입력"
                            onChange={e => setManualForm({...manualForm, [k]: e.target.value})}
                          />
                        ) : (
                          <select 
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.85rem' }}
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
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
                    <h3 style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem' }}>{group.title}</h3>
                    {group.keys.map(k => (
                      <div key={k} style={{ marginBottom: '0.8rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#cbd5e1' }}>{group.labels[k]}</label>
                        {(k === 'buffAbyss' || k === 'buffLevel') ? (
                          <div style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '0.6rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}>
                            (각 캐릭터 개별 정수 입력)
                          </div>
                        ) : (
                          <textarea 
                            rows={2}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.4rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', resize: 'vertical', fontSize: '0.85rem' }}
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

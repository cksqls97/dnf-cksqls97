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
  
  const chartData = React.useMemo(() => {
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
  }, [historyLogs, characters, historyFilterChar]);
  
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
      </div>

      {activeTab === 'roster' && (
      <>
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
                <th style={{ width: '8%' }}>서버</th>
                <th style={{ width: '11%' }}>직업</th>
                <th style={{ width: '28%' }}>캐릭터명 (스펙 현황)</th>
                <th style={{ width: '9%' }}>명성</th>
                <th style={{ width: '15%' }}>장비 (점수)</th>
                <th style={{ width: '10%' }}>서약 (점수)</th>
                <th style={{ width: '8%' }}>던담 링크</th>
                <th style={{ width: '11%' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {characters.map(c => (
                <tr key={c.id} style={{ verticalAlign: 'middle' }}>
                  <td data-label="서버">{SERVER_LIST.find(s => s.id === c.base.server)?.name || c.base.server}</td>
                  <td data-label="직업">{c.base.jobGrowName}</td>
                  <td data-label="스펙 현황">
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '4px' }}>{c.base.charName}</div>
                    
                    {/* 스펙 현황 토글 버튼 */}
                    {c.manual && Object.values(c.manual).some(v => v) && (
                      <button 
                        onClick={() => toggleExpandedSpec(c.id)}
                        style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '0.2rem 0.6rem', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '4px', fontSize: '0.75rem', marginTop: '0.4rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        {expandedSpecs[c.id] ? '스펙 현황 접기 🔼' : '스펙 현황 확인하기 🔽'}
                      </button>
                    )}

                    {expandedSpecs[c.id] && c.manual && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.6rem', fontSize: '0.8rem', color: '#cbd5e1', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <tbody>
                          {/* 1. 핵심 (칭호, 오라, 크리쳐) */}
                          {(c.manual.title || c.manual.aura || c.manual.creature || c.manual.creatureArtifact) && (
                            <tr>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#38bdf8', padding: '0.3rem', width: '12%', fontWeight: '500' }}>칭호</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', padding: '0.3rem', width: '21%', color: '#e2e8f0', fontSize: '0.75rem' }}>{c.manual.title || '-'}</td>
                              
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#f472b6', padding: '0.3rem', width: '12%', fontWeight: '500' }}>오라</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', padding: 0, width: '21%', color: '#e2e8f0', fontSize: '0.75rem', height: '100%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                  {c.manual.aura && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>종류: {c.manual.aura}</div>}
                                  {c.manual.auraEmblem && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: c.manual.aura ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>엠블렘: {c.manual.auraEmblem}</div>}
                                  {(!c.manual.aura && !c.manual.auraEmblem) && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</div>}
                                </div>
                              </td>
                              
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#10b981', padding: '0.3rem', width: '12%', fontWeight: '500' }}>크리쳐</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', padding: 0, width: '22%', color: '#e2e8f0', fontSize: '0.75rem', height: '100%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                  {c.manual.creature && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>종류: {c.manual.creature}</div>}
                                  {c.manual.creatureArtifact && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: c.manual.creature ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>아티팩트: {c.manual.creatureArtifact}</div>}
                                  {(!c.manual.creature && !c.manual.creatureArtifact) && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</div>}
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* 2. 상세 (마부, 스위칭) - 4칸 분할 (colspan 2 활용) */}
                          {(c.manual.enchant || c.manual.buffLevel || c.manual.buffAbyss) && (
                            <tr>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#a78bfa', padding: '0.3rem', width: '12%', fontWeight: '500' }}>마부</td>
                              <td colSpan={2} style={{ border: '1px solid rgba(255,255,255,0.15)', padding: '0.3rem', width: '33%', color: '#e2e8f0', fontSize: '0.75rem' }}>{c.manual.enchant || '-'}</td>
                              
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fb923c', padding: '0.3rem', width: '12%', fontWeight: '500' }}>스위칭</td>
                              <td colSpan={2} style={{ border: '1px solid rgba(255,255,255,0.15)', padding: 0, width: '43%', color: '#e2e8f0', fontSize: '0.75rem', height: '100%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                  {c.manual.buffLevel && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>버프: {String(c.manual.buffLevel).includes('레벨') ? c.manual.buffLevel : `${c.manual.buffLevel}레벨`}</div>}
                                  {c.manual.buffAbyss && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: c.manual.buffLevel ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>편린: {String(c.manual.buffAbyss).includes('개') ? c.manual.buffAbyss : `${c.manual.buffAbyss}개`}</div>}
                                  {(!c.manual.buffLevel && !c.manual.buffAbyss) && <div style={{ padding: '0.3rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</div>}
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* 3. 아바타군 - 6칸 분할, 3Rows 고정 정렬 그리드 */}
                          {(c.manual.avatar || c.manual.skinAvatar || c.manual.weaponAvatar) && (
                            <tr>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#818cf8', padding: '0.3rem', width: '12%', fontWeight: '500' }}>아바타</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', padding: 0, width: '21%', color: '#e2e8f0', fontSize: '0.75rem', height: '100%' }}>
                                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', height: '100%' }}>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.manual.avatar ? `보유 여부: ${c.manual.avatar}` : '-'}</div>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.15)' }}>{c.manual.platEmblem ? (c.manual.platEmblem === '없음' ? '플티 없음' : `플티: ${c.manual.platEmblem}`) : '-'}</div>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.15)' }}>{c.manual.emblem ? `엠블렘: ${c.manual.emblem}` : '-'}</div>
                                </div>
                              </td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#e879f9', padding: '0.3rem', width: '12%', fontWeight: '500' }}>피부</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', padding: 0, width: '21%', color: '#e2e8f0', fontSize: '0.75rem', height: '100%' }}>
                                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', height: '100%' }}>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.manual.skinAvatar ? `보유 여부: ${c.manual.skinAvatar}` : '-'}</div>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.15)' }}>{c.manual.skinSocket ? `소켓 여부: ${c.manual.skinSocket}` : '-'}</div>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.15)' }}>{c.manual.skinEmblem ? `엠블렘: ${c.manual.skinEmblem}` : '-'}</div>
                                </div>
                              </td>

                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#ef4444', padding: '0.3rem', width: '12%', fontWeight: '500' }}>무기압</td>
                              <td style={{ border: '1px solid rgba(255,255,255,0.15)', padding: 0, width: '22%', color: '#e2e8f0', fontSize: '0.75rem', height: '100%' }}>
                                <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', height: '100%' }}>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.manual.weaponAvatar ? `보유 여부: ${c.manual.weaponAvatar}` : '-'}</div>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.15)' }}>{c.manual.weaponSocket ? `소켓 여부: ${c.manual.weaponSocket}` : '-'}</div>
                                  <div style={{ padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.15)' }}>{c.manual.weaponEmblem ? `엠블렘: ${c.manual.weaponEmblem}` : '-'}</div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </td>
                  <td data-label="명성">
                    <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.05rem', textAlign: 'center' }}>
                       {c.base.fame.toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', alignItems: 'center' }}>
                       {(() => {
                           const nextDungeon = [...ADVANCED_DUNGEONS].reverse().find(d => d.fame > c.base.fame);
                           if (!nextDungeon) return null;
                           const diff = nextDungeon.fame - c.base.fame;
                           return (
                             <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginBottom: '1px', background: 'rgba(248, 113, 113, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(248, 113, 113, 0.2)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                               🚀 {nextDungeon.name}까지 <strong style={{color: '#f87171'}}>{diff.toLocaleString()}</strong> 남음
                             </div>
                           );
                       })()}
                       {ADVANCED_DUNGEONS.filter(d => c.base.fame >= d.fame).slice(0, 2).map((dungeon, idx) => (
                          <span key={dungeon.name} style={{ background: idx === 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: idx === 0 ? '#38bdf8' : 'var(--text-muted)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap', border: idx === 0 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)' }}>
                             {dungeon.name}
                          </span>
                       ))}
                    </div>
                  </td>
                  <td data-label="장비">
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{c.equipment.setName}</div>
                    <div className={getTierClass(c.equipment.rarity)}>
                      {c.equipment.gradeDesc} ({c.equipment.points})
                    </div>
                  </td>
                  <td data-label="서약">
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
              ))}
            </tbody>
          </table>
        )}
      </section>
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
                  <Line type="stepAfter" dataKey="fame" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3, strokeWidth: 1, fill: '#0f172a' }} activeDot={{ r: 5 }} animationDuration={1000} />
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

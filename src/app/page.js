"use client";

import React, { useState, useEffect } from 'react';
import RosterTab from './components/RosterTab';
import HistoryTab from './components/HistoryTab';
import ImminentTab from './components/ImminentTab';
import MercTab from './components/MercTab';
import PilgrimageTab from './components/PilgrimageTab';
import { ALL_MANUAL_KEYS, DEFAULT_CUSTOM_OPTIONS } from './lib/constants';

export default function Home() {
  const [apiKey, setApiKeyState] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [characters, setCharacters] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [pilgrimageHistory, setPilgrimageHistory] = useState([]);

  const [activeTab, setActiveTabState] = useState('roster');
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('DNF_ACTIVE_TAB', tab);
  };

  const [mercLevel, setMercLevel] = useState(1);
  const [mercNextLevelTarget, setMercNextLevelTarget] = useState(0);

  const [server, setServer] = useState('cain');
  const [charName, setCharName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const [customOptions, setCustomOptions] = useState(DEFAULT_CUSTOM_OPTIONS);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsFormText, setOptionsFormText] = useState({});

  // Stale-closure guards
  const autoRefreshDone = React.useRef(false);
  const charsRef = React.useRef(characters);
  const logsRef = React.useRef(historyLogs);
  const optsRef = React.useRef(customOptions);
  const mercRef = React.useRef({ level: mercLevel, target: mercNextLevelTarget });
  const pilgrimageRef = React.useRef(pilgrimageHistory);
  const lastCloudUpdateAtRef = React.useRef(0);

  useEffect(() => { charsRef.current = characters; }, [characters]);
  useEffect(() => { logsRef.current = historyLogs; }, [historyLogs]);
  useEffect(() => { optsRef.current = customOptions; }, [customOptions]);
  useEffect(() => { mercRef.current = { level: mercLevel, target: mercNextLevelTarget }; }, [mercLevel, mercNextLevelTarget]);
  useEffect(() => { pilgrimageRef.current = pilgrimageHistory; }, [pilgrimageHistory]);

  // ─── Cloud sync ──────────────────────────────────────────────────────────────

  const syncUpCloudData = async (key, updatedChars, updatedLogs, updatedOpts, updatedMerc, forceOverride = false, updatedPilgrimage = null) => {
    if (!key) return;
    try {
      const pilgrimageData = updatedPilgrimage || pilgrimageRef.current;
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key,
          characters: updatedChars,
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
        console.warn("다중 탭 충돌 감지! 클라우드를 내려받습니다.");
        await syncDownCloudData(key, updatedChars, updatedLogs, updatedOpts);
        return;
      }
      if (resData.success && resData.newUpdateAt) {
        lastCloudUpdateAtRef.current = resData.newUpdateAt;
      }
    } catch (e) { console.error(e); }
  };

  const syncDownCloudData = async (targetKey, localChars, localLogs, localOpts) => {
    if (!targetKey) return;
    setIsCloudSyncing(true);
    try {
      const res = await fetch(`/api/sync?apiKey=${targetKey}`).then(r => r.json());
      if (res.success && res.data) {
        const cData = res.data;
        if (cData.lastUpdateAt) lastCloudUpdateAtRef.current = cData.lastUpdateAt;

        let modified = false;
        if (cData.characters?.length > 0) {
          setCharacters(cData.characters);
          localStorage.setItem('DNF_CHARACTERS', JSON.stringify(cData.characters));
          modified = true;
        }
        if (cData.historyLogs?.length > 0) {
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
        if (!modified && (localChars?.length > 0 || localLogs?.length > 0)) {
          await syncUpCloudData(targetKey, localChars, localLogs, localOpts, mercRef.current);
        }
        if (modified) { setIsCloudSyncing(false); return true; }
      } else if (res.success && !res.data) {
        if (localChars?.length > 0 || localLogs?.length > 0) {
          await syncUpCloudData(targetKey, localChars, localLogs, localOpts, mercRef.current);
        }
      }
    } catch (e) { console.error("Cloud Sync Failed:", e); }
    setIsCloudSyncing(false);
    return false;
  };

  const handleManualCloudSync = async () => {
    if (!apiKey) { alert("API 키를 먼저 설정해야 합니다."); return; }
    setIsCloudSyncing(true);
    await syncUpCloudData(apiKey, characters, historyLogs, customOptions, mercRef.current, true);
    setIsCloudSyncing(false);
    alert("현재 기기의 최신 데이터가 클라우드 서버에 수동으로 백업되었습니다!");
  };

  // ─── Init effect ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const key = localStorage.getItem("DNF_API_KEY") || "";
    setApiKeyState(key);
    if (!key) setShowSettings(true);
    setApiKeyInput(key);

    let loadedChars = [];
    const saved = localStorage.getItem('DNF_CHARACTERS');
    if (saved) { try { loadedChars = JSON.parse(saved); setCharacters(loadedChars); } catch (e) {} }

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
      } catch (e) {}
    }

    let loadedOpts = customOptions;
    let loadedLogs = [];
    const savedHistory = localStorage.getItem('DNF_HISTORY');
    if (savedHistory) { try { loadedLogs = JSON.parse(savedHistory); setHistoryLogs(loadedLogs); } catch (e) {} }

    const savedTab = localStorage.getItem('DNF_ACTIVE_TAB');
    if (savedTab) setActiveTabState(savedTab);

    const savedMerc = localStorage.getItem('DNF_MERC');
    if (savedMerc) {
      try {
        const m = JSON.parse(savedMerc);
        if (m.level) setMercLevel(m.level);
        if (m.target) setMercNextLevelTarget(m.target);
      } catch (e) {}
    }

    const savedPilgrimage = localStorage.getItem('DNF_PILGRIMAGE_HISTORY');
    if (savedPilgrimage) { try { setPilgrimageHistory(JSON.parse(savedPilgrimage)); } catch (e) {} }

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

    if (key) {
      syncDownCloudData(key, loadedChars, loadedLogs, loadedOpts).then((cloudHydrated) => {
        if (!cloudHydrated) triggerLocalMountRefresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 60s auto-refresh
  useEffect(() => {
    if (!apiKey || characters.length === 0) return;
    const timer = setInterval(() => { handleRefreshAll(charsRef.current, apiKey); }, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

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
      body: JSON.stringify({ server: srv, charName: name, apiKey })
    });
    return res.json();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!charName.trim()) return;
    if (!apiKey) { alert("API KEY를 먼저 설정해주세요."); setShowSettings(true); return; }
    setIsAdding(true);
    const data = await fetchCharacterData(server, charName.trim());
    setIsAdding(false);
    if (!data.success) { alert(data.error); return; }

    const bufferKeywords = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];
    const jobName = data.base?.jobGrowName || data.base?.jobName || '';
    data.manual = { role: bufferKeywords.some(kw => jobName.includes(kw)) ? 'buffer' : 'dealer' };

    if (characters.some(c => c.id === data.id)) { alert("이미 등록된 캐릭터입니다."); return; }
    const newList = [...characters, data];
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    setCharName('');
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, mercRef.current, true);
  };

  const handleRefreshAll = async (charsToRefresh = characters, overrideKey = null) => {
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
            id: Date.now() + Math.random().toString(36).slice(2, 11),
            timestamp: Date.now(),
            charId: c.id, charName: c.base.charName, job: c.base.jobGrowName, server: c.base.server,
            fameChange: null, equipChange: null, oathChange: null,
            beforeSnapshot: JSON.parse(JSON.stringify(c)),
            afterSnapshot: JSON.parse(JSON.stringify(res))
          };
          if (c.base.fame !== res.base.fame) { logEntry.fameChange = { old: c.base.fame, new: res.base.fame }; changed = true; }
          if (c.equipment.points !== res.equipment.points || c.equipment.setName !== res.equipment.setName) {
            logEntry.equipChange = { old: c.equipment.points, new: res.equipment.points, oldSet: c.equipment.setName, newSet: res.equipment.setName };
            changed = true;
          }
          if (c.oath.points !== res.oath.points || c.oath.setName !== res.oath.setName) {
            logEntry.oathChange = { old: c.oath.points, new: res.oath.points, oldSet: c.oath.setName, newSet: res.oath.setName };
            changed = true;
          }
          if (changed) newLogs.push(logEntry);
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
        const merged = [...newLogs, ...prev].slice(0, 1000);
        localStorage.setItem('DNF_HISTORY', JSON.stringify(merged));
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

  const handleSaveManual = (charId, formData) => {
    const formToSave = { ...formData, isManualRoleSet: true };
    const newList = characters.map(c => c.id === charId ? { ...c, manual: formToSave } : c);
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    if (apiKey) syncUpCloudData(apiKey, newList, historyLogs, customOptions, mercRef.current, true);
  };

  const handleDeleteLog = (id) => {
    if (!window.confirm("이 성장 기록을 정말 삭제하시겠습니까?")) return;
    setHistoryLogs(prev => {
      const updated = prev.filter(L => L.id !== id);
      localStorage.setItem('DNF_HISTORY', JSON.stringify(updated));
      if (apiKey) syncUpCloudData(apiKey, charsRef.current, updated, optsRef.current, mercRef.current, true);
      return updated;
    });
  };

  const handleSaveLog = (logId, updatedLog) => {
    setHistoryLogs(prev => {
      const updated = prev.map(L => L.id === logId ? updatedLog : L);
      localStorage.setItem('DNF_HISTORY', JSON.stringify(updated));
      if (apiKey) syncUpCloudData(apiKey, charsRef.current, updated, optsRef.current, mercRef.current, true);
      return updated;
    });
  };

  const handleSaveMerc = (level, target) => {
    setMercLevel(level);
    setMercNextLevelTarget(target);
    localStorage.setItem('DNF_MERC', JSON.stringify({ level, target }));
    if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, optsRef.current, { level, target }, true);
  };

  const handleSavePilgrimage = (newRecord) => {
    setPilgrimageHistory(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('DNF_PILGRIMAGE_HISTORY', JSON.stringify(updated));
      if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, optsRef.current, mercRef.current, true, updated);
      return updated;
    });
  };

  const handleDeletePilgrimage = (id) => {
    setPilgrimageHistory(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('DNF_PILGRIMAGE_HISTORY', JSON.stringify(updated));
      if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, optsRef.current, mercRef.current, true, updated);
      return updated;
    });
  };

  const openOptionsModal = () => {
    const textFormat = {};
    for (const key of ALL_MANUAL_KEYS) {
      textFormat[key] = (customOptions[key] || []).join(', ');
    }
    setOptionsFormText(textFormat);
    setShowOptionsModal(true);
  };

  const handleSaveOptions = () => {
    const newOpts = {};
    for (const key of ALL_MANUAL_KEYS) {
      newOpts[key] = optionsFormText[key]
        ? optionsFormText[key].split(',').map(s => s.trim()).filter(s => s)
        : [];
    }
    setCustomOptions(newOpts);
    localStorage.setItem('DNF_OPTIONS', JSON.stringify(newOpts));
    setShowOptionsModal(false);
    if (apiKey) syncUpCloudData(apiKey, charsRef.current, logsRef.current, newOpts, mercRef.current, true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <header className="app-header">
        <h1 className="title">DNF Info Manager</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleManualCloudSync} disabled={isCloudSyncing} style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' }}>
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
        <RosterTab
          characters={characters}
          isAdding={isAdding}
          isRefreshing={isRefreshing}
          server={server}
          charName={charName}
          setServer={setServer}
          setCharName={setCharName}
          customOptions={customOptions}
          onAdd={handleAdd}
          onRefreshAll={handleRefreshAll}
          onDelete={handleDelete}
          onSaveManual={handleSaveManual}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          historyLogs={historyLogs}
          characters={characters}
          onDeleteLog={handleDeleteLog}
          onSaveLog={handleSaveLog}
        />
      )}

      {activeTab === 'imminent' && (
        <ImminentTab characters={characters} />
      )}

      {activeTab === 'merc' && (
        <MercTab
          characters={characters}
          mercLevel={mercLevel}
          mercNextLevelTarget={mercNextLevelTarget}
          onSaveMerc={handleSaveMerc}
        />
      )}

      {activeTab === 'pilgrimage' && (
        <PilgrimageTab
          characters={characters}
          pilgrimageHistory={pilgrimageHistory}
          onSavePilgrimage={handleSavePilgrimage}
          onDeletePilgrimage={handleDeletePilgrimage}
          apiKey={apiKey}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '480px' }}>
            <h2 style={{ marginTop: 0 }}>⚙️ API KEY 설정</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              DNF 개발자 포털에서 발급받은 API KEY를 입력하세요. 입력한 키는 로컬에만 저장됩니다.
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
                <button type="button" onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>취소</button>
              )}
              <button type="button" onClick={handleSaveSettings}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Options modal */}
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
                { title: '아바타 영역', keys: ['avatar', 'emblem', 'platEmblem', 'skinAvatar', 'skinSocket', 'skinEmblem', 'weaponAvatar', 'weaponSocket', 'weaponEmblem', 'aura', 'auraEmblem'], labels: { avatar: '아바타 현황', emblem: '일반 엠블렘', platEmblem: '상하의 플래티넘 엠블렘 보유 여부', skinAvatar: '피부 아바타', skinSocket: '피부 소켓 여부', skinEmblem: '피부 엠블렘', weaponAvatar: '무기 아바타', weaponSocket: '무기 소켓 여부', weaponEmblem: '무기 엠블렘', aura: '오라 현황', auraEmblem: '오라 엠블렘' } }
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
                          onChange={e => setOptionsFormText({ ...optionsFormText, [k]: e.target.value })}
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

"use client";

import React, { useState, useEffect } from 'react';

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

export default function Home() {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const [characters, setCharacters] = useState([]);
  
  const [server, setServer] = useState('cain');
  const [charName, setCharName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiKey, setApiKeyState] = useState('');

  const [manualModalChar, setManualModalChar] = useState(null);
  const [manualForm, setManualForm] = useState({ enchant: '', title: '', aura: '', creature: '', avatar: '', emblem: '' });
  const [customOptions, setCustomOptions] = useState({
    enchant: ['기본', '가성비', '준종결', '종결'],
    title: ['기본', '가성비', '준종결', '종결'],
    aura: ['기본', '가성비', '준종결', '종결'],
    creature: ['기본', '가성비', '준종결', '종결'],
    avatar: ['기본', '이벤압', '레압', '클레압', '찬작', '엔드'],
    emblem: ['기본', '화려', '찬란', '다발', '종결플티']
  });

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsFormText, setOptionsFormText] = useState({});

  const autoRefreshDone = React.useRef(false);

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

    // 초기 마운트 시 자동 갱신 시행 (1회 한정)
    if (loadedChars.length > 0 && key && !autoRefreshDone.current) {
      autoRefreshDone.current = true;
      // 백그라운드 갱신 함수 (초기값으로 바로 실행)
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
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("DNF_API_KEY", apiKeyInput);
    setApiKeyState(apiKeyInput);
    setShowSettings(false);
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
  };

  const handleRefreshAll = async () => {
    if (characters.length === 0) return;
    setIsRefreshing(true);
    const updatedList = await Promise.all(
      characters.map(c => fetchCharacterData(c.base.server, c.base.charName))
    );
    const finalList = updatedList.map((res, i) => res.success ? { ...res, manual: characters[i].manual } : characters[i]);
    setCharacters(finalList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(finalList));
    setIsRefreshing(false);
  };

  const handleDelete = (id) => {
    const newList = characters.filter(c => c.id !== id);
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
  };

  const openManualModal = (char) => {
    setManualForm(char.manual || { enchant: '', title: '', aura: '', creature: '', avatar: '', emblem: '' });
    setManualModalChar(char);
  };

  const handleSaveManual = () => {
    if(!manualModalChar) return;
    const newList = characters.map(c => c.id === manualModalChar.id ? { ...c, manual: manualForm } : c);
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    setManualModalChar(null);
  };

  const openOptionsModal = () => {
    const textFormat = {};
    const ALL_KEYS = ['enchant', 'title', 'aura', 'creature', 'avatar', 'emblem'];
    for(const key of ALL_KEYS) {
      textFormat[key] = (customOptions[key] || []).join(', ');
    }
    setOptionsFormText(textFormat);
    setShowOptionsModal(true);
  };

  const handleSaveOptions = () => {
    const newOpts = {};
    const ALL_KEYS = ['enchant', 'title', 'aura', 'creature', 'avatar', 'emblem'];
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
  };

  const formatNumber = (num) => {
    if(typeof num === 'number') {
      if(num >= 100000000) return (num / 100000000).toFixed(2) + "억";
      if(num >= 10000) return (num / 10000).toFixed(0) + "만";
    }
    return num;
  };

  const getTierClass = (rarity) => {
    if(rarity === '태초') return 'tier-태초';
    if(rarity === '에픽') return 'tier-에픽';
    if(rarity === '레전더리') return 'tier-레전더리';
    if(rarity === '유니크') return 'tier-유니크';
    if(rarity === '레어') return 'tier-레어';
    return '';
  };

  return (
    <div>
      <header className="app-header">
        <h1 className="title">DNF Info Manager</h1>
        <div style={{display:'flex', gap:'0.5rem'}}>
          <button onClick={openOptionsModal}>🛠️ 옵션 편집</button>
          <button onClick={() => setShowSettings(true)}>⚙️ API 설정</button>
        </div>
      </header>

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
             <button type="button" onClick={handleRefreshAll} disabled={isRefreshing || characters.length === 0} style={{ background: '#475569' }}>
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
          <table>
            <thead>
              <tr>
                <th>서버</th>
                <th>직업</th>
                <th>캐릭터명 (제원)</th>
                <th>명성</th>
                <th>장비 (점수)</th>
                <th>서약 (점수)</th>
                <th>던담 링크</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {characters.map(c => (
                <tr key={c.id}>
                  <td>{SERVER_LIST.find(s => s.id === c.base.server)?.name || c.base.server}</td>
                  <td>{c.base.jobGrowName}</td>
                  <td>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '4px' }}>{c.base.charName}</div>
                    {c.manual && (
                       <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                         {c.manual.enchant && <span className="m-pill">마부: {c.manual.enchant}</span>}
                         {c.manual.title && <span className="m-pill">칭호: {c.manual.title}</span>}
                         {c.manual.aura && <span className="m-pill">오라: {c.manual.aura}</span>}
                         {c.manual.creature && <span className="m-pill">크리쳐: {c.manual.creature}</span>}
                         {c.manual.avatar && <span className="m-pill">아바타: {c.manual.avatar}</span>}
                         {c.manual.emblem && <span className="m-pill">엠블렘: {c.manual.emblem}</span>}
                       </div>
                    )}
                  </td>
                  <td style={{ color: '#fbbf24', fontWeight: 'bold' }}>{c.base.fame.toLocaleString()}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{c.equipment.setName}</div>
                    <div className={getTierClass(c.equipment.rarity)}>
                      {c.equipment.gradeDesc} ({c.equipment.points})
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{c.oath.setName}</div>
                    <div className={getTierClass(c.oath.rarity)}>
                      {c.oath.gradeDesc} ({c.oath.points})
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
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
                  <td style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button type="button" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6' }} onClick={() => openManualModal(c)}>
                      ⚙️
                    </button>
                    <button type="button" className="danger" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(c.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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
          <div className="glass-panel modal-content" style={{ maxWidth: '360px' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>[{manualModalChar.base.charName}] 수동 제원 설정</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>상단 🛠️ 탭에서 구성한 목록에서만 선택 가능합니다.</p>
            <div className="manual-form">
              {['enchant', 'title', 'aura', 'creature', 'avatar', 'emblem'].map(k => {
                const labels = { enchant: '마부 상태', title: '칭호', aura: '오라', creature: '크리쳐', avatar: '아바타', emblem: '엠블렘' };
                return (
                  <div key={k} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#94a3b8' }}>{labels[k]}</label>
                    <select 
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px' }}
                      value={manualForm[k] || ''}
                      onChange={e => setManualForm({...manualForm, [k]: e.target.value})}
                    >
                      <option value="">- 선택 안 함 -</option>
                      {customOptions[k]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )
              })}
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
          <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
            <h2 style={{ marginTop: 0, fontSize: '1.3rem' }}>🛠️ 드롭다운 전체 항목 편집</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              각 카테고리별로 콤마(,)를 사용해 선택지를 자유롭게 입력하세요. 
            </p>
            <div className="options-form" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              {['enchant', 'title', 'aura', 'creature', 'avatar', 'emblem'].map(k => {
                const labels = { enchant: '마부 옵션', title: '칭호 옵션', aura: '오라 옵션', creature: '크리쳐 옵션', avatar: '아바타 옵션', emblem: '엠블렘 옵션' };
                return (
                  <div key={k} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#94a3b8' }}>{labels[k]}</label>
                    <textarea 
                      rows={2}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', resize: 'vertical' }}
                      value={optionsFormText[k] || ''}
                      placeholder="종결, 짭종결, 가성비, 기본"
                      onChange={e => setOptionsFormText({...optionsFormText, [k]: e.target.value})}
                    />
                  </div>
                )
              })}
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

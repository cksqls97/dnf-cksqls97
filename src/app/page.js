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
  const [manualForm, setManualForm] = useState({ enchant: '', title: '', aura: '', creature: '', avatar: '' });
  const [customOptions, setCustomOptions] = useState({
    enchant: ['기본', '가성비', '준종결', '종결'],
    title: ['기본', '가성비', '준종결', '종결'],
    aura: ['기본', '가성비', '준종결', '종결'],
    creature: ['기본', '가성비', '준종결', '종결'],
    avatar: ['기본', '이벤압', '레압', '클레압', '찬작', '엔드']
  });

  useEffect(() => {
    const key = localStorage.getItem("DNF_API_KEY") || "";
    setApiKeyState(key);
    if (!key) setShowSettings(true);
    setApiKeyInput(key);

    const saved = localStorage.getItem('DNF_CHARACTERS');
    if (saved) {
      try {
        setCharacters(JSON.parse(saved));
      } catch(e) {}
    }

    const savedOpts = localStorage.getItem('DNF_OPTIONS');
    if (savedOpts) {
      try { setCustomOptions(JSON.parse(savedOpts)); } catch(e) {}
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
    const finalList = updatedList.map((res, i) => res.success ? res : characters[i]);
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
    setManualForm(char.manual || { enchant: '', title: '', aura: '', creature: '', avatar: '' });
    setManualModalChar(char);
  };

  const handleSaveManual = () => {
    if(!manualModalChar) return;
    
    const newList = characters.map(c => c.id === manualModalChar.id ? { ...c, manual: manualForm } : c);
    setCharacters(newList);
    localStorage.setItem('DNF_CHARACTERS', JSON.stringify(newList));
    
    const newOpts = { ...customOptions };
    let optsChanged = false;
    ['enchant', 'title', 'aura', 'creature', 'avatar'].forEach(key => {
      const val = manualForm[key].trim();
      if (val && !newOpts[key].includes(val)) {
        newOpts[key] = [...newOpts[key], val];
        optsChanged = true;
      }
    });
    if (optsChanged) {
      setCustomOptions(newOpts);
      localStorage.setItem('DNF_OPTIONS', JSON.stringify(newOpts));
    }
    
    setManualModalChar(null);
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
        <button onClick={() => setShowSettings(true)}>⚙️ API 설정</button>
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
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                         {c.manual.enchant && <span className="m-pill">🔮{c.manual.enchant}</span>}
                         {c.manual.title && <span className="m-pill">✨{c.manual.title}</span>}
                         {c.manual.aura && <span className="m-pill">🌟{c.manual.aura}</span>}
                         {c.manual.creature && <span className="m-pill">🐾{c.manual.creature}</span>}
                         {c.manual.avatar && <span className="m-pill">👗{c.manual.avatar}</span>}
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>목록에서 선택하거나 새로운 옵션을 직접 입력하세요.</p>
            <div className="manual-form">
              {['enchant', 'title', 'aura', 'creature', 'avatar'].map(k => {
                const labels = { enchant: '마부 상태', title: '칭호', aura: '오라', creature: '크리쳐', avatar: '아바타' };
                return (
                  <div key={k} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: '#94a3b8' }}>{labels[k]}</label>
                    <input 
                      list={`list-${k}`}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={manualForm[k]}
                      placeholder="텍스트 입력/선택"
                      onChange={e => setManualForm({...manualForm, [k]: e.target.value})}
                    />
                    <datalist id={`list-${k}`}>
                      {customOptions[k].map(opt => <option key={opt} value={opt} />)}
                    </datalist>
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
    </div>
  );
}

const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

const funcName = "function SecretShopModalComponent";
const startIdx = content.indexOf(funcName);
if (startIdx !== -1) {
    const endMark = "  );\n}";
    const endIdx = content.indexOf(endMark, startIdx) + endMark.length;

    const newFunc = `function SecretShopModalComponent({ activeSecretShopModal, setActiveSecretShopModal, characters, getCharForm, addCharToken, updateCharToken, removeCharToken, addCharRecipe, updateCharRecipe, removeCharRecipe, updateCharForm }) {
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
      const cleanedTokens = (form.secretTokens || []).filter(t => t.buyPrice !== '');
      updateCharForm(charId, 'secretTokens', cleanedTokens);
      const cleanedRecipes = (form.secretRecipes || []).filter(r => r.buyPrice !== '' || r.sealCost !== '' || r.sellPrice !== '');
      updateCharForm(charId, 'secretRecipes', cleanedRecipes);
    }
    setActiveSecretShopModal(null);
  };

  if (!activeSecretShopModal) return null;
  const charName = characters.find(c => c.id === activeSecretShopModal.charId)?.base.charName || '알 수 없음';
  
  return (
    <div className="modal-overlay">
       <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
            🛒 {charName} - 특별상점 통합 관리
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 인장 구매 섹션 */}
                <div>
                   <h4 style={{ fontSize: '0.75rem', color: '#38bdf8', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>🔹 순례의 인장 (증표 구매)</h4>
                   <button onClick={() => addCharToken(activeSecretShopModal.charId)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '4px', marginBottom: '1rem', cursor: 'pointer' }}>+ 구매 내역 추가</button>
                   {(getCharForm(activeSecretShopModal.charId).secretTokens || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>구매 내역이 없습니다.</div> : (
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                       {(getCharForm(activeSecretShopModal.charId).secretTokens || []).map((t, idx) => (
                         <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>#{idx+1}</span>
                            <input type="number" value={t.buyPrice} onChange={e => updateCharToken(activeSecretShopModal.charId, t.id, e.target.value)} style={{ width: '80px', padding: '0.3rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="골드" />
                            <button onClick={() => removeCharToken(activeSecretShopModal.charId, t.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.3rem' }}>×</button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                {/* 레시피 제작 섹션 */}
                <div>
                   <h4 style={{ fontSize: '0.75rem', color: '#a78bfa', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>🔹 레시피 / 답례품 제작</h4>
                   <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <button onClick={() => addCharRecipe(activeSecretShopModal.charId)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ 일반 레시피</button>
                      <button onClick={() => {
                         const charId = activeSecretShopModal.charId;
                         const form = getCharForm(charId);
                         updateCharForm(charId, 'secretRecipes', [...(form.secretRecipes || []), { id: Date.now(), buyPrice: '', type: 'shinyGift' }]);
                      }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ 빛나는 답례품</button>
                      <button onClick={() => {
                         const charId = activeSecretShopModal.charId;
                         const form = getCharForm(charId);
                         updateCharForm(charId, 'secretRecipes', [...(form.secretRecipes || []), { id: Date.now(), buyPrice: '', type: 'brilliantGift' }]);
                      }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '4px', cursor: 'pointer' }}>+ 화려한 답례품</button>
                   </div>
                   
                   {(getCharForm(activeSecretShopModal.charId).secretRecipes || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>제작 내역이 없습니다.</div> : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {(getCharForm(activeSecretShopModal.charId).secretRecipes || []).map((r, idx) => {
                         const isShiny = r.type === 'shinyGift';
                         const isBrilliant = r.type === 'brilliantGift';
                         const isGift = isShiny || isBrilliant;
                         
                         return (
                           <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ fontSize: '0.7rem', color: isGift ? '#fbbf24' : '#a78bfa', fontWeight: 'bold', minWidth: '110px' }}>
                                {isShiny ? '🎁 빛나는 답례품' : isBrilliant ? '🎁 화려한 답례품' : \`레시피 #\${idx+1}\`}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>구매가:</span>
                                <input type="number" value={r.buyPrice} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'buyPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="골드" />
                              </div>
                              {isGift ? (
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', flex: 1 }}>
                                  [소모] {isShiny ? '레전더리' : '에픽'} 소울 1 / [보상] 증표 {isShiny ? '5' : '20'}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>인장:</span>
                                    <input type="number" value={r.sealCost} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'sealCost', e.target.value)} style={{ width: '40px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} />
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>판매가:</span>
                                    <input type="number" value={r.sellPrice} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'sellPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} />
                                  </div>
                                </div>
                              )}
                              <button onClick={() => removeCharRecipe(activeSecretShopModal.charId, r.id)} style={{ marginLeft: 'auto', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.3rem' }}>×</button>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={handleClose} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>닫기</button>
          </div>
       </div>
    </div>
  );
}`;
    content = content.substring(0, startIdx) + newFunc + content.substring(endIdx);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Modal function replaced successfully.');
} else {
    console.log('Modal function name not found.');
}

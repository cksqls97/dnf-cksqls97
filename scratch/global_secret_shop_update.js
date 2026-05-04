const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

function updateBaseItems() {
    const target = /const baseItems = \['무결점 라이언 코어'.*'피로 회복의 영약'\];/;
    const replacement = "const baseItems = ['무결점 라이언 코어', '무결점 조화의 결정체', '닳아버린 순례의 증표', '순례의 인장(1회 교환 가능)', '순례의 인장(1회 교환 가능) 교환권 1개 상자', '피로 회복의 영약', '레전더리 소울 결정', '에픽 소울 결정'];";
    if (target.test(content)) {
        content = content.replace(target, replacement);
        console.log('Base items updated.');
    } else {
        console.log('Base items target NOT found.');
    }
}

function updateCalculation() {
    const startPattern = 'let recipeProfit = 0;';
    const endPattern = '            });';
    const startIdx = content.indexOf(startPattern);
    if (startIdx === -1) {
        console.log('Calculation start pattern NOT found.');
        return;
    }
    const endIdx = content.indexOf(endPattern, startIdx) + endPattern.length;
    
    const replacement = `let recipeProfit = 0;
            let recipeSealCost = 0;
            (form.secretRecipes || []).forEach(r => {
               const bp = Number(r.buyPrice || 0);
               if (r.type === 'shinyGift') {
                  const matPrice = auctionPrices['레전더리 소울 결정'] || 0;
                  const rewardVal = 5 * (auctionPrices['닳아버린 순례의 증표'] || 0);
                  if (bp > 0 || matPrice > 0) {
                     secretShopGoldSpent += bp;
                     recipeProfit += (rewardVal - bp - matPrice);
                  }
               } else if (r.type === 'brilliantGift') {
                  const matPrice = auctionPrices['에픽 소울 결정'] || 0;
                  const rewardVal = 20 * (auctionPrices['닳아버린 순례의 증표'] || 0);
                  if (bp > 0 || matPrice > 0) {
                     secretShopGoldSpent += bp;
                     recipeProfit += (rewardVal - bp - matPrice);
                  }
               } else {
                  const seals = Number(r.sealCost || 0);
                  const sp = Number(r.sellPrice || 0);
                  if (bp > 0 || sp > 0) {
                    if (bp > 0) secretShopGoldSpent += bp;
                    const sealVal = seals * 5000;
                    recipeSealCost += sealVal;
                    recipeProfit += (sp - bp - sealVal);
                  }
               }
            });`;
    
    const original = content.substring(startIdx, endIdx);
    content = content.replace(original, replacement);
    console.log('Calculation logic updated.');
}

function updateUI() {
    const startPattern = "{activeSecretShopModal.type === 'recipe' && (";
    const endPattern = "              )}";
    const startIdx = content.indexOf(startPattern);
    if (startIdx === -1) {
        console.log('UI start pattern NOT found.');
        return;
    }
    
    // Find the matching closing )} for the recipe block
    let openCount = 1;
    let currentIdx = startIdx + startPattern.length;
    while (openCount > 0 && currentIdx < content.length) {
        if (content.substring(currentIdx, currentIdx + 2) === '({') openCount++;
        if (content.substring(currentIdx, currentIdx + 2) === '})') openCount--;
        if (content.substring(currentIdx, currentIdx + 2) === '({') { /* already handled */ }
        // Simple search for the pattern
        currentIdx++;
    }
    
    // Actually, I'll just find the "닫기" button and go back.
    // Or better, use the known structure.
    const endIdx = content.indexOf("              )}", startIdx) + 16;
    
    const replacement = `{activeSecretShopModal.type === 'recipe' && (
                 <div>
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
                            <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                               <div style={{ fontSize: '0.7rem', color: isGift ? '#fbbf24' : '#a78bfa', fontWeight: 'bold' }}>
                                 {isShiny ? '🎁 디그밍의 빛나는 답례품' : isBrilliant ? '🎁 디그밍의 화려한 답례품' : \`레시피 #\${idx+1}\`}
                               </div>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                 <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>구매가 (상점 가격):</span>
                                 <input type="number" value={r.buyPrice} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'buyPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} placeholder="골드" />
                               </div>
                               {isGift ? (
                                 <div style={{ fontSize: '0.65rem', color: '#94a3b8', padding: '0.4rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', lineHeight: '1.4' }}>
                                   🔹 <span style={{ color: '#e2e8f0' }}>소모 재료:</span> {isShiny ? '레전더리' : '에픽'} 소울 결정 1개<br/>
                                   🔹 <span style={{ color: '#e2e8f0' }}>보상:</span> 닳아버린 순례의 증표 {isShiny ? '5' : '20'}개
                                 </div>
                               ) : (
                                 <>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                     <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>소모 순례의 인장:</span>
                                     <input type="number" value={r.sealCost} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'sealCost', e.target.value)} style={{ width: '60px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} placeholder="개수" />
                                   </div>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                     <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>판매가:</span>
                                     <input type="number" value={r.sellPrice} onChange={e => updateCharRecipe(activeSecretShopModal.charId, r.id, 'sellPrice', e.target.value)} style={{ width: '90px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} placeholder="골드" />
                                   </div>
                                 </>
                               )}
                               <button onClick={() => removeCharRecipe(activeSecretShopModal.charId, r.id)} style={{ marginLeft: 'auto', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                 </div>
              )}`;
    
    const original = content.substring(startIdx, endIdx);
    content = content.replace(original, replacement);
    console.log('UI updated.');
}

updateBaseItems();
updateCalculation();
updateUI();

fs.writeFileSync(path, content, 'utf8');
console.log('Global update finished.');

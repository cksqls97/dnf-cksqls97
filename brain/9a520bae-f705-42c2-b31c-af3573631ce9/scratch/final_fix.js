const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix addCharToken and updateCharToken
content = content.replace(/const addCharToken = \(charId\) => \{[\s\S]*?const updateCharToken = \(charId, tokenId, val\) => \{[\s\S]*?\};/g,
`const addCharToken = (charId, initialPrice = '') => {
            const form = getCharForm(charId);
            const mPrice = auctionPrices['닳아버린 순례의 증표'] || 0;
            updateCharForm(charId, 'secretTokens', [...form.secretTokens, { id: Date.now(), buyPrice: initialPrice, sellPrice: mPrice }]);
         };
         const updateCharToken = (charId, tokenId, field, val) => {
            const form = getCharForm(charId);
            updateCharForm(charId, 'secretTokens', form.secretTokens.map(t => t.id === tokenId ? { ...t, [field]: val } : t));
         };`);

// 2. hasLootData (Exclude shop from exclusion logic)
content = content.replace(/const hasLootData = \([\s\S]*?            \);/g,
`const hasLootData = (
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
                      );`);

// 3. rows.map calculation logic (Unified format)
// Replace the shop variables block
content = content.replace(/let secretShopGoldSpent = 0;[\s\S]*?let recipeSealCostValue = 0;/g,
`let secretShopGoldSpent = 0;
                     let secretShopRewardValue = 0;
                     let recipeSealCostValue = 0;
                     let tokenProfit = 0;
                     let recipeProfit = 0;
                     let recipeSoulCrystalCost = 0;
                     let recipeGiftRewardValue = 0;`);

// Replace the loops in rows.map
content = content.replace(/\(form\.secretTokens \|\| \[\]\)\.forEach\(t => \{[\s\S]*?\}\);/g,
`(form.secretTokens || []).forEach(t => {
                       const bp = Number(t.buyPrice || 0);
                       const sp = Number(t.sellPrice || 0);
                       if (bp > 0 || sp > 0) {
                          secretShopGoldSpent += bp;
                          secretShopRewardValue += sp;
                          tokenProfit += (sp - bp);
                       }
                     });`);

content = content.replace(/\(form\.secretRecipes \|\| \[\]\)\.forEach\(r => \{[\s\S]*?\}\);/g,
`(form.secretRecipes || []).forEach(r => {
                        const bp = Number(r.buyPrice || 0);
                        if (r.type === 'shinyGift') {
                           const matPrice = auctionPrices['레전더리 소울 결정'] || 0;
                           const rewardVal = 5 * tokenPrice;
                           if (bp > 0 || matPrice > 0) {
                              secretShopGoldSpent += bp;
                              recipeSoulCrystalCost += matPrice;
                              recipeGiftRewardValue += rewardVal;
                              secretShopRewardValue += rewardVal;
                              recipeProfit += (rewardVal - bp - matPrice);
                           }
                        } else if (r.type === 'brilliantGift') {
                           const matPrice = auctionPrices['에픽 소울 결정'] || 0;
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
                     });`);

// Update totalConsumedValue and restoredPureGold in rows.map
content = content.replace(/const totalConsumedValue = tokenCost \+ potionCost \+ secretShopCostValue;/g,
`const totalConsumedValue = tokenCost + potionCost + recipeSealCostValue + recipeSoulCrystalCost;`);
content = content.replace(/const restoredPureGold = pureGoldInput \+ secretShopGoldSpent;/g,
`const restoredPureGold = pureGoldInput;`);

// 4. Update Detail Modal
// Remove the restoration line
content = content.replace(/\{calcDetail\.breakdown\.secretShopGoldSpent > 0 && \([\s\S]*?<\/div>\s+\)\}/, '');
// Change Profit labels
content = content.replace(/<span>닳아버린 순례의 증표 단가 이득<\/span>/, '<span>비밀상점 인장 구매 이득 (판매가 - 구매가)</span>');
// Info text
content = content.replace(/\* 순수익\(귀속 제외\) = 교환 가능 합계 - 소모 합계/g, '* 순수익(귀속 제외) = 교환 가능 합계 - 소모 합계 (비밀상점 구매 비용은 이미 순 골드에 반영되어 있습니다)');

// 5. Update SecretShopModalComponent UI
// handleClose tokens filter
content = content.replace(/const cleanedTokens = \(form\.secretTokens \|\| \[\]\)\.filter\(t => t\.buyPrice !== ''\);/g,
`const cleanedTokens = (form.secretTokens || []).filter(t => t.buyPrice !== '' || t.sellPrice !== '');`);

// Token UI section
const tokenUiTarget = /\{\(getCharForm\(activeSecretShopModal\.charId\)\.secretTokens \|\| \[\]\)\.length === 0 \? <div style=\{\{ color: 'var\(--text-muted\)', fontSize: '0\.7rem' \}\}>구매 내역이 없습니다\.<\/div> : \([\s\S]*?                  \)\}/;
const tokenUiReplacement = `{(getCharForm(activeSecretShopModal.charId).secretTokens || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>구매 내역이 없습니다.</div> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(getCharForm(activeSecretShopModal.charId).secretTokens || []).map((t, idx) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold', minWidth: '90px' }}>인장 구매 #{idx+1}</div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                               <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>구매가:</span>
                               <input type="number" value={t.buyPrice} onChange={e => updateCharToken(activeSecretShopModal.charId, t.id, 'buyPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="골드" />
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                               <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>판매가:</span>
                               <input type="number" value={t.sellPrice} onChange={e => updateCharToken(activeSecretShopModal.charId, t.id, 'sellPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="시장가" />
                             </div>
                             <div style={{ fontSize: '0.7rem', color: (Number(t.sellPrice||0) - Number(t.buyPrice||0)) >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold', marginLeft: 'auto', marginRight: '1rem' }}>
                               수익: {(Number(t.sellPrice||0) - Number(t.buyPrice||0)).toLocaleString()} G
                             </div>
                             <button onClick={() => removeCharToken(activeSecretShopModal.charId, t.id)} style={{ padding: '0.2rem 0.4rem', background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>삭제</button>
                          </div>
                        ))}
                      </div>
                    )}`;
if (tokenUiTarget.test(content)) content = content.replace(tokenUiTarget, tokenUiReplacement);

// 6. Fix handleSavePilgrimage history saving logic
// We already replaced common loop patterns, but let's ensure the variables are right.
content = content.replace(/let tokenProfit = 0;\s+let secretShopGoldSpent = 0;/g, 
`let tokenProfit = 0;
            let secretShopGoldSpent = 0;
            let secretShopRewardValue = 0;`);

content = content.replace(/const totalConsumedValue = tokenCost \+ potionCost;/g, 
`const totalConsumedValue = tokenCost + potionCost + recipeSealCost + recipeSoulCrystalCost;`);

content = content.replace(/const finalTradableValue = restoredPureGold \+ tradableCoreValue \+ tradableCrystalValue \+ voucherProfitTotal \+ tradableSealValue \+ voucherBoxValue \+ tokenProfit \+ recipeProfit \+ customTradableValue;/g,
`const finalTradableValue = restoredPureGold + tradableCoreValue + tradableCrystalValue + voucherProfitTotal + tradableSealValue + voucherBoxValue + secretShopRewardValue + customTradableValue;`);

fs.writeFileSync(path, content);
console.log('Success');

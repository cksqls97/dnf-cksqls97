const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Update rows.map calculation
// Find secretShopGoldSpent calculation loop for tokens
content = content.replace(/\(form\.secretTokens \|\| \[\]\)\.forEach\(t => \{([\s\S]*?)\}\);/g,
`(form.secretTokens || []).forEach(t => {
                       const bp = Number(t.buyPrice || 0);
                       const sp = Number(t.sellPrice || 0);
                       if (bp > 0 || sp > 0) {
                          secretShopGoldSpent += bp;
                          secretShopRewardValue += sp;
                          tokenProfit += (sp - bp);
                       }
                     });`);

// Update secretRecipes loop
content = content.replace(/\(form\.secretRecipes \|\| \[\]\)\.forEach\(r => \{([\s\S]*?)\}\);/g,
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

// Update totalConsumedValue (remove secretShopCostValue, use crystal/seal costs directly)
content = content.replace(/const totalConsumedValue = tokenCost \+ potionCost \+ secretShopCostValue;/g,
`const totalConsumedValue = tokenCost + potionCost + recipeSealCostValue + recipeSoulCrystalCost;`);

// Update restoredPureGold (stop restoring)
content = content.replace(/const restoredPureGold = pureGoldInput \+ secretShopGoldSpent;/g,
`const restoredPureGold = pureGoldInput;`);

// 2. Update Detail Modal UI
// Remove restoration line
content = content.replace(/\{calcDetail\.breakdown\.secretShopGoldSpent > 0 && \([\s\S]*?<\/div>\s+\)\}/, '');

// Change Token Profit Label
content = content.replace(/<span>닳아버린 순례의 증표 단가 이득<\/span>\s+<span>\{calcDetail\.breakdown\.tokenProfit\.toLocaleString\(\)\} G<\/span>/,
`<span>비밀상점 인장 구매 이득 (판매가 - 구매가)</span>
                           <span>{calcDetail.breakdown.tokenProfit.toLocaleString()} G</span>`);

// Update info text
content = content.replace(/\* 순수익\(귀속 제외\) = 교환 가능 합계 - 소모 합계/g,
`* 순수익(귀속 제외) = 교환 가능 합계 - 소모 합계 (비밀상점 구매 비용은 이미 순 골드에 반영되어 있습니다)`);

fs.writeFileSync(path, content);
console.log('Success');

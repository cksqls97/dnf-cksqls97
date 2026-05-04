const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Update all baseItems
const fullBaseItems = "['무결점 라이언 코어', '무결점 조화의 결정체', '닳아버린 순례의 증표', '순례의 인장(1회 교환 가능)', '순례의 인장(1회 교환 가능) 교환권 1개 상자', '피로 회복의 영약', '레전더리 소울 결정', '에픽 소울 결정']";
content = content.replace(/const baseItems = \[.*'피로 회복의 영약'\];/, `const baseItems = ${fullBaseItems};`);
content = content.replace(/const baseItems = \['무결점 라이언 코어'.*?'순례의 인장\(1회 교환 가능\) 교환권 1개 상자'\];/, `const baseItems = ${fullBaseItems};`);

// 2. Refactor handleSavePilgrimage calculation
// We need to find the recipe loop and the totals calculation
const recipeLoopStart = content.indexOf('let recipeProfit = 0;');
const recipeLoopEnd = content.indexOf('});', recipeLoopStart) + 3;
const originalRecipeLoop = content.substring(recipeLoopStart, recipeLoopEnd);

const newRecipeLogic = `let recipeProfit = 0;
            let recipeSealCost = 0;
            let recipeSoulCrystalCost = 0;
            let recipeGiftRewardValue = 0;
            
            (form.secretRecipes || []).forEach(r => {
               const bp = Number(r.buyPrice || 0);
               if (r.type === 'shinyGift') {
                  const matPrice = auctionPrices['레전더리 소울 결정'] || 0;
                  const rewardVal = 5 * (auctionPrices['닳아버린 순례의 증표'] || 0);
                  if (bp > 0 || matPrice > 0) {
                     secretShopGoldSpent += bp;
                     recipeSoulCrystalCost += matPrice;
                     recipeGiftRewardValue += rewardVal;
                     recipeProfit += (rewardVal - bp - matPrice);
                  }
               } else if (r.type === 'brilliantGift') {
                  const matPrice = auctionPrices['에픽 소울 결정'] || 0;
                  const rewardVal = 20 * (auctionPrices['닳아버린 순례의 증표'] || 0);
                  if (bp > 0 || matPrice > 0) {
                     secretShopGoldSpent += bp;
                     recipeSoulCrystalCost += matPrice;
                     recipeGiftRewardValue += rewardVal;
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

content = content.replace(originalRecipeLoop, newRecipeLogic);

// Update totalConsumedValue to include soul crystals? 
// Actually, it's better to keep it in recipeProfit but show it in breakdown.
// Let's update the setCalcDetail call in the table rendering.

const setCalcDetailPattern = /setCalcDetail\(\{[\s\S]*?\}\)\}/g;
// There are multiple occurrences of setCalcDetail (one for each profit column).
// I'll replace the breakdown part.

content = content.replace(/breakdown: \{([\s\S]*?)\},/g, (match, p1) => {
    if (p1.includes('recipeProfit: recipeProfit')) {
        return `breakdown: {
                                  ${p1.trim()},
                                  recipeSoulCrystalCost: recipeSoulCrystalCost,
                                  recipeGiftRewardValue: recipeGiftRewardValue
                                },`;
    }
    return match;
});

// 3. Update the Modal UI to show the new metrics
// Find the "비밀상점 레시피 수익" line and add details after it.
const recipeProfitLine = '<span>비밀상점 레시피 수익</span>';
const updatedRecipeProfitLine = `<span>비밀상점 레시피 수익</span>
                                          <span>{calcDetail.breakdown.recipeProfit.toLocaleString()} G</span>
                                        </div>
                                        {(calcDetail.breakdown.recipeSoulCrystalCost > 0 || calcDetail.breakdown.recipeGiftRewardValue > 0) && (
                                          <div style={{ padding: '0.4rem', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', marginTop: '0.2rem', marginBottom: '0.5rem', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                              <span>ㄴ 답례품 소울 결정 소모</span>
                                              <span>-{calcDetail.breakdown.recipeSoulCrystalCost.toLocaleString()} G</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                              <span>ㄴ 답례품 증표 보상 가치</span>
                                              <span>+{calcDetail.breakdown.recipeGiftRewardValue.toLocaleString()} G</span>
                                            </div>
                                          </div>
                                        )}`;

// This replacement is tricky because of the following line <span>{calcDetail.breakdown.recipeProfit.toLocaleString()} G</span>
const targetBlock = `<span>비밀상점 레시피 수익</span>
                          <span>{calcDetail.breakdown.recipeProfit.toLocaleString()} G</span>
                        </div>`;

// Use a more flexible replace for the UI
content = content.replace(/<span>비밀상점 레시피 수익<\/span>\s*<span>\{calcDetail\.breakdown\.recipeProfit\.toLocaleString\(\)\} G<\/span>\s*<\/div>/g, updatedRecipeProfitLine);

fs.writeFileSync(path, content, 'utf8');
console.log('Update script finished.');

const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

// Update baseItems (there are two occurrences, one in Home and one in SecretShopModalComponent if I added it? No, just Home and LootModalComponent)
content = content.replace(
  /const baseItems = \['무결점 라이언 코어', '무결점 조화의 결정체', '닳아버린 순례의 증표', '순례의 인장\(1회 교환 가능\)', '순례의 인장\(1회 교환 가능\) 교환권 1개 상자', '피로 회복의 영약'\];/,
  "const baseItems = ['무결점 라이언 코어', '무결점 조화의 결정체', '닳아버린 순례의 증표', '순례의 인장(1회 교환 가능)', '순례의 인장(1회 교환 가능) 교환권 1개 상자', '피로 회복의 영약', '레전더리 소울 결정', '에픽 소울 결정'];"
);

// Update calculation logic
const calcTarget = `            let recipeProfit = 0;
            let recipeSealCost = 0;
            (form.secretRecipes || []).forEach(r => {
               const bp = Number(r.buyPrice || 0);
               const seals = Number(r.sealCost || 0);
               const sp = Number(r.sellPrice || 0);
               if (bp > 0 || sp > 0) {
                 if (bp > 0) secretShopGoldSpent += bp;
                 const sealVal = seals * 5000;
                 recipeSealCost += sealVal;
                 recipeProfit += (sp - bp - sealVal);
               }
            });`;

const calcReplacement = `            let recipeProfit = 0;
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

// Using a simpler string replacement for calc if regex is too hard with spaces
if (content.includes('let recipeProfit = 0;')) {
    // We need to be careful with indentation. Let's find the whole block.
    const startIdx = content.indexOf('let recipeProfit = 0;');
    const endIdx = content.indexOf('});', startIdx) + 3;
    const originalBlock = content.substring(startIdx - 12, endIdx); // adjust for 12 spaces
    content = content.replace(originalBlock, calcReplacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Update script finished.');

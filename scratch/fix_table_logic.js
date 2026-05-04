const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

// The block inside the table map loop (around line 2214)
const loopTarget = `                    let recipeProfit = 0;
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

const loopReplacement = `                    let recipeProfit = 0;
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

// We need to find the specific one inside the map loop.
// The map loop has different indentation.

if (content.includes('let recipeProfit = 0;') && content.includes('let recipeSealCost = 0;')) {
    // Replace all occurrences of this pattern to be safe
    // (Actually there should be two: one in handleSavePilgrimage and one in table loop)
    // Wait, handleSavePilgrimage was already updated.
    
    // I'll use a more targeted replacement for the table loop.
    const startIdx = content.indexOf('let recipeProfit = 0;', content.indexOf('const rows = selectedChars.map'));
    if (startIdx !== -1) {
        const endIdx = content.indexOf('});', startIdx) + 3;
        const originalBlock = content.substring(startIdx, endIdx);
        content = content.replace(originalBlock, loopReplacement);
        console.log('Table loop logic updated.');
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Update script finished.');

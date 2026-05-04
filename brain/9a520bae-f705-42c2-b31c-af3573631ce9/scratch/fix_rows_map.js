const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// Use markers or very specific unique strings for replacement to avoid regex issues.

// 1. rows.map variables
const varsOld = `                    let secretShopGoldSpent = 0;
                     let secretShopRewardValue = 0;
                     let secretShopCostValue = 0;
                     let recipeSealCostValue = 0;`;
const varsNew = `                    let secretShopGoldSpent = 0;
                     let secretShopRewardValue = 0;
                     let recipeSealCostValue = 0;
                     let tokenProfit = 0;
                     let recipeProfit = 0;
                     let recipeSoulCrystalCost = 0;
                     let recipeGiftRewardValue = 0;`;

if (content.indexOf(varsOld) !== -1) {
    content = content.replace(varsOld, varsNew);
} else {
    // Try with different indentation
    const varsOld2 = varsOld.replace(/\n\s+/g, '\n');
    const varsNew2 = varsNew.replace(/\n\s+/g, '\n');
    // ... too complex. I'll use regex but with careful boundaries.
    content = content.replace(/let secretShopGoldSpent = 0;[\s]*?\n[\s]*?let secretShopRewardValue = 0;[\s]*?\n[\s]*?let secretShopCostValue = 0;[\s]*?\n[\s]*?let recipeSealCostValue = 0;/g, varsNew);
}

// 2. loops in rows.map
const tokenLoopOld = `                    (form.secretTokens || []).forEach(t => {
                       const bp = Number(t.buyPrice || 0);
                       if (bp > 0) {
                          secretShopGoldSpent += bp;
                          secretShopCostValue += bp;
                          secretShopRewardValue += tokenPrice;
                       }
                     });`;
const tokenLoopNew = `                    (form.secretTokens || []).forEach(t => {
                       const bp = Number(t.buyPrice || 0);
                       const sp = Number(t.sellPrice || 0);
                       if (bp > 0 || sp > 0) {
                          secretShopGoldSpent += bp;
                          secretShopRewardValue += sp;
                          tokenProfit += (sp - bp);
                       }
                     });`;

content = content.replace(/\(form\.secretTokens \|\| \[\]\)\.forEach\(t => \{[\s\S]*?secretShopRewardValue \+= tokenPrice;[\s\S]*?\}\);/g, tokenLoopNew);

// 3. recipe loop in rows.map
content = content.replace(/\(form\.secretRecipes \|\| \[\]\)\.forEach\(r => \{[\s\S]*?recipeSealCostValue \+= sealVal;[\s\S]*?secretShopCostValue \+= \(bp \+ sealVal\);[\s\S]*?secretShopRewardValue \+= sp;[\s\S]*?\}\);/g,
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

// 4. Final assignments in rows.map
content = content.replace(/const totalConsumedValue = tokenCost \+ potionCost \+ secretShopCostValue;/g,
`const totalConsumedValue = tokenCost + potionCost + recipeSealCostValue + recipeSoulCrystalCost;`);
content = content.replace(/const restoredPureGold = pureGoldInput \+ secretShopGoldSpent;/g,
`const restoredPureGold = pureGoldInput;`);

fs.writeFileSync(path, content, 'utf8');
console.log('Success');

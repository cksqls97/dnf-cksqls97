const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// Fix addCharToken
content = content.replace(/const addCharToken = \(charId\) => \{/g, 'const addCharToken = (charId, initialPrice = \'\') => {');
content = content.replace(/updateCharForm\(charId, 'secretTokens', \[\.\.\.form\.secretTokens, \{ id: Date\.now\(\), buyPrice: '' \}\]\);/g, "updateCharForm(charId, 'secretTokens', [...form.secretTokens, { id: Date.now(), buyPrice: initialPrice }]);");

// Fix variable definitions in rows.map
// Match the block starting from let secretShopGoldSpent = 0;
const oldVarBlock = `let secretShopGoldSpent = 0;
                     let secretShopRewardValue = 0;
                     let secretShopCostValue = 0;
                     let recipeSealCostValue = 0;`;
const newVarBlock = `let secretShopGoldSpent = 0;
                     let secretShopRewardValue = 0;
                     let secretShopCostValue = 0;
                     let recipeSealCostValue = 0;
                     let tokenProfit = 0;
                     let recipeProfit = 0;
                     let recipeSoulCrystalCost = 0;
                     let recipeGiftRewardValue = 0;`;
content = content.replace(oldVarBlock, newVarBlock);

// Fix loops
// For tokens
content = content.replace(/secretShopRewardValue \+= tokenPrice;\s+\}/g, `secretShopRewardValue += tokenPrice;
                          tokenProfit += (tokenPrice - bp);
                       }`);

// For recipes
content = content.replace(/rewardVal = 5 \* \(auctionPrices\['닳아버린 순례의 증표'\] \|\| 0\);/g, "rewardVal = 5 * tokenPrice;");
content = content.replace(/rewardVal = 20 \* \(auctionPrices\['닳아버린 순례의 증표'\] \|\| 0\);/g, "rewardVal = 20 * tokenPrice;");

// Add missing logic inside recipe loop (shiny/brilliant)
// This is tricky with regex. I will try a more specific match.
content = content.replace(/secretShopRewardValue \+= rewardVal;\s+\}/g, `secretShopRewardValue += rewardVal;
                              recipeSoulCrystalCost += matPrice;
                              recipeGiftRewardValue += rewardVal;
                              recipeProfit += (rewardVal - bp - matPrice);
                           }`);

// Add missing logic for default recipe
content = content.replace(/secretShopRewardValue \+= sp;\s+\}/g, `secretShopRewardValue += sp;
                             recipeProfit += (sp - bp - sealVal);
                           }`);

fs.writeFileSync(path, content);
console.log('Success');

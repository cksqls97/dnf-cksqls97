const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// Define variables if they don't exist
if (!content.includes('let tokenProfit = 0;')) {
    content = content.replace(/let recipeSealCostValue = 0;/g, `let recipeSealCostValue = 0;
                     let tokenProfit = 0;
                     let recipeProfit = 0;
                     let recipeSoulCrystalCost = 0;
                     let recipeGiftRewardValue = 0;`);
}

// Fix token profit logic
if (!content.includes('tokenProfit += (tokenPrice - bp);')) {
    content = content.replace(/secretShopRewardValue \+= tokenPrice;\s+\}/g, `secretShopRewardValue += tokenPrice;
                          tokenProfit += (tokenPrice - bp);
                       }`);
}

// Fix shinyGift/brilliantGift logic
if (!content.includes('recipeSoulCrystalCost += matPrice;')) {
    content = content.replace(/secretShopRewardValue \+= rewardVal;\s+\}/g, `secretShopRewardValue += rewardVal;
                              recipeSoulCrystalCost += matPrice;
                              recipeGiftRewardValue += rewardVal;
                              recipeProfit += (rewardVal - bp - matPrice);
                           }`);
}

// Fix default recipe logic
if (!content.includes('recipeProfit += (sp - bp - sealVal);')) {
    content = content.replace(/secretShopRewardValue \+= sp;\s+\}/g, `secretShopRewardValue += sp;
                             recipeProfit += (sp - bp - sealVal);
                           }`);
}

fs.writeFileSync(path, content);
console.log('Success');

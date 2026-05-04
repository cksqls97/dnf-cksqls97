const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// Use a more robust way to insert variables
if (!content.includes('let tokenProfit = 0;')) {
    // Find the first occurrence of secretShopGoldSpent = 0 and insert after the whole block
    content = content.replace(/(let secretShopGoldSpent = 0;[\s\S]*?let recipeSealCostValue = 0;)/, 
        `$1
                     let tokenProfit = 0;
                     let recipeProfit = 0;
                     let recipeSoulCrystalCost = 0;
                     let recipeGiftRewardValue = 0;`);
}

fs.writeFileSync(path, content);
console.log('Success');

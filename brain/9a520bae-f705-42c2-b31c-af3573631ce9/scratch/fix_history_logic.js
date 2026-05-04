const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix handleSavePilgrimage variables
// Find the start of the block
content = content.replace(/let tokenProfit = 0;\s+let secretShopGoldSpent = 0;/g, 
`let tokenProfit = 0;
            let secretShopGoldSpent = 0;
            let secretShopRewardValue = 0;`);

// Fix the recipe loop inside handleSavePilgrimage
// It might have recipeSealCostValue instead of recipeSealCost
content = content.replace(/recipeSealCostValue \+= sealVal;/g, 'recipeSealCost += sealVal;');

// Fix totalConsumedValue in handleSavePilgrimage
// It's at line 1924
content = content.replace(/const totalConsumedValue = tokenCost \+ potionCost;/g,
`const totalConsumedValue = tokenCost + potionCost + recipeSealCost + recipeSoulCrystalCost;`);

// 2. Ensure everything is consistent in rows.map as well
// Check if rows.map has any errors from previous script
// (The previous script might have introduced some double definitions if not careful)

fs.writeFileSync(path, content);
console.log('Success');

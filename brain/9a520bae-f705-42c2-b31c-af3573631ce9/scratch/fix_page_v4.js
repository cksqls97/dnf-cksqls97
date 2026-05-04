const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// Match the specific block in rows.map
// It's after const tokenPrice = ...
const regex = /let secretShopGoldSpent = 0;\s+let secretShopRewardValue = 0;\s+let secretShopCostValue = 0;\s+let recipeSealCostValue = 0;/;
const replacement = `let secretShopGoldSpent = 0;
                     let secretShopRewardValue = 0;
                     let secretShopCostValue = 0;
                     let recipeSealCostValue = 0;
                     let tokenProfit = 0;
                     let recipeProfit = 0;
                     let recipeSoulCrystalCost = 0;
                     let recipeGiftRewardValue = 0;`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
    console.log('Success');
} else {
    console.log('Not found');
    // Try a more flexible match
    const regex2 = /let secretShopGoldSpent = 0;[\s\n]+let secretShopRewardValue = 0;[\s\n]+let secretShopCostValue = 0;[\s\n]+let recipeSealCostValue = 0;/;
    if (regex2.test(content)) {
        content = content.replace(regex2, replacement);
        fs.writeFileSync(path, content);
        console.log('Success with regex2');
    } else {
        console.log('Still not found');
    }
}

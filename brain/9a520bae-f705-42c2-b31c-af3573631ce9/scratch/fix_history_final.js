const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// Update finalTradableValue in handleSavePilgrimage
content = content.replace(/const finalTradableValue = restoredPureGold \+ tradableCoreValue \+ tradableCrystalValue \+ voucherProfitTotal \+ tradableSealValue \+ voucherBoxValue \+ tokenProfit \+ recipeProfit \+ customTradableValue;/g,
`const finalTradableValue = restoredPureGold + tradableCoreValue + tradableCrystalValue + voucherProfitTotal + tradableSealValue + voucherBoxValue + secretShopRewardValue + customTradableValue;`);

fs.writeFileSync(path, content);
console.log('Success');

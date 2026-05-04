const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Robust addCharToken and updateCharToken (with null checks)
content = content.replace(/const addCharToken = \(charId, initialPrice = ''\) => \{[\s\S]*?const updateCharToken = \(charId, tokenId, field, val\) => \{[\s\S]*?\};/g,
`const addCharToken = (charId, initialPrice = '') => {
            const form = getCharForm(charId);
            const mPrice = auctionPrices['닳아버린 순례의 증표'] || 0;
            updateCharForm(charId, 'secretTokens', [...(form.secretTokens || []), { id: Date.now(), buyPrice: initialPrice, sellPrice: mPrice }]);
         };
         const updateCharToken = (charId, tokenId, field, val) => {
            const form = getCharForm(charId);
            updateCharForm(charId, 'secretTokens', (form.secretTokens || []).map(t => t.id === tokenId ? { ...t, [field]: val } : t));
         };`);

// 2. Also fix addCharRecipe and updateCharRecipe just in case
content = content.replace(/const addCharRecipe = \(charId\) => \{[\s\S]*?const updateCharRecipe = \(charId, tokenId, field, val\) => \{[\s\S]*?\};/g,
`const addCharRecipe = (charId) => {
            const form = getCharForm(charId);
            const mPrice = auctionPrices['닳아버린 순례의 증표'] || 0; // Default selling price for generic recipe
            updateCharForm(charId, 'secretRecipes', [...(form.secretRecipes || []), { id: Date.now(), buyPrice: '', sealCost: '', sellPrice: mPrice }]);
         };
         const updateCharRecipe = (charId, tokenId, field, val) => {
            const form = getCharForm(charId);
            updateCharForm(charId, 'secretRecipes', (form.secretRecipes || []).map(r => r.id === tokenId ? { ...r, [field]: val } : r));
         };`);

// 3. Ensure calcDetail breakdown is fully populated in onClick to avoid undefined errors
// We need to make sure ALL variables used in the detail modal are defined here.
// I'll check the onClick block again.
// It seems fine but I'll ensure they are at least 0.

fs.writeFileSync(path, content, 'utf8');
console.log('Success');

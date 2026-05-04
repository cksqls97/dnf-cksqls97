const fs = require('fs');
const path = 'c:\\Users\\Steve\\my-dnf\\src\\app\\page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Update State Functions
content = content.replace(/const addCharToken = \(charId, initialPrice = ''\) => \{([\s\S]*?)\};/g, 
`const addCharToken = (charId, initialPrice = '') => {
            const form = getCharForm(charId);
            const mPrice = auctionPrices['닳아버린 순례의 증표'] || 0;
            updateCharForm(charId, 'secretTokens', [...form.secretTokens, { id: Date.now(), buyPrice: initialPrice, sellPrice: mPrice }]);
         };`);

content = content.replace(/const updateCharToken = \(charId, tokenId, val\) => \{([\s\S]*?)\};/g,
`const updateCharToken = (charId, tokenId, field, val) => {
            const form = getCharForm(charId);
            updateCharForm(charId, 'secretTokens', form.secretTokens.map(t => t.id === tokenId ? { ...t, [field]: val } : t));
         };`);

// 2. Update Close Handler
content = content.replace(/const cleanedTokens = \(form\.secretTokens \|\| \[\]\)\.filter\(t => t\.buyPrice !== ''\);/g,
`const cleanedTokens = (form.secretTokens || []).filter(t => t.buyPrice !== '' || t.sellPrice !== '');`);

// 3. Update Token UI Section
// This is a big block, I'll use a markers if possible or a very careful regex.
const tokenUiTarget = /\{\(getCharForm\(activeSecretShopModal\.charId\)\.secretTokens \|\| \[\]\)\.length === 0 \? <div style=\{\{ color: 'var\(--text-muted\)', fontSize: '0\.7rem' \}\}>구매 내역이 없습니다\.<\/div> : \([\s\S]*?                  \)\}/;
const tokenUiReplacement = `{(getCharForm(activeSecretShopModal.charId).secretTokens || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>구매 내역이 없습니다.</div> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(getCharForm(activeSecretShopModal.charId).secretTokens || []).map((t, idx) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold', minWidth: '90px' }}>인장 구매 #{idx+1}</div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                               <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>구매가:</span>
                               <input type="number" value={t.buyPrice} onChange={e => updateCharToken(activeSecretShopModal.charId, t.id, 'buyPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="골드" />
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                               <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>판매가:</span>
                               <input type="number" value={t.sellPrice} onChange={e => updateCharToken(activeSecretShopModal.charId, t.id, 'sellPrice', e.target.value)} style={{ width: '80px', padding: '0.2rem 0.1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }} placeholder="시장가" />
                             </div>
                             <div style={{ fontSize: '0.7rem', color: (Number(t.sellPrice||0) - Number(t.buyPrice||0)) >= 0 ? '#4ade80' : '#f87171', fontWeight: 'bold', marginLeft: 'auto', marginRight: '1rem' }}>
                               수익: {(Number(t.sellPrice||0) - Number(t.buyPrice||0)).toLocaleString()} G
                             </div>
                             <button onClick={() => removeCharToken(activeSecretShopModal.charId, t.id)} style={{ padding: '0.2rem 0.4rem', background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>삭제</button>
                          </div>
                        ))}
                      </div>
                    )}`;

if (tokenUiTarget.test(content)) {
    content = content.replace(tokenUiTarget, tokenUiReplacement);
} else {
    console.log('Token UI target not found');
}

fs.writeFileSync(path, content);
console.log('Success');

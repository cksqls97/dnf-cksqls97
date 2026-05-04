const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

const tableCellRegex = /\{\/\* 16 \*\/\} <td style=\{\{ padding: '0\.2rem 0\.1rem', borderLeft: '1px solid rgba\(255,255,255,0\.1\)', verticalAlign: 'middle', minWidth: '80px' \}\}>\s*<button onClick=\{\(\) => setActiveSecretShopModal\(\{ charId: c\.id, type: 'token' \}\)\}[\s\S]*?<\/td>\s*\{\/\* 17 \*\/\} <td style=\{\{ padding: '0\.2rem 0\.1rem', verticalAlign: 'middle', minWidth: '80px' \}\}>\s*<button onClick=\{\(\) => setActiveSecretShopModal\(\{ charId: c\.id, type: 'recipe' \}\)\}[\s\S]*?<\/td>/;

const newTableCell = `{/* 16-17 특별상점 */} 
                             <td colSpan="2" style={{ padding: '0.2rem 0.1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', verticalAlign: 'middle' }}>
                               <button 
                                 onClick={() => setActiveSecretShopModal({ charId: c.id })} 
                                 style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'rgba(167, 139, 250, 0.2)', border: '1px solid rgba(167, 139, 250, 0.4)', color: '#a78bfa', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                               >
                                 특별상점 관리 {( (form.secretTokens?.length || 0) + (form.secretRecipes?.length || 0) ) > 0 ? \`(\${(form.secretTokens?.length || 0) + (form.secretRecipes?.length || 0)})\` : ''}
                               </button>
                             </td>`;

if (tableCellRegex.test(content)) {
    content = content.replace(tableCellRegex, newTableCell);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Table cells merged.');
} else {
    console.log('Table cell pattern not found.');
}

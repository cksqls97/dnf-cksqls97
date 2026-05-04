const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

// Find the "Total Sum" row in the Pilgrimage table
const totalRowPattern = /<tr style=\{\{ background: 'rgba\(255,255,255,0\.05\)', fontWeight: 'bold', borderTop: '2px solid rgba\(255,255,255,0\.2\)' \}\}>.*?<\/tr>/s;
const totalRowMatch = content.match(totalRowPattern);

if (totalRowMatch) {
    const averageRow = `
                           <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                             <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8' }}>평균 (캐릭터당)</td>
                             <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8' }}>{Math.round(sumFatigue / selectedChars.length) || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem', color: '#94a3b8' }}>{Math.round(sumRuns / selectedChars.length) || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>-</td>
                             <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{Math.round(sumPureGold / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem' }}>{Math.round(sumSeal / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem' }}>{Math.round(sumTradableSeal / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem' }}>{Math.round(sumSealVoucher / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem' }}>{Math.round(sumSealVoucherBox / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{Math.round(sumCondensedCore / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem' }}>{Math.round(sumFlawlessCore / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{Math.round(sumCrystal / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem' }}>{Math.round(sumFlawlessCrystal / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{Math.round(sumTokens / selectedChars.length) || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem' }}>{Math.round(sumPotions / selectedChars.length) || '-'}</td>
                             <td colSpan="2" style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>-</td>
                             <td style={{ padding: '0.3rem 0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{Math.round(sumBoundValue / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem' }}>{Math.round(sumTradableValue / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem', color: sumTotalProfit > 0 ? '#4ade80' : '#f87171' }}>{Math.round(sumTotalProfit / selectedChars.length).toLocaleString() || '-'}</td>
                             <td style={{ padding: '0.3rem 0.5rem', color: sumProfitExclBound > 0 ? '#38bdf8' : '#f87171' }}>{Math.round(sumProfitExclBound / selectedChars.length).toLocaleString() || '-'}</td>
                           </tr>`;
    content = content.replace(totalRowMatch[0], totalRowMatch[0] + averageRow);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully added the average row.');
} else {
    console.log('Could not find the total row pattern.');
}

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Neople Open API에는 "장비 점수"(명성과 별개인, 실제 딜/버프 손익 기반 종합 전투력 지표)가 없다.
// 던파 공식 홈페이지 캐릭터 검색(df.nexon.com/world/character)의 내부 API가 이 값을 내려주지만
// obfuscateKey로 XOR 난독화되어 있다. 아래 상수/알고리즘은 공홈 JS 번들(nameIndex.js)에서
// 그대로 추출한 것 — UT/LT/FT/BT는 번들에 박혀있는 고정 상수, key/salt는 응답마다 내려오는 값이다.
//   1. expandedKey  = base64Decode(key)  + UT + LT   (18바이트, 문자열로 취급)
//   2. expandedSalt = base64Decode(salt) + FT + BT   (18바이트, "패딩 길이"로만 사용됨)
//   3. cipherBytes  = base64Decode(암호문)
//   4. xored[i]     = cipherBytes[i] XOR UTF8(expandedKey)[i % keyLen]  (반복 XOR)
//   5. decoded      = UTF8Decode(xored) 에서 앞뒤로 expandedSalt.length만큼 잘라낸 가운데 부분
const SERVER_KOR = {
  cain: '카인', diregie: '디레지에', siroco: '시로코', prey: '프레이',
  casillas: '카시야스', hilder: '힐더', anton: '안톤', bakal: '바칼'
};

const UT = [94, 105, 48, 89, 125, 105];
const LT = [88, 96, 45, 120, 42, 89];
const FT = [104, 95, 52, 69, 43, 59];
const BT = [115, 110, 42, 59, 33, 42];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function base64ToBytes(b64) {
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

function decodeObfuscatedPoint(ciphertext, key, salt) {
  if (!ciphertext) return '0';
  try {
    const expandedKey = String.fromCharCode(...base64ToBytes(key), ...UT, ...LT);
    const expandedSalt = String.fromCharCode(...base64ToBytes(salt), ...FT, ...BT);
    const cipherBytes = base64ToBytes(ciphertext);
    const keyBytes = new TextEncoder().encode(expandedKey);
    const xored = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) xored[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
    const decoded = new TextDecoder().decode(xored);
    return decoded.substring(expandedSalt.length, decoded.length - expandedSalt.length);
  } catch (e) {
    return '0';
  }
}

export async function POST(request) {
  try {
    const { server, charName } = await request.json();
    if (!server || !charName) {
      return NextResponse.json({ success: false, error: '파라미터가 부족합니다.' }, { status: 400 });
    }
    const serverKor = SERVER_KOR[server];
    if (!serverKor) {
      return NextResponse.json({ success: false, error: '알 수 없는 서버입니다.' }, { status: 400 });
    }

    const url = `https://df.nexon.com/world/character/fetch?serverName=all&characName=${encodeURIComponent(charName)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://df.nexon.com/world/character',
        'Origin': 'https://df.nexon.com',
        'X-Requested-With': 'XMLHttpRequest'
      },
      cache: 'no-store'
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `던파 공홈 조회 실패 (${res.status})` }, { status: 502 });
    }
    const data = await res.json();
    const match = (data.body || []).find(c => c.characterName === charName && c.serverNameKor === serverKor);
    if (!match) {
      return NextResponse.json({ success: false, error: '캐릭터를 찾을 수 없습니다.' });
    }

    const isBuffScore = !!match.bufferCharacter;
    const raw = isBuffScore ? match.buffPoint : match.equipmentPoint;
    const decoded = decodeObfuscatedPoint(raw, match.obfuscateKey.key, match.obfuscateKey.salt);
    const score = Number(decoded);
    if (!Number.isFinite(score)) {
      return NextResponse.json({ success: false, error: '점수 복호화에 실패했습니다.' });
    }

    return NextResponse.json({ success: true, score, isBuffScore });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

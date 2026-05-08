import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// tradableSeal / sealVoucher / sealVoucherBox 는 아이콘 동일 → 수동 입력, 자동인식 제외
const ICON_MAP = [
  { key: 'seal',          file: 'seal.png',          label: '순례의 인장' },
  { key: 'condensedCore', file: 'condensedCore.png',  label: '응축된 라이언 코어' },
  { key: 'flawlessCore',  file: 'flawlessCore.png',   label: '무결점 라이언 코어' },
  { key: 'crystal',       file: 'crystal.png',        label: '빛나는 조화의 결정체' },
  { key: 'flawlessCrystal', file: 'flawlessCrystal.png', label: '무결점 조화의 결정체' },
];

function loadIconBase64(filename) {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'icons', filename));
    return buf.toString('base64');
  } catch {
    return null;
  }
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY 미설정' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식' }, { status: 400 });
  }

  const { image } = body;
  if (!image) {
    return NextResponse.json({ success: false, error: 'image 필드 누락' }, { status: 400 });
  }

  // 레퍼런스 아이콘 로드
  const iconBlocks = [];
  const iconDesc = [];
  for (const { key, file, label } of ICON_MAP) {
    const b64 = loadIconBase64(file);
    if (b64) {
      iconBlocks.push({ type: 'text', text: `[레퍼런스 아이콘: ${label} → JSON 키: "${key}"]` });
      iconBlocks.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: b64 } });
      iconDesc.push(`- "${key}": 위 레퍼런스 이미지와 같은 아이콘`);
    }
  }

  const prompt = `위 레퍼런스 아이콘들을 참고해서, 마지막 이미지(게임 캡처 화면)에서 각 아이콘을 찾고 우상단에 표시된 수량 숫자를 읽으세요.

규칙:
- 아이콘이 없거나 수량 숫자가 없으면 0
- pureGold는 화면에 보이는 골드(G) 보유량 (숫자만, 콤마 제거)
- 반드시 JSON만 반환, 다른 텍스트 없음

반환 형식:
{
  "pureGold": 0,
  "seal": 0,
  "condensedCore": 0,
  "flawlessCore": 0,
  "crystal": 0,
  "flawlessCrystal": 0
}

각 키 설명:
- "pureGold": 보유 골드
${iconDesc.join('\n')}`;

  const messageContent = [
    ...iconBlocks,
    { type: 'text', text: '[분석할 게임 화면 캡처]' },
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
    { type: 'text', text: prompt },
  ];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: messageContent }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ success: false, error: `Anthropic API 오류: ${res.status} ${errText}` }, { status: 502 });
    }

    const result = await res.json();
    const text = result.content?.[0]?.text ?? '';

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return NextResponse.json({ success: false, error: `JSON 파싱 실패: ${text}` }, { status: 502 });
    }

    const data = {};
    for (const { key } of ICON_MAP) {
      data[key] = Number(parsed[key] ?? 0);
    }
    data.pureGold = Number(parsed.pureGold ?? 0);

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

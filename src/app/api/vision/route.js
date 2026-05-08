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

  const prompt = `[던전앤파이터 인벤토리 아이템 수량 추출]

게임 화면은 어두운 배경의 격자 인벤토리입니다.
각 아이템 칸의 모서리(주로 좌상단 또는 우상단)에 흰색 숫자로 수량이 표시됩니다.

[단계 1] 인벤토리에서 레퍼런스 이미지와 시각적으로 가장 유사한 아이콘 칸을 찾으세요.
- 인벤토리 배경이 어둡기 때문에 아이콘 색상이 레퍼런스보다 어둡거나 다르게 보일 수 있습니다
- 아이콘의 전체적인 색상 계열과 형태(원형/결정체/구형 등)로 식별하세요
- 각 아이콘 설명:
  * seal(순례의 인장): 붉은색/자주색 계열, 원형 인장 문양, 배경이 붉음
  * condensedCore(응축된 라이언 코어): 파란색 계열 구형 에너지 코어
  * flawlessCore(무결점 라이언 코어): condensedCore보다 밝고 선명한 구형 코어
  * crystal(빛나는 조화의 결정체): 보라/분홍 계열 결정체 형태
  * flawlessCrystal(무결점 조화의 결정체): crystal보다 밝고 빛나는 결정체

[단계 2] 찾은 아이콘 칸의 수량 숫자를 읽으세요.
- 수량은 아이콘 칸 모서리의 숫자입니다 (보통 두 자리 이상)
- 강화 수치(+7, +8 등 아이콘 하단의 작은 숫자)와 절대 혼동하지 마세요
- 해당 아이콘이 없으면 0

[단계 3] 아래 JSON 형식으로만 반환하세요. 다른 텍스트 없음.
{
  "pureGold": 0,
  "seal": 0,
  "condensedCore": 0,
  "flawlessCore": 0,
  "crystal": 0,
  "flawlessCrystal": 0
}

(pureGold는 화면 상단 골드 보유량, 없으면 0)`;

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
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
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

    return NextResponse.json({ success: true, data, rawText: text });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

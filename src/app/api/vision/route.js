import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// tradableSeal / sealVoucher / sealVoucherBox 는 아이콘 동일 → 수동 입력, 자동인식 제외
const FIELD_NAMES = {
  pureGold: '순 골드 (비밀상점 이후 잔여액)',
  seal: '순례의 인장',
  condensedCore: '응축된 라이언 코어',
  flawlessCore: '무결점 라이언 코어',
  crystal: '빛나는 조화의 결정체',
  flawlessCrystal: '무결점 조화의 결정체',
};

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

  const prompt = `이 이미지는 던전앤파이터(DNF) 게임 화면의 일부입니다.
아이템 아이콘 우상단에 표시된 수량 숫자를 읽어 JSON으로 반환하세요.
수량이 보이지 않거나 해당 아이콘이 없으면 0을 반환하세요.
반드시 JSON만 반환하고 다른 텍스트는 포함하지 마세요.

반환 형식:
{
  "pureGold": 0,
  "seal": 0,
  "condensedCore": 0,
  "flawlessCore": 0,
  "crystal": 0,
  "flawlessCrystal": 0
}

항목 설명 (아이콘 우상단 숫자를 읽으세요):
- pureGold: 화면에 표시된 골드(G) 수량. 숫자+G 형태이거나 골드 아이콘 옆 숫자.
- seal: 순례의 인장. 붉은/자주색 원형 문양 아이콘.
- condensedCore: 응축된 라이언 코어. 파란 보석/코어 형태 아이콘.
- flawlessCore: 무결점 라이언 코어. 밝게 빛나는 코어 아이콘.
- crystal: 빛나는 조화의 결정체. 결정체/크리스탈 형태 아이콘.
- flawlessCrystal: 무결점 조화의 결정체. 더 밝게 빛나는 결정체 아이콘.`;

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
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              { type: 'text', text: prompt },
            ],
          },
        ],
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
    for (const key of Object.keys(FIELD_NAMES)) {
      data[key] = Number(parsed[key] ?? 0);
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

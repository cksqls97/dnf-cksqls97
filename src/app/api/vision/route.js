import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FIELD_NAMES = {
  pureGold: '순 골드 (비밀상점 이후 잔여액)',
  seal: '순례의 인장',
  tradableSeal: '순례의 인장(1회 교환 가능)',
  sealVoucher: '순례의 인장(1회 교환 가능) 교환권',
  sealVoucherBox: '순례의 인장(1회 교환 가능) 교환권 1개 상자',
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

  const prompt = `이 이미지는 던전앤파이터(DNF) 게임의 순례 보상 화면입니다.
아래 항목들의 수량을 이미지에서 읽어서 JSON으로 반환하세요.
수량이 보이지 않거나 해당 항목이 없으면 0을 반환하세요.
골드(pureGold)는 정수값으로 반환하세요 (예: 1234567).
다른 항목들도 정수값으로 반환하세요.
반드시 JSON만 반환하고 다른 텍스트는 포함하지 마세요.

반환 형식:
{
  "pureGold": 0,
  "seal": 0,
  "tradableSeal": 0,
  "sealVoucher": 0,
  "sealVoucherBox": 0,
  "condensedCore": 0,
  "flawlessCore": 0,
  "crystal": 0,
  "flawlessCrystal": 0
}

항목 설명:
- pureGold: 보유 골드 또는 획득 골드 수량
- seal: 순례의 인장 수량
- tradableSeal: 순례의 인장(1회 교환 가능) 수량
- sealVoucher: 순례의 인장(1회 교환 가능) 교환권 수량
- sealVoucherBox: 순례의 인장(1회 교환 가능) 교환권 1개 상자 수량
- condensedCore: 응축된 라이언 코어 수량
- flawlessCore: 무결점 라이언 코어 수량
- crystal: 빛나는 조화의 결정체 수량
- flawlessCrystal: 무결점 조화의 결정체 수량`;

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

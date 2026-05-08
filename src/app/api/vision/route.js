import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const GOLD_START = 10_000_000;
const ITEM_KEYS = ['seal', 'condensedCore', 'flawlessCore', 'crystal', 'flawlessCrystal'];

function loadIcon(file) {
  try {
    return readFileSync(join(process.cwd(), 'public', 'icons', file)).toString('base64');
  } catch { return null; }
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY 미설정' }, { status: 500 });

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, error: '잘못된 요청 형식' }, { status: 400 }); }

  const { image, positions } = body;
  if (!image) return NextResponse.json({ success: false, error: 'image 필드 누락' }, { status: 400 });

  const content = [];

  // 골드 아이콘 레퍼런스
  const goldB64 = loadIcon('gold.png');
  if (goldB64) {
    content.push({ type: 'text', text: '골드 아이콘 레퍼런스 (이 아이콘 오른쪽 숫자가 보유 골드):' });
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: goldB64 } });
  }

  content.push({ type: 'text', text: '인벤토리 스크린샷 (픽셀 매칭으로 아이템 슬롯에 색상 테두리 표시됨):' });
  content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } });

  // 슬롯 위치 설명
  if (positions && Object.keys(positions).length > 0) {
    const posLines = ITEM_KEYS
      .filter(k => positions[k])
      .map(k => `- ${k}: 좌상단 (${positions[k].x}, ${positions[k].y}), 크기 ${positions[k].w}×${positions[k].h}px`)
      .join('\n');
    content.push({ type: 'text', text: `각 아이템 슬롯의 픽셀 위치:\n${posLines}` });
  }

  content.push({
    type: 'text',
    text: [
      '각 슬롯의 좌상단 모서리에 있는 수량 숫자를 읽어주세요 (슬롯에 아이템이 없으면 0).',
      '골드 아이콘(레퍼런스 참고) 오른쪽의 골드 수량도 읽어주세요 (없으면 0).',
      'JSON만 출력:',
      '{"seal":0,"condensedCore":0,"flawlessCore":0,"crystal":0,"flawlessCrystal":0,"gold":0}',
    ].join('\n'),
  });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        system: 'Output ONLY a single JSON object. No explanation.',
        messages: [{ role: 'user', content }],
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
      const jsonMatches = [...text.matchAll(/\{[^{}]*\}/g)];
      parsed = JSON.parse(jsonMatches.length > 0 ? jsonMatches[jsonMatches.length - 1][0] : text);
    } catch {
      return NextResponse.json({ success: false, error: `JSON 파싱 실패: ${text}`, rawText: text }, { status: 502 });
    }

    const data = {};
    for (const key of ITEM_KEYS) data[key] = Number(parsed[key] ?? 0);
    const rawGold = Number(parsed.gold ?? 0);
    data.pureGold = rawGold > 0 ? rawGold - GOLD_START : 0;

    return NextResponse.json({ success: true, data, rawText: text });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

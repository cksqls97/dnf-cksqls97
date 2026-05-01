import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = "https://api.neople.co.kr/df";

export async function POST(request) {
  try {
    const { apiKey, itemNames } = await request.json();
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API 키가 없습니다." }, { status: 400 });
    }
    if (!itemNames || !Array.isArray(itemNames)) {
      return NextResponse.json({ success: false, error: "아이템 이름 배열이 필요합니다." }, { status: 400 });
    }

    const fetchPrice = async (itemName) => {
      const url = `${BASE_URL}/auction?itemName=${encodeURIComponent(itemName)}&wordType=match&limit=10&sort=unitPrice:asc&apikey=${apiKey}`;
      const res = await fetch(url, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!res.ok) throw new Error("경매장 API 조회 실패");
      const data = await res.json();
      
      // 최저가 반환 (unitPrice)
      if (data.rows && data.rows.length > 0) {
         return data.rows[0].unitPrice;
      }
      return 0; // 매물 없음
    };

    const prices = {};
    // 여러 아이템 동시 조회
    const promises = itemNames.map(async (name) => {
      prices[name] = await fetchPrice(name);
    });
    
    await Promise.all(promises);

    return NextResponse.json({ success: true, data: prices });
  } catch (error) {
    console.error("Auction API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

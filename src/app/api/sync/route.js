import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

let redis;
try {
  redis = Redis.fromEnv();
} catch (e) {
  console.warn("Upstash Redis ENV variables missing. Cloud sync will be disabled.");
  redis = null;
}

export async function GET(request) {
  if (!redis) return NextResponse.json({ success: false, error: "Redis not configured" }, { status: 500 });
  
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('apiKey');
  
  if (!apiKey) return NextResponse.json({ success: false, error: "Missing API Key" }, { status: 400 });
  
  try {
    const data = await redis.get(`sync_${apiKey}`);
    return NextResponse.json({ success: true, data: data || null });
  } catch(error) {
    console.error("DB GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!redis) return NextResponse.json({ success: false, error: "Redis not configured" }, { status: 500 });

  try {
    const body = await request.json();
    const { apiKey, characters, historyLogs, customOptions, merc, pilgrimage, clientUpdateAt, forceOverride } = body;
    if (!apiKey) return NextResponse.json({ success: false, error: "Missing API Key" }, { status: 400 });
    
    // 기존 데이터 버전 확인
    const existing = await redis.get(`sync_${apiKey}`);
    
    // 만약 클라우드에 기존 데이터가 있고, 클라이언트가 자신이 아는 버전(clientUpdateAt)을 보냈다면 검사
    if (existing && existing.lastUpdateAt && clientUpdateAt) {
       // 클라이언트 지식이 클라우드 최신 버전보다 오래되었다면 다중 탭 레이스컨디션으로 판주하고 차단
       if (clientUpdateAt < existing.lastUpdateAt && !forceOverride) {
          return NextResponse.json({ success: false, error: "Cloud has newer data. Blocked stale overwrite.", conflict: true });
       }
    }
    
    // 객체 필드들만 수합해서 KV에 저장 (Overwriting)
    const payload = {};
    if (characters !== undefined) payload.characters = characters;
    if (historyLogs !== undefined) payload.historyLogs = historyLogs;
    if (customOptions !== undefined) payload.customOptions = customOptions;
    if (merc !== undefined) payload.merc = merc;
    if (pilgrimage !== undefined) payload.pilgrimage = pilgrimage;
    
    // 새 버전(타임스탬프) 부여
    const newUpdateAt = Date.now();
    payload.lastUpdateAt = newUpdateAt;
    
    await redis.set(`sync_${apiKey}`, payload);
    
    return NextResponse.json({ success: true, newUpdateAt });
  } catch(error) {
    console.error("DB POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

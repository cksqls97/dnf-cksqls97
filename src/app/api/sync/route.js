import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;
if (REDIS_URL && REDIS_TOKEN) {
  try {
    redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  } catch (e) {
    console.warn("Upstash Redis init failed:", e.message);
  }
} else {
  console.warn("Upstash Redis ENV variables missing. Cloud sync will be disabled.");
}

export async function GET(request) {
  if (!redis) return NextResponse.json({
    success: false,
    error: "Redis not configured",
    _debug: {
      hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      urlPrefix: process.env.UPSTASH_REDIS_REST_URL?.slice(0, 20) ?? null,
    }
  }, { status: 500 });
  
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
    const { apiKey, characters, historyLogs, customOptions, merc, pilgrimage, uniqueEquip, clientUpdateAt, forceOverride } = body;
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
    
    // 기존 데이터 위에 이번 요청에 실려온 필드만 덮어써서 저장한다. 요청에 없는(undefined) 필드는
    // 기존 값을 그대로 유지한다 - 그렇지 않으면 그 필드를 아직 쓰지 않는 기기가 동기화할 때마다
    // 다른 기기가 이미 올려둔 데이터를 통째로 지워버리게 된다(uniqueEquip이 대표적인 경우).
    const payload = { ...(existing || {}) };
    if (characters !== undefined) payload.characters = characters;
    if (historyLogs !== undefined) payload.historyLogs = historyLogs;
    if (customOptions !== undefined) payload.customOptions = customOptions;
    if (merc !== undefined) payload.merc = merc;
    if (pilgrimage !== undefined) payload.pilgrimage = pilgrimage;
    if (uniqueEquip !== undefined) payload.uniqueEquip = uniqueEquip;
    
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

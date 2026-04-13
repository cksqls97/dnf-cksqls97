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
    const { apiKey, characters, historyLogs, customOptions } = body;
    if (!apiKey) return NextResponse.json({ success: false, error: "Missing API Key" }, { status: 400 });
    
    // 객체 필드들만 수합해서 KV에 저장 (Overwriting)
    const payload = {};
    if (characters !== undefined) payload.characters = characters;
    if (historyLogs !== undefined) payload.historyLogs = historyLogs;
    if (customOptions !== undefined) payload.customOptions = customOptions;
    
    // 만약 기존 데이터랑 병합하려면 get을 먼저 할수도 있으나 프론트엔드가 Source of Truth임을 가정 (Overriding 전체 데이터)
    await redis.set(`sync_${apiKey}`, payload);
    
    return NextResponse.json({ success: true });
  } catch(error) {
    console.error("DB POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

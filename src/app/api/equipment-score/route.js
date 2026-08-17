import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Neople Open API에는 "장비 점수"(명성과 별개인, 실제 딜/버프 손익 기반 종합 전투력 지표)가 없다.
// 던파 공식 홈페이지 캐릭터 검색(df.nexon.com/world/character)이 이 값을 화면에 렌더링하지만,
// 내부 fetch 응답(/world/character/fetch)은 obfuscateKey로 암호화된 문자열만 내려주고
// 복호화 로직은 심하게 난독화된 웹팩 번들 안에 있어 정적으로 재현하기 어렵다.
// 그래서 헤드리스 브라우저로 실제 페이지를 띄워 사이트 자체 JS가 복호화한 결과를
// DOM에서 그대로 읽어온다.
const SERVER_KOR = {
  cain: '카인', diregie: '디레지에', siroco: '시로코', prey: '프레이',
  casillas: '카시야스', hilder: '힐더', anton: '안톤', bakal: '바칼'
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function launchBrowser() {
  // Vercel(서버리스)에서는 번들된 Chromium이 너무 커서 못 쓰므로 puppeteer-core +
  // @sparticuz/chromium을 사용. 로컬 개발 환경(Windows 등)에서는 @sparticuz/chromium이
  // Linux 전용 바이너리라 대신 puppeteer의 번들 Chromium을 그대로 사용한다.
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
  }
  const puppeteer = await import('puppeteer');
  return puppeteer.launch({ headless: true });
}

export async function POST(request) {
  let browser;
  try {
    const { server, charName } = await request.json();
    if (!server || !charName) {
      return NextResponse.json({ success: false, error: '파라미터가 부족합니다.' }, { status: 400 });
    }
    const serverKor = SERVER_KOR[server];
    if (!serverKor) {
      return NextResponse.json({ success: false, error: '알 수 없는 서버입니다.' }, { status: 400 });
    }

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(UA);

    const url = `https://df.nexon.com/world/character?name=${encodeURIComponent(charName)}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });

    await page.waitForFunction(() => {
      const area = document.querySelector('#searchResultArea');
      const empty = document.querySelector('#searchResultEmpty');
      return (area && area.innerText.trim().length > 0) || (empty && getComputedStyle(empty).display !== 'none');
    }, { timeout: 20000 });

    const cards = await page.evaluate(() => {
      return [...document.querySelectorAll('#searchResultArea dd')].map(dd => {
        const nameEl = dd.querySelector('.name');
        const jobEl = dd.querySelector('.job');
        const fameEl = dd.querySelector('.fame');
        const scoreEl = fameEl ? fameEl.querySelector('span.buff, span.equi') : null;
        return {
          charName: nameEl ? (nameEl.dataset.characname || nameEl.textContent.trim()) : '',
          jobText: jobEl ? jobEl.textContent : '',
          isBuffScore: !!(scoreEl && scoreEl.classList.contains('buff')),
          scoreText: scoreEl ? scoreEl.textContent.replace(/[^0-9]/g, '') : ''
        };
      });
    });

    const match = cards.find(c => c.charName === charName && c.jobText.endsWith(serverKor));

    if (!match || !match.scoreText) {
      return NextResponse.json({ success: false, error: '장비/버프 점수를 찾을 수 없습니다.' });
    }

    return NextResponse.json({ success: true, score: Number(match.scoreText), isBuffScore: match.isBuffScore });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

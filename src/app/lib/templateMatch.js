'use client';

// ── 픽셀 유틸 ────────────────────────────────────────────────────────────────

function getImageData(canvas) {
  return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
}

async function loadRefCanvas(key) {
  const resp = await fetch(`/icons/${key}.png`);
  if (!resp.ok) throw new Error(`icon not found: ${key}`);
  const blob = await resp.blob();
  const bm = await createImageBitmap(blob);
  const c = document.createElement('canvas');
  c.width = bm.width; c.height = bm.height;
  c.getContext('2d').drawImage(bm, 0, 0);
  return { canvas: c, w: bm.width, h: bm.height };
}

// MSE per pixel (alpha-weighted). 반환값: 0 = 완벽 일치, 65025 = 최대 차이
function mse(invPx, IW, refPx, rW, rH, ox, oy, earlyExit = Infinity) {
  let sum = 0, count = 0;
  for (let ry = 0; ry < rH; ry++) {
    for (let rx = 0; rx < rW; rx++) {
      const ri = (ry * rW + rx) * 4;
      const alpha = refPx[ri + 3];
      if (alpha < 32) continue;
      const ii = ((oy + ry) * IW + (ox + rx)) * 4;
      const w = alpha / 255;
      const dr = (invPx[ii]   - refPx[ri])   * w;
      const dg = (invPx[ii+1] - refPx[ri+1]) * w;
      const db = (invPx[ii+2] - refPx[ri+2]) * w;
      sum += (dr * dr + dg * dg + db * db) / 3;
      count++;
      if (count % 20 === 0 && sum / count > earlyExit) return Infinity;
    }
  }
  return count > 0 ? sum / count : Infinity;
}

function similarity(mseVal) { return 1 - mseVal / 65025; }

// ── 격자 탐지 ────────────────────────────────────────────────────────────────

/**
 * 위상 접기(phase folding)로 주기 추정.
 * 후보 주기 P로 신호를 접었을 때 분산이 최대인 P = 실제 격자 주기.
 * 자기상관 대비 배음(harmonic) 선택 오류가 없고 더 안정적.
 */
function estimatePeriodByFolding(signal, minP, maxP) {
  const N = signal.length;
  let bestP = minP, bestVar = -Infinity;
  for (let p = minP; p <= maxP; p++) {
    const folded = new Float32Array(p);
    const cnt    = new Int32Array(p);
    for (let i = 0; i < N; i++) { folded[i % p] += signal[i]; cnt[i % p]++; }
    for (let j = 0; j < p; j++) if (cnt[j] > 0) folded[j] /= cnt[j];
    const mean = folded.reduce((a, b) => a + b, 0) / p;
    const variance = folded.reduce((s, v) => s + (v - mean) ** 2, 0) / p;
    if (variance > bestVar) { bestVar = variance; bestP = p; }
  }
  return bestP;
}

/**
 * 격자선 오프셋을 전수 탐색으로 찾습니다.
 * 0~period-1 범위의 모든 offset을 시도, 격자선 위치들의 평균 밝기가 최소인 offset 반환.
 */
function findBestOffset(signal, period) {
  const N = signal.length;
  let bestOff = 0, bestScore = Infinity;
  for (let off = 0; off < period; off++) {
    let sum = 0, count = 0;
    for (let pos = off; pos < N; pos += period) { sum += signal[pos]; count++; }
    if (count > 0 && sum / count < bestScore) { bestScore = sum / count; bestOff = off; }
  }
  return bestOff;
}

/**
 * 인벤토리 크롭에서 격자 구조를 분석합니다.
 * @returns {{ cellW, cellH, startX, startY }}
 */
export function detectGrid(canvas) {
  const W = canvas.width, H = canvas.height;
  const px = getImageData(canvas).data;

  // 행별 평균 밝기 (픽셀 전체 사용, 서브샘플링 없음)
  const rowBr = new Float32Array(H);
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; s += (px[i] + px[i+1] + px[i+2]) / 3; }
    rowBr[y] = s / W;
  }

  // 열별 평균 밝기
  const colBr = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let y = 0; y < H; y++) { const i = (y * W + x) * 4; s += (px[i] + px[i+1] + px[i+2]) / 3; }
    colBr[x] = s / H;
  }

  const cellH = estimatePeriodByFolding(rowBr, 28, 70);
  const cellW = estimatePeriodByFolding(colBr, 28, 70);
  const startY = findBestOffset(rowBr, cellH);
  const startX = findBestOffset(colBr, cellW);

  return { cellW, cellH, startX, startY };
}

// ── 격자 기반 매칭 ────────────────────────────────────────────────────────────

/**
 * 격자 각 셀에서 레퍼런스 이미지와 비교해 95% 이상 일치하는 셀을 찾습니다.
 *
 * @param {HTMLCanvasElement} cropCanvas  원본 해상도 인벤토리 크롭
 * @param {string[]} iconKeys
 * @param {number} threshold  유사도 임계값 (0~1, 기본 0.95)
 * @returns {Promise<{ positions: Record<string,object|null>, grid: object }>}
 */
export async function findItemPositions(cropCanvas, iconKeys, threshold = 0.95) {
  const grid = detectGrid(cropCanvas);
  const { cellW, cellH, startX, startY } = grid;
  const IW = cropCanvas.width, IH = cropCanvas.height;
  const invPx = getImageData(cropCanvas).data;

  const numCols = Math.max(1, Math.floor((IW - startX) / cellW));
  const numRows = Math.max(1, Math.floor((IH - startY) / cellH));

  const positions = {};

  for (const key of iconKeys) {
    let ref;
    try { ref = await loadRefCanvas(key); }
    catch { positions[key] = null; continue; }

    const { w: rW, h: rH } = ref;
    const refPx = getImageData(ref.canvas).data;

    let bestMatch = null;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const cx = startX + col * cellW;
        const cy = startY + row * cellH;

        // 레퍼런스는 셀의 일부분 → 셀 내부에서 위치 탐색
        const maxDx = Math.max(0, cellW - rW);
        const maxDy = Math.max(0, cellH - rH);

        for (let dy = 0; dy <= maxDy; dy++) {
          for (let dx = 0; dx <= maxDx; dx++) {
            const ox = cx + dx, oy = cy + dy;
            if (ox + rW > IW || oy + rH > IH) continue;

            const currentBest = bestMatch ? (1 - bestMatch.sim) * 65025 : Infinity;
            const m = mse(invPx, IW, refPx, rW, rH, ox, oy, currentBest);
            const sim = similarity(m);

            if (sim >= threshold && (!bestMatch || sim > bestMatch.sim)) {
              bestMatch = { cellX: cx, cellY: cy, cellW, cellH, offsetX: dx, offsetY: dy, sim, row, col };
            }
          }
        }
      }
    }

    positions[key] = bestMatch;
  }

  return { positions, grid };
}

// ── 숫자 영역 추출 ────────────────────────────────────────────────────────────

/**
 * 셀 좌상단 숫자 영역을 추출해 base64 PNG로 반환합니다.
 * @param {HTMLCanvasElement} cropCanvas
 * @param {number} cellX
 * @param {number} cellY
 * @param {number} cellW
 * @param {number} cellH
 * @param {number} upscale  확대 배율 (기본 4)
 * @returns {string} base64 PNG
 */
export function extractNumberCrop(cropCanvas, cellX, cellY, cellW, cellH, upscale = 4) {
  const numW = Math.round(cellW * 0.55);
  const numH = Math.round(cellH * 0.38);
  const out = document.createElement('canvas');
  out.width = numW * upscale; out.height = numH * upscale;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cropCanvas, cellX, cellY, numW, numH, 0, 0, out.width, out.height);
  return out.toDataURL('image/png').split(',')[1];
}

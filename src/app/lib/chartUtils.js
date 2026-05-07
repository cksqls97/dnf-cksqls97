const getDayKey = (ts) => {
  const offset = (9 - 6) * 60 * 60 * 1000;
  const adjusted = new Date(ts - offset);
  return `${adjusted.getUTCFullYear()}-${String(adjusted.getUTCMonth() + 1).padStart(2, '0')}-${String(adjusted.getUTCDate()).padStart(2, '0')}`;
};

const getFameAt = (t, historyLogs, characters, charId) => {
  if (charId === '') {
    let total = 0;
    characters.forEach(c => {
      const cLogs = historyLogs.filter(l => l.charId === c.id && l.fameChange).sort((a, b) => a.timestamp - b.timestamp);
      if (cLogs.length === 0) { total += c.base.fame; }
      else {
        const past = cLogs.filter(l => l.timestamp <= t);
        total += past.length > 0 ? past[past.length - 1].fameChange.new : cLogs[0].fameChange.old;
      }
    });
    return total;
  } else {
    const cLogs = historyLogs.filter(l => l.charId === charId && l.fameChange).sort((a, b) => a.timestamp - b.timestamp);
    const past = cLogs.filter(l => l.timestamp <= t);
    return past.length > 0 ? past[past.length - 1].fameChange.new : (cLogs[0]?.fameChange.old ?? 0);
  }
};

const getInitialFame = (historyLogs, characters, charId) => {
  if (charId === '') {
    let total = 0;
    characters.forEach(c => {
      const cLogs = historyLogs.filter(l => l.charId === c.id && l.fameChange).sort((a, b) => a.timestamp - b.timestamp);
      total += cLogs.length > 0 ? cLogs[0].fameChange.old : c.base.fame;
    });
    return total;
  } else {
    const cLogs = historyLogs.filter(l => l.charId === charId && l.fameChange).sort((a, b) => a.timestamp - b.timestamp);
    if (cLogs.length > 0) return cLogs[0].fameChange.old;
    return characters.find(c => c.id === charId)?.base.fame ?? 0;
  }
};

const getCurrentFame = (historyLogs, characters, charId) => {
  if (charId === '') return characters.reduce((acc, c) => acc + c.base.fame, 0);
  const c = characters.find(char => char.id === charId);
  if (c) return c.base.fame;
  const cLogs = historyLogs.filter(l => l.charId === charId && l.fameChange).sort((a, b) => a.timestamp - b.timestamp);
  return cLogs.length > 0 ? cLogs[cLogs.length - 1].fameChange.new : 0;
};

export const computeChartData = (historyLogs, characters, historyFilterChar, chartViewMode) => {
  if (chartViewMode === 'daily') {
    const relevantLogs = historyLogs
      .filter(l => l.fameChange && (historyFilterChar === '' || l.charId === historyFilterChar))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (relevantLogs.length === 0) {
      if (characters.length > 0) {
        return [{ time: Date.now(), formattedTime: '현재', fame: getCurrentFame(historyLogs, characters, historyFilterChar) }];
      }
      return [];
    }

    const allTimestamps = [...new Set(historyLogs.filter(l => l.fameChange).map(l => l.timestamp))].sort((a, b) => a - b);
    const targetTimestamps = historyFilterChar === ''
      ? allTimestamps
      : [...new Set(historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).map(l => l.timestamp))].sort((a, b) => a - b);

    const dayMap = {};
    targetTimestamps.forEach(t => { dayMap[getDayKey(t)] = t; });

    const days = Object.keys(dayMap).sort();
    const dataPoints = days.map(day => {
      const t = dayMap[day];
      const [, m, d] = day.split('-');
      return { time: t, formattedTime: `${m}/${d}`, fame: getFameAt(t, historyLogs, characters, historyFilterChar) };
    });

    if (dataPoints.length > 0) {
      const firstT = targetTimestamps[0];
      const initFame = getInitialFame(historyLogs, characters, historyFilterChar);
      const [, m, d] = getDayKey(firstT).split('-');
      dataPoints.unshift({ time: firstT - 1, formattedTime: `${m}/${d} 이전`, fame: initFame });
    }

    const now = Date.now();
    const lastT = targetTimestamps[targetTimestamps.length - 1];
    if (now - lastT > 60000) {
      dataPoints.push({ time: now, formattedTime: '현재', fame: getCurrentFame(historyLogs, characters, historyFilterChar) });
    }
    return dataPoints;
  }

  // --- 이벤트 모드 ---
  const timestamps = new Set();
  historyLogs.forEach(log => { if (log.fameChange) timestamps.add(log.timestamp); });
  const sortedTimes = Array.from(timestamps).sort((a, b) => a - b);

  if (sortedTimes.length === 0) {
    if (characters.length > 0) {
      return [{ time: Date.now(), formattedTime: '현재', fame: characters.reduce((acc, c) => acc + c.base.fame, 0) }];
    }
    return [];
  }

  let targetTimes = sortedTimes;
  if (historyFilterChar !== '') {
    const charTimes = new Set();
    historyLogs.filter(l => l.charId === historyFilterChar && l.fameChange).forEach(l => charTimes.add(l.timestamp));
    targetTimes = Array.from(charTimes).sort((a, b) => a - b);
    if (targetTimes.length === 0) {
      const char = characters.find(c => c.id === historyFilterChar);
      if (char) return [{ time: Date.now(), formattedTime: '현재', fame: char.base.fame }];
      return [];
    }
  }

  const dataPoints = targetTimes.map(t => {
    const dt = new Date(t);
    return {
      time: t,
      formattedTime: `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
      fame: getFameAt(t, historyLogs, characters, historyFilterChar)
    };
  });

  if (targetTimes.length > 0) {
    const initFame = getInitialFame(historyLogs, characters, historyFilterChar);
    dataPoints.unshift({ time: targetTimes[0] - 1, formattedTime: '시작', fame: initFame });
  }

  const now = Date.now();
  const lastTime = targetTimes[targetTimes.length - 1];
  if (now - lastTime > 60000) {
    dataPoints.push({ time: now, formattedTime: '현재', fame: getCurrentFame(historyLogs, characters, historyFilterChar) });
  }

  return dataPoints;
};

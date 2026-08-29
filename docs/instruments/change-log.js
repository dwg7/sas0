(function () {
  const ALLOWED_HOSTS = ['www.jma.go.jp'];
  const LAST_STATE_KEY = 'sas0.changeLog.lastState.v1';
  const ENTRIES_KEY = 'sas0.changeLog.entries.v1';
  const MAX_ENTRIES = 50;

  // Duplicated from warnings.js — D10's "instrument files are
  // self-contained" convention.
  const HOKKAIDO_OFFICES = [
    ['011000', '宗谷地方'],
    ['012000', '上川・留萌地方'],
    ['013000', '網走・北見・紋別地方'],
    ['014030', '十勝地方'],
    ['014100', '釧路・根室地方'],
    ['015000', '胆振・日高地方'],
    ['016000', '石狩・空知・後志地方'],
    ['017000', '渡島・檜山地方']
  ];

  const WARNING_KIND_NAMES = {
    '02': '暴風雪警報',
    '03': '大雨警報',
    '04': '洪水警報',
    '05': '暴風警報',
    '06': '大雪警報',
    '07': '波浪警報',
    '08': '高潮警報',
    '09': '土砂災害警報',
    '10': '大雨注意報',
    '12': '大雪注意報',
    '13': '風雪注意報',
    '14': '雷注意報',
    '15': '強風注意報',
    '16': '波浪注意報',
    '17': '融雪注意報',
    '18': '洪水注意報',
    '19': '高潮注意報',
    '20': '濃霧注意報',
    '21': '乾燥注意報',
    '22': 'なだれ注意報',
    '23': '低温注意報',
    '24': '霜注意報',
    '25': '着氷注意報',
    '26': '着雪注意報',
    '29': '土砂災害注意報',
    '32': '暴風雪特別警報',
    '33': '大雨特別警報',
    '35': '暴風特別警報',
    '36': '大雪特別警報',
    '37': '波浪特別警報',
    '38': '高潮特別警報',
    '39': '土砂災害特別警報',
    '43': '大雨危険警報',
    '48': '高潮危険警報',
    '49': '土砂災害危険警報'
  };

  function extractActiveWarnings(report) {
    const items = (report && report.warning && report.warning.class10Items) || [];
    const active = [];
    items.forEach((item) => {
      (item.kinds || []).forEach((kind) => {
        if (!kind.code || kind.status === '解除') {
          return;
        }
        const name = WARNING_KIND_NAMES[kind.code] || `不明な警報種別 (code=${kind.code})`;
        if (!active.some((existing) => existing.name === name && existing.status === kind.status)) {
          active.push({ name, status: kind.status });
        }
      });
    });
    return active;
  }

  async function fetchWarningsByOffice() {
    const results = await Promise.all(
      HOKKAIDO_OFFICES.map(([code]) => {
        const url = SAS0.getSafeUrl(`https://www.jma.go.jp/bosai/warning/data/r8/${code}.json`, {
          allowedProtocols: ['https:'],
          allowedHosts: ALLOWED_HOSTS
        });
        return fetch(url)
          .then((response) => response.json())
          .catch(() => null);
      })
    );
    const byOffice = {};
    results.forEach((reports, i) => {
      if (!Array.isArray(reports) || reports.length === 0) {
        return;
      }
      byOffice[HOKKAIDO_OFFICES[i][0]] = extractActiveWarnings(reports[0]);
    });
    return byOffice;
  }

  // Duplicated from quake.js.
  function isHokkaidoRelatedQuake(entry) {
    if (typeof entry.anm === 'string' && entry.anm.includes('北海道')) {
      return true;
    }
    return (entry.int || []).some((region) =>
      (region.city || []).some((city) => typeof city.code === 'string' && city.code.startsWith('01'))
    );
  }

  async function fetchQuakes() {
    const url = SAS0.getSafeUrl('https://www.jma.go.jp/bosai/quake/data/list.json', {
      allowedProtocols: ['https:'],
      allowedHosts: ALLOWED_HOSTS
    });
    const list = await fetch(url).then((response) => response.json());
    return list.filter(isHokkaidoRelatedQuake);
  }

  // Duplicated from volcano.js.
  const HOKKAIDO_MONITORED_VOLCANO_CODES = ['104', '105', '107', '108', '109', '111', '112', '113', '114'];

  function extractVolcanoLevelName(warningEntry) {
    const infos = warningEntry.volcanoInfos || [];
    const volcanoInfo = infos.find((info) => info.type === '噴火警報・予報（対象火山）');
    const item = volcanoInfo && volcanoInfo.items && volcanoInfo.items[0];
    return (item && item.name) || '警戒レベル引き上げ中';
  }

  async function fetchVolcanoLevels() {
    const listUrl = SAS0.getSafeUrl('https://www.jma.go.jp/bosai/volcano/const/volcano_list.json', {
      allowedProtocols: ['https:'],
      allowedHosts: ALLOWED_HOSTS
    });
    const warningUrl = SAS0.getSafeUrl('https://www.jma.go.jp/bosai/volcano/data/warning.json', {
      allowedProtocols: ['https:'],
      allowedHosts: ALLOWED_HOSTS
    });
    const [volcanoes, warnings] = await Promise.all([
      fetch(listUrl).then((response) => response.json()),
      fetch(warningUrl).then((response) => response.json())
    ]);
    const warningByCode = new Map(warnings.map((warning) => [String(warning.eventId), warning]));
    const byCode = {};
    volcanoes
      .filter((volcano) => HOKKAIDO_MONITORED_VOLCANO_CODES.includes(String(volcano.code)))
      .forEach((volcano) => {
        const active = warningByCode.get(String(volcano.code));
        byCode[volcano.code] = {
          name: volcano.name_jp,
          level: active ? extractVolcanoLevelName(active) : '平常'
        };
      });
    return byCode;
  }

  function readJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function officeName(code) {
    const entry = HOKKAIDO_OFFICES.find(([officeCode]) => officeCode === code);
    return entry ? entry[1] : code;
  }

  function warningKey(warning) {
    return `${warning.name}|${warning.status}`;
  }

  function diffState(prev, current) {
    const entries = [];

    // 警報・注意報
    const officeCodes = new Set([...Object.keys(prev.warnings || {}), ...Object.keys(current.warnings)]);
    officeCodes.forEach((code) => {
      const prevWarnings = (prev.warnings && prev.warnings[code]) || [];
      const currentWarnings = current.warnings[code] || [];
      const prevKeys = new Set(prevWarnings.map(warningKey));
      const currentKeys = new Set(currentWarnings.map(warningKey));
      currentWarnings.forEach((warning) => {
        if (!prevKeys.has(warningKey(warning))) {
          entries.push({ category: 'warning', message: `${officeName(code)}で${warning.name}が新たに発表されました` });
        }
      });
      prevWarnings.forEach((warning) => {
        if (!currentKeys.has(warningKey(warning))) {
          entries.push({ category: 'warning', message: `${officeName(code)}の${warning.name}が解除されました` });
        }
      });
    });

    // 地震
    const prevQuakeIds = new Set(prev.quakeIds || []);
    current.quakeIds.forEach((id) => {
      if (!prevQuakeIds.has(id)) {
        const quake = current.quakeDetails[id];
        entries.push({
          category: 'quake',
          message: quake ? `地震を検知：${quake.anm}　M${quake.mag}` : `地震を検知（${id}）`
        });
      }
    });

    // 火山
    const volcanoCodes = new Set([...Object.keys(prev.volcano || {}), ...Object.keys(current.volcano)]);
    volcanoCodes.forEach((code) => {
      const prevLevel = prev.volcano && prev.volcano[code] && prev.volcano[code].level;
      const currentEntry = current.volcano[code];
      if (currentEntry && prevLevel !== undefined && prevLevel !== currentEntry.level) {
        entries.push({ category: 'volcano', message: `${currentEntry.name}の状況が「${currentEntry.level}」に変化しました` });
      }
    });

    return entries;
  }

  function categoryLabel(category) {
    if (category === 'warning') return '警報・注意報';
    if (category === 'quake') return '地震';
    if (category === 'volcano') return '火山';
    return category;
  }

  function formatTimestamp(ms) {
    return new Date(ms).toLocaleString('ja-JP', { hour12: false });
  }

  async function fetchCurrentState() {
    const [warnings, quakes, volcano] = await Promise.all([
      fetchWarningsByOffice(),
      fetchQuakes(),
      fetchVolcanoLevels()
    ]);
    const quakeDetails = {};
    quakes.forEach((entry) => {
      quakeDetails[entry.eid] = entry;
    });
    return {
      warnings,
      quakeIds: quakes.map((entry) => entry.eid),
      quakeDetails,
      volcano
    };
  }

  function renderLog(container, entries, statusText) {
    container.innerHTML = '';

    if (statusText) {
      const status = document.createElement('p');
      status.className = 'sas0-caption';
      status.textContent = statusText;
      container.appendChild(status);
    }

    const refreshButton = document.createElement('button');
    refreshButton.type = 'button';
    refreshButton.className = 'sas0-change-log-refresh';
    refreshButton.textContent = '更新';
    refreshButton.addEventListener('click', () => runOnce(container));
    container.appendChild(refreshButton);

    if (entries.length === 0) {
      const caption = document.createElement('p');
      caption.className = 'sas0-caption';
      caption.textContent = '記録開始後、変化は検知されていません。';
      container.appendChild(caption);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'sas0-change-log-list';
    entries
      .slice()
      .reverse()
      .forEach((entry) => {
        const item = document.createElement('li');
        const time = document.createElement('span');
        time.className = 'sas0-change-log-time';
        time.textContent = formatTimestamp(entry.timestamp);
        const category = document.createElement('span');
        category.className = `sas0-change-log-category sas0-change-log-category-${entry.category}`;
        category.textContent = categoryLabel(entry.category);
        const message = document.createElement('span');
        message.className = 'sas0-change-log-message';
        message.textContent = entry.message;
        item.appendChild(time);
        item.appendChild(category);
        item.appendChild(message);
        list.appendChild(item);
      });
    container.appendChild(list);
  }

  async function runOnce(container) {
    container.textContent = '読み込み中…';

    let current;
    try {
      current = await fetchCurrentState();
    } catch (error) {
      container.textContent = '取得に失敗しました。';
      return;
    }

    const prev = readJson(LAST_STATE_KEY, null);
    const now = Date.now();

    if (!prev) {
      writeJson(LAST_STATE_KEY, current);
      renderLog(container, readJson(ENTRIES_KEY, []), '前回訪問の記録がありません。現在の状況を基準として保存しました。');
      return;
    }

    const newDiffs = diffState(prev, current);
    const entries = readJson(ENTRIES_KEY, []);
    newDiffs.forEach((diff) => entries.push({ timestamp: now, ...diff }));
    const capped = entries.slice(-MAX_ENTRIES);

    writeJson(LAST_STATE_KEY, current);
    writeJson(ENTRIES_KEY, capped);

    renderLog(container, capped, null);
  }

  SAS0.registerInstrument({
    key: 'change-log',
    name: '変化の記録',
    parentKey: 'root',
    autoRefresh: false,
    render: runOnce
  });
})();

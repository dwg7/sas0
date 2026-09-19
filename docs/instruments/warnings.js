(function () {
  const ALLOWED_HOSTS = ['www.jma.go.jp'];

  // Shared with docs/instruments/hkd-map.js / change-log.js and (via the
  // TabularMapsJmaWarnings fetchJson hook below) the vendored tabular map —
  // all four read the same 8 JMA r8 files. SAS0.fetchJsonCached() means at
  // most one real network round-trip per URL within this window, no matter
  // how many of those consumers ask for it (D77).
  const WARNING_CACHE_TTL_MS = 2 * 60 * 1000;

  // The 8 JMA forecast regions that make up 北海道地方 (center code 010100).
  // 016000 (石狩・空知・後志地方) includes Sapporo.
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

  // https://www.jma.go.jp/jma/kishou/know/bosai/warning_kind.html
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

  function severityClass(name) {
    if (name.includes('特別警報') || name.includes('危険警報')) {
      return 'sas0-severity-special';
    }
    if (name.includes('警報')) {
      return 'sas0-severity-warning';
    }
    return 'sas0-severity-advisory';
  }

  // `reports`はr8の1府県予報区分のJSON全体(配列)。中身は同じ内容の重複では
  // なく、dataTypeCodeの異なる複数の電文シリーズ(VPWW55/56/58/59/61等)が
  // 並んでいて、どれが「今アクティブな警報を含む」かは順番から分からない
  // ——過去には先頭(reports[0])だけを見ており、他の電文シリーズにしか
  // 現れない警報(例: 濃霧注意報)を取りこぼしていた。tabularmaps/doの
  // jma-warnings.js(D77の一環で導入)が全件を走査しているのを見て発覚。
  // 必ず配列全体を走査する（D76）。
  function extractActiveWarnings(reports) {
    const active = [];

    (reports || []).forEach((report) => {
      const items = (report && report.warning && report.warning.class10Items) || [];
      items.forEach((item) => {
        (item.kinds || []).forEach((kind) => {
          if (!kind.code) {
            return; // "発表警報・注意報はなし"
          }
          if (kind.status === '解除') {
            return; // already lifted
          }
          const name = WARNING_KIND_NAMES[kind.code] || `不明な警報種別 (code=${kind.code})`;
          if (!active.some((existing) => existing.name === name && existing.status === kind.status)) {
            active.push({ name, status: kind.status });
          }
        });
      });
    });

    return active;
  }

  async function fetchOfficeReports() {
    return Promise.all(
      HOKKAIDO_OFFICES.map(([code]) => {
        const url = SAS0.getSafeUrl(`https://www.jma.go.jp/bosai/warning/data/r8/${code}.json`, {
          allowedProtocols: ['https:'],
          allowedHosts: ALLOWED_HOSTS
        });
        return SAS0.fetchJsonCached(url, { ttlMs: WARNING_CACHE_TTL_MS }).catch(() => null);
      })
    );
  }

  function renderList(container, results) {
    container.innerHTML = '';
    let anyActive = false;

    results.forEach((reports, i) => {
      if (!Array.isArray(reports) || reports.length === 0) {
        return;
      }

      const officeName = HOKKAIDO_OFFICES[i][1];
      const active = extractActiveWarnings(reports);
      if (active.length === 0) {
        return;
      }

      anyActive = true;
      const section = document.createElement('section');
      section.className = 'sas0-warning-section';

      const heading = document.createElement('h3');
      heading.textContent = officeName;
      section.appendChild(heading);

      const list = document.createElement('ul');
      active.forEach((warning) => {
        const item = document.createElement('li');
        item.className = severityClass(warning.name);
        item.textContent = `${warning.name}（${warning.status}）`;
        list.appendChild(item);
      });
      section.appendChild(list);

      container.appendChild(section);
    });

    if (!anyActive) {
      const caption = document.createElement('p');
      caption.className = 'sas0-caption';
      caption.textContent = '現在、北海道内で発表されている警報・注意報はありません。';
      container.appendChild(caption);
    }
  }

  // tabularmaps/do (vendored, docs/vendor/tabularmap/ — D77) の水準
  // (0/2/3/4/5) ごとの塗り色。このファイルのseverityClass、hkd-map.jsの
  // SEVERITY_COLOR/CALM_COLORと同じ配色に揃える。危険警報（水準4）は、
  // sas0がこれまで独立の段を設けておらず特別警報と同じ扱いにしている
  // （severityClass自身の分類を見よ）ため、ここでも水準5と同じ色にする —
  // 凡例で2段が同色に並ぶが、それはsas0が実際にこの2つを区別していない
  // ことを正直に表しているだけで、tabularmap側の不備ではない。
  const TABULARMAP_COLORS = {
    '0': '#5fae8c', // hkd-map.jsのCALM_COLOR
    '2': '#e4c74a', // sas0-severity-advisory
    '3': '#e46a4a', // sas0-severity-warning
    '4': '#d24aa8', // sas0-severity-special と同じ（危険警報）
    '5': '#d24aa8' // sas0-severity-special（特別警報）
  };

  const TABULARMAP_ASSET_BASE = './vendor/tabularmap/';
  let tabularMapAssetsPromise = null;

  function loadTabularMapAssets() {
    if (!tabularMapAssetsPromise) {
      tabularMapAssetsPromise = Promise.all([
        fetch(`${TABULARMAP_ASSET_BASE}data/layout-v08.json`).then((response) => response.json()),
        fetch(`${TABULARMAP_ASSET_BASE}data/municipalities.json`).then((response) => response.json()),
        fetch(`${TABULARMAP_ASSET_BASE}data/sapporo-wards.json`).then((response) => response.json())
      ]).then(([layout, municipalities, wards]) => ({ layout, municipalities, wards }));
    }
    return tabularMapAssetsPromise;
  }

  async function render(container) {
    container.classList.add('sas0-warning-instrument');

    const toolbar = document.createElement('div');
    toolbar.className = 'sas0-warning-mode-toggle';
    const listButton = document.createElement('button');
    listButton.type = 'button';
    listButton.className = 'sas0-warning-mode-button';
    listButton.textContent = '一覧';
    const tabularButton = document.createElement('button');
    tabularButton.type = 'button';
    tabularButton.className = 'sas0-warning-mode-button';
    tabularButton.textContent = '北海道全体表示';
    toolbar.appendChild(listButton);
    toolbar.appendChild(tabularButton);

    const listPane = document.createElement('div');
    listPane.className = 'sas0-warning-list-pane';
    listPane.textContent = '読み込み中…';

    const tabularPane = document.createElement('div');
    // tabularmap.js's own .tm-root defaults to a light palette, switching to
    // dark only via prefers-color-scheme or an explicit .tm-dark/data-theme
    // hook — sas0's Espresso theme is unconditionally dark regardless of the
    // visiting OS's own light/dark setting, so force it here rather than
    // leaving it to chance (D77).
    tabularPane.className = 'sas0-warning-tabular-pane tm-dark';
    tabularPane.hidden = true;

    container.appendChild(toolbar);
    container.appendChild(listPane);
    container.appendChild(tabularPane);

    let mode = 'list';
    let tabularMap = null;
    let tabularSource = null;

    function setMode(next) {
      mode = next;
      listButton.classList.toggle('is-active', mode === 'list');
      tabularButton.classList.toggle('is-active', mode === 'tabular');
      listPane.hidden = mode !== 'list';
      tabularPane.hidden = mode !== 'tabular';
      if (mode === 'tabular') {
        ensureTabularMap().catch(() => {});
      }
    }

    listButton.addEventListener('click', () => setMode('list'));
    tabularButton.addEventListener('click', () => setMode('tabular'));

    async function ensureTabularMap() {
      if (tabularMap || !window.TabularMap || !window.TabularMapsJmaWarnings) {
        if (!tabularMap && !window.TabularMap) {
          tabularPane.textContent = '北海道全体表示の読み込みに失敗しました。';
        }
        return;
      }
      const { layout, municipalities, wards } = await loadTabularMapAssets();
      if (tabularMap) {
        return; // a second call raced us here while awaiting assets
      }
      tabularMap = window.TabularMap.create(tabularPane, { layout, municipalities, wards });
      tabularSource = window.TabularMapsJmaWarnings.create({
        // 生JSONの取得だけをsas0の共有キャッシュに差し込む(D77) —
        // class20Itemsの解釈などのパースロジックはdo側のまま。
        fetchJson: (url) => SAS0.fetchJsonCached(url, { ttlMs: WARNING_CACHE_TTL_MS }),
        codesUrl: `${TABULARMAP_ASSET_BASE}data/jma-warning-codes.json`,
        colors: TABULARMAP_COLORS
      });
      tabularMap.setSeries(await tabularSource.fetchValues());
    }

    async function tick() {
      const results = await fetchOfficeReports();
      renderList(listPane, results);
      if (tabularSource) {
        tabularMap.setSeries(await tabularSource.fetchValues());
      }
    }

    await tick();
    const timer = setInterval(() => {
      tick().catch(() => {});
    }, WARNING_CACHE_TTL_MS);

    return () => {
      clearInterval(timer);
      if (tabularMap) {
        tabularMap.destroy();
      }
    };
  }

  SAS0.registerInstrument({
    key: 'warnings',
    name: '警報・注意報',
    parentKey: 'root',
    render,
    // 北海道全体表示(tabularmap)がマウント時に自前のSVGを持つステートフルな
    // 計器になったため、hkd-map.js(D27)と同じパターンでautoRefreshを切り、
    // このファイル自身がtick()の間隔とcleanup(map.destroy())を管理する。
    autoRefresh: false
  });
})();

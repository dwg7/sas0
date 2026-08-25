(function () {
  const ALLOWED_HOSTS = ['www.jma.go.jp'];

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

  function extractActiveWarnings(report) {
    const items = (report && report.warning && report.warning.class10Items) || [];
    const active = [];

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

    return active;
  }

  async function render(container) {
    container.textContent = '読み込み中…';

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

    container.innerHTML = '';
    let anyActive = false;

    results.forEach((reports, i) => {
      if (!Array.isArray(reports) || reports.length === 0) {
        return;
      }

      const officeName = HOKKAIDO_OFFICES[i][1];
      const active = extractActiveWarnings(reports[0]);
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

  SAS0.registerInstrument({
    key: 'warnings',
    name: '警報・注意報（北海道）',
    parentKey: 'jma',
    render
  });
})();

(function () {
  const ALLOWED_HOSTS = ['www.jma.go.jp'];
  const LIST_URL = 'https://www.jma.go.jp/bosai/volcano/const/volcano_list.json';
  const WARNING_URL = 'https://www.jma.go.jp/bosai/volcano/data/warning.json';

  // Hokkaido mainland volcano codes only (知床硫黄山 101 〜 雄阿寒岳 120);
  // the Kuril/Chishima chain (151+) is intentionally out of scope.
  const HOKKAIDO_MIN_CODE = 101;
  const HOKKAIDO_MAX_CODE = 120;

  function extractLevelName(warningEntry) {
    const infos = warningEntry.volcanoInfos || [];
    const volcanoInfo = infos.find((info) => info.type === '噴火警報・予報（対象火山）');
    const item = volcanoInfo && volcanoInfo.items && volcanoInfo.items[0];
    return (item && item.name) || '警戒レベル引き上げ中';
  }

  async function render(container) {
    container.textContent = '読み込み中…';

    const [volcanoes, warnings] = await Promise.all([
      fetch(SAS0.getSafeUrl(LIST_URL, { allowedProtocols: ['https:'], allowedHosts: ALLOWED_HOSTS })).then(
        (response) => response.json()
      ),
      fetch(SAS0.getSafeUrl(WARNING_URL, { allowedProtocols: ['https:'], allowedHosts: ALLOWED_HOSTS })).then(
        (response) => response.json()
      )
    ]);

    const hokkaidoVolcanoes = volcanoes.filter((volcano) => {
      const code = Number(volcano.code);
      return code >= HOKKAIDO_MIN_CODE && code <= HOKKAIDO_MAX_CODE;
    });

    const warningByCode = new Map(warnings.map((warning) => [String(warning.eventId), warning]));

    container.innerHTML = '';
    const list = document.createElement('ul');
    list.className = 'sas0-volcano-list';

    hokkaidoVolcanoes.forEach((volcano) => {
      const item = document.createElement('li');
      const active = warningByCode.get(String(volcano.code));
      if (active) {
        item.className = 'sas0-severity-warning';
        item.textContent = `${volcano.name_jp}：${extractLevelName(active)}`;
      } else {
        item.textContent = `${volcano.name_jp}：平常`;
      }
      list.appendChild(item);
    });

    container.appendChild(list);
  }

  SAS0.registerInstrument({
    key: 'volcano',
    name: '火山情報（北海道の火山）',
    parentKey: 'jma',
    render
  });
})();

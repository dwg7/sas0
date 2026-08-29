(function () {
  const ALLOWED_HOSTS = ['www.jma.go.jp'];
  const LIST_URL = 'https://www.jma.go.jp/bosai/volcano/const/volcano_list.json';
  const WARNING_URL = 'https://www.jma.go.jp/bosai/volcano/data/warning.json';

  // The 9 volcanoes JMA designates as "常時観測火山" (continuously
  // monitored) within Hokkaido mainland's full 20-volcano range (知床硫黄山
  // 101 〜 雄阿寒岳 120; the Kuril/Chishima chain 151+ is intentionally out
  // of scope). Only these 9 have 噴火警戒レベル actually in operation — the
  // other 11 in that code range aren't under continuous watch and mixing
  // them in here made this list read as "current alert level" for
  // volcanoes that don't really have one. This is exactly the 9-volcano
  // set docs/instruments/volcano-councils.js already covers (each has an
  // established 火山防災協議会). See DECISIONS.md D28.
  const HOKKAIDO_MONITORED_CODES = ['104', '105', '107', '108', '109', '111', '112', '113', '114'];

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

    const hokkaidoVolcanoes = volcanoes.filter((volcano) => HOKKAIDO_MONITORED_CODES.includes(String(volcano.code)));

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
    name: '火山',
    parentKey: 'root',
    render
  });
})();

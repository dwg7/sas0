(function () {
  const ALLOWED_HOSTS = ['www.jma.go.jp'];
  const LIST_URL = 'https://www.jma.go.jp/bosai/quake/data/list.json';
  const MAX_ITEMS = 10;

  // JMA's seismic-intensity city codes are 6-digit JIS X 0402 codes;
  // Hokkaido's prefecture-level JIS code is "01".
  function isHokkaidoRelated(entry) {
    if (typeof entry.anm === 'string' && entry.anm.includes('北海道')) {
      return true;
    }
    return (entry.int || []).some((region) =>
      (region.city || []).some((city) => typeof city.code === 'string' && city.code.startsWith('01'))
    );
  }

  const INTENSITY_ORDER = ['1', '2', '3', '4', '5-', '5+', '6-', '6+', '7'];

  function maxHokkaidoIntensity(entry) {
    let max = null;
    (entry.int || []).forEach((region) => {
      (region.city || []).forEach((city) => {
        if (typeof city.code !== 'string' || !city.code.startsWith('01')) {
          return;
        }
        if (max === null || INTENSITY_ORDER.indexOf(city.maxi) > INTENSITY_ORDER.indexOf(max)) {
          max = city.maxi;
        }
      });
    });
    return max || entry.maxi || '不明';
  }

  async function render(container) {
    container.textContent = '読み込み中…';

    const url = SAS0.getSafeUrl(LIST_URL, { allowedProtocols: ['https:'], allowedHosts: ALLOWED_HOSTS });
    const list = await fetch(url).then((response) => response.json());

    const relevant = list.filter(isHokkaidoRelated).slice(0, MAX_ITEMS);

    container.innerHTML = '';

    if (relevant.length === 0) {
      const caption = document.createElement('p');
      caption.className = 'sas0-caption';
      caption.textContent = '直近、北海道に関連する地震情報はありません。';
      container.appendChild(caption);
      return;
    }

    const listEl = document.createElement('ul');
    listEl.className = 'sas0-quake-list';
    relevant.forEach((entry) => {
      const item = document.createElement('li');
      const time = entry.at || entry.rdt || '';
      item.textContent = `${time}　${entry.anm}　M${entry.mag}　北海道内最大震度${maxHokkaidoIntensity(entry)}`;
      listEl.appendChild(item);
    });
    container.appendChild(listEl);
  }

  SAS0.registerInstrument({
    key: 'quake',
    name: '地震情報（北海道関連）',
    parentKey: 'jma',
    render
  });
})();

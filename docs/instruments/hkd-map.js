(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.hkdMap) || {};
  const ALLOWED_HOSTS = config.allowedHosts || ['stars.optgeo.org', 'gsi-cyberjapan.github.io', 'www.jma.go.jp'];

  // Mirrors docs/instruments/warnings.js's HOKKAIDO_OFFICES / WARNING_KIND_NAMES —
  // kept as an independent copy since instrument files are self-contained
  // (D10's pattern), not because the underlying JMA data differs. See
  // DECISIONS.md D26 for why `code` here (class10) is one tier finer than
  // warnings.js's own office-level fetch, and joins 1:1 against
  // class10Items[].areaCode in the same office JSON warnings.js already uses.
  const HOKKAIDO_OFFICES = ['011000', '012000', '013000', '014030', '014100', '015000', '016000', '017000'];

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

  // Same colors as .sas0-severity-* in style.css, so the map and the
  // 警報・注意報 instrument agree visually.
  const SEVERITY_COLOR = { advisory: '#e4c74a', warning: '#e46a4a', special: '#d24aa8' };
  const SEVERITY_RANK = { advisory: 1, warning: 2, special: 3 };
  const NO_WARNING_COLOR = '#243247';

  function severityOf(name) {
    if (name.includes('特別警報') || name.includes('危険警報')) {
      return 'special';
    }
    if (name.includes('警報')) {
      return 'warning';
    }
    return 'advisory';
  }

  async function fetchWarningsByAreaCode() {
    const results = await Promise.all(
      HOKKAIDO_OFFICES.map((officeCode) => {
        const url = SAS0.getSafeUrl(`https://www.jma.go.jp/bosai/warning/data/r8/${officeCode}.json`, {
          allowedProtocols: ['https:'],
          allowedHosts: ALLOWED_HOSTS
        });
        return fetch(url)
          .then((response) => response.json())
          .catch(() => null);
      })
    );

    const byAreaCode = new Map();

    results.forEach((reports) => {
      if (!Array.isArray(reports) || reports.length === 0) {
        return;
      }
      const items = (reports[0].warning && reports[0].warning.class10Items) || [];
      items.forEach((item) => {
        const active = [];
        (item.kinds || []).forEach((kind) => {
          if (!kind.code || kind.status === '解除') {
            return;
          }
          const name = WARNING_KIND_NAMES[kind.code];
          if (!name) {
            return;
          }
          active.push({ name, severity: severityOf(name) });
        });
        if (active.length > 0) {
          byAreaCode.set(item.areaCode, active);
        }
      });
    });

    return byAreaCode;
  }

  function bestSeverity(activeWarnings) {
    return activeWarnings.reduce((best, warning) => {
      const rank = SEVERITY_RANK[warning.severity];
      return !best || rank > SEVERITY_RANK[best] ? warning.severity : best;
    }, null);
  }

  function buildFillColorExpression(byAreaCode) {
    const expr = ['match', ['get', 'code']];
    byAreaCode.forEach((activeWarnings, areaCode) => {
      expr.push(areaCode, SEVERITY_COLOR[bestSeverity(activeWarnings)]);
    });
    expr.push(NO_WARNING_COLOR);
    return expr;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function linkRowHtml({ title, description, url, allowedProtocols }) {
    const safeUrl = SAS0.getSafeUrl(url, { allowedProtocols: allowedProtocols || ['https:'] });
    const descHtml = description ? `<div class="sas0-link-row-desc">${escapeHtml(description)}</div>` : '';
    const linkHtml = safeUrl
      ? `<a class="sas0-link-row-action" href="${safeUrl}" target="_blank" rel="noopener noreferrer">開く ↗</a>`
      : '';
    return `<div class="sas0-link-row"><div class="sas0-link-row-text"><div class="sas0-link-row-title">${escapeHtml(title)}</div>${descHtml}</div>${linkHtml}</div>`;
  }

  function findMunicipalityLink(properties) {
    const municipalities = (window.SAS0_CONFIG && window.SAS0_CONFIG.municipalities) || [];
    const name = properties.county_or_city || properties.municipality;
    return municipalities.find((m) => m.title === name) || null;
  }

  async function render(container) {
    container.innerHTML = '';
    const mapDiv = document.createElement('div');
    mapDiv.className = 'sas0-map';
    container.appendChild(mapDiv);

    const styleUrl = SAS0.getSafeUrl(config.basemapStyleUrl, { allowedHosts: ALLOWED_HOSTS });
    const jmaSourceUrl = SAS0.getSafeUrl(config.jmaSourceUrl, { allowedHosts: ALLOWED_HOSTS });
    const n03SourceUrl = SAS0.getSafeUrl(config.n03SourceUrl, { allowedHosts: ALLOWED_HOSTS });

    if (!styleUrl || !jmaSourceUrl || !n03SourceUrl) {
      mapDiv.textContent = '地図の読み込みに失敗しました（URL設定エラー）。';
      return undefined;
    }

    let style;
    try {
      style = await fetch(styleUrl).then((response) => response.json());
    } catch (error) {
      mapDiv.textContent = 'ベースマップの読み込みに失敗しました。';
      return undefined;
    }

    style.sources.jma_1saibun = { type: 'vector', url: jmaSourceUrl };
    style.sources.ksj_n03 = { type: 'vector', url: n03SourceUrl };
    style.layers.push(
      {
        id: 'jma-warning-fill',
        type: 'fill',
        source: 'jma_1saibun',
        'source-layer': 'jma_1saibun',
        paint: { 'fill-color': NO_WARNING_COLOR, 'fill-opacity': 0.35 }
      },
      {
        id: 'jma-warning-outline',
        type: 'line',
        source: 'jma_1saibun',
        'source-layer': 'jma_1saibun',
        paint: { 'line-color': '#7ba7e0', 'line-width': 1 }
      },
      {
        id: 'ksj-n03-fill',
        type: 'fill',
        source: 'ksj_n03',
        'source-layer': 'ksj_n03_shichoson',
        paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.03 }
      },
      {
        id: 'ksj-n03-outline',
        type: 'line',
        source: 'ksj_n03',
        'source-layer': 'ksj_n03_shichoson',
        paint: { 'line-color': '#4c85f0', 'line-width': 0.5 }
      },
      {
        id: 'ksj-n03-label',
        type: 'symbol',
        source: 'ksj_n03',
        'source-layer': 'ksj_n03_shichoson',
        minzoom: 8,
        layout: { 'text-field': ['get', 'municipality'], 'text-size': 11 },
        paint: { 'text-color': '#dce6f1', 'text-halo-color': '#0d1117', 'text-halo-width': 1 }
      }
    );

    const map = new maplibregl.Map({
      container: mapDiv,
      style,
      center: [143.2, 43.5],
      zoom: 6,
      maxBounds: [
        [138.5, 40.5],
        [149.5, 46.5]
      ]
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    let warningsByAreaCode = new Map();

    map.on('load', () => {
      fetchWarningsByAreaCode()
        .then((byAreaCode) => {
          warningsByAreaCode = byAreaCode;
          map.setPaintProperty('jma-warning-fill', 'fill-color', buildFillColorExpression(byAreaCode));
        })
        .catch(() => {});
    });

    map.on('mouseenter', 'ksj-n03-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'ksj-n03-fill', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('click', 'ksj-n03-fill', (event) => {
      const feature = event.features && event.features[0];
      if (!feature) {
        return;
      }
      const match = findMunicipalityLink(feature.properties);
      const html = match
        ? linkRowHtml(match)
        : linkRowHtml({
            title: feature.properties.municipality,
            description: 'この市町村はまだリンク未登録です（sas0の市町村一覧を参照）。'
          });
      new maplibregl.Popup().setLngLat(event.lngLat).setHTML(html).addTo(map);
    });

    map.on('click', 'jma-warning-fill', (event) => {
      const feature = event.features && event.features[0];
      if (!feature) {
        return;
      }
      const active = warningsByAreaCode.get(feature.properties.code) || [];
      const description =
        active.length > 0 ? active.map((warning) => warning.name).join('、') : '現在、発表されている警報・注意報はありません。';
      new maplibregl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(linkRowHtml({ title: feature.properties.name, description }))
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }

  SAS0.registerInstrument({
    key: 'hkd-map',
    name: config.title || '地図',
    parentKey: 'root',
    autoRefresh: false,
    render
  });
})();

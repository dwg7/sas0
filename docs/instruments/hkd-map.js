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
  // 警報・注意報 instrument agree visually. Hue carries category (JMA's own
  // convention: yellow → orange-red → magenta/purple as 注意報 → 警報 →
  // 特別警報 escalate), CALM_COLOR is sas0's own addition for the zero
  // point — JMA's data simply omits areas with nothing active, but a map
  // needs an explicit color for every polygon, and a calm green reads as
  // "actively monitored, currently fine" rather than the old NO_WARNING
  // grey (`#243247`, coincidentally the same hex already used as this
  // page's neutral UI chrome/border color elsewhere in style.css — which
  // made "no warning" read as "this control is disabled", not a status).
  // Fill-opacity is a second, quieter channel on the same idea: severity
  // also raises opacity, so attention scales with actual danger instead of
  // the whole map sitting at one uniform visual weight. See DECISIONS.md D50.
  const SEVERITY_COLOR = { advisory: '#e4c74a', warning: '#e46a4a', special: '#d24aa8' };
  const SEVERITY_OPACITY = { advisory: 0.35, warning: 0.42, special: 0.5 };
  const SEVERITY_RANK = { advisory: 1, warning: 2, special: 3 };
  const CALM_COLOR = '#5fae8c';
  // stars.optgeo.org's "bvmap-dark" basemap is actually a light/white
  // ground (its own style JSON's background-color is white/pale-grey,
  // confirmed by inspection — "dark" apparently names something else about
  // it, not the ground color) — a pale fill needs real opacity to read as
  // deliberate green rather than fading into that white, so this sits
  // higher than the severity tiers' own resting point would suggest.
  const CALM_OPACITY = 0.4;

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
    // MapLibre's 'match' expression requires at least one label/output pair
    // before the fallback (4 args minimum) — with zero active warnings
    // anywhere in Hokkaido, the loop below never runs and a bare fallback
    // color must be returned directly instead of an ['match', ...] wrapper.
    if (byAreaCode.size === 0) {
      return CALM_COLOR;
    }
    const expr = ['match', ['get', 'code']];
    byAreaCode.forEach((activeWarnings, areaCode) => {
      expr.push(areaCode, SEVERITY_COLOR[bestSeverity(activeWarnings)]);
    });
    expr.push(CALM_COLOR);
    return expr;
  }

  function buildFillOpacityExpression(byAreaCode) {
    if (byAreaCode.size === 0) {
      return CALM_OPACITY;
    }
    const expr = ['match', ['get', 'code']];
    byAreaCode.forEach((activeWarnings, areaCode) => {
      expr.push(areaCode, SEVERITY_OPACITY[bestSeverity(activeWarnings)]);
    });
    expr.push(CALM_OPACITY);
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

  // Point layers reuse quake.js / volcano.js's own JMA feeds (D47) — no new
  // data source, just a second consumer of the same CORS-open bosai API.
  // Constants/helpers are duplicated rather than shared, matching this
  // file's existing HOKKAIDO_OFFICES/WARNING_KIND_NAMES duplication of
  // warnings.js (D10: instrument files are self-contained).
  const QUAKE_LIST_URL = 'https://www.jma.go.jp/bosai/quake/data/list.json';
  const QUAKE_MAX_POINTS = 10;
  const INTENSITY_ORDER = ['1', '2', '3', '4', '5-', '5+', '6-', '6+', '7'];

  function isHokkaidoRelatedQuake(entry) {
    if (typeof entry.anm === 'string' && entry.anm.includes('北海道')) {
      return true;
    }
    return (entry.int || []).some((region) =>
      (region.city || []).some((city) => typeof city.code === 'string' && city.code.startsWith('01'))
    );
  }

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

  // JMA's `cod` field is an ISO-6709-like string: signed lat, signed lon,
  // signed depth/altitude in km, e.g. "+43.5+142.9-10/" — undetermined
  // epicenters use out-of-range sentinel values, so anything outside real
  // lat/lon bounds is dropped rather than plotted.
  function parseQuakeCoordinate(cod) {
    if (typeof cod !== 'string') {
      return null;
    }
    const match = cod.match(/^([+-]\d+\.?\d*)([+-]\d+\.?\d*)/);
    if (!match) {
      return null;
    }
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (Number.isNaN(lat) || Number.isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return null;
    }
    return [lon, lat];
  }

  async function fetchQuakePoints() {
    const url = SAS0.getSafeUrl(QUAKE_LIST_URL, { allowedProtocols: ['https:'], allowedHosts: ALLOWED_HOSTS });
    try {
      const list = await fetch(url).then((response) => response.json());
      const features = list
        .filter(isHokkaidoRelatedQuake)
        .slice(0, QUAKE_MAX_POINTS)
        .map((entry) => {
          const coordinate = parseQuakeCoordinate(entry.cod);
          if (!coordinate) {
            return null;
          }
          const mag = parseFloat(entry.mag);
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coordinate },
            properties: {
              name: entry.anm,
              magLabel: entry.mag || '不明',
              mag: Number.isNaN(mag) ? 3 : mag,
              intensity: maxHokkaidoIntensity(entry),
              time: entry.at || entry.rdt || ''
            }
          };
        })
        .filter(Boolean);
      return { type: 'FeatureCollection', features };
    } catch (error) {
      return { type: 'FeatureCollection', features: [] };
    }
  }

  const VOLCANO_LIST_URL = 'https://www.jma.go.jp/bosai/volcano/const/volcano_list.json';
  const VOLCANO_WARNING_URL = 'https://www.jma.go.jp/bosai/volcano/data/warning.json';
  // Same 9 continuously-monitored volcanoes as volcano.js / volcano-councils.js — D28.
  const HOKKAIDO_MONITORED_VOLCANO_CODES = ['104', '105', '107', '108', '109', '111', '112', '113', '114'];

  function extractVolcanoLevelName(warningEntry) {
    const infos = warningEntry.volcanoInfos || [];
    const volcanoInfo = infos.find((info) => info.type === '噴火警報・予報（対象火山）');
    const item = volcanoInfo && volcanoInfo.items && volcanoInfo.items[0];
    return (item && item.name) || '警戒レベル引き上げ中';
  }

  async function fetchVolcanoPoints() {
    const listUrl = SAS0.getSafeUrl(VOLCANO_LIST_URL, { allowedProtocols: ['https:'], allowedHosts: ALLOWED_HOSTS });
    const warningUrl = SAS0.getSafeUrl(VOLCANO_WARNING_URL, {
      allowedProtocols: ['https:'],
      allowedHosts: ALLOWED_HOSTS
    });
    try {
      const [volcanoes, warnings] = await Promise.all([
        fetch(listUrl).then((response) => response.json()),
        fetch(warningUrl).then((response) => response.json())
      ]);
      const warningByCode = new Map(warnings.map((warning) => [String(warning.eventId), warning]));
      const features = volcanoes
        .filter((volcano) => HOKKAIDO_MONITORED_VOLCANO_CODES.includes(String(volcano.code)))
        .map((volcano) => {
          const lat = parseFloat(volcano.latlon[0]);
          const lon = parseFloat(volcano.latlon[1]);
          const active = warningByCode.get(String(volcano.code));
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lon, lat] },
            properties: {
              name: volcano.name_jp,
              active: !!active,
              levelName: active ? extractVolcanoLevelName(active) : '平常'
            }
          };
        });
      return { type: 'FeatureCollection', features };
    } catch (error) {
      return { type: 'FeatureCollection', features: [] };
    }
  }

  // 国土地理院の地理院タイル — 電子基準点（GEONET）の位置情報。CORSオープン・
  // 無登録・無償で、政府標準利用規約（出典明記でCC-BY相当）に基づき配信されて
  // いる（D51/D53で確認）。ズームレベル7では電子基準点のみが収録されるため、
  // 一等三角点等が混ざらない。北海道全域をカバーするz=7タイル群（x:113-116,
  // y:45-47の12枚、緯度経度からのタイル座標変換は標準的なWeb Mercatorの式）
  // をまとめてfetchし、1つのGeoJSONにマージする — quake-epicenter/
  // volcano-pointと同じ「複数fetch結果をマージしてgeojsonソースにする」
  // パターン（D47）。See DECISIONS.md D53.
  const REFERENCE_POINT_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/cp';
  const REFERENCE_POINT_ZOOM = 7;
  const REFERENCE_POINT_TILES = [];
  for (let x = 113; x <= 116; x += 1) {
    for (let y = 45; y <= 47; y += 1) {
      REFERENCE_POINT_TILES.push([x, y]);
    }
  }

  async function fetchReferencePoints() {
    const results = await Promise.all(
      REFERENCE_POINT_TILES.map(([x, y]) => {
        const url = SAS0.getSafeUrl(`${REFERENCE_POINT_TILE_URL}/${REFERENCE_POINT_ZOOM}/${x}/${y}.geojson`, {
          allowedProtocols: ['https:'],
          allowedHosts: ALLOWED_HOSTS
        });
        return fetch(url)
          .then((response) => response.json())
          .catch(() => null);
      })
    );

    const features = [];
    results.forEach((geojson) => {
      if (!geojson || !Array.isArray(geojson.features)) {
        return;
      }
      geojson.features.forEach((feature) => {
        if (feature.properties && feature.properties['基準点種別'] === '電子基準点') {
          features.push({
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
              name: feature.properties['点名'],
              code: feature.properties['基準点コード'],
              status: feature.properties['成果状態']
            }
          });
        }
      });
    });

    return { type: 'FeatureCollection', features };
  }

  const INFO_PLACEHOLDER_HTML =
    '<div class="sas0-map-info-placeholder">地図上にカーソルを合わせると、市町村・警報の状況が表示されます。</div>';

  // Docked info pane, updated continuously on hover — Open MCT's own
  // Inspector uses the same "fixed pane, not a floating tooltip" idiom for
  // showing details of whatever's under the cursor/selection. This is a
  // native re-implementation of that visual language, not an integration
  // with Open MCT's actual Inspector plugin (which is coupled to its object
  // selection model, not raw MapLibre hover events). See DECISIONS.md D29.
  function renderInfoPanel(panel, { pointTitle, pointSubtitle, pointStatus, municipalityName, areaName, activeWarnings }) {
    if (pointTitle) {
      const subLine = pointSubtitle ? `<div class="sas0-map-info-area">${escapeHtml(pointSubtitle)}</div>` : '';
      const statusLine = pointStatus ? `<div class="sas0-map-info-warning">${escapeHtml(pointStatus)}</div>` : '';
      panel.innerHTML = `<div class="sas0-map-info-title">${escapeHtml(pointTitle)}</div>${subLine}${statusLine}`;
      return;
    }
    if (!municipalityName && !areaName) {
      panel.innerHTML = INFO_PLACEHOLDER_HTML;
      return;
    }
    const titleText = municipalityName || areaName;
    const warningText =
      activeWarnings && activeWarnings.length > 0
        ? activeWarnings.map((warning) => warning.name).join('、')
        : '現在、発表されている警報・注意報はありません。';
    const areaLine =
      areaName && areaName !== titleText
        ? `<div class="sas0-map-info-area">${escapeHtml(areaName)}</div>`
        : '';
    panel.innerHTML = `<div class="sas0-map-info-title">${escapeHtml(titleText)}</div>${areaLine}<div class="sas0-map-info-warning">${escapeHtml(warningText)}</div>`;
  }

  async function render(container) {
    container.innerHTML = '';
    const mapWrap = document.createElement('div');
    mapWrap.className = 'sas0-map-wrap';
    container.appendChild(mapWrap);

    const mapDiv = document.createElement('div');
    mapDiv.className = 'sas0-map';
    mapWrap.appendChild(mapDiv);

    const infoPanel = document.createElement('div');
    infoPanel.className = 'sas0-map-info';
    infoPanel.innerHTML = INFO_PLACEHOLDER_HTML;
    mapWrap.appendChild(infoPanel);

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
    style.sources.quake_points = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } };
    style.sources.volcano_points = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } };
    style.sources.reference_points = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } };
    style.layers.push(
      {
        id: 'jma-warning-fill',
        type: 'fill',
        source: 'jma_1saibun',
        'source-layer': 'jma_1saibun',
        paint: { 'fill-color': CALM_COLOR, 'fill-opacity': CALM_OPACITY }
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
      },
      // Point layers on top of the polygons — recent Hokkaido-related quake
      // epicenters and the 9 continuously-monitored volcanoes, both sourced
      // from data quake.js/volcano.js already fetch. See DECISIONS.md D47.
      {
        id: 'quake-epicenter',
        type: 'circle',
        source: 'quake_points',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 2, 4, 7, 14],
          'circle-color': '#f5c542',
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0d1117'
        }
      },
      {
        id: 'volcano-point',
        type: 'circle',
        source: 'volcano_points',
        paint: {
          'circle-radius': 6,
          'circle-color': ['case', ['get', 'active'], SEVERITY_COLOR.warning, CALM_COLOR],
          // Red outline (independent of active/平常 fill color) is the
          // at-a-glance cue distinguishing volcano points from quake points
          // — both are circles of similar size, and a color-only distinction
          // via fill alone wasn't enough once both layers were on screen
          // together (D47 feedback).
          'circle-stroke-width': 2,
          'circle-stroke-color': '#e5484d'
        }
      },
      // 電子基準点（GEONET）— 国土地理院由来であることを示すため、市町村
      // 境界線と同じ青系（#4c85f0）を使う。地震・火山のポイントより小さく
      // 目立たせすぎない — 常時100件超が表示される、参照用の背景情報。
      // See DECISIONS.md D53.
      {
        id: 'reference-point',
        type: 'circle',
        source: 'reference_points',
        paint: {
          'circle-radius': 3,
          'circle-color': '#4c85f0',
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0d1117'
        }
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
          map.setPaintProperty('jma-warning-fill', 'fill-opacity', buildFillOpacityExpression(byAreaCode));
        })
        .catch(() => {});
      fetchQuakePoints()
        .then((geojson) => map.getSource('quake_points').setData(geojson))
        .catch(() => {});
      fetchVolcanoPoints()
        .then((geojson) => map.getSource('volcano_points').setData(geojson))
        .catch(() => {});
      fetchReferencePoints()
        .then((geojson) => map.getSource('reference_points').setData(geojson))
        .catch(() => {});
    });

    map.on('mouseenter', 'ksj-n03-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'ksj-n03-fill', () => {
      map.getCanvas().style.cursor = '';
    });

    // Hover updates the docked info panel (ambient, non-blocking); click
    // opens a popup with a link, from ksj-n03-fill only. Splitting it this
    // way (rather than a click handler per layer) is deliberate — both fill
    // layers cover the same ground, so two independent click handlers used
    // to both fire on one click and stack two overlapping popups. See
    // DECISIONS.md D29. Quake/volcano points (D47) take priority over the
    // polygons underneath when present — they're the more specific thing
    // under the cursor — and are hover-only, no click/link (unlike
    // ksj-n03-fill, neither has an obvious single link target).
    map.on('mousemove', (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ['quake-epicenter', 'volcano-point', 'reference-point', 'ksj-n03-fill', 'jma-warning-fill']
      });
      if (features.length === 0) {
        renderInfoPanel(infoPanel, {});
        return;
      }

      const quakeFeature = features.find((feature) => feature.layer.id === 'quake-epicenter');
      if (quakeFeature) {
        const props = quakeFeature.properties;
        renderInfoPanel(infoPanel, {
          pointTitle: props.name,
          pointSubtitle: props.time,
          pointStatus: `M${props.magLabel}　北海道内最大震度${props.intensity}`
        });
        return;
      }

      const volcanoFeature = features.find((feature) => feature.layer.id === 'volcano-point');
      if (volcanoFeature) {
        renderInfoPanel(infoPanel, {
          pointTitle: volcanoFeature.properties.name,
          pointStatus: volcanoFeature.properties.levelName
        });
        return;
      }

      const referenceFeature = features.find((feature) => feature.layer.id === 'reference-point');
      if (referenceFeature) {
        const props = referenceFeature.properties;
        renderInfoPanel(infoPanel, {
          pointTitle: `${props.name}（電子基準点）`,
          pointSubtitle: props.code,
          pointStatus: props.status
        });
        return;
      }

      const muniFeature = features.find((feature) => feature.layer.id === 'ksj-n03-fill');
      const warnFeature = features.find((feature) => feature.layer.id === 'jma-warning-fill');
      renderInfoPanel(infoPanel, {
        municipalityName: muniFeature ? muniFeature.properties.municipality : null,
        areaName: warnFeature ? warnFeature.properties.name : null,
        activeWarnings: warnFeature ? warningsByAreaCode.get(warnFeature.properties.code) || [] : []
      });
    });
    mapDiv.addEventListener('mouseleave', () => renderInfoPanel(infoPanel, {}));

    map.on('click', 'ksj-n03-fill', (event) => {
      const feature = event.features && event.features[0];
      if (!feature) {
        return;
      }
      // No popup for a municipality with no registered link (nothing to
      // click through to) — the hover panel already told the user its name
      // and warning status; a click implies wanting to open something.
      const match = findMunicipalityLink(feature.properties);
      if (!match) {
        return;
      }
      new maplibregl.Popup().setLngLat(event.lngLat).setHTML(linkRowHtml(match)).addTo(map);
    });

    return () => {
      map.remove();
    };
  }

  SAS0.registerInstrument({
    key: 'hkd-map',
    name: config.title || '状況図',
    parentKey: 'root',
    autoRefresh: false,
    order: 1,
    render
  });
})();

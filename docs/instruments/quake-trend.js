(function () {
  const ALLOWED_HOSTS = ['www.jma.go.jp'];
  const LIST_URL = 'https://www.jma.go.jp/bosai/quake/data/list.json';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Duplicated from quake.js rather than shared — D10's "instrument files
  // are self-contained" convention.
  function isHokkaidoRelated(entry) {
    if (typeof entry.anm === 'string' && entry.anm.includes('北海道')) {
      return true;
    }
    return (entry.int || []).some((region) =>
      (region.city || []).some((city) => typeof city.code === 'string' && city.code.startsWith('01'))
    );
  }

  async function fetchPoints() {
    const url = SAS0.getSafeUrl(LIST_URL, { allowedProtocols: ['https:'], allowedHosts: ALLOWED_HOSTS });
    const list = await fetch(url).then((response) => response.json());
    return list
      .filter(isHokkaidoRelated)
      .map((entry) => {
        const mag = parseFloat(entry.mag);
        const time = Date.parse(entry.at || entry.rdt || '');
        if (Number.isNaN(mag) || Number.isNaN(time)) {
          return null;
        }
        return { timestamp: time, mag, name: entry.anm };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach((key) => el.setAttribute(key, attrs[key]));
    return el;
  }

  function formatDate(ms) {
    const date = new Date(ms);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  // Open MCT ships a real Plot view built for exactly this (time-series
  // telemetry), and this project tried it first — but wiring a hand-built
  // domain object (not created via Open MCT's own "+Create" flow) into it
  // hit a wall: metadata/composition/request all resolved correctly
  // (verified directly via openmct.telemetry.request()), yet the plot's own
  // draw step never produced a visible mark, and enabling point markers
  // threw an internal "getXVal is not a function" error deep in Open MCT's
  // own bundle. This plain SVG scatter renders the exact same fetched data
  // through the same self-contained custom-DOM path every other instrument
  // in sas0 already uses. See DECISIONS.md D53.
  function renderChart(container, points) {
    const width = 640;
    const height = 320;
    const margin = { top: 16, right: 16, bottom: 32, left: 40 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const times = points.map((p) => p.timestamp);
    const mags = points.map((p) => p.mag);
    const timeMin = Math.min(...times);
    const timeMax = Math.max(...times);
    const magMin = Math.floor(Math.min(...mags) * 2) / 2 - 0.5;
    const magMax = Math.ceil(Math.max(...mags) * 2) / 2 + 0.5;
    const timeSpan = timeMax - timeMin || 1;
    const magSpan = magMax - magMin || 1;

    const x = (t) => margin.left + ((t - timeMin) / timeSpan) * plotWidth;
    const y = (m) => margin.top + plotHeight - ((m - magMin) / magSpan) * plotHeight;

    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, class: 'sas0-quake-trend-svg' });

    // Y-axis gridlines + labels (5 ticks)
    const yTickCount = 5;
    for (let i = 0; i <= yTickCount; i += 1) {
      const value = magMin + (magSpan * i) / yTickCount;
      const py = y(value);
      svg.appendChild(
        svgEl('line', {
          x1: margin.left,
          x2: width - margin.right,
          y1: py,
          y2: py,
          class: 'sas0-quake-trend-grid'
        })
      );
      const label = svgEl('text', { x: margin.left - 8, y: py + 4, class: 'sas0-quake-trend-axis-label', 'text-anchor': 'end' });
      label.textContent = value.toFixed(1);
      svg.appendChild(label);
    }

    // X-axis labels (first, middle, last)
    [timeMin, (timeMin + timeMax) / 2, timeMax].forEach((t) => {
      const label = svgEl('text', {
        x: x(t),
        y: height - margin.bottom + 18,
        class: 'sas0-quake-trend-axis-label',
        'text-anchor': 'middle'
      });
      label.textContent = formatDate(t);
      svg.appendChild(label);
    });

    // Points
    points.forEach((point) => {
      const circle = svgEl('circle', {
        cx: x(point.timestamp),
        cy: y(point.mag),
        r: 3.5,
        class: 'sas0-quake-trend-point'
      });
      circle.appendChild(svgEl('title')).textContent = `${new Date(point.timestamp).toLocaleString('ja-JP')}　${point.name}　M${point.mag}`;
      svg.appendChild(circle);
    });

    container.appendChild(svg);
  }

  async function render(container) {
    container.textContent = '読み込み中…';

    let points;
    try {
      points = await fetchPoints();
    } catch (error) {
      container.textContent = '取得に失敗しました。';
      return;
    }

    container.innerHTML = '';

    if (points.length === 0) {
      const caption = document.createElement('p');
      caption.className = 'sas0-caption';
      caption.textContent = '直近、北海道に関連する地震情報はありません。';
      container.appendChild(caption);
      return;
    }

    renderChart(container, points);

    const caption = document.createElement('p');
    caption.className = 'sas0-caption';
    caption.textContent = `直近${points.length}件の北海道関連地震（規模×発生時刻）`;
    container.appendChild(caption);
  }

  SAS0.registerInstrument({
    key: 'quake-trend',
    name: '地震の規模推移（北海道関連）',
    parentKey: 'root',
    render
  });
})();

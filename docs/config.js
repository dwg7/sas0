window.SAS0_CONFIG = {
  weather: {
    title: "Today's Weather Chart",
    imageAlt: 'Latest surface weather chart from the Japan Meteorological Agency',
    allowedHosts: ['www.jma.go.jp'],
    // JMA publishes no stable "latest.png" — listUrl is a JSON index of
    // current filenames, refreshed every few hours; the app fetches it and
    // builds the image URL from the last entry in near.now. See DECISIONS.md D8.
    listUrl: 'https://www.jma.go.jp/bosai/weather_map/data/list.json',
    imageBaseUrl: 'https://www.jma.go.jp/bosai/weather_map/data/png/',
    sourceLabel: '出典：気象庁ホームページ（https://www.jma.go.jp/bosai/weather_map/）',
    sourceUrl: 'https://www.jma.go.jp/bosai/weather_map/'
  },
  spiccato: {
    title: 'Spiccato',
    allowedHosts: ['dwg7.github.io'],
    // allow-same-origin is safe here: Spiccato is served from the same
    // origin as this site (dwg7.github.io). Without it, Brave treats the
    // sandboxed-but-first-party iframe as untrusted and restricts WebGL,
    // breaking MapLibre's vector-tile rendering. See DECISIONS.md D9.
    sandbox: 'allow-scripts allow-forms allow-same-origin',
    url: 'https://dwg7.github.io/spiccato/#q=catalog=https%3A%2F%2Fhfu.github.io%2Flayers-martin%2Fcatalog.json&req=blank%7C%E7%99%BD%E5%9C%B0%E5%9B%B3'
  },
  gsiHazard: {
    title: 'ハザードマップポータル',
    allowedHosts: ['disaportal.gsi.go.jp'],
    // disaportal.gsi.go.jp is genuinely third-party (not dwg7.github.io),
    // so unlike Spiccato (D9) we do NOT grant allow-same-origin here.
    sandbox: 'allow-scripts allow-forms',
    url: 'https://disaportal.gsi.go.jp/maps/'
  },
  hokkaidoLink: {
    title: '北海道 防災情報',
    description:
      '北海道庁のウェブサイトは X-Frame-Options: SAMEORIGIN を送出しており、このサイトへの埋め込みができません。新しいタブで開いてご覧ください。',
    url: 'https://www.pref.hokkaido.lg.jp/'
  }
};

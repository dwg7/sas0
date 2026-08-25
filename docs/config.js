window.SAS0_CONFIG = {
  weather: {
    title: '天気図',
    imageAlt: '気象庁 最新の地上天気図',
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
    // Not embedded: this app (old jQuery + Leaflet 1.9.3, using
    // jquery.cookie.js for state) breaks under any sandbox attribute,
    // even allow-scripts allow-forms with no other restriction — sandboxing
    // forces an opaque origin, and its cookie/localStorage access appears
    // to fail silently, leaving the map gray. Granting allow-same-origin
    // would fix it, but disaportal.gsi.go.jp is genuinely third-party, so
    // per the D9/D12 rule we don't grant it — external link instead.
    // See DECISIONS.md D14.
    description:
      '国土地理院「重ねるハザードマップ」は、このサイトへの埋め込みに向かない作りのため、新しいタブで開いてご覧ください。',
    url: 'https://disaportal.gsi.go.jp/maps/'
  },
  hokkaidoLink: {
    title: '北海道 防災情報',
    description:
      '北海道庁のウェブサイトは X-Frame-Options: SAMEORIGIN を送出しており、このサイトへの埋め込みができません。新しいタブで開いてご覧ください。',
    url: 'https://www.pref.hokkaido.lg.jp/'
  },
  // 市町村単位のハザードマップ。北海道179市町村のうち主要な市から着手（D15）。
  // 埋め込み可否は個別に未検証のため、GSI(D14)の教訓に倣いリンクカードで統一。
  municipalities: [
    {
      folderKey: 'shien-ishikari',
      key: 'sapporo',
      title: '札幌市',
      description: '札幌市の災害危険箇所図（ハザードマップ）を新しいタブで開きます。',
      url: 'https://www.city.sapporo.jp/kikikanri/higoro/hazardmap/hazardmap_index.html'
    },
    {
      folderKey: 'shien-kushiro',
      key: 'kushiro',
      title: '釧路市',
      description: '釧路市のハザードマップ（津波・洪水・土砂災害・火山）を新しいタブで開きます。',
      url: 'https://www.city.kushiro.lg.jp/kurashi/bousai/1003697/index.html'
    }
  ],
  // 火山防災協議会が設置されている北海道の常時観測火山（9火山）。
  // 気象庁「○○の火山防災協議会など」ページへのリンク。See DECISIONS.md D15.
  volcanoCouncils: [
    {
      key: 'atosanupuri',
      title: 'アトサヌプリ',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/104_Atosanupri/104_bousai.html'
    },
    {
      key: 'meakandake',
      title: '雌阿寒岳',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/105_Meakan/105_bousai.html'
    },
    {
      key: 'taisetsuzan',
      title: '大雪山',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/107_Taisetusan/107_bousai.html'
    },
    {
      key: 'tokachidake',
      title: '十勝岳',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/108_Tokachi/108_bousai.html'
    },
    {
      key: 'tarumaesan',
      title: '樽前山',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/109_Tarumae/109_bousai.html'
    },
    {
      key: 'kuttara',
      title: '倶多楽',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/111_Kuttara/111_bousai.html'
    },
    {
      key: 'usuzan',
      title: '有珠山',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/112_Usu/112_bousai.html'
    },
    {
      key: 'hokkaido-komagatake',
      title: '北海道駒ヶ岳',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/113_Komagatake/113_bousai.html'
    },
    {
      key: 'esan',
      title: '恵山',
      url: 'https://www.data.jma.go.jp/vois/data/sapporo/114_Esan/114_bousai.html'
    }
  ]
};

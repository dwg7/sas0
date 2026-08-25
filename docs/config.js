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
    },
    {
      folderKey: 'shien-oshima',
      key: 'hakodate',
      title: '函館市',
      description: '函館市のハザードマップ（津波・高潮・洪水・土砂災害・地震）を新しいタブで開きます。',
      url: 'https://www.city.hakodate.hokkaido.jp/docs/2017092500033/'
    },
    {
      folderKey: 'shien-hiyama',
      key: 'esashi',
      title: '江差町',
      description: '江差町のハザードマップ（洪水・津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.hokkaido-esashi.jp/webmap_esashi/'
    },
    {
      // 倶知安町は単一のハザードマップ統合ページを持たず、洪水浸水想定図・土砂災害警戒
      // システム・火山情報へのリンクが防災情報ページに分散している。次善としてその
      // 防災情報ページ自体を案内する。
      folderKey: 'shien-shiribeshi',
      key: 'kutchan',
      title: '倶知安町',
      description: '倶知安町の防災情報ページ（洪水・土砂災害・火山防災の関連リンク）を新しいタブで開きます。',
      url: 'https://www.town.kutchan.hokkaido.jp/Living_Information/bouhan-bousai-syobo/bousai_info/'
    },
    {
      folderKey: 'shien-sorachi',
      key: 'iwamizawa',
      title: '岩見沢市',
      description: '岩見沢市のハザードマップ（洪水・内水氾濫）を新しいタブで開きます。',
      url: 'https://www.city.iwamizawa.hokkaido.jp/soshiki/bosaitaisakushitsu/anshin_anzen/1/1/2671.html'
    },
    {
      // 旭川市も洪水・土砂災害マップが別ページに分かれているため、全ハザードへの
      // 導線としてより適切な総合防災ガイド「これ一冊まとまっぷ」のページを案内する。
      folderKey: 'shien-kamikawa',
      key: 'asahikawa',
      title: '旭川市',
      description: '旭川市の防災ガイド「これ一冊まとまっぷ」（洪水・内水氾濫・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.city.asahikawa.hokkaido.jp/kurashi/320/kouzui/d065806.html'
    },
    {
      folderKey: 'shien-rumoi',
      key: 'rumoi',
      title: '留萌市',
      description: '留萌市のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.e-rumoi.jp/bosai/cat_00097.html'
    },
    {
      folderKey: 'shien-soya',
      key: 'wakkanai',
      title: '稚内市',
      description: '稚内市のハザードマップ（洪水・津波）を新しいタブで開きます。',
      url: 'https://www.city.wakkanai.hokkaido.jp/kurashi/bosaibohankotsuanzen/bosai/sonaeru/hazardmap/'
    },
    {
      folderKey: 'shien-okhotsk',
      key: 'kitami',
      title: '北見市',
      description: '北見市のWEBハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.city.kitami.lg.jp/administration/disaster/detail.php?content=11476'
    },
    {
      folderKey: 'shien-iburi',
      key: 'muroran',
      title: '室蘭市',
      description: '室蘭市の防災ハザードマップ（津波・土砂災害・洪水・内水）を新しいタブで開きます。',
      url: 'https://www.city.muroran.lg.jp/prevention/?content=2392'
    },
    {
      folderKey: 'shien-hidaka',
      key: 'urakawa',
      title: '浦河町',
      description: '浦河町のハザードマップ（津波・洪水・内水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.urakawa.hokkaido.jp/gyosei/prevention/?content=227'
    },
    {
      folderKey: 'shien-tokachi',
      key: 'obihiro',
      title: '帯広市',
      description: '帯広市のWEBハザードマップ（洪水・内水氾濫・土砂災害）を新しいタブで開きます。',
      url: 'https://www.city.obihiro.hokkaido.jp/kurashi/bousai/1007329/1014402.html'
    },
    {
      folderKey: 'shien-nemuro',
      key: 'nemuro',
      title: '根室市',
      description: '根室市の防災ハザードマップ（津波・土砂災害・高潮・洪水）を新しいタブで開きます。',
      url: 'https://www.city.nemuro.hokkaido.jp/lifeinfo/kakuka/soumubu/kikikanri/kiki_SONAE/10244.html'
    }
  ],
  // 火山防災協議会が設置されている北海道の常時観測火山（9火山）。
  // 各協議会・事務局自治体が公表する火山防災計画／避難計画そのものへのリンク
  // （気象庁の協議会概要ページではない）。See DECISIONS.md D15.
  volcanoCouncils: [
    {
      key: 'atosanupuri',
      title: 'アトサヌプリ',
      description: 'アトサヌプリ火山防災協議会の火山防災計画を新しいタブで開きます。',
      url: 'https://www.town.teshikaga.hokkaido.jp/kurashi/soshikiichiran/somuka/10/2/5915.html'
    },
    {
      key: 'meakandake',
      title: '雌阿寒岳',
      description: '雌阿寒岳火山防災協議会の火山防災計画を新しいタブで開きます。',
      url: 'https://www.town.ashoro.hokkaido.jp/kurashi/bousai/meakandake/'
    },
    {
      // 協議会自体のポータルは見つからず、現時点で最良の公式資料は北海道が
      // 公開する避難計画PDF（協議会名義で作成）。
      key: 'taisetsuzan',
      title: '大雪山',
      description: '大雪山火山防災協議会の火山避難計画（PDF）を新しいタブで開きます。',
      url: 'https://www.pref.hokkaido.lg.jp/fs/8/9/8/4/9/3/7/_/%E5%A4%A7%E9%9B%AA%E5%B1%B1%E7%81%AB%E5%B1%B1%E9%81%BF%E9%9B%A3%E8%A8%88%E7%94%BB.pdf',
    },
    {
      // 同様に協議会ポータルはなく、事務局自治体（上富良野町）が公開する
      // 避難計画PDFが現時点で最良の公式資料。
      key: 'tokachidake',
      title: '十勝岳',
      description: '十勝岳火山防災協議会の火山避難計画（PDF）を新しいタブで開きます。',
      url: 'https://www.town.kamifurano.hokkaido.jp/contents/01soumu/0110soumu/bosai/hinankankoku/tokatidakekazanhinankeikaku-2024.06.pdf'
    },
    {
      key: 'tarumaesan',
      title: '樽前山',
      description: '樽前山火山防災協議会のページを新しいタブで開きます。',
      url: 'https://www.city.tomakomai.hokkaido.jp/kurashi/bosai/jishin/volcano/kaigikyogikai.html'
    },
    {
      key: 'kuttara',
      title: '倶多楽',
      description: '倶多楽火山防災協議会の火山避難計画を新しいタブで開きます。',
      url: 'https://www.city.noboribetsu.lg.jp/article/2018082200032/'
    },
    {
      key: 'usuzan',
      title: '有珠山',
      description: '有珠山火山防災協議会の火山防災マップを新しいタブで開きます。',
      url: 'https://www.city.date.hokkaido.jp/hotnews/detail/00000764.html'
    },
    {
      key: 'hokkaido-komagatake',
      title: '北海道駒ヶ岳',
      description: '北海道駒ヶ岳火山防災協議会の火山避難計画を新しいタブで開きます。',
      url: 'https://www.town.nanae.hokkaido.jp/hotnews/detail/00007295.html'
    },
    {
      // 恵山を担当していた協議会は市町村合併により函館市防災会議に統合済み。
      // 現存する独立協議会サイトはないため、避難計画を含む函館市の恵山
      // 火山災害対策ページを案内する。
      key: 'esan',
      title: '恵山',
      description: '恵山の火山災害対策（避難計画等）のページを新しいタブで開きます。',
      url: 'https://www.city.hakodate.hokkaido.jp/docs/2014022700907/'
    }
  ]
};

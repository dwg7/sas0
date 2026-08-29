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
  // Native MapLibre GL JS map — replaces the Spiccato iframe (which only
  // ever existed to prove a complex CDN-loaded MapLibre site could run
  // embedded in Open MCT at all, D9; that question is answered). No iframe
  // this time: rendered directly into the instrument's own container, so
  // none of D9/D12's sandbox/allow-same-origin questions apply here.
  // Basemap + both Hokkaido-only overlay layers (D26) are served from
  // stars.optgeo.org. See DECISIONS.md D27.
  hkdMap: {
    title: '地図',
    description: '北海道の気象警報区域・市町村界を表示します。',
    allowedHosts: ['stars.optgeo.org', 'gsi-cyberjapan.github.io', 'www.jma.go.jp'],
    basemapStyleUrl: 'https://stars.optgeo.org/style/bvmap-dark',
    jmaSourceUrl: 'https://stars.optgeo.org/pmtiles_jma_1saibun_hkd',
    n03SourceUrl: 'https://stars.optgeo.org/pmtiles_ksj_n03_hkd'
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
  // 北海道（総務部危機対策課）が運営する防災専用ポータル。179市町村分の避難情報・
  // 気象警報・河川水位・土砂災害危険度・火山情報を一つの地図でまとめて確認できる、
  // hokkaidoLink（道庁トップページ）より災害対応に特化した情報源。X-Frame-Options:
  // SAMEORIGIN を送出しており埋め込み不可。裏付けのJSON（data/top/topdata.json等）
  // もAccess-Control-Allow-Originを送出せずCORS非対応のため計器化もできず、
  // リンクとして案内する。See DECISIONS.md D19, D20, GitHub issue #2.
  hokkaidoBousaiPortal: {
    title: '北海道防災ポータル',
    description:
      '北海道内179市町村の避難情報・気象警報・河川水位・土砂災害危険度・火山情報を地図と一覧表で確認できる北海道の防災ポータルを新しいタブで開きます。',
    url: 'https://www.bousai-hokkaido.jp/?l=15-0%2C96-0&ll=43.58749799999999%2C142.74732300000002&z=7'
  },
  // 北海道運輸局が運営する、道内交通機関（航空・フェリー・鉄道・バス・道路）の
  // 運行状況と気象情報をまとめた多言語対応サイト。旅行者・出張者向けだが、荒天時の
  // 交通障害情報は北海道の実地調査業務にも有用。See DECISIONS.md D19, issue #2.
  hokkaidoSafeTravel: {
    title: '北海道 旅の安全情報',
    description:
      '北海道運輸局による、道内交通機関（航空・フェリー・鉄道・バス・道路）の運行状況と気象情報をまとめた多言語対応サイトを新しいタブで開きます。',
    url: 'https://hokkaido-safe-travel.mlit.go.jp/'
  },
  // 防災科学技術研究所（防災科研）が運営する全国リアルタイム震度モニタ。
  // このサイトはHTTPSに対応していないため（curlで443番ポートへの接続が
  // タイムアウトすることを確認済み）、renderLinkListの各項目にallowedProtocols:
  // ['http:']を明示的に渡す必要がある — D7のデフォルトを緩めるのではなく、この
  // 一件だけの例外として扱う。See DECISIONS.md D19, issue #2.
  kmoni: {
    title: '強震モニタ',
    description:
      '防災科学技術研究所「強震モニタ」で、日本全国のリアルタイム震度分布を新しいタブで確認できます。このサイトはHTTPSに対応していないため、ブラウザに保護されていない接続の警告が表示される場合があります。',
    url: 'http://www.kmoni.bosai.go.jp/'
  },
  // 国土交通省「川の防災情報」。北海道内河川の水位・洪水予報の一次情報源。
  // 気象庁の警報・注意報（区域単位の大まかな洪水/土砂災害警報のみ、D11）を
  // 補完する。CORS非対応のため計器化はできず、リンクとして案内する。
  // See DECISIONS.md D20.
  riverInfo: {
    title: '川の防災情報',
    description:
      '国土交通省「川の防災情報」で、全国の河川水位・洪水予報（北海道内の観測所を含む）を新しいタブで確認できます。',
    url: 'https://www.river.go.jp/'
  },
  // 北海道開発局が運営する防災情報ポータルサイト。河川・土砂災害・道路・港湾・
  // 気象・地震津波・火山・各開発建設部の災害情報までを網羅した、開発局自身が
  // 編集するリンク集で、開発局の管理する国道・河川に関する固有情報（河川
  // リアルタイム情報等）への入口としてはriverInfoより網羅的。
  // See DECISIONS.md D21, HANDOVER.md open item #2.
  hokkaidoDevelopmentBureau: {
    title: '北海道開発局 防災情報ポータルサイト',
    description:
      '北海道開発局の防災情報ポータルサイト（河川・土砂災害・道路・港湾・気象・地震津波・火山・各開発建設部の災害情報を集約）を新しいタブで開きます。',
    url: 'https://www.hkd.mlit.go.jp/ky/saigai/splaat0000001sq7.html'
  },
  // 市町村単位のハザードマップ。北海道179市町村のうち主要な市から着手（D15）。
  // regionKey は表示上のグルーピングキー（docs/instruments/municipalities.js
  // 内の振興局名マップに対応）であり、D20以降はOpen MCT上のフォルダではない。
  municipalities: [
    {
      regionKey: 'shien-ishikari',
      key: 'sapporo',
      title: '札幌市',
      description: '札幌市の災害危険箇所図（ハザードマップ）を新しいタブで開きます。',
      url: 'https://www.city.sapporo.jp/kikikanri/higoro/hazardmap/hazardmap_index.html'
    },
    {
      // 静的なハザードマップ(上記)とは別に、区ごとの避難情報・雨量・河川水位・
      // 土砂災害危険度をリアルタイムに表示する札幌市自身の防災ポータル。
      // CORS非対応のため計器化はできず、リンクとして案内する（D19, D20, issue #2）。
      regionKey: 'shien-ishikari',
      key: 'sapporo-bousai-portal',
      title: 'さっぽろ防災ポータル',
      description:
        '札幌市の防災ポータル（行政区ごとの避難情報・雨量・河川水位・土砂災害危険度をリアルタイムに表示）を新しいタブで開きます。',
      url: 'https://bousai.city.sapporo.jp/?l=15-0%2C26-0%2C29-0%2C42-0%2C96-0&ll=43.0686606%2C141.34856659999997&z=12'
    },
    // 札幌市の10区のうち、区独自の（citywide 2件の再掲にとどまらない）詳細な
    // 資料を公開しているのは豊平区・清田区の2区のみと確認した（他8区は citywide
    // な kikikanri 資料への案内に留まる薄いページ）。低価値な10行の水増しより、
    // 実際に価値のある2件だけを追加する。See DECISIONS.md D30.
    {
      regionKey: 'shien-ishikari',
      key: 'sapporo-toyohira',
      title: '札幌市豊平区',
      description: '豊平区の防災ウォーキングマップ（地区別の避難所への徒歩ルート・危険箇所）を新しいタブで開きます。',
      url: 'https://www.city.sapporo.jp/toyohira/bousai/index.html'
    },
    {
      regionKey: 'shien-ishikari',
      key: 'sapporo-kiyota',
      title: '札幌市清田区',
      description: '清田区の避難場所一覧（地区別・清田区防災マップ）を新しいタブで開きます。',
      url: 'https://www.city.sapporo.jp/kiyota/chiiki-anzen/hinan/index.html'
    },
    {
      regionKey: 'shien-kushiro',
      key: 'kushiro',
      title: '釧路市',
      description: '釧路市のハザードマップ（津波・洪水・土砂災害・火山）を新しいタブで開きます。',
      url: 'https://www.city.kushiro.lg.jp/kurashi/bousai/1003697/index.html'
    },
    {
      regionKey: 'shien-oshima',
      key: 'hakodate',
      title: '函館市',
      description: '函館市のハザードマップ（津波・高潮・洪水・土砂災害・地震）を新しいタブで開きます。',
      url: 'https://www.city.hakodate.hokkaido.jp/docs/2017092500033/'
    },
    {
      regionKey: 'shien-hiyama',
      key: 'esashi',
      title: '江差町',
      description: '江差町のハザードマップ（洪水・津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.hokkaido-esashi.jp/webmap_esashi/'
    },
    {
      // 倶知安町は単一のハザードマップ統合ページを持たず、洪水浸水想定図・土砂災害警戒
      // システム・火山情報へのリンクが防災情報ページに分散している。次善としてその
      // 防災情報ページ自体を案内する。
      regionKey: 'shien-shiribeshi',
      key: 'kutchan',
      title: '倶知安町',
      description: '倶知安町の防災情報ページ（洪水・土砂災害・火山防災の関連リンク）を新しいタブで開きます。',
      url: 'https://www.town.kutchan.hokkaido.jp/Living_Information/bouhan-bousai-syobo/bousai_info/'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'iwamizawa',
      title: '岩見沢市',
      description: '岩見沢市のハザードマップ（洪水・内水氾濫）を新しいタブで開きます。',
      url: 'https://www.city.iwamizawa.hokkaido.jp/soshiki/bosaitaisakushitsu/anshin_anzen/1/1/2671.html'
    },
    {
      // 旭川市も洪水・土砂災害マップが別ページに分かれているため、全ハザードへの
      // 導線としてより適切な総合防災ガイド「これ一冊まとまっぷ」のページを案内する。
      regionKey: 'shien-kamikawa',
      key: 'asahikawa',
      title: '旭川市',
      description: '旭川市の防災ガイド「これ一冊まとまっぷ」（洪水・内水氾濫・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.city.asahikawa.hokkaido.jp/kurashi/320/kouzui/d065806.html'
    },
    {
      regionKey: 'shien-rumoi',
      key: 'rumoi',
      title: '留萌市',
      description: '留萌市のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.e-rumoi.jp/bosai/cat_00097.html'
    },
    {
      regionKey: 'shien-soya',
      key: 'wakkanai',
      title: '稚内市',
      description: '稚内市のハザードマップ（洪水・津波）を新しいタブで開きます。',
      url: 'https://www.city.wakkanai.hokkaido.jp/kurashi/bosaibohankotsuanzen/bosai/sonaeru/hazardmap/'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'kitami',
      title: '北見市',
      description: '北見市のWEBハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.city.kitami.lg.jp/administration/disaster/detail.php?content=11476'
    },
    {
      regionKey: 'shien-iburi',
      key: 'muroran',
      title: '室蘭市',
      description: '室蘭市の防災ハザードマップ（津波・土砂災害・洪水・内水）を新しいタブで開きます。',
      url: 'https://www.city.muroran.lg.jp/prevention/?content=2392'
    },
    {
      regionKey: 'shien-hidaka',
      key: 'urakawa',
      title: '浦河町',
      description: '浦河町のハザードマップ（津波・洪水・内水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.urakawa.hokkaido.jp/gyosei/prevention/?content=227'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'obihiro',
      title: '帯広市',
      description: '帯広市のWEBハザードマップ（洪水・内水氾濫・土砂災害）を新しいタブで開きます。',
      url: 'https://www.city.obihiro.hokkaido.jp/kurashi/bousai/1007329/1014402.html'
    },
    {
      regionKey: 'shien-nemuro',
      key: 'nemuro',
      title: '根室市',
      description: '根室市の防災ハザードマップ（津波・土砂災害・高潮・洪水）を新しいタブで開きます。',
      url: 'https://www.city.nemuro.hokkaido.jp/lifeinfo/kakuka/soumubu/kikikanri/kiki_SONAE/10244.html'
    },
    // 以下8件は既に1市町村を持つ振興局への2件目以降（人口規模の大きい市を優先）。
    // See DECISIONS.md D23.
    {
      regionKey: 'shien-iburi',
      key: 'tomakomai',
      title: '苫小牧市',
      description: '苫小牧市のまちごとハザードマップ（地震・津波・風水害・土砂災害・火山）を新しいタブで開きます。',
      url: 'https://www.city.tomakomai.hokkaido.jp/kurashi/bosai/jishin/hazardmap/'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'otaru',
      title: '小樽市',
      description: '小樽市のハザードマップ（洪水・土砂災害・津波）を新しいタブで開きます。',
      url: 'https://www.city.otaru.lg.jp/categories/bunya/ansin_anzen/bousai/hazardmap/'
    },
    {
      // 単体のハザードマップページは樽前山の火山マップを含まないため、旭川市と
      // 同様、両方へ導線のある防災情報ページを案内する。
      regionKey: 'shien-ishikari',
      key: 'chitose',
      title: '千歳市',
      description: '千歳市の防災情報ページ（洪水・土砂災害・樽前山火山のハザードマップ）を新しいタブで開きます。',
      url: 'https://www.city.chitose.lg.jp/c50/1002703/1002706/1004864.html'
    },
    {
      regionKey: 'shien-ishikari',
      key: 'ebetsu',
      title: '江別市',
      description: '江別市の防災あんしんマップ（洪水ハザードマップ・避難所）を新しいタブで開きます。',
      url: 'https://www.city.ebetsu.hokkaido.jp/site/bousai/272.html'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'abashiri',
      title: '網走市',
      description: '網走市のWeb版ハザードマップ（浸水想定区域・土砂災害警戒区域）を新しいタブで開きます。',
      url: 'https://www.city.abashiri.hokkaido.jp/site/bousai/20164.html'
    },
    {
      // 倶知安町・千歳市と同様、単一のハザードマップ統合ページがないため、
      // 津波・洪水・土砂災害・有珠山火山の各マップへの導線がある
      // 「災害への備え」カテゴリページを案内する。
      regionKey: 'shien-iburi',
      key: 'date',
      title: '伊達市',
      description: '伊達市の「災害への備え」ページ（津波・洪水・土砂災害・有珠山火山のハザードマップ）を新しいタブで開きます。',
      url: 'https://www.city.date.hokkaido.jp/hotnews/category/219.html'
    },
    {
      // 名寄市の公式サイトはこのページをHTTPSで提供していない（TLSハンドシェイクが
      // SNI不一致で失敗することを確認済み）。kmoni（D19）と同じ理由で
      // allowedProtocols: ['http:'] が必要 — D7のデフォルトを緩めるのではなく、
      // この一件だけの例外として扱う。See DECISIONS.md D23.
      regionKey: 'shien-kamikawa',
      key: 'nayoro',
      title: '名寄市',
      description: '名寄市の防災・災害・ハザードマップページ（洪水・土砂災害・ため池）を新しいタブで開きます。',
      url: 'http://www.city.nayoro.lg.jp/life/cat3/vdh2d1000000boqc.html',
      allowedProtocols: ['http:']
    },
    {
      regionKey: 'shien-sorachi',
      key: 'takikawa',
      title: '滝川市',
      description: '滝川市の防災ハザードマップ（洪水・ため池）を新しいタブで開きます。',
      url: 'https://www.city.takikawa.lg.jp/site/bousai/1110.html'
    },
    // バッチ3（8件）: まだ1〜2市町村しかない振興局への追加、人口規模で優先。
    // See DECISIONS.md D24.
    {
      regionKey: 'shien-tokachi',
      key: 'otofuke',
      title: '音更町',
      description: '音更町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.otofuke.hokkaido.jp/bosai/hinanjo/'
    },
    {
      regionKey: 'shien-oshima',
      key: 'hokuto',
      title: '北斗市',
      description: '北斗市のハザードマップ（津波・土砂災害・地震）を新しいタブで開きます。',
      url: 'https://www.city.hokuto.hokkaido.jp/anshin/bosai/hazardmap/'
    },
    {
      regionKey: 'shien-ishikari',
      key: 'eniwa',
      title: '恵庭市',
      description: '恵庭市のWeb版ハザードマップ（浸水想定区域・土砂災害警戒区域）を新しいタブで開きます。',
      url: 'https://www.city.eniwa.hokkaido.jp/soshikikarasagasu/soumubu/kichi_bosaika/bosai_saigai/20701.html'
    },
    {
      // 倶知安町・千歳市・伊達市と同様、単一のハザードマップ統合ページがないため、
      // 「防災計画・ハザードマップ等」カテゴリページを案内する。
      regionKey: 'shien-kamikawa',
      key: 'furano',
      title: '富良野市',
      description: '富良野市の「防災計画・ハザードマップ等」ページ（洪水・土砂災害・地震のハザードマップ）を新しいタブで開きます。',
      url: 'https://www.city.furano.hokkaido.jp/life/bosaigai/saigainisonaete/bousaikeikaku/'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'mombetsu',
      title: '紋別市',
      description: '紋別市のハザードマップ（洪水・津波）を新しいタブで開きます。',
      url: 'https://mombetsu.jp/prevention/?content=956'
    },
    {
      regionKey: 'shien-nemuro',
      key: 'nakashibetsu',
      title: '中標津町',
      description: '中標津町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.nakashibetsu.jp/kurashi/bohanbosai/HM/'
    },
    {
      regionKey: 'shien-hidaka',
      key: 'shinhidaka',
      title: '新ひだか町',
      description: '新ひだか町のハザードマップ（津波・洪水）を新しいタブで開きます。',
      url: 'https://www.shinhidaka-hokkaido.jp/bousai/'
    },
    {
      // 検索結果に出るURL（.../uo2pli000000cjuz.html）は既にstaleで、部署一覧ページへ
      // 301リダイレクトされる。現行の正しいページ（.../uo2pli000000ck2a.html）に
      // 差し替え済み。See DECISIONS.md D24.
      regionKey: 'shien-sorachi',
      key: 'fukagawa',
      title: '深川市',
      description: '深川市のハザードマップ（石狩川・雨竜川流域の洪水浸水想定）を新しいタブで開きます。',
      url: 'https://www.city.fukagawa.lg.jp/cms/section/soumu/uo2pli000000ck2a.html'
    },
    // バッチ4（8件）: 残っていた1件のみの4振興局（釧路・檜山・留萌・宗谷）を2件以上に、
    // 加えて未収録の人口規模の大きい市町を追加。See DECISIONS.md D25.
    {
      // 釧路町の公式サイトはHTTPSのSNIが一致せずTLSハンドシェイクに失敗する
      // （名寄市 D23と同一の失敗モード。しかも同一IPアドレス 45.60.112.77 で、
      // 同じホスティング基盤の設定不備の可能性が高い）。kmoni/名寄市と同じ
      // allowedProtocols: ['http:'] 例外が必要。See DECISIONS.md D25.
      regionKey: 'shien-kushiro',
      key: 'kushirocho',
      title: '釧路町',
      description: '釧路町のハザードマップ（洪水・津波・土砂災害）を新しいタブで開きます。',
      url: 'http://www.town.kushiro.lg.jp/disaster/keikaku/hazard.html',
      allowedProtocols: ['http:']
    },
    {
      regionKey: 'shien-hiyama',
      key: 'setana',
      title: 'せたな町',
      description: 'せたな町防災マップWEB版（土砂災害・津波）を新しいタブで開きます。',
      url: 'https://www.town.setana.lg.jp/kurashi/bousai/bousaimapweb.html'
    },
    {
      regionKey: 'shien-rumoi',
      key: 'haboro',
      title: '羽幌町',
      description: '羽幌町のハザードマップ（津波・土砂災害・洪水）を新しいタブで開きます。',
      url: 'https://www.town.haboro.lg.jp/kurashi/bousai-bouhan/bousai_map/hazardmap/'
    },
    {
      regionKey: 'shien-soya',
      key: 'esashi-cho',
      title: '枝幸町',
      description: '枝幸町の防災マップ（洪水・津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.esashi.jp/disaster/hazardmap.html'
    },
    {
      regionKey: 'shien-ishikari',
      key: 'kitahiroshima',
      title: '北広島市',
      description: '北広島市防災マップ（ハザードマップ）（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.city.kitahiroshima.hokkaido.jp/hotnews/detail/00150372.html'
    },
    {
      regionKey: 'shien-iburi',
      key: 'noboribetsu',
      title: '登別市',
      description: '登別市防災マップ（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.city.noboribetsu.lg.jp/bousaimap/'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'makubetsu',
      title: '幕別町',
      description: '幕別町の防災のしおり・ハザードマップ（洪水・土砂災害・津波・高潮）を新しいタブで開きます。',
      url: 'https://www.town.makubetsu.lg.jp/shobo_bosai/bosai/bosaimap/1659.html'
    },
    {
      regionKey: 'shien-nemuro',
      key: 'betsukai',
      title: '別海町',
      description: '別海町防災ハザードマップ（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://betsukai.jp/anzen/bosai/betsukai_hazardmap/'
    },
    // バッチ5（9件）：北海道35市のうち残っていた9市を追加し、市の網羅を完了。
    // See DECISIONS.md D31.
    {
      regionKey: 'shien-sorachi',
      key: 'yubari',
      title: '夕張市',
      description: '夕張市のハザードマップ（洪水・土砂災害・地震）を新しいタブで開きます。',
      url: 'https://www.city.yubari.lg.jp/soshiki/19/1783.html'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'bibai',
      title: '美唄市',
      description: '美唄市防災ガイドブック（洪水・土砂災害のハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.city.bibai.hokkaido.jp/soshiki/4/189.html'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'ashibetsu',
      title: '芦別市',
      description: '芦別市の防災ハザードマップ（土砂災害等）を新しいタブで開きます。',
      url: 'https://www.city.ashibetsu.hokkaido.jp/docs/4712.html'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'akabira',
      title: '赤平市',
      description: '赤平市防災マップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.city.akabira.hokkaido.jp/docs/4273.html'
    },
    {
      // 検索結果に出るURL（.../www/contents/1334832392813/index.html）は既に
      // 404（ページ削除済み）。現行の正しいページに差し替え済み。See D31.
      regionKey: 'shien-kamikawa',
      key: 'shibetsu',
      title: '士別市',
      description: '士別市洪水ハザードマップ（洪水・土砂災害警戒区域）を新しいタブで開きます。',
      url: 'https://www.city.shibetsu.lg.jp/soshikikarasagasu/somuka/gyoseikakari/1096.html'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'mikasa',
      title: '三笠市',
      description: '三笠市防災ハザードマップ（洪水・土砂災害・地震）を新しいタブで開きます。',
      url: 'https://www.city.mikasa.hokkaido.jp/hotnews/detail/00001717.html'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'sunagawa',
      title: '砂川市',
      description: '砂川市防災ハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.city.sunagawa.hokkaido.jp/shisei/bousai_bouka/hazard-map.html'
    },
    {
      // 検索エンジンには防災ポータルの汎用ページしかヒットせず、市サイト自身の
      // 「暮らし＞防災」カテゴリページから個別ページを特定した。See D31.
      regionKey: 'shien-sorachi',
      key: 'utashinai',
      title: '歌志内市',
      description: '歌志内市防災ハザードマップ（洪水・土砂災害・地震）を新しいタブで開きます。',
      url: 'https://www.city.utashinai.hokkaido.jp/hotnews/detail/00003232.html'
    },
    {
      // 倶知安町・千歳市等と同様、単一のハザードマップ統合ページがなく
      // （地区防災ガイド・防災GIS・3D浸水ハザードマップ・土砂災害ハザードマップが
      // 別ページに分かれている）、それら全てへの導線がある計画ページを案内する。
      regionKey: 'shien-ishikari',
      key: 'ishikari',
      title: '石狩市',
      description: '石狩市の防災等の計画ページ（地区防災ガイド・防災GIS・土砂災害ハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.city.ishikari.hokkaido.jp/kurashi/bosai/1005776/1004565/'
    },
    // バッチ6（10件）：全35市の網羅完了後、未収録の町のうち人口上位10件を追加。
    // See DECISIONS.md D32.
    {
      // 名寄市・釧路町と同じHTTPS/SNI不一致（www2.サブドメイン）。See D32.
      regionKey: 'shien-oshima',
      key: 'nanae',
      title: '七飯町',
      description: '七飯町のハザードマップ（洪水・土砂災害・火山）を新しいタブで開きます。',
      url: 'http://www2.town.nanae.hokkaido.jp/bousai/hazardmap/',
      allowedProtocols: ['http:']
    },
    {
      regionKey: 'shien-tokachi',
      key: 'memuro',
      title: '芽室町',
      description: '芽室町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.memuro.net/administration/soshiki/soumu/bousai/'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'engaru',
      title: '遠軽町',
      description: '遠軽町防災ガイドマップ（洪水・土砂災害・地震等）を新しいタブで開きます。',
      url: 'https://engaru.jp/life/page.php?id=377'
    },
    {
      // 七飯町と同じHTTPS/SNI不一致（bousai.サブドメイン）。See D32.
      regionKey: 'shien-okhotsk',
      key: 'bihoro',
      title: '美幌町',
      description: '美幌町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'http://bousai.town.bihoro.hokkaido.jp/hazardmap/',
      allowedProtocols: ['http:']
    },
    {
      // 検索結果には出ず、町サイト自身の防災カテゴリページから特定した。See D32.
      regionKey: 'shien-shiribeshi',
      key: 'yoichi',
      title: '余市町',
      description: '余市町の防災ガイドマップ（洪水・土砂災害・津波等）を新しいタブで開きます。',
      url: 'https://www.town.yoichi.hokkaido.jp/kurashi/kurashinojouhou/bousai/2018-0410-1723-1.html'
    },
    {
      // 検索結果の上位URLは404（既にstale）。町サイト自身の危機対策課ページから
      // 現行URLを特定した。See D32.
      regionKey: 'shien-ishikari',
      key: 'tobetsu',
      title: '当別町',
      description: '当別町防災マップ（洪水・土砂災害・地震）を新しいタブで開きます。',
      url: 'https://www.town.tobetsu.hokkaido.jp/soshiki/kiki/2292.html'
    },
    {
      regionKey: 'shien-oshima',
      key: 'yakumo',
      title: '八雲町',
      description: '八雲町のハザードマップ（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.yakumo.lg.jp/soshiki/kikitaisaku/hazadomap2022.html'
    },
    {
      regionKey: 'shien-iburi',
      key: 'shiraoi',
      title: '白老町',
      description: '白老町防災マップ（地震・津波・火山・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.shiraoi.hokkaido.jp/docs/page2013091100014.html'
    },
    {
      // 検索結果の上位URLは404（既にstale）。町サイト自身のナビゲーションから
      // 現行URLを特定した。See D32.
      regionKey: 'shien-oshima',
      key: 'mori',
      title: '森町',
      description: '森町のハザードマップ・避難所（津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.hokkaido-mori.lg.jp/soshiki/bosaikotsu/3/1/index.html'
    },
    {
      // 検索結果の上位URLは404（既にstale）。町サイト自身の防災・災害情報
      // カテゴリページから現行URLを特定した。See D32.
      regionKey: 'shien-okhotsk',
      key: 'shari',
      title: '斜里町',
      description: '斜里町のハザードマップ（洪水・地震・津波・火山）を新しいタブで開きます。',
      url: 'https://www.town.shari.hokkaido.jp/kurashinojoho/bosai_kishojoho/1109.html'
    },
    // バッチ7（15件）：北海道15村すべてを追加し、村の網羅を完了。See D33.
    {
      regionKey: 'shien-shiribeshi',
      key: 'akaigawa',
      title: '赤井川村',
      description: '赤井川村のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.akaigawa.com/kurashi/cat83/post_142.html'
    },
    {
      regionKey: 'shien-kamikawa',
      key: 'otoineppu',
      title: '音威子府村',
      description: '音威子府村の防災情報ページ（風水害・地震ハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.vill.otoineppu.hokkaido.jp/bousai/'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'kamoenai',
      title: '神恵内村',
      description: '神恵内村のハザードマップ（地震・津波・風水害・土砂災害）を新しいタブで開きます。',
      url: 'https://www.vill.kamoenai.hokkaido.jp/hotnews/detail/00000511.html'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'sarabetsu',
      title: '更別村',
      description: '更別村のハザードマップ（防災マップ・洪水）を新しいタブで開きます。',
      url: 'https://www.sarabetsu.jp/bosai/bousaimappu/'
    },
    {
      regionKey: 'shien-soya',
      key: 'sarufutsu',
      title: '猿払村',
      description: '猿払村のハザードマップ（洪水・津波）を新しいタブで開きます。',
      url: 'https://www.vill.sarufutsu.hokkaido.jp/hotnews/detail/00003938.html'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'shimamaki',
      title: '島牧村',
      description: '島牧村のハザードマップ（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.vill.shimamaki.lg.jp/category/detail.php?category=prevention&content=21'
    },
    {
      regionKey: 'shien-kamikawa',
      key: 'shimukappu',
      title: '占冠村',
      description: '占冠村の防災のしおり・洪水ハザードマップを新しいタブで開きます。',
      url: 'https://www.vill.shimukappu.lg.jp/shimukappu/section/soumu/nmudtq000004kzft.html'
    },
    {
      regionKey: 'shien-rumoi',
      key: 'shosanbetsu',
      title: '初山別村',
      description: '初山別村のハザードマップ（土砂災害・ため池等）を新しいタブで開きます。',
      url: 'https://www.vill.shosanbetsu.lg.jp/kurashi/bousaianzen/hazardmap.html'
    },
    {
      regionKey: 'shien-ishikari',
      key: 'shinshinotsu',
      title: '新篠津村',
      description: '新篠津村の防災ガイドブック・防災マップを新しいタブで開きます。',
      url: 'https://www.vill.shinshinotsu.hokkaido.jp/hotnews/detail/00000553.html'
    },
    {
      regionKey: 'shien-kushiro',
      key: 'tsurui',
      title: '鶴居村',
      description: '鶴居村のハザードマップ（地震・風水害等）を新しいタブで開きます。',
      url: 'https://www.vill.tsurui.lg.jp/bosai_kyukyu/1059.html'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'tomari',
      title: '泊村',
      description: '泊村のハザードマップを新しいタブで開きます。',
      url: 'https://www.vill.tomari.hokkaido.jp/kurashi/anzenbosai/3908.html'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'nakasatsunai',
      title: '中札内村',
      description: '中札内村の防災ページ（防災マップ・土砂災害警戒区域等）を新しいタブで開きます。',
      url: 'https://www.vill.nakasatsunai.hokkaido.jp/bousai_bouhan/bouhan/'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'nishiokoppe',
      title: '西興部村',
      description: '西興部村のハザードマップを新しいタブで開きます。',
      url: 'https://www.vill.nishiokoppe.lg.jp/section/kikaku/hhlo2b00000059e0.html'
    },
    {
      // 村独自のハザードマップ統合ページはなく、避難場所一覧ページに
      // ハザードマップPDFが置かれている。See D33.
      regionKey: 'shien-shiribeshi',
      key: 'makkari',
      title: '真狩村',
      description: '真狩村の避難場所一覧ページ（ハザードマップ・避難所情報）を新しいタブで開きます。',
      url: 'https://www.vill.makkari.lg.jp/makkari_map/hinanbasho/'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'rusutsu',
      title: '留寿都村',
      description: '留寿都村のハザードマップを新しいタブで開きます。',
      url: 'https://www.vill.rusutsu.lg.jp/hotnews/detail/00000269.html'
    },
    // バッチ8（10件）：全35市・全15村の完了後、人口上位10の町を追加。See D34。
    {
      regionKey: 'shien-sorachi',
      key: 'kuriyama',
      title: '栗山町',
      description: '栗山町のハザードマップページ（洪水・風水害・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.kuriyama.hokkaido.jp/life/6/38/'
    },
    {
      // 検索結果はdisaportal.gsi.go.jpの汎用ページのみヒットし、町独自のページは
      // 町サイト自身の防災ナビゲーションから特定した。See D34。
      regionKey: 'shien-shiribeshi',
      key: 'iwanai',
      title: '岩内町',
      description: '岩内町の避難所・ハザードマップページ（津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.iwanai.hokkaido.jp/暮らしガイド/防災/避難所・ハザードマップ/'
    },
    {
      regionKey: 'shien-hidaka',
      key: 'hidaka',
      title: '日高町',
      description: '日高町のハザードマップページ（津波・防災ガイドマップ）を新しいタブで開きます。',
      url: 'https://www.town.hidaka.hokkaido.jp/prevention/?category=62'
    },
    {
      // 検索結果の上位URL（.../docs/11022.html）は既にstale（404）。町サイト自身の
      // 防災情報ナビゲーションから現行ページを特定した。See D34。
      regionKey: 'shien-kamikawa',
      key: 'higashikagura',
      title: '東神楽町',
      description: '東神楽町の防災情報ページ（洪水・ため池のハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.town.higashikagura.lg.jp/c4_bosai/safety/bosai/'
    },
    {
      // 検索結果の上位URL（bosai_map.html）は既にstale（404）。町サイト自身の
      // ナビゲーションから現行ページを特定した。独自ドメイン（maoi-net.jp）。
      // See D34。
      regionKey: 'shien-sorachi',
      key: 'naganuma',
      title: '長沼町',
      description: '長沼町の防災マップページ（洪水・地震・土砂災害）を新しいタブで開きます。',
      url: 'https://www.maoi-net.jp/kyukyu_bosai/bosai/map/'
    },
    {
      regionKey: 'shien-kamikawa',
      key: 'biei',
      title: '美瑛町',
      description: '美瑛町の「災害にそなえる」ページ（洪水・土砂災害・十勝岳火山等）を新しいタブで開きます。',
      url: 'https://town.biei.hokkaido.jp/emergency/'
    },
    {
      regionKey: 'shien-kamikawa',
      key: 'kamifurano',
      title: '上富良野町',
      description: '上富良野町の防災対策ページ（洪水・十勝岳火山・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.kamifurano.hokkaido.jp/index.php?id=73'
    },
    {
      // 独自ドメイン（higashikawa-town.jp）。JS駆動のパネル型サイトで
      // <title>はサイト共通の汎用文言だが、本文は防災情報そのもの。See D34。
      regionKey: 'shien-kamikawa',
      key: 'higashikawa',
      title: '東川町',
      description: '東川町の災害対策ページ（洪水・大雪山（旭岳）火山防災マップ）を新しいタブで開きます。',
      url: 'https://higashikawa-town.jp/portal/kurashi/panel/68'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'shimizu',
      title: '清水町',
      description: '清水町防災ガイドマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.shimizu.hokkaido.jp/disaster/details/post_7.html'
    },
    {
      // 独自ドメイン（akkeshi-town.jp）。See D34。
      regionKey: 'shien-kushiro',
      key: 'akkeshi',
      title: '厚岸町',
      description: '厚岸町の防災ハザードマップ（津波・土砂災害・洪水）を新しいタブで開きます。',
      url: 'https://www.akkeshi-town.jp/bousai/bousaitaisaku_05/'
    },
    // バッチ9（10件）：人口上位10の町を追加、3巡目。See D35。
    {
      regionKey: 'shien-sorachi',
      key: 'nanporo',
      title: '南幌町',
      description: '南幌町のハザードマップ（洪水等）を新しいタブで開きます。',
      url: 'https://www.town.nanporo.hokkaido.jp/emergency-management/'
    },
    {
      // 洞爺湖町・.hokkaido.jp/.lg.jpいずれもHTTPS/SNI不一致
      // （名寄市・釧路町・七飯町・美幌町と同じ失敗モード）。See D35。
      regionKey: 'shien-iburi',
      key: 'toyako',
      title: '洞爺湖町',
      description: '洞爺湖町のハザードマップ（津波・土砂災害等）を新しいタブで開きます。',
      url: 'http://www.town.toyako.hokkaido.jp/hazardmap/index.html',
      allowedProtocols: ['http:']
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'yubetsu',
      title: '湧別町',
      description: '湧別町の防災情報（洪水・津波・高潮ハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.town.yubetsu.lg.jp/administration/life/category/?category=44'
    },
    {
      regionKey: 'shien-iburi',
      key: 'mukawa',
      title: 'むかわ町',
      description: 'むかわ町の防災情報（津波・洪水・土砂災害ハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.town.mukawa.lg.jp/3983.htm'
    },
    {
      regionKey: 'shien-iburi',
      key: 'abira',
      title: '安平町',
      description: '安平町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.abira.lg.jp/kurashi/bosai/hazard-map'
    },
    {
      regionKey: 'shien-kushiro',
      key: 'shiranuka',
      title: '白糠町',
      description: '白糠町のハザードマップ（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.shiranuka.lg.jp/kurashi/bousai/'
    },
    {
      // 町の観光用サイトは別ドメイン（hokkaido.shibecha.jp）。行政サイト
      // （town.shibecha.hokkaido.jp）は「行政情報」経由でしか辿り着けない。
      // See D35。
      regionKey: 'shien-kushiro',
      key: 'shibecha',
      title: '標茶町',
      description: '標茶町の防災情報（浸水ハザードマップ等）を新しいタブで開きます。',
      url: 'https://town.shibecha.hokkaido.jp/gyousei/bousai_chuui/bousai/index.html'
    },
    {
      regionKey: 'shien-kushiro',
      key: 'teshikaga',
      title: '弟子屈町',
      description: '弟子屈町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.teshikaga.hokkaido.jp/kurashi/soshikiichiran/somuka/10/2/3470.html'
    },
    {
      // 検索結果の上位URLは既にstale（404）。町サイト自身のナビゲーションから
      // 現行URLを特定した。See D35。
      regionKey: 'shien-okhotsk',
      key: 'ozora',
      title: '大空町',
      description: '大空町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.ozora.hokkaido.jp/izatoiutoki/2957.html'
    },
    {
      // 検索結果の上位URLは既にstale（サイトのURL体系移行により404）。
      // 町サイト自身のナビゲーションから現行URLを特定した。See D35。
      regionKey: 'shien-kamikawa',
      key: 'takasu',
      title: '鷹栖町',
      description: '鷹栖町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.takasu.hokkaido.jp/page/1263.html'
    },
    // バッチ10（10件）：人口上位10の町を追加、4巡目。See D36。
    {
      regionKey: 'shien-sorachi',
      key: 'shintotsukawa',
      title: '新十津川町',
      description: '新十津川町のハザードマップ（洪水・地震・ため池等）を新しいタブで開きます。',
      url: 'https://www.town.shintotsukawa.lg.jp/hotnews/category/253.html'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'kyowa',
      title: '共和町',
      description: '共和町の防災対策ページ（土砂災害・避難所情報等）を新しいタブで開きます。',
      url: 'https://www.town.kyowa.hokkaido.jp/prevention/?content=483'
    },
    {
      // 公式ドメインはtown.tohma（tomaではない）。JS駆動のWebGISアプリで
      // 素のHTMLの<title>は空だが、ブラウザでのレンダリング後は
      // 「当麻町洪水ハザードマップ」と確認済み。See D36。
      regionKey: 'shien-kamikawa',
      key: 'toma',
      title: '当麻町',
      description: '当麻町洪水ハザードマップを新しいタブで開きます。',
      url: 'https://www.town.tohma.hokkaido.jp/haz/index.html'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'honbetsu',
      title: '本別町',
      description: '本別町WEBハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.honbetsu.hokkaido.jp/webhazardmap/'
    },
    {
      // 検索結果の上位はハザードマップへの直接リンクがないトップページのみ。
      // 町サイト自身の「くらし＞防災＞防災ガイドマップ」から特定した。See D36。
      regionKey: 'shien-tokachi',
      key: 'ashoro',
      title: '足寄町',
      description: '足寄町防災ガイドマップ（地震・風水害・土砂災害・雌阿寒岳火山等）を新しいタブで開きます。',
      url: 'https://www.town.ashoro.hokkaido.jp/kurashi/bousai/bousai_map/page_254.html'
    },
    {
      // 公式ドメインはhokkaido-ikeda.lg.jp（長野県池田町と同名のため注意）。
      // See D36。
      regionKey: 'shien-tokachi',
      key: 'ikeda',
      title: '池田町',
      description: '池田町の防災のしおり（洪水・土砂災害・地震ハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.town.hokkaido-ikeda.lg.jp/bosai-bohan/bosai/izatoiutoki/5365.html'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'hiroo',
      title: '広尾町',
      description: '広尾町Web版ハザードマップ（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.hiroo.lg.jp/hazardmap/'
    },
    {
      // 公式ドメインはshihoro.jp（隣接する上士幌町のkamishihoro.jpと
      // 混同しないよう注意）。See D36。
      regionKey: 'shien-tokachi',
      key: 'shihoro',
      title: '士幌町',
      description: '士幌町防災ガイドブック・ハザードマップ（全域・市街地）を新しいタブで開きます。',
      url: 'https://www.shihoro.jp/life/detail.php?content=62'
    },
    {
      // 検索結果の上位は警報レベルの説明ページのみ。町サイト自身の防災
      // ナビゲーションから防災ガイドマップ本体を特定した。See D36。
      regionKey: 'shien-shiribeshi',
      key: 'niseko',
      title: 'ニセコ町',
      description: 'ニセコ町防災ガイドマップ（令和3年4月発行）を新しいタブで開きます。',
      url: 'https://www.town.niseko.lg.jp/kurashi/bosai_anzen/bosai/bousaigaidomappu/'
    },
    {
      regionKey: 'shien-oshima',
      key: 'oshamambe',
      title: '長万部町',
      description: '長万部町の防災ページ（土砂災害・津波・高潮ハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.town.oshamambe.lg.jp/life/6/23/91/'
    },
    // バッチ11（10件）：人口上位10の町を追加、5巡目。See D37。
    {
      // 検索結果の上位はstale（404）。町サイト自身のナビゲーションから
      // 現行ページを特定。ブラウザ表示URLはwwwなしに正規化されるが、
      // 実際に解決するホストはwww付きのみ（wwwなしはDNS未解決）。See D37。
      regionKey: 'shien-oshima',
      key: 'matsumae',
      title: '松前町',
      description: '松前町のハザードマップ（洪水・土砂災害・津波等）を新しいタブで開きます。',
      url: 'https://www.town.matsumae.hokkaido.jp/hotnews/detail/00000192.html'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'shintoku',
      title: '新得町',
      description: '新得町のハザードマップ（洪水・土砂災害・火山・雪崩等）を新しいタブで開きます。',
      url: 'https://www.shintoku-town.jp/kurashi-tetuduki/bousai_anzen/shinsuisoutei/'
    },
    {
      regionKey: 'shien-kushiro',
      key: 'hamanaka',
      title: '浜中町',
      description: '浜中町のハザードマップ（津波・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.townhamanaka.jp/kurashi_kankyou/bousai/bousai_map.html'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'taiki',
      title: '大樹町',
      description: '大樹町のハザードマップ（津波・洪水等）を新しいタブで開きます。',
      url: 'https://www.town.taiki.hokkaido.jp/soshiki/somuka/4/2/3/888.html'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'shikaoi',
      title: '鹿追町',
      description: '鹿追町の総合防災ハザードブック（地震・風水害・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.shikaoi.lg.jp/kurashi/bosai/hazardbook/'
    },
    {
      regionKey: 'shien-hidaka',
      key: 'niikappu',
      title: '新冠町',
      description: '新冠町のハザードマップ（洪水・津波等）を新しいタブで開きます。',
      url: 'https://www.niikappu.jp/kurashi/bosai/'
    },
    {
      // 検索結果の上位はstale（404）。町サイト自身のリンクから、防災専用の
      // 別ドメイン（shibetsutown-bousai.jp）を特定。JS駆動サイトだが実際に
      // ブラウザで確認するとタイトルは正しく表示される。既収録の中標津町
      // （別自治体）と混同しないよう注意。key は士別市（shien-kamikawa）
      // と同じローマ字「shibetsu」になるため 'shibetsu-cho' に変更 —
      // D42で発見・修正。See D37, D42。
      regionKey: 'shien-nemuro',
      key: 'shibetsu-cho',
      title: '標津町',
      description: '標津町のWeb版ハザードマップ（津波・洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://shibetsutown-bousai.jp/'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'naie',
      title: '奈井江町',
      description: '奈井江町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.naie.hokkaido.jp/bousai_info/hazardmap/'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'kamishihoro',
      title: '上士幌町',
      description: '上士幌町のハザードマップ（土砂災害・洪水浸水等）を新しいタブで開きます。',
      url: 'https://www.kamishihoro.jp/page/00000323'
    },
    {
      // 単一のハザードマップ統合ページはなく、防災情報カテゴリページを
      // 案内する。サイトが「行政情報」「いまCh.」の2ポータルに分かれており、
      // 本URLは「行政情報」側。See D37。
      regionKey: 'shien-hiyama',
      key: 'imakane',
      title: '今金町',
      description: '今金町の防災情報（土砂災害警戒区域・ため池ハザードマップ等）を新しいタブで開きます。',
      url: 'https://www.town.imakane.lg.jp/gyousei/kurashi/syoubou/post_43.html'
    },
    // バッチ12（10件）：人口上位10の町を追加、6巡目。See D38。
    {
      regionKey: 'shien-sorachi',
      key: 'yuni',
      title: '由仁町',
      description: '由仁町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.yuni.lg.jp/chosei/bosai'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'rankoshi',
      title: '蘭越町',
      description: '蘭越町のハザードマップ（洪水・土砂災害・津波等）を新しいタブで開きます。',
      url: 'https://www.town.rankoshi.hokkaido.jp/webMap/index.html'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'saroma',
      title: '佐呂間町',
      description: '佐呂間町のハザードマップを新しいタブで開きます。',
      url: 'https://www.town.saroma.hokkaido.jp/emergency/hazardmap.html'
    },
    {
      // 個別の改定版ニュース記事ではなく、恒久的なカテゴリページを採用
      // （改定のたびにリンク切れになるのを避けるため）。See D38。
      regionKey: 'shien-hidaka',
      key: 'biratori',
      title: '平取町',
      description: '平取町のハザードマップ（防災ガイドマップ）を新しいタブで開きます。',
      url: 'https://www.town.biratori.hokkaido.jp/kurashi/seikatsukankyo/bosai/'
    },
    {
      regionKey: 'shien-kamikawa',
      key: 'nakafurano',
      title: '中富良野町',
      description: '中富良野町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.nakafurano.lg.jp/hotnews/category/116.html'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'kunneppu',
      title: '訓子府町',
      description: '訓子府町のハザードマップ（防災ガイドマップ・洪水ハザードマップ）を新しいタブで開きます。',
      url: 'https://www.town.kunneppu.hokkaido.jp/life/somu/bousai_kikikanri/bousaigaidomap.html'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'koshimizu',
      title: '小清水町',
      description: '小清水町のハザードマップ（洪水・土砂災害・津波等）を新しいタブで開きます。',
      url: 'https://www.town.koshimizu.hokkaido.jp/hotnews/detail/00005586.html'
    },
    {
      // 防災専用の別サブドメイン（bousai.town.atsuma.lg.jp）。JS駆動サイトで
      // <title>は空だが、実ブラウザでは「厚真町Web版ハザードマップ」と
      // 正しく表示されることを確認済み。See D38。
      regionKey: 'shien-iburi',
      key: 'atsuma',
      title: '厚真町',
      description: '厚真町のハザードマップ（洪水・土砂災害・津波等）を新しいタブで開きます。',
      url: 'https://bousai.town.atsuma.lg.jp'
    },
    {
      // 別ドメイン（rausutown-bousai.jp）にWeb版ハザードマップもあるが、
      // 町の公式ドメイン（rausu-town.jp）上のこのページを採用。<title>は
      // 空だが実ブラウザでは正しく表示されることを確認済み。See D38。
      regionKey: 'shien-nemuro',
      key: 'rausu',
      title: '羅臼町',
      description: '羅臼町のハザードマップ（地震・津波・噴火・風水害等）を新しいタブで開きます。',
      url: 'https://www.rausu-town.jp/pages/view/288'
    },
    {
      // ハザードマップ本体（www1.town.oumu.hokkaido.jp）はHTTPS/SNI不一致
      // だが、同じ内容へリンクするHTTPS版の防災ページがあるためそちらを
      // 採用し、allowedProtocols例外を避けた。See D38。
      regionKey: 'shien-okhotsk',
      key: 'oumu',
      title: '雄武町',
      description: '雄武町の防災ハンドブック・防災マップを新しいタブで開きます。',
      url: 'https://www.town.oumu.hokkaido.jp/kurashi_tetsuzuki/anshin_anzen/bosai/1/2585.html'
    },
    // バッチ13（10件）：人口上位10の町を追加、7巡目。See D39。
    {
      // 検索結果の上位はstale（404）。町サイト自身のナビゲーションから
      // 現行ページを特定した。See D39。
      regionKey: 'shien-tokachi',
      key: 'urahoro',
      title: '浦幌町',
      description: '浦幌町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://urahoro.jp/prevention/?content=483'
    },
    {
      // 検索結果の上位はstale（404）。町サイト自身のナビゲーションから
      // 現行ページを特定した。See D39。
      regionKey: 'shien-okhotsk',
      key: 'tsubetsu',
      title: '津別町',
      description: '津別町のハザードマップ（洪水等）を新しいタブで開きます。',
      url: 'https://www.town.tsubetsu.hokkaido.jp/kurashi_tetsuzuki/bosai_anzenanshin/6/4511.html'
    },
    {
      regionKey: 'shien-hidaka',
      key: 'erimo',
      title: 'えりも町',
      description: 'えりも町のハザードマップ（津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.erimo.lg.jp/section/kikaku/u9c3nn00000004rq.html'
    },
    {
      // 名寄市・釧路町・深川市と同一IP（45.60.112.77）上のHTTPS/SNI不一致
      // （これで7件目のこのパターン）。同内容のHTTPS代替も存在しないため
      // allowedProtocols: ['http:']が必要。See D39。
      regionKey: 'shien-hidaka',
      key: 'samani',
      title: '様似町',
      description: '様似町のハザードマップ（洪水・津波・土砂災害）を新しいタブで開きます。',
      url: 'http://www.samani.jp/bousai/',
      allowedProtocols: ['http:']
    },
    {
      regionKey: 'shien-hiyama',
      key: 'kaminokuni',
      title: '上ノ国町',
      description: '上ノ国町のハザードマップ（洪水・津波・地震・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.kaminokuni.lg.jp/hotnews/detail/00002266.html'
    },
    {
      regionKey: 'shien-oshima',
      key: 'shiriuchi',
      title: '知内町',
      description: '知内町のハザードマップ（洪水・津波）を新しいタブで開きます。',
      url: 'https://www.town.shiriuchi.hokkaido.jp/kurashi/bosai/bousaimap.html'
    },
    {
      // 洪水のみが地図として整備されており、土砂災害情報は地図でない告知の
      // 形で別途公開されている。説明文は洪水のみに限定。See D39。
      regionKey: 'shien-kamikawa',
      key: 'bifuka',
      title: '美深町',
      description: '美深町のハザードマップ（洪水）を新しいタブで開きます。',
      url: 'https://www.town.bifuka.hokkaido.jp/cms/section/soumu/qlmcaj0000005h19.html'
    },
    {
      // 美深町と同様、洪水のみが地図として整備されている。See D39。
      regionKey: 'shien-okhotsk',
      key: 'kiyosato',
      title: '清里町',
      description: '清里町のハザードマップ（洪水）を新しいタブで開きます。',
      url: 'https://www.town.kiyosato.hokkaido.jp/life/?content=595'
    },
    {
      regionKey: 'shien-soya',
      key: 'toyotomi',
      title: '豊富町',
      description: '豊富町のハザードマップ（洪水・津波・地震等）を新しいタブで開きます。',
      url: 'https://www.town.toyotomi.hokkaido.jp/section/soumuka/tdlqvk000000jvel.html'
    },
    {
      regionKey: 'shien-iburi',
      key: 'toyoura',
      title: '豊浦町',
      description: '豊浦町防災ガイドマップ（地震・津波・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.toyoura.hokkaido.jp/hotnews/detail/00001467.html'
    },
    // バッチ14（10件）：人口上位10の町を追加、8巡目。See D40。
    {
      regionKey: 'shien-okhotsk',
      key: 'okoppe',
      title: '興部町',
      description: '興部町のハザードマップ（洪水・土砂災害・津波）を新しいタブで開きます。',
      url: 'https://www.town.okoppe.lg.jp/bosai/hazardmap.html'
    },
    {
      // 洪水マップは未整備。土砂災害・津波のみ。See D40。
      regionKey: 'shien-oshima',
      key: 'shikabe',
      title: '鹿部町',
      description: '鹿部町のハザードマップ（土砂災害・津波）を新しいタブで開きます。',
      url: 'https://www.town.shikabe.lg.jp/kurashi_tetsuzuki/anzen_anshin/bosai/2/index.html'
    },
    {
      // JS駆動のWebGISアプリで素のHTMLの<title>は空だが、実ブラウザでは
      // 「増毛町WEB版防災ハザードマップ」と正しく表示されることを確認済み。
      // See D40。
      regionKey: 'shien-rumoi',
      key: 'mashike',
      title: '増毛町',
      description: '増毛町のハザードマップ（洪水・土砂災害・津波）を新しいタブで開きます。',
      url: 'https://www.town.mashike.hokkaido.jp/menu/bousai/hazardmap/index.html'
    },
    {
      // 増毛町と同様、JS駆動で<title>は空。実ブラウザで「比布町防災マップ」
      // と正しく表示されることを確認済み。See D40。
      regionKey: 'shien-kamikawa',
      key: 'pippu',
      title: '比布町',
      description: '比布町のハザードマップ（洪水・土砂災害・ため池）を新しいタブで開きます。',
      url: 'https://www.town.pippu.hokkaido.jp/htdocs/'
    },
    {
      regionKey: 'shien-oshima',
      key: 'kikonai',
      title: '木古内町',
      description: '木古内町のハザードマップ（洪水・津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.kikonai.hokkaido.jp/bosai/bosaimap.html'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'niki',
      title: '仁木町',
      description: '仁木町の防災ガイドマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.niki.hokkaido.jp/section/somuka/irv9760000000gin.html'
    },
    {
      regionKey: 'shien-oshima',
      key: 'fukushima',
      title: '福島町',
      description: '福島町のハザードマップ（洪水・津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.fukushima.hokkaido.jp/map/'
    },
    {
      // 土砂災害情報は地図でないテキストの注意喚起のみ。説明文は水害
      // （洪水・風水害）のみに限定。See D40。
      regionKey: 'shien-kamikawa',
      key: 'kamikawa',
      title: '上川町',
      description: '上川町の水害ハザードマップ（洪水・風水害）を新しいタブで開きます。',
      url: 'https://www.town.hokkaido-kamikawa.lg.jp/section/chiikimiryoku/chs81200000009ay.html'
    },
    {
      regionKey: 'shien-hiyama',
      key: 'assabu',
      title: '厚沢部町',
      description: '厚沢部町の防災ハザードマップ（洪水・土砂災害・津波）を新しいタブで開きます。',
      url: 'https://www.town.assabu.lg.jp/page/9399.html'
    },
    {
      // 名寄市・釧路町・深川市・様似町と同一IP（45.60.112.77）上のHTTPS/SNI
      // 不一致（8件目）。HTTPS代替も存在しないためallowedProtocols:
      // ['http:']が必要。See D40。
      regionKey: 'shien-soya',
      key: 'hamatonbetsu',
      title: '浜頓別町',
      description: '浜頓別町の防災マップ（洪水・津波・土砂災害）を新しいタブで開きます。',
      url: 'http://www.town.hamatonbetsu.hokkaido.jp/disaster/detail.php?content=632',
      allowedProtocols: ['http:']
    },
    // バッチ15（12件）：人口上位12の町を追加、9巡目（残り件数が少ないため
    // やや大きめのバッチ）。See D41。
    {
      regionKey: 'shien-sorachi',
      key: 'tsukigata',
      title: '月形町',
      description: '月形町のハザードマップ（水害・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.tsukigata.hokkaido.jp/page/1569.html'
    },
    {
      regionKey: 'shien-hiyama',
      key: 'otobe',
      title: '乙部町',
      description: '乙部町のハザードマップ（津波・洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.otobe.lg.jp/section/soumu/e0taal0000000jho.html'
    },
    {
      // 洪水のみが地図として整備されている。See D41。
      regionKey: 'shien-shiribeshi',
      key: 'kyogoku',
      title: '京極町',
      description: '京極町のハザードマップ（洪水）を新しいタブで開きます。',
      url: 'https://www.town-kyogoku.jp/page/1157.html'
    },
    {
      // 洪水のみが地図として整備されている。See D41。
      regionKey: 'shien-kamikawa',
      key: 'shimokawa',
      title: '下川町',
      description: '下川町のハザードマップ（洪水）を新しいタブで開きます。',
      url: 'https://www.town.shimokawa.hokkaido.jp/section/bosai/'
    },
    {
      regionKey: 'shien-tokachi',
      key: 'toyokoro',
      title: '豊頃町',
      description: '豊頃町のハザードマップ（津波・洪水）を新しいタブで開きます。',
      url: 'https://www.toyokoro.jp/hazardmap/'
    },
    {
      // 検索結果の上位URLは旧URL体系（301リダイレクト）。町サイト自身の
      // 現行URLを特定した。See D41。
      regionKey: 'shien-kamikawa',
      key: 'wassamu',
      title: '和寒町',
      description: '和寒町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.wassamu.hokkaido.jp/affairs/community-safety/disaster-prevention/'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'numata',
      title: '沼田町',
      description: '沼田町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.numata.hokkaido.jp/section/soumu/ujj7s30000001q7o.html'
    },
    {
      // 苫前町と同一IP（45.60.112.77）上のHTTPS/SNI不一致（9件目）。
      // ドメイン全体でHTTPSが機能せず、HTTPS代替も存在しないため
      // allowedProtocols: ['http:']が必要。See D41。
      regionKey: 'shien-shiribeshi',
      key: 'kuromatsunai',
      title: '黒松内町',
      description: '黒松内町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'http://www.kuromatsunai.com/townlife/bousai/file001/',
      allowedProtocols: ['http:']
    },
    {
      // 検索エンジンには全くヒットせず、町サイト自身のメニューから発見。
      // 土砂災害マップは未整備（警戒区域指定の告知のみ）。See D41。
      regionKey: 'shien-kamikawa',
      key: 'kembuchi',
      title: '剣淵町',
      description: '剣淵町のハザードマップ（洪水・ため池等）を新しいタブで開きます。',
      url: 'https://www.town.kembuchi.hokkaido.jp/kurashi/消防・防災/災害が起きたら/'
    },
    {
      // 具体的な改定版ニュース記事ではなく、恒久的なカテゴリページを採用
      // （改定のたびにリンク切れになるのを避けるため、D38の平取町と同じ判断）。
      regionKey: 'shien-rumoi',
      key: 'obira',
      title: '小平町',
      description: '小平町のハザードマップ（津波・洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.obira.hokkaido.jp/hotnews/category/286.html'
    },
    {
      // 黒松内町と同一IP（45.60.112.77）上のHTTPS/SNI不一致（10件目）。
      // 土砂災害情報は地図でないテキストの注意喚起のみ。See D41。
      regionKey: 'shien-rumoi',
      key: 'tomamae',
      title: '苫前町',
      description: '苫前町のハザードマップ（津波・洪水）を新しいタブで開きます。',
      url: 'http://www.town.tomamae.lg.jp/section/somu/lg6iib00000000cj.html',
      allowedProtocols: ['http:']
    },
    {
      regionKey: 'shien-rumoi',
      key: 'teshio',
      title: '天塩町',
      description: '天塩町のハザードマップ（津波・洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.teshiotown.hokkaido.jp/?page_id=17345'
    },
    // 最終バッチ（25件）：残っていた町すべてを追加し、179市町村の全網羅を
    // 達成。See D42。
    {
      regionKey: 'shien-kamikawa',
      key: 'aibetsu',
      title: '愛別町',
      description: '愛別町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.aibetsu.hokkaido.jp/01/07/01/663'
    },
    {
      regionKey: 'shien-kamikawa',
      key: 'nakagawa',
      title: '中川町',
      description: '中川町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.nakagawa.hokkaido.jp/section/kikakuzaisei/b02d3l0000000oyw.html'
    },
    {
      // 地理的には空知地方だが行政上は上川総合振興局に属する。See D42。
      regionKey: 'shien-kamikawa',
      key: 'horokanai',
      title: '幌加内町',
      description: '幌加内町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.horokanai.hokkaido.jp/kurasu/bosai-kyukyu/hazard-map'
    },
    {
      regionKey: 'shien-kamikawa',
      key: 'minamifurano',
      title: '南富良野町',
      description: '南富良野町のハザードマップ（洪水）を新しいタブで開きます。',
      url: 'https://www.town.minamifurano.hokkaido.jp/kurashi-info/防災情報/'
    },
    {
      regionKey: 'shien-iburi',
      key: 'sobetsu',
      title: '壮瞥町',
      description: '壮瞥町のハザードマップ（火山・土砂災害・洪水）を新しいタブで開きます。',
      url: 'https://www.town.sobetsu.lg.jp/anzen/bosai.html'
    },
    {
      // 独自ドメイン（rikubetsu.jp、town.rikubetsu.hokkaido.jpではない）。
      // See D42。
      regionKey: 'shien-tokachi',
      key: 'rikubetsu',
      title: '陸別町',
      description: '陸別町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.rikubetsu.jp/kurashi/bousai_saigai/'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'kimobetsu',
      title: '喜茂別町',
      description: '喜茂別町防災ハザードマップ・防災情報（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.kimobetsu.hokkaido.jp/life/detail.php?content=104'
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'shakotan',
      title: '積丹町',
      description: '積丹町の避難マニュアル・防災マップ（津波・土砂災害・洪水）を新しいタブで開きます。',
      url: 'https://www.town.shakotan.lg.jp/contents/content0640.html'
    },
    {
      // 名寄市・釧路町等と同一IP（45.60.112.77）上のHTTPS/SNI不一致
      // （11件目）。ドメイン全体でHTTPSが機能せず、HTTPS代替も存在しない
      // ためallowedProtocols: ['http:']が必要。ローマ字表記は"suttu"
      // （"suttsu"ではない）。See D42。
      regionKey: 'shien-shiribeshi',
      key: 'suttu',
      title: '寿都町',
      description: '寿都町のハザードマップ（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'http://www.town.suttu.lg.jp/disaster/detail.php?id=83',
      allowedProtocols: ['http:']
    },
    {
      regionKey: 'shien-shiribeshi',
      key: 'furubira',
      title: '古平町',
      description: '古平町の防災ハンドブック（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.furubira.lg.jp/life/detail.php?id=20'
    },
    {
      regionKey: 'shien-okhotsk',
      key: 'oketo',
      title: '置戸町',
      description: '置戸町のハザードマップ（洪水・土砂災害・地震）を新しいタブで開きます。',
      url: 'https://www.town.oketo.hokkaido.jp/kurashi/koutsu_bousai/hazard_map/'
    },
    {
      // 検索結果の上位は不動産・観光サイトのみ。町の公式サイトから
      // 直接特定した。See D42。
      regionKey: 'shien-okhotsk',
      key: 'takinoue',
      title: '滝上町',
      description: '滝上町地域防災計画・ハザードマップ（土砂災害等）を新しいタブで開きます。',
      url: 'https://town.takinoue.hokkaido.jp/kurashi/kinkyu/20150602.html'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'urausu',
      title: '浦臼町',
      description: '浦臼町のハザードマップ（洪水）を新しいタブで開きます。',
      url: 'https://www.town.urausu.hokkaido.jp/kurashi/kurashi/bousai/'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'uryu',
      title: '雨竜町',
      description: '雨竜町のハザードマップを新しいタブで開きます。',
      url: 'https://www.town.uryu.hokkaido.jp/docs/bousai-map.html'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'kamisunagawa',
      title: '上砂川町',
      description: '上砂川町のハザードマップ（洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://town.kamisunagawa.hokkaido.jp/kurashi_tetsuzuki/bosai/'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'chippubetsu',
      title: '秩父別町',
      description: '秩父別町の防災マップ（洪水・ため池等）を新しいタブで開きます。',
      url: 'https://www.town.chippubetsu.hokkaido.jp/category/single.html?category=life&content_category=14'
    },
    {
      // 検索結果の上位URLは301後に404（既にstale）。町サイト自身の
      // ナビゲーションから現行ページを特定した。See D42。
      regionKey: 'shien-sorachi',
      key: 'hokuryu',
      title: '北竜町',
      description: '北竜町のハザードマップ（洪水）を新しいタブで開きます。',
      url: 'https://www.town.hokuryu.hokkaido.jp/bosai/'
    },
    {
      regionKey: 'shien-sorachi',
      key: 'moseushi',
      title: '妹背牛町',
      description: '妹背牛町のハザードマップ（洪水）を新しいタブで開きます。',
      url: 'https://www.town.moseushi.hokkaido.jp/bousai_bouhan/bousai/'
    },
    {
      regionKey: 'shien-soya',
      key: 'nakatombetsu',
      title: '中頓別町',
      description: '中頓別町のハザードマップ（洪水・土砂災害等）を新しいタブで開きます。',
      url: 'https://www.town.nakatombetsu.hokkaido.jp/bunya/4713/'
    },
    {
      regionKey: 'shien-soya',
      key: 'horonobe',
      title: '幌延町',
      description: '幌延町のハザードマップ（洪水・津波）を新しいタブで開きます。',
      url: 'https://www.town.horonobe.lg.jp/hazardmap/'
    },
    {
      // 旧town.rishiri.hokkaido.jpは独自ドメイン（rishiri-town.jp）へ
      // 移行済み。See D42。
      regionKey: 'shien-soya',
      key: 'rishiri',
      title: '利尻町',
      description: '利尻町のハザードマップ（津波・土砂災害）を新しいタブで開きます。',
      url: 'https://rishiri-town.jp/防災・天気/ハザードマップ/'
    },
    {
      // JS駆動のWeb版地図（/hazardmap/）は空のシェルで不安定なため、
      // 静的な内容を持つ親ページを採用。See D42。
      regionKey: 'shien-soya',
      key: 'rishirifuji',
      title: '利尻富士町',
      description: '利尻富士町のハザードマップ（津波・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.rishirifuji.hokkaido.jp/rishirifuji/1176.htm'
    },
    {
      // 津波のみが地図として整備されている。See D42。
      regionKey: 'shien-soya',
      key: 'rebun',
      title: '礼文町',
      description: '礼文町の津波ハザードマップを新しいタブで開きます。',
      url: 'https://www.town.rebun.hokkaido.jp/hotnews/detail/00003006.html'
    },
    {
      // 土砂災害のみが地図として整備されている。See D42。
      regionKey: 'shien-rumoi',
      key: 'embetsu',
      title: '遠別町',
      description: '遠別町の土砂災害ハザードマップを新しいタブで開きます。',
      url: 'https://www.town.embetsu.hokkaido.jp/docs/page2020052900026.html'
    },
    {
      regionKey: 'shien-hiyama',
      key: 'okushiri',
      title: '奥尻町',
      description: '奥尻町の総合防災マップ（津波・洪水・土砂災害）を新しいタブで開きます。',
      url: 'https://www.town.okushiri.lg.jp/hotnews/detail/00003705.html'
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

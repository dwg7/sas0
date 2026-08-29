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
    title: '防災情報ポータルサイト',
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

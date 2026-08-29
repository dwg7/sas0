// フォルダは2計器以上を束ねる時だけ作る — 1計器しか持たないフォルダは
// クリックしてもその1計器しか出てこず、ワンクッション増やすだけの無駄に
// なるため作らない。その計器は元フォルダの位置（同じ order）へ直接
// 昇格させる。気象庁（4計器）とリンク集（4項目）は複数計器を束ねるため
// フォルダとして維持する。See DECISIONS.md D28, D43.
SAS0.registerFolder({ key: 'jma', name: '気象庁', parentKey: 'root', order: 1 });
// order 2 は docs/instruments/hkd-map.js の registerInstrument が使う（地図）。
// order 3 は docs/instruments/kmoni.js が使う（強震モニタ、旧 防災科学技術研究所 フォルダ）。
// order 4 は docs/instruments/river-info.js が使う（川の防災情報、旧 国土交通省 フォルダ）。
// order 5 は docs/instruments/hokkaido-development-bureau.js が使う（旧 北海道開発局 フォルダ）。
// order 6 は docs/instruments/hokkaido.js が使う（北海道 防災情報、旧 北海道 フォルダ）。

// リンク集：常用しない・状況情報でない（一度確認すれば足りる参照資料）を
// まとめる置き場。ハザードマップポータル（docs/instruments/gsi-hazard.js、
// 旧 国土地理院 フォルダ）・旅の安全情報（docs/instruments/
// hokkaido-safe-travel.js、旧 北海道運輸局 フォルダ）もここへ直接ぶら下がる
// 単一計器として自己登録する。市町村・火山（下記コメント参照）も同様。
// See DECISIONS.md D28, D43.
SAS0.registerFolder({ key: 'reference', name: 'リンク集', parentKey: 'root', order: 9 });

// 市町村・火山は「組織ごとのフォルダ」という慣習（D10）に馴染まない
// （各市町村・各協議会がそれぞれ別組織）ため、フォルダ階層は作らず
// docs/instruments/municipalities.js・volcano-councils.js がリンク集直下の
// 単一計器として自己登録する（内部で見出しつきリストに束ねる）。
// See DECISIONS.md D20, D28.

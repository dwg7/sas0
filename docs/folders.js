// Root order: 気象庁と地図（下記 hkd-map.js）は「常用する」という実利由で
// 建制順より優先して先頭固定する（order 1, 2）。それ以外は文部科学省系→
// 国土交通省系（本省→地方支分部局）→都道府県という建制順・省庁→都道府県の
// 慣習に沿わせ、参照情報（常用しない・状況情報でないリンク）は「リンク集」に
// まとめて最後に置く。See DECISIONS.md D28.
SAS0.registerFolder({ key: 'jma', name: '気象庁', parentKey: 'root', order: 1 });
// order 2 は docs/instruments/hkd-map.js の registerInstrument が使う（地図）。
SAS0.registerFolder({ key: 'nied', name: '防災科学技術研究所', parentKey: 'root', order: 3 });
// 国土交通省本省の「川の防災情報」。北海道運輸局（地方運輸局）とは別組織なので
// 同じフォルダにはまとめない。See DECISIONS.md D20.
SAS0.registerFolder({ key: 'mlit', name: '国土交通省', parentKey: 'root', order: 4 });
// 北海道開発局。国道・河川・港湾等の管理者として独自の防災情報ポータルを持つ、
// 北海道運輸局・国土交通省本省のいずれとも別組織。See DECISIONS.md D21,
// HANDOVER.md open item #2.
SAS0.registerFolder({ key: 'kaihatsukyoku', name: '北海道開発局', parentKey: 'root', order: 5 });
SAS0.registerFolder({ key: 'hokkaido', name: '北海道', parentKey: 'root', order: 6 });

// リンク集：常用しない・状況情報でない（一度確認すれば足りる参照資料）を
// まとめる置き場。国土地理院・北海道運輸局はフォルダごとここへ移動、
// 市町村・火山（下記コメント参照）はここに直接ぶら下がる単一計器のまま。
// See DECISIONS.md D28.
SAS0.registerFolder({ key: 'reference', name: 'リンク集', parentKey: 'root', order: 9 });
SAS0.registerFolder({ key: 'gsi', name: '国土地理院', parentKey: 'reference' });
SAS0.registerFolder({ key: 'unyukyoku', name: '北海道運輸局', parentKey: 'reference' });

// 市町村・火山は「組織ごとのフォルダ」という慣習（D10）に馴染まない
// （各市町村・各協議会がそれぞれ別組織）ため、フォルダ階層は作らず
// docs/instruments/municipalities.js・volcano-councils.js がリンク集直下の
// 単一計器として自己登録する（内部で見出しつきリストに束ねる）。
// See DECISIONS.md D20, D28.

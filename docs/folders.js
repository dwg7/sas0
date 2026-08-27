SAS0.registerFolder({ key: 'jma', name: '気象庁', parentKey: 'root' });
SAS0.registerFolder({ key: 'hokkaido', name: '北海道', parentKey: 'root' });
SAS0.registerFolder({ key: 'gsi', name: '国土地理院', parentKey: 'root' });
SAS0.registerFolder({ key: 'nied', name: '防災科学技術研究所', parentKey: 'root' });
SAS0.registerFolder({ key: 'unyukyoku', name: '北海道運輸局', parentKey: 'root' });
// 国土交通省本省の「川の防災情報」。北海道運輸局（地方運輸局）とは別組織なので
// 同じフォルダにはまとめない。See DECISIONS.md D20.
SAS0.registerFolder({ key: 'mlit', name: '国土交通省', parentKey: 'root' });

// 市町村・火山は「組織ごとのフォルダ」という慣習（D10）に馴染まない
// （各市町村・各協議会がそれぞれ別組織）ため、フォルダ階層は作らず
// docs/instruments/municipalities.js・volcano-councils.js がルート直下の
// 単一計器として自己登録する（内部で見出しつきリストに束ねる）。
// See DECISIONS.md D20.

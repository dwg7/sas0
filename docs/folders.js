SAS0.registerFolder({ key: 'jma', name: '気象庁', parentKey: 'root' });
SAS0.registerFolder({ key: 'hokkaido', name: '北海道', parentKey: 'root' });
SAS0.registerFolder({ key: 'gsi', name: '国土地理院', parentKey: 'root' });

// 市町村: grouped by 振興局 (Hokkaido's 14 subprefectures), not a flat list —
// Hokkaido has 179 municipalities, so only add a subprefecture folder once
// it actually has a municipality registered under it. Start small (D15).
SAS0.registerFolder({ key: 'municipalities', name: '市町村', parentKey: 'root' });
SAS0.registerFolder({ key: 'shien-ishikari', name: '石狩振興局', parentKey: 'municipalities' });
SAS0.registerFolder({ key: 'shien-kushiro', name: '釧路総合振興局', parentKey: 'municipalities' });

// 火山: one item per volcano that actually has an established 火山防災協議会
// (a subset of the ~20 monitored Hokkaido volcanoes) — see D15.
SAS0.registerFolder({ key: 'volcano-councils', name: '火山', parentKey: 'root' });

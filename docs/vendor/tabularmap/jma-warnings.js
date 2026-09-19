/*
 * jma-warnings.js — 気象庁「気象警報・注意報」を市町村ごとの指標 (source) にする。
 *
 * データ: https://www.jma.go.jp/bosai/warning/data/r8/<府県予報区コード>.json
 *   北海道は 8 つの府県予報区に分かれる (宗谷 / 上川・留萌 / 網走・北見・紋別 / 十勝 / 釧路・根室 / 胆振・日高 /
 *   石狩・空知・後志 / 渡島・檜山)。各ファイルは電文種別 (dataTypeCode: VPWW55 など) ごとの配列で、
 *   各要素の warning.class20Items[] が市町村単位 (areaCode 7桁 = 5桁コード + 2桁)、kinds[] に種類コードと status
 *   (発表・継続・解除・「発表警報・注意報はなし」) が入る。全要素を合算して現在の発表状況にする。
 *   CORS は許可されている (access-control-allow-origin: *)。
 *   注意: 旧形式の warning/data/warning/<コード>.json は 2026 年 5 月末で更新が止まっている (last-modified で確認)。使わない。
 *   釧路市・北見市・伊達市・八雲町・羽幌町・日高町は市域内で複数の区域に分かれるため、5桁コードごとに最も高い水準を採る。
 * 種類コード → 名称・水準: ./data/jma-warning-codes.json (気象庁防災情報XML コード管理表から作成)。
 * 値: 警戒レベル相当の水準 (0 発表なし、2 注意報、3 警報、4 危険警報、5 特別警報)。notes に発表中の種類名を持たせる。
 * 北方領土の 6 村は気象庁の市町村区域 (class20s) に無いので「無データ」になる。
 *
 * 使い方:
 *   window.TABULARMAPS_JMA_WARNINGS                  既定の設定で作った指標 (このリポジトリの index.html / preview.html が使う)
 *   window.TabularMapsJmaWarnings.create(options)    他のダッシュボードに組み込む時の入口。options は全て任意:
 *     fetchJson(url) → Promise<JSON>   気象庁 JSON の取得を差し替える (組み込み先の共有キャッシュ付き fetch など)。
 *                                      解釈 (class20Items の合算) はこのファイルのまま。失敗 (reject) した予報区は「取得できず」に回る。
 *     codesUrl                         種類コード表の URL (既定 './data/jma-warning-codes.json')。
 *     codeTable                        種類コード表のオブジェクトを直接渡す (codesUrl より優先。取得しない)。
 *     colors: {'0': '#rrggbb', ...}    水準ごとの塗り色。scale.colors として描画コアに渡る (無い水準は既定のランプ)。
 *     baseUrl, refreshMs, key, name
 */
(function () {
  'use strict';
  const OFFICES = [
    ['011000', '宗谷地方'], ['012000', '上川・留萌地方'], ['013000', '網走・北見・紋別地方'], ['014030', '十勝地方'],
    ['014100', '釧路・根室地方'], ['015000', '胆振・日高地方'], ['016000', '石狩・空知・後志地方'], ['017000', '渡島・檜山地方']
  ];
  const BASE = 'https://www.jma.go.jp/bosai/warning/data/r8/';
  const CODES_URL = './data/jma-warning-codes.json';
  const defaultFetchJson = (url) => fetch(url, { cache: 'no-store' }).then((r) => r.json());
  function fmtTime(iso) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? String(iso || '') : d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function create(options) {
    const o = options || {};
    const fetchJson = o.fetchJson || defaultFetchJson;
    const base = o.baseUrl || BASE;
    let codesPromise = null;
    function codes() {
      if (o.codeTable) return Promise.resolve(o.codeTable);
      if (!codesPromise) {
        codesPromise = fetch(o.codesUrl || CODES_URL).then((r) => r.json());
        codesPromise.catch(() => { codesPromise = null; });   // 失敗は次回に再試行する
      }
      return codesPromise;
    }

    async function fetchValues() {
      const table = await codes();
      const reports = await Promise.all(OFFICES.map(([code]) =>
        Promise.resolve().then(() => fetchJson(base + code + '.json')).catch(() => null)));
      const level = {}, names = {};
      let latest = null, failed = [];
      reports.forEach((entries, i) => {
        if (!Array.isArray(entries) || entries.length === 0) { failed.push(OFFICES[i][1]); return; }
        for (const rep of entries) {
          if (!latest || rep.reportDatetime > latest) latest = rep.reportDatetime;
          for (const item of (rep.warning && rep.warning.class20Items) || []) {
            const code5 = String(item.areaCode).slice(0, 5);
            if (!(code5 in level)) { level[code5] = 0; names[code5] = new Set(); }
            for (const k of item.kinds || []) {
              if (!k.code || k.status === '解除') continue;   // code 無しは「発表警報・注意報はなし」
              const def = table.codes[String(k.code).padStart(2, '0')];
              if (!def) continue;
              level[code5] = Math.max(level[code5], def.level);
              names[code5].add(def.name);
            }
          }
        }
      });
      const values = {}, notes = {};
      for (const c in level) {
        values[c] = level[c];
        if (names[c].size) notes[c] = [...names[c]].join('、');   // 発表なしは値の段階名だけで示す
      }
      return {
        label: '気象警報・注意報', unit: '',
        asOf: (latest ? fmtTime(latest) + ' 発表' : '') + (failed.length ? '（' + failed.join('・') + ' は取得できず）' : '') + '　出典: 気象庁',
        min: 0, max: 5, values, notes,
        scale: Object.assign({ type: 'ordinal', labels: table.levels }, o.colors ? { colors: o.colors } : {})
      };
    }

    return {
      key: o.key || 'jma-warnings', name: o.name || '気象警報・注意報 (気象庁)',
      refreshMs: o.refreshMs || 5 * 60 * 1000, fetchValues
    };
  }

  window.TabularMapsJmaWarnings = { create, OFFICES };
  window.TABULARMAPS_JMA_WARNINGS = create();
})();

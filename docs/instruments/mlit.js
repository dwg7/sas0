(function () {
  const hazardPortal = (window.SAS0_CONFIG && window.SAS0_CONFIG.gsiHazard) || {};
  const river = (window.SAS0_CONFIG && window.SAS0_CONFIG.riverInfo) || {};

  // 国土地理院のハザードマップポータルと、本省直轄の「川の防災情報」は
  // どちらも国土交通省傘下のサービスのため、リンク集では組織単位で一つの
  // 「国土交通省」エントリにまとめる（ユーザー指定、D56）。config.js側の
  // gsiHazard/riverInfoというキー名自体は変更していない — 計器ファイルは
  // 自己完結という慣習（D10）と、config.jsのキー名は表示名と独立という
  // 既存の切り分けに合わせた。旧gsi-hazard.js/river-info.jsを統合。
  SAS0.registerInstrument({
    key: 'mlit',
    name: '国土交通省',
    parentKey: 'reference',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkList(container, {
        groups: [
          {
            items: [
              { title: hazardPortal.title, description: hazardPortal.description, url: hazardPortal.url },
              { title: river.title, description: river.description, url: river.url }
            ]
          }
        ]
      });
    }
  });
})();

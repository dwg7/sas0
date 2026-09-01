(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.higumap) || {};

  SAS0.registerInstrument({
    key: 'higumap',
    // D56の「リンク集の計器名は運営組織名」という方針からは意図的に外れる
    // ——運営元のダッピスタジオ合同会社は利用者にとって無意味な名前で、
    // 連携先の各市町村自身も「ひぐまっぷ」というサービス名で案内している
    // （例：美幌町の告知ページタイトルが「ヒグマ出没情報（ひぐまっぷ）」）。
    // ここでは組織名よりサービス名の方が実際に認知されている、という判断。
    // See DECISIONS.md D67.
    name: 'ひぐまっぷ',
    parentKey: 'reference',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkList(container, {
        groups: [{ items: [{ title: config.title, description: config.description, url: config.url }] }]
      });
    }
  });
})();

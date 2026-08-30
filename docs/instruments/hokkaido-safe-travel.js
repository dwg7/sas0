(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.hokkaidoSafeTravel) || {};

  SAS0.registerInstrument({
    key: 'hokkaido-safe-travel',
    // 計器名（ツリー上の見出し）は運営組織で、行内のリンク自体のタイトルは
    // config.jsのconfig.title（「北海道 旅の安全情報」）のまま — D56で
    // リンク集全体を「運営組織名を見出しに」という方針に揃えた際、両者を
    // 意図的に分離した。
    name: '北海道運輸局',
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

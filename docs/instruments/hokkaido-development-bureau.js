(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.hokkaidoDevelopmentBureau) || {};

  SAS0.registerInstrument({
    key: 'hokkaido-development-bureau',
    // 計器名は運営組織、行内のリンクタイトルはconfig.titleのまま — D56。
    name: '北海道開発局',
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

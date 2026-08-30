(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.kmoni) || {};

  SAS0.registerInstrument({
    key: 'kmoni',
    // 計器名は運営組織（防災科学技術研究所＝防災科研）、行内のリンクタイトルは
    // config.title（「強震モニタ」）のまま — D56。
    name: '防災科学技術研究所',
    parentKey: 'reference',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkList(container, {
        groups: [
          {
            items: [
              {
                title: config.title,
                description: config.description,
                url: config.url,
                // kmoni has no HTTPS endpoint at all (DECISIONS.md D19) —
                // the default allowedProtocols: ['https:'] would silently
                // disable this link, so it's the one item that opts into 'http:'.
                allowedProtocols: ['http:']
              }
            ]
          }
        ]
      });
    }
  });
})();

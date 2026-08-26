(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.kmoni) || {};

  SAS0.registerInstrument({
    key: 'kmoni',
    name: config.title || '強震モニタ',
    parentKey: 'nied',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkCard(container, {
        title: config.title,
        description: config.description,
        url: config.url,
        // kmoni has no HTTPS endpoint at all (DECISIONS.md D19) — the
        // default allowedProtocols: ['https:'] would silently disable
        // this link, so it's the one instrument that opts into 'http:'.
        allowedProtocols: ['http:']
      });
    }
  });
})();

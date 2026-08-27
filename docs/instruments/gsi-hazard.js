(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.gsiHazard) || {};

  SAS0.registerInstrument({
    key: 'gsi-hazard',
    name: config.title || 'ハザードマップポータル',
    parentKey: 'gsi',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkList(container, {
        groups: [{ items: [{ title: config.title, description: config.description, url: config.url }] }]
      });
    }
  });
})();

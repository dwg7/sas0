(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.riverInfo) || {};

  SAS0.registerInstrument({
    key: 'river-info',
    name: config.title || '川の防災情報',
    parentKey: 'mlit',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkList(container, {
        groups: [{ items: [{ title: config.title, description: config.description, url: config.url }] }]
      });
    }
  });
})();

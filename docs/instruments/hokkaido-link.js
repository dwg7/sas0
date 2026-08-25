(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.hokkaidoLink) || {};

  SAS0.registerInstrument({
    key: 'hokkaido-link',
    name: config.title || '北海道',
    parentKey: 'hokkaido',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkCard(container, {
        title: config.title,
        description: config.description,
        url: config.url
      });
    }
  });
})();

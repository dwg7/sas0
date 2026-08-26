(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.hokkaidoBousaiPortal) || {};

  SAS0.registerInstrument({
    key: 'hokkaido-bousai-portal',
    name: config.title || '北海道防災ポータル',
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

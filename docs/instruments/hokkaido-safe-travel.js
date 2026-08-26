(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.hokkaidoSafeTravel) || {};

  SAS0.registerInstrument({
    key: 'hokkaido-safe-travel',
    name: config.title || '北海道 旅の安全情報',
    parentKey: 'unyukyoku',
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

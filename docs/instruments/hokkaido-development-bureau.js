(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.hokkaidoDevelopmentBureau) || {};

  SAS0.registerInstrument({
    key: 'hokkaido-development-bureau',
    name: config.title || '防災情報ポータルサイト',
    parentKey: 'kaihatsukyoku',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkList(container, {
        groups: [{ items: [{ title: config.title, description: config.description, url: config.url }] }]
      });
    }
  });
})();

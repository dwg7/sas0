(function () {
  const link = (window.SAS0_CONFIG && window.SAS0_CONFIG.hokkaidoLink) || {};
  const portal = (window.SAS0_CONFIG && window.SAS0_CONFIG.hokkaidoBousaiPortal) || {};

  SAS0.registerInstrument({
    key: 'hokkaido-links',
    name: '防災情報',
    parentKey: 'hokkaido',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkList(container, {
        groups: [
          {
            items: [
              { title: link.title, description: link.description, url: link.url },
              { title: portal.title, description: portal.description, url: portal.url }
            ]
          }
        ]
      });
    }
  });
})();

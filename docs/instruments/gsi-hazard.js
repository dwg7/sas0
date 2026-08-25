(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.gsiHazard) || {};

  SAS0.registerInstrument({
    key: 'gsi-hazard',
    name: config.title || 'ハザードマップポータル',
    parentKey: 'gsi',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderIframe(container, {
        src: config.url,
        title: config.title || 'ハザードマップポータル',
        sandbox: config.sandbox,
        allowedHosts: config.allowedHosts,
        className: 'sas0-hazard-frame'
      });
    }
  });
})();

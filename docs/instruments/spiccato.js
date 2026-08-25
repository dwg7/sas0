(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.spiccato) || {};
  const DEFAULT_HOSTS = ['dwg7.github.io'];

  SAS0.registerInstrument({
    key: 'spiccato',
    name: config.title || 'Spiccato',
    parentKey: 'root',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderIframe(container, {
        src: config.url,
        title: config.title || 'Spiccato',
        sandbox: config.sandbox,
        allowedHosts: config.allowedHosts || DEFAULT_HOSTS,
        className: 'sas0-spiccato-frame'
      });
    }
  });
})();

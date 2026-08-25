(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.weather) || {};
  const DEFAULT_HOSTS = ['www.jma.go.jp'];

  async function render(container) {
    const hosts = config.allowedHosts || DEFAULT_HOSTS;
    const listUrl = SAS0.getSafeUrl(config.listUrl, { allowedProtocols: ['https:'], allowedHosts: hosts });

    if (!listUrl) {
      return;
    }

    const response = await fetch(listUrl);
    const data = await response.json();
    const timeline = data && data.near && data.near.now;
    const latestFilename =
      Array.isArray(timeline) && timeline.length > 0 ? timeline[timeline.length - 1] : '';

    if (!latestFilename || typeof config.imageBaseUrl !== 'string') {
      return;
    }

    const imageUrl = SAS0.getSafeUrl(config.imageBaseUrl + latestFilename, {
      allowedProtocols: ['https:'],
      allowedHosts: hosts
    });

    container.innerHTML = '';

    const image = document.createElement('img');
    image.className = 'sas0-weather-image';
    image.alt = config.imageAlt || 'Latest surface weather chart';
    image.referrerPolicy = 'no-referrer';
    image.src = imageUrl;
    container.appendChild(image);

    const caption = document.createElement('p');
    caption.className = 'sas0-caption';
    const sourceUrl = SAS0.getSafeUrl(config.sourceUrl, { allowedProtocols: ['https:'], allowedHosts: hosts });
    if (config.sourceLabel && sourceUrl) {
      const link = document.createElement('a');
      link.href = sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = config.sourceLabel;
      caption.appendChild(link);
    } else {
      caption.textContent = config.sourceLabel || '';
    }
    container.appendChild(caption);
  }

  SAS0.registerInstrument({
    key: 'weather',
    name: config.title || "Today's Weather Chart",
    parentKey: 'jma',
    render
  });
})();

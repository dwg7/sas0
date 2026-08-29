(function () {
  const config = (window.SAS0_CONFIG && window.SAS0_CONFIG.weather) || {};
  const DEFAULT_HOSTS = ['www.jma.go.jp'];

  // JMA's list.json's near.now is itself a short time series of recent
  // chart filenames, not just "the latest one" — weather.js used to throw
  // away every entry but the last. This builds an image URL for an
  // arbitrary index into that same already-fetched array, so the scrubber
  // below needs no extra fetch.
  function buildImageUrl(filename, hosts) {
    if (!filename || typeof config.imageBaseUrl !== 'string') {
      return '';
    }
    return SAS0.getSafeUrl(config.imageBaseUrl + filename, { allowedProtocols: ['https:'], allowedHosts: hosts });
  }

  async function render(container) {
    const hosts = config.allowedHosts || DEFAULT_HOSTS;
    const listUrl = SAS0.getSafeUrl(config.listUrl, { allowedProtocols: ['https:'], allowedHosts: hosts });

    if (!listUrl) {
      return;
    }

    const response = await fetch(listUrl);
    const data = await response.json();
    const timeline = data && data.near && data.near.now;

    if (!Array.isArray(timeline) || timeline.length === 0) {
      return;
    }

    const latestIndex = timeline.length - 1;
    const imageUrl = buildImageUrl(timeline[latestIndex], hosts);
    if (!imageUrl) {
      return;
    }

    container.innerHTML = '';

    const image = document.createElement('img');
    image.className = 'sas0-weather-image';
    image.alt = config.imageAlt || '最新の天気図';
    image.referrerPolicy = 'no-referrer';
    image.src = imageUrl;
    container.appendChild(image);

    // A scrubber over the same already-fetched frames — defaults to the
    // latest frame (identical to the old fixed behavior) so this is purely
    // additive. Resets to latest on every autoRefresh tick rather than
    // trying to preserve scrub position across a fetch of possibly-shifted
    // filenames.
    if (timeline.length > 1) {
      const scrubWrap = document.createElement('div');
      scrubWrap.className = 'sas0-weather-scrub';

      const label = document.createElement('span');
      label.className = 'sas0-weather-scrub-label';
      label.textContent = `${latestIndex + 1} / ${timeline.length}（最新）`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'sas0-weather-scrub-slider';
      slider.min = '0';
      slider.max = String(latestIndex);
      slider.value = String(latestIndex);
      slider.addEventListener('input', () => {
        const index = Number(slider.value);
        const url = buildImageUrl(timeline[index], hosts);
        if (url) {
          image.src = url;
        }
        label.textContent = index === latestIndex ? `${index + 1} / ${timeline.length}（最新）` : `${index + 1} / ${timeline.length}`;
      });

      scrubWrap.appendChild(slider);
      scrubWrap.appendChild(label);
      container.appendChild(scrubWrap);
    }

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
    name: config.title || '天気図',
    parentKey: 'jma',
    render
  });
})();

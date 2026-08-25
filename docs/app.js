(function () {
  if (!window.openmct) {
    throw new Error('Open MCT failed to load');
  }

  const openmct = window.openmct;
  const config = window.SAS0_CONFIG || {};
  const weather = config.weather || {};
  const spiccato = config.spiccato || {};
  const defaultWeatherHosts = ['upload.wikimedia.org'];
  const defaultSpiccatoHosts = ['dwg7.github.io'];

  const NAMESPACE = 'sas0';
  const CONSOLE_IDENTIFIER = {
    namespace: NAMESPACE,
    key: 'console'
  };

  function getSafeUrl(value, options) {
    if (!value) {
      return '';
    }

    try {
      const parsed = new URL(value, window.location.href);
      const allowedProtocols = (options && options.allowedProtocols) || ['https:'];
      const allowedHosts = (options && options.allowedHosts) || [];

      if (!allowedProtocols.includes(parsed.protocol)) {
        return '';
      }

      if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
        return '';
      }

      return parsed.toString();
    } catch (error) {
      return '';
    }
  }

  function getSafeSandbox(value) {
    const defaultTokens = ['allow-scripts', 'allow-forms'];
    const allowedTokens = new Set(defaultTokens);
    const inputTokens = typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
    const safeTokens = inputTokens.filter((token) => allowedTokens.has(token));

    return (safeTokens.length > 0 ? safeTokens : defaultTokens).join(' ');
  }

  const openmctScript = document.querySelector('script[src*="openmct"]');
  if (openmctScript) {
    openmct.setAssetPath(openmctScript.src.replace(/openmct\.js(?:\?.*)?$/, ''));
  }
  openmct.install(openmct.plugins.LocalStorage());

  openmct.types.addType('sas0.console', {
    name: 'SAS0 Console',
    description: 'Minimal mission-console layout for public situational awareness',
    creatable: false
  });

  const consoleObject = {
    identifier: CONSOLE_IDENTIFIER,
    name: 'sas0',
    type: 'sas0.console'
  };

  openmct.objects.addRoot(CONSOLE_IDENTIFIER);
  openmct.objects.addProvider(NAMESPACE, {
    get(identifier) {
      if (identifier.key === CONSOLE_IDENTIFIER.key) {
        return Promise.resolve(consoleObject);
      }

      return Promise.reject(new Error('Unknown object'));
    }
  });

  openmct.objectViews.addProvider({
    key: 'sas0.console.view',
    name: 'SAS0 Console',
    canView(domainObject) {
      return domainObject.type === 'sas0.console';
    },
    view() {
      let root;

      return {
        show(element) {
          root = document.createElement('div');
          root.className = 'sas0-console';

          const weatherPanel = document.createElement('section');
          weatherPanel.className = 'sas0-panel';

          const weatherTitle = document.createElement('h2');
          weatherTitle.textContent = weather.title || "Today's Weather Chart";

          const weatherBody = document.createElement('div');
          weatherBody.className = 'sas0-panel-body';

          const weatherImage = document.createElement('img');
          weatherImage.className = 'sas0-weather-image';
          weatherImage.src = getSafeUrl(weather.imageUrl, {
            allowedProtocols: ['https:'],
            allowedHosts: weather.allowedHosts || defaultWeatherHosts
          });
          weatherImage.alt =
            weather.imageAlt || 'Daily synoptic weather chart placeholder image';
          weatherImage.referrerPolicy = 'no-referrer';

          weatherBody.appendChild(weatherImage);

          const weatherCaption = document.createElement('p');
          weatherCaption.className = 'sas0-caption';
          weatherCaption.textContent = weather.sourceLabel || '';

          weatherPanel.appendChild(weatherTitle);
          weatherPanel.appendChild(weatherBody);
          weatherPanel.appendChild(weatherCaption);

          const spiccatoPanel = document.createElement('section');
          spiccatoPanel.className = 'sas0-panel';

          const spiccatoTitle = document.createElement('h2');
          spiccatoTitle.textContent = spiccato.title || 'Spiccato';

          const spiccatoBody = document.createElement('div');
          spiccatoBody.className = 'sas0-panel-body';

          const spiccatoFrame = document.createElement('iframe');
          spiccatoFrame.className = 'sas0-spiccato-frame';
          spiccatoFrame.src =
            getSafeUrl(spiccato.url, {
              allowedProtocols: ['https:'],
              allowedHosts: spiccato.allowedHosts || defaultSpiccatoHosts
            }) || 'about:blank';
          spiccatoFrame.title = spiccato.title || 'Spiccato';
          spiccatoFrame.loading = 'lazy';
          spiccatoFrame.referrerPolicy = 'no-referrer';
          spiccatoFrame.sandbox = getSafeSandbox(spiccato.sandbox);

          spiccatoBody.appendChild(spiccatoFrame);

          spiccatoPanel.appendChild(spiccatoTitle);
          spiccatoPanel.appendChild(spiccatoBody);

          root.appendChild(weatherPanel);
          root.appendChild(spiccatoPanel);
          element.appendChild(root);
        },
        destroy() {
          if (root && root.parentNode) {
            root.parentNode.removeChild(root);
          }
        }
      };
    }
  });

  openmct.start();
})();

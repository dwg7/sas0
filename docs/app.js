(function () {
  const config = window.SAS0_CONFIG || {};
  const weather = config.weather || {};
  const spiccato = config.spiccato || {};

  const NAMESPACE = 'sas0';
  const CONSOLE_IDENTIFIER = {
    namespace: NAMESPACE,
    key: 'console'
  };

  openmct.setAssetPath('https://unpkg.com/openmct/dist/');
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

  openmct.objects.addRoot(consoleObject);
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
          weatherPanel.innerHTML = `
            <h2>${weather.title || "Today's Weather Chart"}</h2>
            <div class="sas0-panel-body">
              <img
                class="sas0-weather-image"
                src="${weather.imageUrl || ''}"
                alt="${weather.title || "Today's Weather Chart"}"
                referrerpolicy="no-referrer"
              />
            </div>
            <p class="sas0-caption">${weather.sourceLabel || ''}</p>
          `;

          const spiccatoPanel = document.createElement('section');
          spiccatoPanel.className = 'sas0-panel';
          spiccatoPanel.innerHTML = `
            <h2>${spiccato.title || 'Spiccato'}</h2>
            <div class="sas0-panel-body">
              <iframe
                class="sas0-spiccato-frame"
                src="${spiccato.url || ''}"
                title="${spiccato.title || 'Spiccato'}"
                loading="lazy"
              ></iframe>
            </div>
          `;

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

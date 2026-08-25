window.SAS0 = (function () {
  if (!window.openmct) {
    throw new Error('Open MCT failed to load');
  }

  const openmct = window.openmct;
  const NAMESPACE = 'sas0';
  const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

  const objectsByKey = new Map();
  const childrenByKey = new Map();

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
    const allowedTokens = new Set([...defaultTokens, 'allow-same-origin']);
    const inputTokens = typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
    const safeTokens = inputTokens.filter((token) => allowedTokens.has(token));

    return (safeTokens.length > 0 ? safeTokens : defaultTokens).join(' ');
  }

  function renderIframe(container, { src, title, sandbox, allowedHosts, className }) {
    const frame = document.createElement('iframe');
    frame.className = className || 'sas0-iframe';
    frame.src = getSafeUrl(src, { allowedProtocols: ['https:'], allowedHosts }) || 'about:blank';
    frame.title = title || '';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer';
    frame.sandbox = getSafeSandbox(sandbox);
    container.appendChild(frame);
  }

  function renderLinkCard(container, { title, description, url }) {
    const card = document.createElement('div');
    card.className = 'sas0-link-card';

    const heading = document.createElement('h2');
    heading.textContent = title || '';
    card.appendChild(heading);

    if (description) {
      const paragraph = document.createElement('p');
      paragraph.textContent = description;
      card.appendChild(paragraph);
    }

    const safeUrl = getSafeUrl(url, { allowedProtocols: ['https:'] });
    const link = document.createElement('a');
    link.className = 'sas0-link-card-button';
    link.href = safeUrl || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '新しいタブで開く';
    if (!safeUrl) {
      link.setAttribute('aria-disabled', 'true');
    }
    card.appendChild(link);

    container.appendChild(card);
  }

  function ensureChildBucket(key) {
    if (!childrenByKey.has(key)) {
      childrenByKey.set(key, []);
    }
    return childrenByKey.get(key);
  }

  function registerFolder({ key, name, parentKey }) {
    const identifier = { namespace: NAMESPACE, key };
    objectsByKey.set(key, { identifier, name, type: 'folder' });
    ensureChildBucket(key);
    if (parentKey) {
      ensureChildBucket(parentKey).push(identifier);
    }
    return key;
  }

  function startAutoRefresh(container, render) {
    let cancelled = false;
    const tick = () => {
      if (cancelled) {
        return;
      }
      Promise.resolve(render(container)).catch(() => {
        // Instruments are expected to render their own error/empty state;
        // a rejected render() just skips this tick rather than crashing.
      });
    };

    tick();
    const timer = setInterval(tick, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }

  function registerInstrument({ key, name, parentKey, render, autoRefresh = true }) {
    const identifier = { namespace: NAMESPACE, key };
    objectsByKey.set(key, { identifier, name, type: 'sas0.instrument' });
    if (parentKey) {
      ensureChildBucket(parentKey).push(identifier);
    }

    openmct.objectViews.addProvider({
      key: `sas0.view.${key}`,
      name,
      canView(domainObject) {
        return (
          domainObject.identifier.namespace === NAMESPACE && domainObject.identifier.key === key
        );
      },
      view() {
        let root;
        let stopRefresh;

        return {
          show(element) {
            root = document.createElement('div');
            root.className = 'sas0-instrument';
            element.appendChild(root);

            if (autoRefresh) {
              stopRefresh = startAutoRefresh(root, render);
            } else {
              Promise.resolve(render(root)).catch(() => {});
            }
          },
          destroy() {
            if (stopRefresh) {
              stopRefresh();
            }
            if (root && root.parentNode) {
              root.parentNode.removeChild(root);
            }
          }
        };
      }
    });
  }

  const openmctScript = document.querySelector('script[src*="openmct"]');
  if (openmctScript) {
    openmct.setAssetPath(openmctScript.src.replace(/openmct\.js(?:\?.*)?$/, ''));
  }
  openmct.install(openmct.plugins.LocalStorage());
  openmct.install(openmct.plugins.UTCTimeSystem());
  openmct.install(openmct.plugins.Espresso());

  openmct.types.addType('sas0.instrument', {
    name: '計器',
    description: '状況認識サービス0の単体表示項目',
    creatable: false
  });

  registerFolder({ key: 'root', name: '状況認識サービス0' });

  openmct.objects.addRoot({ namespace: NAMESPACE, key: 'root' });
  openmct.objects.addProvider(NAMESPACE, {
    get(identifier) {
      const domainObject = objectsByKey.get(identifier.key);
      return domainObject ? Promise.resolve(domainObject) : Promise.reject(new Error('Unknown object'));
    }
  });
  openmct.composition.addProvider({
    appliesTo(domainObject) {
      return (
        domainObject.identifier.namespace === NAMESPACE && childrenByKey.has(domainObject.identifier.key)
      );
    },
    load(domainObject) {
      return Promise.resolve(childrenByKey.get(domainObject.identifier.key) || []);
    }
  });

  return {
    registerFolder,
    registerInstrument,
    getSafeUrl,
    getSafeSandbox,
    renderIframe,
    renderLinkCard,
    start() {
      openmct.on('start', () => {
        openmct.router.setPath(`/browse/${NAMESPACE}:root`);
      });
      openmct.start('#app');
    }
  };
})();

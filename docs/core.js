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

  function renderLinkRow({ title, description, url, allowedProtocols }) {
    const row = document.createElement('div');
    row.className = 'sas0-link-row';

    const text = document.createElement('div');
    text.className = 'sas0-link-row-text';

    const heading = document.createElement('div');
    heading.className = 'sas0-link-row-title';
    heading.textContent = title || '';
    text.appendChild(heading);

    if (description) {
      const paragraph = document.createElement('div');
      paragraph.className = 'sas0-link-row-desc';
      paragraph.textContent = description;
      text.appendChild(paragraph);
    }

    row.appendChild(text);

    // Defaults to https-only (D7). A caller may pass an explicit narrower
    // allowlist (e.g. ['http:']) for a source with no HTTPS at all — see
    // kmoni.js / DECISIONS.md D19. Never widen this by default.
    const safeUrl = getSafeUrl(url, { allowedProtocols: allowedProtocols || ['https:'] });
    const link = document.createElement('a');
    link.className = 'sas0-link-row-action';
    link.href = safeUrl || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '開く ↗';
    if (!safeUrl) {
      link.setAttribute('aria-disabled', 'true');
    }
    row.appendChild(link);

    return row;
  }

  // groups: [{ heading?: string, items: [{ title, description, url, allowedProtocols? }] }]
  // A dense list of link rows, grouped under optional headings — the
  // space-efficient replacement for the old single-card-per-link layout
  // (DECISIONS.md D20). Used for every "occasional reference" instrument,
  // from a single external link (one group, one item) up to the full
  // grouped 市町村 list.
  function renderLinkList(container, { groups }) {
    (groups || []).forEach((group) => {
      if (group.heading) {
        const heading = document.createElement('h3');
        heading.className = 'sas0-link-list-heading';
        heading.textContent = group.heading;
        container.appendChild(heading);
      }

      const list = document.createElement('div');
      list.className = 'sas0-link-list';
      (group.items || []).forEach((item) => list.appendChild(renderLinkRow(item)));
      container.appendChild(list);
    });
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
        let cleanup;

        return {
          show(element) {
            root = document.createElement('div');
            root.className = 'sas0-instrument';
            element.appendChild(root);

            if (autoRefresh) {
              stopRefresh = startAutoRefresh(root, render);
            } else {
              // If render() returns a function, treat it as a teardown
              // callback and run it from destroy() below — needed for
              // stateful instruments (e.g. a MapLibre map) that hold
              // resources (WebGL contexts, timers) render() itself can't
              // release just by being garbage-collected. Existing
              // instruments return nothing, so this is additive.
              Promise.resolve(render(root))
                .then((result) => {
                  if (typeof result === 'function') {
                    cleanup = result;
                  }
                })
                .catch(() => {});
            }
          },
          destroy() {
            if (stopRefresh) {
              stopRefresh();
            }
            if (typeof cleanup === 'function') {
              try {
                cleanup();
              } catch (error) {
                // Best-effort teardown; a failing cleanup shouldn't block
                // the view from being removed.
              }
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
    renderLinkList,
    start() {
      openmct.on('start', () => {
        openmct.router.setPath(`/browse/${NAMESPACE}:root`);
      });
      openmct.start('#app');
    }
  };
})();

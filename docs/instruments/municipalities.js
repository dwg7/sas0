(function () {
  const municipalities = (window.SAS0_CONFIG && window.SAS0_CONFIG.municipalities) || [];

  municipalities.forEach((municipality) => {
    SAS0.registerInstrument({
      key: `municipality-${municipality.key}`,
      name: municipality.title,
      parentKey: municipality.folderKey,
      autoRefresh: false,
      render(container) {
        container.innerHTML = '';
        SAS0.renderLinkCard(container, {
          title: municipality.title,
          description: municipality.description,
          url: municipality.url
        });
      }
    });
  });
})();

(function () {
  const councils = (window.SAS0_CONFIG && window.SAS0_CONFIG.volcanoCouncils) || [];

  councils.forEach((volcano) => {
    SAS0.registerInstrument({
      key: `volcano-council-${volcano.key}`,
      name: volcano.title,
      parentKey: 'volcano-councils',
      autoRefresh: false,
      render(container) {
        container.innerHTML = '';
        SAS0.renderLinkCard(container, {
          title: volcano.title,
          description:
            volcano.description || `${volcano.title}の火山防災協議会に関する情報を新しいタブで開きます。`,
          url: volcano.url
        });
      }
    });
  });
})();

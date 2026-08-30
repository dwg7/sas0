(function () {
  const councils = (window.SAS0_CONFIG && window.SAS0_CONFIG.volcanoCouncils) || [];

  SAS0.registerInstrument({
    key: 'volcano-councils',
    name: '火山防災協議会',
    parentKey: 'reference',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      SAS0.renderLinkList(container, {
        groups: [
          {
            items: councils.map((volcano) => ({
              title: volcano.title,
              description:
                volcano.description || `${volcano.title}の火山防災協議会に関する情報を新しいタブで開きます。`,
              url: volcano.url
            }))
          }
        ]
      });
    }
  });
})();

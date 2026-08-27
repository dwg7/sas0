(function () {
  const municipalities = (window.SAS0_CONFIG && window.SAS0_CONFIG.municipalities) || [];

  // Display order/names for the 14 subprefectures — moved here from
  // folders.js when 市町村 stopped being a folder tree (DECISIONS.md D20).
  const REGIONS = [
    ['shien-ishikari', '石狩振興局'],
    ['shien-kushiro', '釧路総合振興局'],
    ['shien-oshima', '渡島総合振興局'],
    ['shien-hiyama', '檜山振興局'],
    ['shien-shiribeshi', '後志総合振興局'],
    ['shien-sorachi', '空知総合振興局'],
    ['shien-kamikawa', '上川総合振興局'],
    ['shien-rumoi', '留萌振興局'],
    ['shien-soya', '宗谷総合振興局'],
    ['shien-okhotsk', 'オホーツク総合振興局'],
    ['shien-iburi', '胆振総合振興局'],
    ['shien-hidaka', '日高振興局'],
    ['shien-tokachi', '十勝総合振興局'],
    ['shien-nemuro', '根室振興局']
  ];

  SAS0.registerInstrument({
    key: 'municipalities',
    name: '市町村',
    parentKey: 'root',
    autoRefresh: false,
    render(container) {
      container.innerHTML = '';
      const groups = REGIONS.map(([regionKey, heading]) => ({
        heading,
        items: municipalities.filter((m) => m.regionKey === regionKey)
      })).filter((group) => group.items.length > 0);
      SAS0.renderLinkList(container, { groups });
    }
  });
})();

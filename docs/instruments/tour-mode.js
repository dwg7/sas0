(function () {
  // 状況図・更新情報・天気図・警報・注意報・地震・火山・地震の規模推移を、
  // 現在のルート表示順（D55時点）のまま自動で切り替える。リンク集はフォルダ
  // なので対象外——単体表示できる計器のみを巡回する。D10の「計器ファイルは
  // 自己完結」に沿って、キー・名前をここで独自に持つ（core.js側に計器一覧を
  // 問い合わせるAPIは存在しないため、複製ではなく唯一の情報源）。
  const TOUR_TARGETS = [
    { key: 'hkd-map', name: '状況図' },
    { key: 'change-log', name: '更新情報' },
    { key: 'weather', name: '天気図' },
    { key: 'warnings', name: '警報・注意報' },
    { key: 'quake', name: '地震' },
    { key: 'volcano', name: '火山' },
    { key: 'quake-trend', name: '地震の規模推移' }
  ];

  const DEFAULT_INTERVAL_SEC = 15;
  const MIN_INTERVAL_SEC = 5;
  const SETTINGS_KEY = 'sas0.tourMode.settings.v1';

  // モジュールスコープに状態を持つ——巡回中は表示中の計器がこの計器自身から
  // 他の計器（状況図等）へ切り替わり、Open MCTがこのファイルのview/render を
  // 都度destroyするため、インターバルやオーバーレイをrender()のクロージャ内に
  // 置くと巡回2周目に消えてしまう。ページ自体はSPAでリロードされないので、
  // ここに置けば計器をまたいで生き続ける。
  let intervalHandle = null;
  let currentIndex = -1;
  let overlayEl = null;
  let activeTargets = null;
  let activeIntervalSec = DEFAULT_INTERVAL_SEC;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      // Safariプライベートモード等での例外は無視——設定は保存されないだけで、
      // 巡回モード自体の動作には影響しない。
    }
  }

  function isRunning() {
    return intervalHandle !== null;
  }

  // 自動tick・矢印キーでの手動送り、両方をここに集約する——JavaScriptの
  // `%`は負数を正にラップしない（`-1 % 5`は`-1`のまま）ため、後方（矢印
  // キー左）の遷移では単純な`% length`だけでは壊れる。`resetTimer`が
  // trueの時（手動操作時）は、直後に自動tickが割り込まないようタイマー
  // を仕切り直す。
  function goToIndex(newIndex, { resetTimer }) {
    const length = activeTargets.length;
    currentIndex = ((newIndex % length) + length) % length;
    const target = activeTargets[currentIndex];
    SAS0.navigateTo(target.key);
    if (overlayEl) {
      overlayEl.querySelector('.sas0-tour-overlay-label').textContent = `巡回中：${target.name}`;
    }
    if (resetTimer && intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = setInterval(() => goToIndex(currentIndex + 1, { resetTimer: false }), activeIntervalSec * 1000);
    }
  }

  function isEditableTarget(target) {
    if (!target) {
      return false;
    }
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  // 巡回中のみ矢印キーで前後に手動送りできる。入力欄にフォーカスがある
  // 間は素通しする——巡回対象の計器が検索欄等を持つ場合に備えた防御。
  document.addEventListener('keydown', (event) => {
    if (!isRunning() || isEditableTarget(event.target)) {
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToIndex(currentIndex + 1, { resetTimer: true });
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToIndex(currentIndex - 1, { resetTimer: true });
    }
  });

  function buildOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.className = 'sas0-tour-overlay';
    overlayEl.innerHTML =
      '<span class="sas0-tour-overlay-label"></span>' +
      '<button type="button" class="sas0-tour-overlay-stop">巡回モードを終了（Escでも終了できます）</button>';
    overlayEl.querySelector('.sas0-tour-overlay-stop').addEventListener('click', stopTour);
    document.body.appendChild(overlayEl);
  }

  function removeOverlay() {
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
    }
    overlayEl = null;
  }

  function startTour(targets, intervalSec) {
    if (isRunning() || targets.length === 0) {
      return;
    }
    activeTargets = targets;
    activeIntervalSec = intervalSec;
    document.body.classList.add('sas0-tour-active');
    if (document.documentElement.requestFullscreen) {
      // ボタンクリック（ユーザー操作）から呼ばれているので、ブラウザの
      // フルスクリーンAPIのユーザー操作要件は満たしている。対応していない
      // 環境や拒否された場合でも、巡回自体（画面切り替え）は続行する——
      // フルスクリーンはあくまで付加的な演出。
      document.documentElement.requestFullscreen().catch(() => {});
    }
    buildOverlay();
    currentIndex = -1;
    goToIndex(0, { resetTimer: false });
    intervalHandle = setInterval(() => goToIndex(currentIndex + 1, { resetTimer: false }), intervalSec * 1000);
  }

  function stopTour() {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
    document.body.classList.remove('sas0-tour-active');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    removeOverlay();
  }

  // ブラウザ標準のEscキーでのフルスクリーン解除も、巡回の停止として扱う——
  // 「フルスクリーンは終わったのに裏で画面が切り替わり続ける」という
  // 分かりにくい状態を作らないため。
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isRunning()) {
      stopTour();
    }
  });

  function render(container) {
    container.innerHTML = '';

    const heading = document.createElement('p');
    heading.className = 'sas0-tour-intro';
    heading.textContent =
      '選んだ計器を一定間隔で自動的に切り替えて、全画面で表示し続けます。壁掛けディスプレイでの常時表示や、定点監視での巡回チェックを想定しています。巡回中は←→キーで前後の計器に手動で移動でき、移動すると自動切り替えのタイマーもそこからやり直します。';
    container.appendChild(heading);

    if (isRunning()) {
      const runningNote = document.createElement('p');
      runningNote.className = 'sas0-tour-running-note';
      runningNote.textContent =
        '現在、巡回モードは実行中です。←→キーで前後の計器に手動移動できます。停止するには画面上のボタンか、Escキーを押してください。';
      container.appendChild(runningNote);
      const stopButton = document.createElement('button');
      stopButton.type = 'button';
      stopButton.className = 'sas0-tour-start-button';
      stopButton.textContent = '巡回モードを終了する';
      stopButton.addEventListener('click', stopTour);
      container.appendChild(stopButton);
      return;
    }

    const saved = loadSettings();
    const savedKeys = saved && Array.isArray(saved.targetKeys) ? new Set(saved.targetKeys) : null;
    const savedIntervalSec = saved && typeof saved.intervalSec === 'number' ? saved.intervalSec : DEFAULT_INTERVAL_SEC;

    const list = document.createElement('div');
    list.className = 'sas0-tour-target-list';
    const checkboxes = TOUR_TARGETS.map((target) => {
      const row = document.createElement('label');
      row.className = 'sas0-tour-target-row';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = savedKeys ? savedKeys.has(target.key) : true;
      checkbox.dataset.key = target.key;
      row.appendChild(checkbox);
      row.appendChild(document.createTextNode(target.name));
      list.appendChild(row);
      return checkbox;
    });
    container.appendChild(list);

    const intervalRow = document.createElement('label');
    intervalRow.className = 'sas0-tour-interval-row';
    intervalRow.textContent = '切り替え間隔（秒）：';
    const intervalInput = document.createElement('input');
    intervalInput.type = 'number';
    intervalInput.className = 'sas0-tour-interval-input';
    intervalInput.min = String(MIN_INTERVAL_SEC);
    intervalInput.step = '5';
    intervalInput.value = String(savedIntervalSec);
    intervalRow.appendChild(intervalInput);
    container.appendChild(intervalRow);

    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.className = 'sas0-tour-start-button';
    startButton.textContent = '巡回モードを開始する（全画面表示）';
    startButton.addEventListener('click', () => {
      const targets = TOUR_TARGETS.filter((target, index) => checkboxes[index].checked);
      const intervalSec = Math.max(MIN_INTERVAL_SEC, parseInt(intervalInput.value, 10) || DEFAULT_INTERVAL_SEC);
      if (targets.length === 0) {
        return;
      }
      saveSettings({ targetKeys: targets.map((target) => target.key), intervalSec });
      startTour(targets, intervalSec);
    });
    container.appendChild(startButton);
  }

  SAS0.registerInstrument({
    key: 'tour-mode',
    name: '巡回モード',
    parentKey: 'root',
    autoRefresh: false,
    render
  });
})();

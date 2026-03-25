/* eslint-disable no-undef */
(function () {
  'use strict';

  const DEV_URL = '__DEV_URL__';

  // 动态引入css
  function loadCSS() {
    try {
      const devOrigin = new URL(DEV_URL).origin;
      const DEV_CSS_URL = devOrigin + '/userscript.css';

      const existing = document.querySelector('link[data-tinygrail-dev-style="1"]');
      if (existing) {
        // 更新现有的css
        existing.href = DEV_CSS_URL + '?t=' + Date.now();
      } else {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = DEV_CSS_URL + '?t=' + Date.now();
        link.dataset.tinygrailDevStyle = '1';
        document.documentElement.appendChild(link);
      }
      console.log('[Dev Loader] CSS loaded');
    } catch (e) {
      console.warn('[Dev Loader] failed to load CSS', e);
    }
  }

  // 加载并执行脚本
  function loadScript() {
    console.log('[Dev Loader] fetching', DEV_URL);

    GM_xmlhttpRequest({
      method: 'GET',
      url: DEV_URL + '?t=' + Date.now(),
      onload: function (response) {
        if (response.status !== 200) {
          console.error('[Dev Loader] HTTP ' + response.status);
          return;
        }

        try {
          eval(response.responseText);
          console.log('[Dev Loader] bundle loaded');
        } catch (e) {
          console.error('[Dev Loader] eval error', e);
        }
      },
      onerror: function (err) {
        console.error('[Dev Loader] request error', err);
      },
    });
  }

  // 初始加载
  loadCSS();
  loadScript();
})();

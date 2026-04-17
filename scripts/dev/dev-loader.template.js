/* eslint-disable no-undef */
(function () {
  'use strict';

  const DEV_URL = '__DEV_URL__';

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
  loadScript();
})();

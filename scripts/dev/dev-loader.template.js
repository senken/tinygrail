/* eslint-disable no-undef */
(function () {
  'use strict';

  const DEV_URL = '__DEV_URL__';
  const CHECK_INTERVAL = 2000; // 每2秒检查一次
  let lastModified = null;

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

  // 清理旧的脚本内容
  function cleanup() {
    // 移除旧的tinygrail元素
    const oldElements = document.querySelectorAll('[id^="tg-"]');
    oldElements.forEach(el => {
      if (el.parentNode === document.body || el.parentNode === document.documentElement) {
        el.remove();
      }
    });

    // 移除旧的样式
    const oldStyles = document.querySelectorAll('style[id^="tg-"], style[id*="tinygrail"]');
    oldStyles.forEach(style => style.remove());

    console.log('[Dev Loader] Cleaned up old elements');
  }

  // 加载并执行脚本
  function loadScript(isReload = false) {
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
          if (isReload) {
            cleanup();
            loadCSS();
          }

          eval(response.responseText);
          console.log('[Dev Loader] bundle loaded');
          
          if (!isReload) {
            // 首次加载后启动自动刷新检测
            startAutoReload();
          }
        } catch (e) {
          console.error('[Dev Loader] eval error', e);
        }
      },
      onerror: function (err) {
        console.error('[Dev Loader] request error', err);
      },
    });
  }

  // 自动刷新功能
  function startAutoReload() {
    console.log('[Dev Loader] Hot reload enabled (experimental)');
    console.log('[Dev Loader] Tip: Some changes may require full page reload');
    
    let reloadTimeout;
    
    function checkForUpdates() {
      // 页面不可见时跳过检查
      if (document.hidden) return;
      
      GM_xmlhttpRequest({
        method: 'GET',
        url: DEV_URL + '?t=' + Date.now(),
        onload: function (response) {
          if (response.status !== 200) return;
          
          // 使用内容的简单哈希来检测变化
          const currentHash = simpleHash(response.responseText);
          
          if (lastModified === null) {
            lastModified = currentHash;
            return;
          }
          
          if (currentHash !== lastModified) {
            console.log('[Dev Loader] Changes detected, hot reloading...');
            lastModified = currentHash;
            
            // 防抖：延迟300ms执行，避免频繁更新
            clearTimeout(reloadTimeout);
            reloadTimeout = setTimeout(() => {
              try {
                loadScript(true);
                console.log('[Dev Loader] Hot reload successful');
              } catch (error) {
                console.error('[Dev Loader] Hot reload failed, full page reload required');
                location.reload();
              }
            }, 300);
          }
        },
        onerror: function () {
          // 静默失败，服务器可能暂时不可用
        }
      });
    }
    
    // 简单的哈希函数
    function simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash;
    }
    
    setInterval(checkForUpdates, CHECK_INTERVAL);
  }

  // 初始加载
  loadCSS();
  loadScript(false);
})();

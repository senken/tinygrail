/**
 * 简单的HMR客户端
 */

(function () {
  const HMR_PORT = 4173;
  const CHECK_INTERVAL = 1000; // 每秒检查一次
  let lastHash = null;

  // 检查更新
  async function checkUpdate() {
    try {
      const response = await fetch(`http://localhost:${HMR_PORT}/userscript.user.js?t=${Date.now()}`);
      const content = await response.text();
      
      // 计算简单的哈希
      const hash = simpleHash(content);
      
      if (lastHash === null) {
        lastHash = hash;
        console.log('[HMR] 🔥 Hot reload enabled');
        return;
      }
      
      if (hash !== lastHash) {
        console.log('[HMR] 🔄 Detected changes, reloading...');
        lastHash = hash;
        
        // 重新加载脚本
        try {
          // 清除旧的模块
          const oldScript = document.querySelector('script[data-hmr="true"]');
          if (oldScript) {
            oldScript.remove();
          }
          
          // 注入新的脚本
          const script = document.createElement('script');
          script.setAttribute('data-hmr', 'true');
          script.textContent = content;
          document.head.appendChild(script);
          
          console.log('[HMR] ✅ Updated successfully');
        } catch (error) {
          console.error('[HMR] ❌ Update failed:', error);
          // 如果热更新失败，刷新页面
          location.reload();
        }
      }
    } catch (error) {
      // 静默失败，可能是服务器未启动
    }
  }

  // 简单的哈希函数
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  // 开始轮询
  setInterval(checkUpdate, CHECK_INTERVAL);
  checkUpdate();
})();

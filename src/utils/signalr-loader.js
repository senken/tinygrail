/**
 * SignalR动态加载器
 */

const SIGNALR_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.7/signalr.min.js";

let signalRLoadPromise = null;
let signalRInstance = null;

/**
 * 动态加载SignalR库
 * @returns {Promise<Object>} SignalR对象
 */
export async function loadSignalR() {
  // 如果已经加载，直接返回
  if (signalRInstance) {
    return signalRInstance;
  }

  // 如果正在加载，返回现有的Promise
  if (signalRLoadPromise) {
    return signalRLoadPromise;
  }

  // 创建加载Promise
  signalRLoadPromise = (async () => {
    try {
      // 使用fetch获取脚本内容
      const response = await fetch(SIGNALR_CDN_URL);
      if (!response.ok) {
        throw new Error(`加载失败: ${response.status}`);
      }
      
      const scriptContent = await response.text();
      
      // 创建一个包装函数来捕获导出的对象
      const wrapper = `
        (function() {
          var exports = {};
          var module = { exports: exports };
          ${scriptContent}
          return module.exports || exports || window.signalR || window.SignalR;
        })()
      `;
      
      // 执行脚本并获取返回值
      const signalR = eval(wrapper);
      
      if (!signalR || !signalR.HubConnectionBuilder) {
        throw new Error("SignalR对象无效");
      }
      
      signalRInstance = signalR;
      return signalR;
      
    } catch (error) {
      signalRLoadPromise = null; // 重置以便重试
      console.error("SignalR加载失败:", error);
      throw error;
    }
  })();

  return signalRLoadPromise;
}

/**
 * 创建SignalR Hub连接
 * @param {string} url - Hub URL
 * @param {Object} options - 连接选项
 * @returns {Promise<Object>} Hub连接对象
 */
export async function createHubConnection(url, options = {}) {
  const signalR = await loadSignalR();

  const builder = new signalR.HubConnectionBuilder().withUrl(url);

  // 默认启用自动重连
  if (options.automaticReconnect !== false) {
    builder.withAutomaticReconnect();
  }

  return builder.build();
}

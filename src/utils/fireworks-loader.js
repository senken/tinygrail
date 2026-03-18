/**
 * Fireworks动态加载器
 */

const FIREWORKS_CDN_URL = "https://cdn.jsdelivr.net/npm/fireworks-js@2.10.8/dist/index.umd.js";

let fireworksLoadPromise = null;
let fireworksInstance = null;

/**
 * 动态加载Fireworks库
 * @returns {Promise<Object>} Fireworks对象
 */
export async function loadFireworks() {
  // 如果已经加载，直接返回
  if (fireworksInstance) {
    return fireworksInstance;
  }

  // 如果正在加载，返回现有的Promise
  if (fireworksLoadPromise) {
    return fireworksLoadPromise;
  }

  // 创建加载Promise
  fireworksLoadPromise = (async () => {
    try {
      // 使用fetch获取脚本内容
      const response = await fetch(FIREWORKS_CDN_URL);
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
          return module.exports || exports || window.Fireworks;
        })()
      `;
      
      // 执行脚本并获取返回值
      const Fireworks = eval(wrapper);
      
      if (!Fireworks || !Fireworks.Fireworks) {
        throw new Error("Fireworks对象无效");
      }
      
      fireworksInstance = Fireworks;
      return Fireworks;
      
    } catch (error) {
      fireworksLoadPromise = null; // 重置以便重试
      console.error("Fireworks加载失败:", error);
      throw error;
    }
  })();

  return fireworksLoadPromise;
}

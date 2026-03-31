/**
 * Fireworks动态加载器
 */

const FIREWORKS_CDN_URLS = [
  "https://unpkg.com/fireworks-js@2.10.8/dist/index.umd.js",
  "https://cdn.jsdelivr.net/npm/fireworks-js@2.10.8/dist/index.umd.js",
];

let fireworksLoadPromise = null;
let fireworksInstance = null;

/**
 * 尝试从指定URL加载Fireworks
 * @param {string} url - CDN URL
 * @returns {Promise<Object>} Fireworks对象
 */
async function tryLoadFromUrl(url) {
  const response = await fetch(url);
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

  return Fireworks;
}

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
    // 同时从所有CDN加载，使用加载速度最快的那个
    const loadPromises = FIREWORKS_CDN_URLS.map(async (url) => {
      try {
        const Fireworks = await tryLoadFromUrl(url);
        return { success: true, Fireworks, url };
      } catch (error) {
        return { success: false, error, url };
      }
    });

    // 使用Promise.allSettled等待所有请求完成
    const results = await Promise.allSettled(loadPromises);

    // 找到第一个成功的结果
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        fireworksInstance = result.value.Fireworks;
        return result.value.Fireworks;
      }
    }

    // 所有CDN都失败
    fireworksLoadPromise = null; // 重置以便重试
    console.error("Fireworks加载失败");
    throw new Error("Fireworks加载失败: 所有CDN都不可用");
  })();

  return fireworksLoadPromise;
}

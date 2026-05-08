/**
 * ECharts动态加载器
 */

const ECHARTS_CDN_URLS = [
  "https://mange.cn/js/echarts.min.js",
];

let echartsLoadPromise = null;
let echartsInstance = null;

/**
 * 尝试从指定URL加载ECharts
 * @param {string} url - CDN URL
 * @returns {Promise<Object>} ECharts对象
 */
async function tryLoadFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`加载失败: ${response.status}`);
  }

  const scriptContent = await response.text();

  // 执行脚本
  eval(scriptContent);

  // 检查window.echarts是否存在
  if (!window.echarts) {
    throw new Error("ECharts对象未找到");
  }

  return window.echarts;
}

/**
 * 动态加载ECharts库
 * @returns {Promise<Object>} ECharts对象
 */
export async function loadECharts() {
  // 如果已经加载，直接返回
  if (echartsInstance) {
    return echartsInstance;
  }

  // 如果window.echarts已存在，直接返回
  if (window.echarts) {
    echartsInstance = window.echarts;
    return window.echarts;
  }

  // 如果正在加载，返回现有的Promise
  if (echartsLoadPromise) {
    return echartsLoadPromise;
  }

  // 创建加载Promise
  echartsLoadPromise = (async () => {
    // 依次尝试每个CDN
    for (const url of ECHARTS_CDN_URLS) {
      try {
        const echarts = await tryLoadFromUrl(url);
        console.log(`ECharts loaded from: ${url}`);
        echartsInstance = echarts;
        return echarts;
      } catch (error) {
        console.warn(`Failed to load ECharts from ${url}:`, error);
        continue;
      }
    }

    // 所有CDN都失败
    echartsLoadPromise = null; // 重置以便重试
    console.error("ECharts加载失败: 所有CDN都不可用");
    throw new Error("ECharts加载失败: 所有CDN都不可用");
  })();

  return echartsLoadPromise;
}

/**
 * MD5动态加载器
 */

const MD5_CDN_URL = "https://mange.cn/js/md5.min.js";

let md5LoadPromise = null;
let md5Function = null;

/**
 * 动态加载MD5库
 * @returns {Promise<Function>} MD5函数
 */
export async function loadMD5() {
  // 如果已经加载，直接返回
  if (md5Function) {
    return md5Function;
  }

  // 如果正在加载，返回现有的Promise
  if (md5LoadPromise) {
    return md5LoadPromise;
  }

  // 创建加载Promise
  md5LoadPromise = (async () => {
    try {
      // 使用fetch获取脚本内容
      const response = await fetch(MD5_CDN_URL);
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
          return module.exports || exports.md5 || window.md5 || md5;
        })()
      `;
      
      // 执行脚本并获取返回值
      const md5 = eval(wrapper);
      
      if (typeof md5 !== 'function') {
        throw new Error("MD5函数无效");
      }
      
      md5Function = md5;
      return md5;
      
    } catch (error) {
      md5LoadPromise = null; // 重置以便重试
      console.error("MD5加载失败:", error);
      throw error;
    }
  })();

  return md5LoadPromise;
}

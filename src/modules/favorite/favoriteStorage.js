/**
 * 收藏夹localStorage管理工具
 */

const STORAGE_KEY = "tinygrail:favorites";

/**
 * 从 localStorage获取收藏夹列表
 * @returns {Array} 收藏夹列表
 */
export function getFavorites() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("获取收藏夹失败:", e);
    return [];
  }
}

/**
 * 保存收藏夹列表到localStorage
 * @param {Array} favorites - 收藏夹列表
 */
export function saveFavorites(favorites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error("保存收藏夹失败:", e);
  }
}

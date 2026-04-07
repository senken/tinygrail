/**
 * 收藏夹localStorage管理工具
 */

const STORAGE_KEY = "tinygrail:favorites";

/**
 * 从localStorage获取收藏夹列表
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

/**
 * 获取可见的收藏夹
 * @param {Array} favorites - 收藏夹列表
 * @param {number} userId - 用户ID
 * @returns {Array} 过滤并排序后的收藏夹列表
 */
export function getVisibleFavorites(favorites, userId) {
  return favorites
    .filter((f) => !f.deleted && f.userId === userId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * 重新索引指定用户的收藏夹order
 * @param {Array} favorites - 收藏夹列表
 * @param {number} userId - 用户ID
 * @returns {Array} 重新索引后的收藏夹列表
 */
export function reindexFavorites(favorites, userId) {
  // 获取指定用户未删除的收藏夹并排序
  const userFavorites = favorites.filter(f => !f.deleted && f.userId === userId);
  userFavorites.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // 重新分配order
  userFavorites.forEach((f, index) => {
    f.order = index;
  });
  
  return favorites;
}

/**
 * 获取当前用户的可见收藏夹
 * @param {number} userId - 用户ID
 * @returns {Array} 过滤并排序后的收藏夹列表
 */
export function getUserFavorites(userId) {
  const favorites = getFavorites();
  return getVisibleFavorites(favorites, userId);
}

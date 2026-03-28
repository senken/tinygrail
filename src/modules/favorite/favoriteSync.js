/**
 * 收藏夹云同步管理
 */

import { getFavorites, saveFavorites } from "./favoriteStorage.js";

const CLOUD_KEY = "tinygrail_favorites";

/**
 * 从云端获取收藏夹数据
 * @returns {Array|null} 云端收藏夹列表，如果不存在返回null
 */
export function getCloudFavorites() {
  try {
    if (!chiiApp?.cloud_settings) {
      console.warn("云服务不可用");
      return null;
    }

    const cloudDataStr = chiiApp.cloud_settings.get(CLOUD_KEY);

    if (!cloudDataStr) {
      return null;
    }

    const cloudData = JSON.parse(cloudDataStr);
    return cloudData;
  } catch (e) {
    console.error("获取云端收藏夹失败:", e);
    return null;
  }
}

/**
 * 上传收藏夹数据到云端
 * @param {Array} favorites - 收藏夹列表
 */
export function uploadToCloud(favorites) {
  try {
    if (!chiiApp?.cloud_settings) {
      console.warn("云服务不可用");
      return false;
    }

    const favoritesStr = JSON.stringify(favorites);

    // 上传到云端
    chiiApp.cloud_settings.update({
      [CLOUD_KEY]: favoritesStr,
    });
    chiiApp.cloud_settings.save();

    return true;
  } catch (e) {
    console.error("上传收藏夹到云端失败:", e);
    return false;
  }
}

/**
 * 合并本地和云端的收藏夹数据（基于时间戳）
 * @param {Array} localFavorites - 本地收藏夹列表
 * @param {Array} cloudFavorites - 云端收藏夹列表
 * @returns {Object} { merged: 合并后的列表, hasChanges: 是否有变化 }
 */
function mergeFavorites(localFavorites, cloudFavorites) {
  if (!cloudFavorites || cloudFavorites.length === 0) {
    return { merged: localFavorites, hasChanges: false };
  }

  if (!localFavorites || localFavorites.length === 0) {
    return { merged: cloudFavorites, hasChanges: true };
  }

  // 创建ID到收藏夹的映射
  const localMap = new Map(localFavorites.map((f) => [f.id, f]));
  const cloudMap = new Map(cloudFavorites.map((f) => [f.id, f]));

  // 获取所有的ID
  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);

  const merged = [];
  let hasChanges = false;

  allIds.forEach((id) => {
    const localFav = localMap.get(id);
    const cloudFav = cloudMap.get(id);

    if (!localFav) {
      // 只有云端有数据
      merged.push(cloudFav);
      hasChanges = true;
    } else if (!cloudFav) {
      // 只有本地有数据
      merged.push(localFav);
    } else {
      // 两边都有数据，比较时间戳
      const localTime = localFav.updatedAt || localFav.createdAt || 0;
      const cloudTime = cloudFav.updatedAt || cloudFav.createdAt || 0;

      if (cloudTime > localTime) {
        // 云端更新
        merged.push(cloudFav);
        hasChanges = true;
      } else {
        // 本地更新
        merged.push(localFav);
      }
    }
  });

  // 按order字段排序
  merged.sort((a, b) => (a.order || 0) - (b.order || 0));

  return { merged, hasChanges };
}

/**
 * 从云端同步收藏夹到本地
 * @returns {Array} 合并后的收藏夹列表
 */
export function syncFromCloud() {
  try {
    const cloudFavorites = getCloudFavorites();
    const localFavorites = getFavorites();

    if (!cloudFavorites) {
      return localFavorites;
    }

    const { merged, hasChanges } = mergeFavorites(localFavorites, cloudFavorites);

    if (hasChanges) {
      saveFavorites(merged);
    }

    return merged;
  } catch (e) {
    console.error("从云端同步收藏夹失败:", e);
    return getFavorites();
  }
}

/**
 * 上传本地收藏夹到云端
 * @returns {boolean} 是否上传成功
 */
export function syncToCloud() {
  try {
    const localFavorites = getFavorites();
    return uploadToCloud(localFavorites);
  } catch (e) {
    console.error("上传收藏夹到云端失败:", e);
    return false;
  }
}

/**
 * 双向同步
 * @returns {boolean} 是否有更新
 */
export function syncBidirectional() {
  try {
    const cloudFavorites = getCloudFavorites();
    const localFavorites = getFavorites();

    if (!cloudFavorites) {
      // 云端无数据，直接上传本地
      uploadToCloud(localFavorites);
      return false;
    }

    const { merged, hasChanges } = mergeFavorites(localFavorites, cloudFavorites);

    if (hasChanges) {
      // 有变化，保存到本地并上传到云端
      saveFavorites(merged);
      uploadToCloud(merged);
      return true;
    }

    return false;
  } catch (e) {
    console.error("双向同步收藏夹失败:", e);
    return false;
  }
}

/**
 * 检查云服务是否可用
 * @returns {boolean}
 */
export function isCloudAvailable() {
  return !!chiiApp?.cloud_settings;
}

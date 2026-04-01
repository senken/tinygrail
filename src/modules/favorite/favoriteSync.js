/**
 * 收藏夹云同步管理
 */

import { getCachedUserAssets } from "@src/utils/session.js";
import { getFavorites, saveFavorites } from "./favoriteStorage.js";

const CLOUD_KEY = "tinygrail_favorites";
const RETENTION_DAYS = 90; // 保留90天

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

    // 上传前清理超过保留期的已删除项
    const cleaned = cleanupDeletedFavorites(favorites);

    const favoritesStr = JSON.stringify(cleaned);

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
 * 清理超过保留期的已删除收藏夹
 * @param {Array} favorites - 收藏夹列表
 * @returns {Array} 清理后的列表
 */
function cleanupDeletedFavorites(favorites) {
  const retentionTime = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return favorites.filter((fav) => {
    // 如果没有删除标记，保留
    if (!fav.deleted) {
      return true;
    }

    // 如果已删除，检查是否超过保留期
    const deletedAt = fav.deletedAt || fav.updatedAt || 0;
    const age = now - deletedAt;

    // 超过保留期，彻底删除
    return age < retentionTime;
  });
}

/**
 * 合并本地和云端的收藏夹数据（基于时间戳，支持软删除）
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
      // 只有本地有数据，检查本地数据是否超过保留期未修改
      const localTime = localFav.updatedAt || localFav.createdAt || 0;
      const age = Date.now() - localTime;
      const retentionTime = RETENTION_DAYS * 24 * 60 * 60 * 1000;

      if (age >= retentionTime) {
        // 本地数据超过保留期未修改，直接丢弃
        hasChanges = true;
      } else {
        // 本地数据未超过保留期，保留
        merged.push(localFav);
      }
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

  // 清理超过保留期的已删除项
  const cleaned = cleanupDeletedFavorites(merged);

  // 按order字段排序
  cleaned.sort((a, b) => (a.order || 0) - (b.order || 0));

  return { merged: cleaned, hasChanges };
}

/**
 * 从云端同步收藏夹到本地
 * @returns {Array} 合并后的收藏夹列表（过滤掉已删除的）
 */
export function syncFromCloud() {
  try {
    const cloudFavorites = getCloudFavorites();
    const localFavorites = getFavorites();
    const userAssets = getCachedUserAssets();
    const currentUserId = userAssets?.id;

    if (!cloudFavorites) {
      // 云端无数据，但本地有数据，上传到云端
      if (localFavorites && localFavorites.length > 0) {
        uploadToCloud(localFavorites);
      }
      return localFavorites.filter((f) => !f.deleted && f.userId === currentUserId);
    }

    const { merged, hasChanges } = mergeFavorites(localFavorites, cloudFavorites);

    if (hasChanges) {
      saveFavorites(merged);
    }

    // 返回时过滤掉已删除的收藏夹个不属于当前用户的收藏夹
    return merged.filter((f) => !f.deleted && f.userId === currentUserId);
  } catch (e) {
    const userAssets = getCachedUserAssets();
    const currentUserId = userAssets?.id;
    console.error("从云端同步收藏夹失败:", e);
    return getFavorites().filter((f) => !f.deleted && f.userId === currentUserId);
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

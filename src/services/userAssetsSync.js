import { getUserAssets } from "@src/api/user.js";
import { USER_CARD_STORE_KEY } from "@src/modules/rakuen-home/user-card/constants.js";
import { getUserTinygrailStoreKeys } from "@src/modules/user-tinygrail/constants.js";
import { getCachedUserAssets, performBangumiAuth } from "@src/utils/session.js";
import { setStoreState } from "@src/utils/store.js";

/**
 * 判断是否正在请求当前登录用户资产
 *
 * @param {string} username 用户名
 * @returns {boolean} 是否为当前登录用户
 */
function isCurrentUserAssetsRequest(username) {
  const cachedUserAssets = getCachedUserAssets();
  return !username || cachedUserAssets?.name === username;
}

/**
 * 缓存当前登录用户资产
 *
 * @param {Object} userAssets 用户资产数据
 */
function cacheCurrentUserAssets(userAssets) {
  try {
    localStorage.setItem("tinygrail:user-assets", JSON.stringify(userAssets));
  } catch (error) {
    console.warn("缓存用户资产失败:", error);
  }
}

/**
 * 同步当前登录用户关联组件状态
 *
 * @param {Object} userAssets 用户资产数据
 */
function syncCurrentUserAssets(userAssets) {
  setStoreState(USER_CARD_STORE_KEY, {
    authorized: true,
    ...userAssets,
  });

  getUserTinygrailStoreKeys(userAssets.name).forEach((storeKey) => {
    setStoreState(storeKey, userAssets);
  });
}

/**
 * 缓存并同步当前登录用户资产
 *
 * @param {Object} userAssets 用户资产数据
 */
function cacheAndSyncCurrentUserAssets(userAssets) {
  cacheCurrentUserAssets(userAssets);
  syncCurrentUserAssets(userAssets);
}

/**
 * 执行当前登录用户授权失败处理
 */
function handleCurrentUserAuthFailure() {
  performBangumiAuth(async () => {
    const result = await getUserAssets();
    if (result.success) {
      cacheAndSyncCurrentUserAssets(result.data);
    }
  });
}

/**
 * 获取用户资产并同步当前登录用户状态
 *
 * @param {string} username 用户名
 * @returns {Promise<Object>} 用户资产信息
 */
export async function getUserAssetsWithSync(username) {
  const isCurrentUserRequest = isCurrentUserAssetsRequest(username);
  const result = await getUserAssets(username);

  if (!result.success) {
    if (isCurrentUserRequest) {
      handleCurrentUserAuthFailure();
    }
    return result;
  }

  if (isCurrentUserRequest) {
    cacheAndSyncCurrentUserAssets(result.data);
  }

  return result;
}

import { getStorageItem, removeStorageItem, setStorageItem } from "./storage.js";

const ACCESS_TOKEN_STORAGE_KEY = "access-token";

/**
 * 获取当前站点保存的TinyGrail访问令牌
 * @returns {string|null} 访问令牌，未授权时返回null
 */
export function getAccessToken() {
  return getStorageItem(ACCESS_TOKEN_STORAGE_KEY);
}

/**
 * 校验并保存授权窗口返回的访问令牌
 * @param {string} token 访问令牌
 * @returns {boolean} 是否成功保存
 */
export function setAccessToken(token) {
  if (typeof token !== "string" || !token.trim() || /[\r\n]/.test(token)) {
    return false;
  }

  return setStorageItem(ACCESS_TOKEN_STORAGE_KEY, token.trim());
}

/**
 * 清除当前站点保存的访问令牌
 * @returns {boolean} 是否成功清除
 */
export function clearAccessToken() {
  return removeStorageItem(ACCESS_TOKEN_STORAGE_KEY);
}

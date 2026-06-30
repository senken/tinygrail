const STORAGE_KEY_PREFIX = "tinygrail:";

/**
 * 获取完整localStorage缓存键
 *
 * @param {string} key 缓存键
 * @returns {string} 完整缓存键
 */
function getStorageKey(key) {
  if (typeof key !== "string" || key === "") {
    throw new TypeError("storage key不能为空");
  }

  return key.startsWith(STORAGE_KEY_PREFIX) ? key : `${STORAGE_KEY_PREFIX}${key}`;
}

/**
 * 获取localStorage字符串值
 *
 * @param {string} key 缓存键
 * @param {*} fallbackValue 读取失败时的默认值
 * @returns {*}
 */
export function getStorageItem(key, fallbackValue = null) {
  const storageKey = getStorageKey(key);

  try {
    const value = localStorage.getItem(storageKey);
    return value == null ? fallbackValue : value;
  } catch (error) {
    console.warn("读取localStorage失败:", error);
    return fallbackValue;
  }
}

/**
 * 设置localStorage字符串值
 *
 * @param {string} key 缓存键
 * @param {string} value 缓存值
 * @returns {boolean} 是否设置成功
 */
export function setStorageItem(key, value) {
  const storageKey = getStorageKey(key);

  try {
    localStorage.setItem(storageKey, value);
    return true;
  } catch (error) {
    console.warn("写入localStorage失败:", error);
    return false;
  }
}

/**
 * 删除localStorage值
 *
 * @param {string} key 缓存键
 * @returns {boolean} 是否删除成功
 */
export function removeStorageItem(key) {
  const storageKey = getStorageKey(key);

  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.warn("删除localStorage失败:", error);
    return false;
  }
}

/**
 * 获取localStorageJSON值
 *
 * @param {string} key 缓存键
 * @param {*} fallbackValue 读取失败时的默认值
 * @returns {*}
 */
export function getJsonStorageItem(key, fallbackValue = null) {
  const value = getStorageItem(key);
  if (value == null) {
    return cloneFallbackValue(fallbackValue);
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("解析localStorageJSON失败:", error);
    return cloneFallbackValue(fallbackValue);
  }
}

/**
 * 设置localStorageJSON值
 *
 * @param {string} key 缓存键
 * @param {*} value 缓存值
 * @returns {boolean} 是否设置成功
 */
export function setJsonStorageItem(key, value) {
  try {
    return setStorageItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("序列化localStorageJSON失败:", error);
    return false;
  }
}

/**
 * 克隆默认值
 *
 * @param {*} fallbackValue 默认值
 * @returns {*}
 */
function cloneFallbackValue(fallbackValue) {
  if (Array.isArray(fallbackValue)) {
    return [...fallbackValue];
  }

  if (fallbackValue != null && typeof fallbackValue === "object") {
    return { ...fallbackValue };
  }

  return fallbackValue;
}

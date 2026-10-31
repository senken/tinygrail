import { getAccessToken } from "./authToken.js";

const baseURL = "https://tinygrail.com/api/";

/**
 * 获取完整的请求URL
 * @param {string} url - 相对URL
 * @returns {string} 完整URL
 */
function getFullURL(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return baseURL + url;
}

/**
 * 合并请求选项，仅向TinyGrail API附加访问令牌
 * @param {string} url 请求地址
 * @param {Object} options 自定义请求选项
 * @returns {Object} 同时支持Cookie和访问令牌的请求选项
 */
function createRequestOptions(url, options) {
  const requestURL = new URL(getFullURL(options.url ?? url));
  const headers = { ...options.headers };

  // 公共请求工具也用于Bangumi API，令牌只能发送到TinyGrail API
  if (requestURL.origin === "https://tinygrail.com" && requestURL.pathname.startsWith("/api/")) {
    const token = getAccessToken();
    if (token) {
      headers["x-access-token"] = token;
    }
  }

  return {
    ...options,
    url: requestURL.href,
    headers,
    xhrFields: { withCredentials: true, ...options.xhrFields },
  };
}

/**
 * GET请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求参数
 * @param {object} options - 其他选项
 * @returns {Promise}
 */
export function get(url, data = {}, options = {}) {
  return $.ajax({
    type: "GET",
    data,
    dataType: "json",
    ...createRequestOptions(url, options),
  });
}

/**
 * POST请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求数据
 * @param {object} options - 其他选项
 * @returns {Promise}
 */
export function post(url, data = {}, options = {}) {
  return $.ajax({
    type: "POST",
    data: JSON.stringify(data),
    contentType: "application/json",
    dataType: "json",
    ...createRequestOptions(url, options),
  });
}

export default { get, post };

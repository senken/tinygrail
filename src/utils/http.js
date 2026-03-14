let baseURL = 'https://tinygrail.com/api/';

/**
 * 获取完整的请求URL
 * @param {string} url - 相对URL
 * @returns {string} 完整URL
 */
function getFullURL(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return baseURL + url;
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
    url: getFullURL(url),
    type: 'GET',
    data,
    dataType: 'json',
    xhrFields: { withCredentials: true },
    ...options
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
    url: getFullURL(url),
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
    dataType: 'json',
    xhrFields: { withCredentials: true },
    ...options
  });
}

export default { get, post };

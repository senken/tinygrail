/**
 * 转义 HTML 特殊字符
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeHtml(str) {
  if (!str) return "";

  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 反转义 HTML 实体
 * @param {string} str - 需要反转义的字符串
 * @returns {string} 反转义后的字符串
 */
export function unescapeHtml(str) {
  if (!str) return "";

  const div = document.createElement("div");
  div.innerHTML = str;
  return div.textContent || div.innerText || "";
}

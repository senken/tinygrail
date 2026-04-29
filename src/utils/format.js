/**
 * 格式化数字
 * @param {number} num - 需要格式化的数字
 * @param {number} decimals - 保留的小数位数
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num, decimals = 2) {
  if (num == null || isNaN(num)) return "0";

  // 转换为数字并保留小数位
  const number = Number(num).toFixed(decimals);

  // 分离整数和小数部分
  const [integer, decimal] = number.split(".");

  // 添加千分位分隔符
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // 移除小数部分末尾的0
  if (decimal) {
    const trimmedDecimal = decimal.replace(/0+$/, "");
    return trimmedDecimal ? `${formattedInteger}.${trimmedDecimal}` : formattedInteger;
  }

  return formattedInteger;
}

/**
 * 格式化货币
 * @param {number} amount - 金额
 * @param {string} symbol - 货币符号
 * @param {number} decimals - 保留的小数位数
 * @param {boolean} abbreviate - 是否启用缩略
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(amount, symbol = "₵", decimals = 2, abbreviate = true) {
  if (amount == null || isNaN(amount)) return `${symbol}0`;

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  // 不启用缩略，直接格式化
  if (!abbreviate) {
    return `${sign}${symbol}${formatNumber(absAmount, decimals)}`;
  }

  // 亿元
  if (absAmount >= 100000000) {
    const value = absAmount / 100000000;
    return `${sign}${symbol}${formatNumber(value, decimals)}e`;
  }

  // 万元
  if (absAmount >= 10000) {
    const value = absAmount / 10000;
    return `${sign}${symbol}${formatNumber(value, decimals)}w`;
  }

  // 小于1万
  return `${sign}${symbol}${formatNumber(absAmount, decimals)}`;
}

/**
 * 格式化日期时间
 * @param {string|Date} dateStr - 日期字符串或日期对象
 * @param {string} format - 日期格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(dateStr, format = "YYYY-MM-DD HH:mm:ss") {
  if (!dateStr) return "";
  const localOffset = new Date().getTimezoneOffset();
  const serverOffset = -8 * 60; // 服务器是UTC+8
  const correctedTime = new Date(dateStr) - (localOffset - serverOffset) * 60 * 1000;
  const date = new Date(correctedTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * 计算剩余时间
 * @param {string|Date} endTime - 结束时间
 * @returns {string} 剩余时间字符串
 */
export function formatRemainingTime(endTime) {
  const now = new Date();
  const localOffset = new Date().getTimezoneOffset();
  const serverOffset = -8 * 60; // 服务器是UTC+8
  const end = new Date(endTime) - (localOffset - serverOffset) * 60 * 1000;
  const diff = end - now;

  // 已结束
  if (diff <= 0) {
    return "已结束";
  }

  const hours = diff / (1000 * 60 * 60);
  const days = diff / (1000 * 60 * 60 * 24);

  // 大于一天
  if (days >= 1) {
    return `剩余 ${Math.floor(days)} 天`;
  }

  // 大于12小时
  if (hours >= 12) {
    return `剩余 ${Math.floor(hours)} 小时`;
  }

  // 小于12小时
  return "即将结束";
}

/**
 * 格式化相对时间
 * @param {string|Date} dateTime - 日期时间
 * @returns {string} 相对时间字符串
 */
export function formatTimeAgo(dateTime) {
  if (!dateTime) return "";

  const now = new Date();
  const localOffset = new Date().getTimezoneOffset();
  const serverOffset = -8 * 60; // 服务器是UTC+8
  const past = new Date(dateTime) - (localOffset - serverOffset) * 60 * 1000;
  const diff = now - past;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 365) {
    return "years ago";
  }

  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return `${seconds}s ago`;
}

/**
 * 计算时间差
 * @param {string|Date} timeStr - 时间字符串或日期对象
 * @returns {number} 时间差（毫秒）
 */
export function getTimeDiff(timeStr) {
  const now = new Date();
  const localOffset = new Date().getTimezoneOffset();
  const serverOffset = -8 * 60; // 服务器是UTC+8
  const time = new Date(timeStr) - (localOffset - serverOffset) * 60 * 1000;
  return now - time;
}

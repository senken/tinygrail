// CDN地址
const CDN = "https://tinygrail.mange.cn/";
// OOS地址
const OSS_URL = "https://tinygrail.oss-cn-hangzhou.aliyuncs.com/";

/**
 * 获取圣殿图片URL
 * @param {string} cover - 原始URL
 * @param {('small'|'large')} size - 尺寸
 * @returns {string} 处理后URL
 */
export function getCover(cover, size = "large") {
  if (!cover) return "";

  const width = size === "small" ? "150" : "480";

  if (cover.includes("/crt/")) {
    if (size === "large" && cover.includes("/crt/m/")) {
      return cover.replace("/m/", "/l/");
    }
    if (size === "small" && cover.includes("/crt/g/")) {
      return cover.replace("/g/", "/m/");
    }
    return cover;
  }

  // 转换OOS的URL
  if (cover.startsWith(OSS_URL)) {
    return `${CDN}${cover.substring(OSS_URL.length)}!w${width}`;
  }

  // 转换相对路径的URL
  if (cover.startsWith("/cover")) {
    return `${CDN}${cover}!w${width}`;
  }

  // 处理//开头的URL
  if (cover.startsWith("//")) {
    return `https:${cover}`;
  }

  return cover;
}

/**
 * 获取大尺寸圣殿图片（480px）
 * @param {string} cover - 原始URL
 * @returns {string} 处理后的URL
 */
export function getLargeCover(cover) {
  return getCover(cover, "large");
}

/**
 * 获取小尺寸圣殿图片（150px）
 * @param {string} cover - 原始URL
 * @returns {string} 处理后的URL
 */
export function getSmallCover(cover) {
  return getCover(cover, "small");
}

/**
 * 标准化头像URL
 * @param {string} avatar - 原始头像URL
 * @returns {string} 处理后的头像URL
 */
export function normalizeAvatar(avatar) {
  if (!avatar) return "//lain.bgm.tv/pic/user/l/icon.jpg";

  // 转换OSS的URL
  if (avatar.startsWith(OSS_URL)) {
    return `${CDN}${avatar.substring(OSS_URL.length)}!w120`;
  }

  // 转换相对路径的URL
  if (avatar.startsWith("/avatar")) {
    return `${CDN}${avatar}!w120`;
  }

  // 将http://替换为//
  const normalized = avatar.replace("http://", "//");

  return normalized;
}

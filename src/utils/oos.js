// CDN地址
const CDN = "https://tinygrail.mange.cn/";
// OOS地址
const OSS_URL = "https://tinygrail.oss-cn-hangzhou.aliyuncs.com/";

/**
 * 判断封面是否为GIF，兼容旧缩略图后缀和查询参数
 * @param {string} cover 封面地址
 * @returns {boolean} 是否为GIF封面
 */
export function isGifCover(cover) {
  return typeof cover === "string" && /\.gif(?:!w\d+)?(?:[?#]|$)/i.test(cover);
}

/**
 * 获取圣殿图片URL，GIF始终使用原图，由封面组件控制播放
 * @param {string} cover - 原始URL
 * @param {('small'|'large')} size - 尺寸
 * @returns {string} 处理后URL
 */
export function getCover(cover, size = "large") {
  if (!cover) return "";

  const useOriginalGif = isGifCover(cover);
  if (useOriginalGif) {
    cover = cover.replace(/(\.gif)!w\d+(?=[?#]|$)/i, "$1");
  }
  const width = size === "small" ? "150" : "480";
  const suffix = useOriginalGif ? "" : `!w${width}`;

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
    return `${CDN}${cover.substring(OSS_URL.length)}${suffix}`;
  }

  // 转换相对路径的URL
  if (cover.startsWith("/cover")) {
    return `${CDN}${cover}${suffix}`;
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

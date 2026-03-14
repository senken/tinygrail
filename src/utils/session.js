import { getBangumiBonus } from "@src/api/event.js";

/**
 * 获取缓存的用户资产数据
 * @returns {Object|null} 用户资产数据，如果没有缓存则返回null
 */
export function getCachedUserAssets() {
  try {
    const cachedUserAssets = localStorage.getItem("tinygrail:user-assets");
    if (cachedUserAssets) {
      return JSON.parse(cachedUserAssets);
    }
    return null;
  } catch (error) {
    console.warn("读取缓存的用户资产失败:", error);
    return null;
  }
}

/**
 * 执行Bangumi授权登录
 * @param {Function} onSuccess - 授权成功后的回调函数
 * @returns {Promise<void>}
 */
export function performBangumiAuth(onSuccess) {
  return new Promise((resolve) => {
    // 监听授权完成消息
    const messageHandler = (e) => {
      if (e.data === "reloadEditBox") {
        // 移除事件监听器
        window.removeEventListener("message", messageHandler);

        // 获取奖励
        getBangumiBonus().then((result) => {
          if (result.success && result.message) {
            alert(result.message);
          }
          if (onSuccess) {
            onSuccess();
          }
          resolve();
        });
      }
    };

    window.addEventListener("message", messageHandler);

    // 打开授权页面
    const loginUrl =
      "https://bgm.tv/oauth/authorize?response_type=code&client_id=bgm2525b0e4c7d93fec&redirect_uri=https%3A%2F%2Ftinygrail.com%2Fapi%2Faccount%2Fcallback";
    window.open(loginUrl);
  });
}

/**
 * 判断当前用户是否为GM(GameMaster)
 * @returns {boolean} 如果是GM返回true，否则返回false
 */
export function isGameMaster() {
  const userAssets = getCachedUserAssets();
  if (!userAssets) {
    return false;
  }
  return userAssets.Type >= 999 || userAssets.Id === 702;
}

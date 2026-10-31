import { getBangumiBonus } from "@src/api/event.js";
import { clearAccessToken, setAccessToken } from "./authToken.js";
import { openAlertModal } from "./modalManager";
import { showWarning } from "./toastManager.jsx";

// 授权窗口最多等待5分钟，避免窗口关闭后永久保留消息监听
const AUTH_TIMEOUT_MS = 5 * 60 * 1000;

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
 * 在用户点击后执行Bangumi授权登录，关闭窗口或失败后允许再次尝试
 * @param {Function} onSuccess - 授权成功后的回调函数
 * @returns {Promise<void>}
 */
export async function performBangumiAuth(onSuccess) {
  const authorized = await new Promise((resolve) => {
    let authWindow = null;

    /**
     * 结束本次授权等待并清理消息监听和超时任务
     * @param {boolean} success 是否完成授权
     * @returns {void}
     */
    const finish = (success) => {
      window.removeEventListener("message", messageHandler);
      window.clearTimeout(timeoutId);
      window.clearInterval(closeCheckId);
      resolve(success);
    };

    /**
     * 接收本次授权窗口的令牌或Cookie授权完成消息
     * @param {MessageEvent} event 授权回调消息
     * @returns {void}
     */
    const messageHandler = (event) => {
      if (event.origin !== "https://tinygrail.com" || !authWindow || event.source !== authWindow) {
        return;
      }

      if (event.data && typeof event.data === "object" && "tinygrail_token" in event.data) {
        if (!setAccessToken(event.data.tinygrail_token)) {
          showWarning("保存登录凭据失败，请检查浏览器存储设置后重试");
          finish(false);
          return;
        }

        // 先保存令牌，再获取奖励和刷新资产，后续reloadEditBox不再重复处理
        finish(true);
      } else if (event.data === "reloadEditBox") {
        // 仅返回旧消息时使用Cookie授权，避免沿用其他会话的令牌
        clearAccessToken();
        finish(true);
      }
    };

    const timeoutId = window.setTimeout(() => {
      finish(false);
      showWarning("授权等待超时，请重新登录");
    }, AUTH_TIMEOUT_MS);

    // 用户关闭授权窗口时结束等待，让授权按钮恢复可点击状态
    const closeCheckId = window.setInterval(() => {
      if (authWindow?.closed) finish(false);
    }, 500);

    window.addEventListener("message", messageHandler);

    // 保留授权窗口引用，用于校验回调来源
    try {
      const loginUrl =
        "https://bgm.tv/oauth/authorize?response_type=code&client_id=bgm2525b0e4c7d93fec&redirect_uri=https%3A%2F%2Ftinygrail.com%2Fapi%2Faccount%2Fcallback";
      authWindow = window.open(loginUrl);
    } catch (error) {
      console.warn("打开授权窗口失败");
    }

    if (!authWindow) {
      finish(false);
      showWarning("无法打开授权窗口，请允许弹出窗口后重试");
    }
  });

  if (!authorized) {
    return;
  }

  const result = await getBangumiBonus();
  if (result.success && result.message) {
    openAlertModal({ message: result.message });
  }
  if (typeof onSuccess === "function") {
    await onSuccess();
  }
}

/**
 * 判断当前用户是否为GM
 * @returns {boolean} 如果是GM返回true，否则返回false
 */
export function isGameMaster() {
  const userAssets = getCachedUserAssets();
  if (!userAssets) {
    return false;
  }

  return userAssets.type >= 999 || userAssets.id === 702;
}

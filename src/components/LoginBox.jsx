import { performBangumiAuth } from "@src/utils/session.js";
import { showError } from "@src/utils/toastManager.jsx";

/**
 * 显示手动授权入口，容器外观由调用方维护，授权后只刷新仍挂载的内容
 * @param {Object} props 组件配置
 * @param {Function} props.onLogin 授权后的数据加载函数
 * @returns {HTMLElement} 授权提示和按钮
 */
export function LoginBox({ onLogin }) {
  let pending = false;
  const button = (
    <button
      type="button"
      className="bgm-bg min-h-8 min-w-20 shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90"
    >
      授权登录
    </button>
  );
  const container = (
    <div className="flex flex-wrap items-center gap-2 p-3">
      <span className="mr-auto min-w-0 max-w-full break-words text-sm font-medium opacity-80">
        点击授权登录，开启「小圣杯」最萌大战！
      </span>
      {button}
    </div>
  );

  /**
   * 在用户点击时打开授权窗口，避免重复点击并恢复失败后的按钮
   * @returns {Promise<void>} 授权和刷新结束
   */
  const handleLogin = async () => {
    if (pending) return;
    pending = true;
    button.disabled = true;
    button.textContent = "授权中...";
    try {
      await performBangumiAuth(async () => {
        if (container.isConnected) await onLogin();
      });
    } catch (error) {
      showError("授权或刷新失败，请重试");
    } finally {
      pending = false;
      button.disabled = false;
      button.textContent = "授权登录";
    }
  };

  button.addEventListener("click", handleLogin);
  return container;
}

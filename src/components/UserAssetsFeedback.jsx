import { LoginBox } from "./LoginBox.jsx";
import { showError } from "@src/utils/toastManager.jsx";

/**
 * 根据用户资产失败类型显示授权入口或手动重试
 * @param {Object} props 组件配置
 * @param {Object} props.result 用户资产请求失败结果
 * @param {Function} props.onRetry 重新加载当前页面或弹窗的函数
 * @returns {HTMLElement} 授权提示或失败提示
 */
export function UserAssetsFeedback({ result, onRetry }) {
  if (result.unauthorized) {
    return <LoginBox onLogin={onRetry} />;
  }

  const button = <button type="button" className="btn btn-sm">重试</button>;
  /**
   * 重试当前内容并在请求结束后恢复按钮
   * @returns {Promise<void>} 重试结束
   */
  const handleRetry = async () => {
    if (button.disabled) return;
    button.disabled = true;
    try {
      await onRetry();
    } catch (error) {
      showError("加载失败，请重试");
    } finally {
      button.disabled = false;
    }
  };
  button.addEventListener("click", handleRetry);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-4 text-sm">
      <span>{result.message || "加载用户资产失败"}</span>
      {button}
    </div>
  );
}

/**
 * Toast管理器
 */

import { XIcon, CircleAlertIcon, CircleCheckIcon, TriangleAlertIcon } from "@src/icons";

// 存储所有toast实例
const toasts = new Map();

// 全局toast容器
let globalToastContainer = null;

/**
 * 获取当前应该添加toast的容器
 * 如果有打开的弹窗，返回最顶层弹窗的容器，否则返回全局容器
 */
function getToastContainer() {
  // 检查是否有打开的dialog弹窗
  const openDialogs = document.querySelectorAll("dialog[open]");
  
  if (openDialogs.length > 0) {
    // 获取最顶层的dialog
    const topDialog = openDialogs[openDialogs.length - 1];
    
    // 在dialog内查找或创建toast容器
    let dialogToastContainer = topDialog.querySelector(".tg-toast-in-modal");
    
    if (!dialogToastContainer) {
      dialogToastContainer = (
        <div className="tg-toast-in-modal pointer-events-none absolute right-4 top-4 z-10 flex flex-col gap-3" />
      );
      
      // 鼠标悬浮在容器上时暂停所有toast
      dialogToastContainer.addEventListener("mouseenter", () => {
        toasts.forEach((toast) => {
          if (toast.timer) {
            clearTimeout(toast.timer);
            toast.timer = null;
            toast.isPaused = true;
          }
        });
      });

      // 鼠标离开容器时恢复所有toast
      dialogToastContainer.addEventListener("mouseleave", () => {
        toasts.forEach((toast) => {
          if (toast.isPaused && toast.duration > 0) {
            toast.timer = setTimeout(() => {
              closeToast(toast.id);
            }, toast.duration);
            toast.isPaused = false;
          }
        });
      });
      
      topDialog.appendChild(dialogToastContainer);
    }
    
    return dialogToastContainer;
  }
  
  // 没有弹窗，返回全局容器
  return getGlobalToastContainer();
}

/**
 * 获取或创建全局toast容器
 */
function getGlobalToastContainer() {
  if (!globalToastContainer || !document.body.contains(globalToastContainer)) {
    // 创建外层tinygrail容器
    const outerContainer = <div id="tg-toast-outer" className="tinygrail" />;

    // 创建内层容器
    globalToastContainer = (
      <div
        id="tg-toast-container"
        className="pointer-events-none fixed right-4 top-4 z-[99999] flex flex-col gap-3"
      />
    );

    // 鼠标悬浮在容器上时暂停所有toast
    outerContainer.addEventListener("mouseenter", () => {
      toasts.forEach((toast) => {
        if (toast.timer) {
          clearTimeout(toast.timer);
          toast.timer = null;
          toast.isPaused = true;
        }
      });
    });

    // 鼠标离开容器时恢复所有toast
    outerContainer.addEventListener("mouseleave", () => {
      toasts.forEach((toast) => {
        if (toast.isPaused && toast.duration > 0) {
          toast.timer = setTimeout(() => {
            closeToast(toast.id);
          }, toast.duration);
          toast.isPaused = false;
        }
      });
    });

    outerContainer.appendChild(globalToastContainer);
    document.body.appendChild(outerContainer);
  }
  return globalToastContainer;
}

/**
 * 显示Toast消息
 * @param {Object} options - 配置选项
 * @param {string} options.message - 消息内容
 * @param {string} options.type - 消息类型：'success' | 'error' | 'warning' | 'info'（默认info）
 * @param {number} options.duration - 显示时长（毫秒，默认3000，0表示不自动关闭）
 * @param {Function} options.onClose - 关闭回调
 * @returns {string} Toast ID
 */
export function showToast(options = {}) {
  const { message, type = "info", duration = 3000, onClose } = options;

  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 根据类型设置文字颜色和图标
  const typeTextColor = {
    success: "text-success",
    error: "text-error",
    warning: "text-warning",
    info: "text-base-content",
  };

  const typeIcon = {
    success: CircleCheckIcon,
    error: CircleAlertIcon,
    warning: TriangleAlertIcon,
    info: CircleAlertIcon,
  };

  const textColorClass = typeTextColor[type] || typeTextColor.info;
  const IconComponent = typeIcon[type] || typeIcon.info;

  // 创建toast元素
  const toast = (
    <div
      className={`card pointer-events-auto w-80 translate-x-full transform bg-base-100 opacity-0 shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out`}
    >
      <div className="card-body relative p-4">
        <div className="flex items-center gap-3">
          <IconComponent className={`h-4 w-4 flex-shrink-0 ${textColorClass}`} />
          <p className={`text-sm font-medium leading-4 ${textColorClass} flex-1 pr-6`}>{message}</p>
        </div>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content opacity-50 transition-opacity hover:opacity-100"
          onClick={() => closeToast(toastId)}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // 获取容器并添加toast
  const container = getToastContainer();
  container.appendChild(toast);

  // 触发滑入动画
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove("opacity-0", "translate-x-full");
      toast.classList.add("opacity-100", "translate-x-0");
    });
  });

  // 保存实例
  const toastInstance = {
    id: toastId,
    element: toast,
    onClose,
    timer: null,
    isPaused: false,
    duration: duration, // 保存duration用于恢复
  };

  toasts.set(toastId, toastInstance);

  // 如果设置了持续时间，自动关闭
  if (duration > 0) {
    toastInstance.timer = setTimeout(() => {
      closeToast(toastId);
    }, duration);
  }

  return toastId;
}

/**
 * 关闭指定Toast
 * @param {string} id - Toast ID
 */
export function closeToast(id) {
  const toast = toasts.get(id);
  if (!toast) return;

  // 清除定时器
  if (toast.timer) {
    clearTimeout(toast.timer);
  }

  // 添加滑出动画
  toast.element.classList.remove("opacity-100", "translate-x-0");
  toast.element.classList.add("opacity-0", "translate-x-full");

  // 等待动画完成后移除
  setTimeout(() => {
    // 调用关闭回调
    if (toast.onClose) {
      toast.onClose();
    }

    // 移除元素
    toast.element.remove();

    // 从Map中删除
    toasts.delete(id);
  }, 300);
}

/**
 * 关闭所有Toast
 */
export function closeAllToasts() {
  const ids = Array.from(toasts.keys());
  ids.forEach((id) => closeToast(id));
}

/**
 * 显示成功消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒，默认3000）
 * @returns {string} Toast ID
 */
export function showSuccess(message, duration = 3000) {
  return showToast({ message, type: "success", duration });
}

/**
 * 显示错误消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒，默认3000）
 * @returns {string} Toast ID
 */
export function showError(message, duration = 3000) {
  return showToast({ message, type: "error", duration });
}

/**
 * 显示警告消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒，默认3000）
 * @returns {string} Toast ID
 */
export function showWarning(message, duration = 3000) {
  return showToast({ message, type: "warning", duration });
}

/**
 * 显示信息消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒，默认3000）
 * @returns {string} Toast ID
 */
export function showInfo(message, duration = 3000) {
  return showToast({ message, type: "info", duration });
}

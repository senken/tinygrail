/**
 * 弹窗管理器
 */

import { XIcon } from "@src/icons";

// 存储所有弹窗实例
const modals = new Map();

// 全局tinygrail容器
let globalTinygrailContainer = null;

/**
 * 获取或创建全局tinygrail容器
 */
function getGlobalTinygrailContainer() {
  if (!globalTinygrailContainer || !document.body.contains(globalTinygrailContainer)) {
    globalTinygrailContainer = document.createElement("div");
    globalTinygrailContainer.id = "tg-modal-container";
    globalTinygrailContainer.className = "tinygrail";
    document.body.appendChild(globalTinygrailContainer);
  }
  return globalTinygrailContainer;
}

/**
 * 创建并打开弹窗
 * @param {string} id - 弹窗唯一标识
 * @param {Object} options - 弹窗配置
 * @param {HTMLElement|Function} options.content - 弹窗内容
 * @param {string|HTMLElement} options.title - 弹窗标题
 * @param {string} options.titleClassName - 标题额外类名
 * @param {string} options.contentClassName - 内容容器类名
 * @param {HTMLElement|Function} options.footer - 底栏内容
 * @param {boolean} options.showCloseButton - 是否显示关闭按钮
 * @param {boolean} options.borderless - 无边框模式（默认false）
 * @param {boolean} options.closeOnBackdropClick - 点击遮罩是否关闭弹窗（默认true）
 * @param {Function} options.onClose - 关闭回调
 * @param {string} options.size - 弹窗大小：'sm' | 'md' | 'lg' | 'xl' | 'full' | 'fit'（默认md）
 * @param {string} options.position - 弹窗位置：'middle' | 'bottom' | 'top' | 'responsive'（默认middle）
 * @param {Object} options.modalBoxProps - modalBox div 的额外属性（如 id, className, dataset 等）
 * @returns {Object} 弹窗控制对象
 */
export function openModal(id, options = {}) {
  const {
    content,
    title,
    titleClassName = "",
    contentClassName = "",
    footer,
    showCloseButton = true,
    borderless = false,
    closeOnBackdropClick = true,
    onClose,
    size = "md",
    position = "responsive",
    modalBoxProps = {},
  } = options;

  // 如果没有传入contentClassName且有标题，自动添加上边距
  let finalContentClassName = contentClassName;
  if (!contentClassName && title) {
    finalContentClassName = "mt-4";
  }

  // 如果弹窗已存在，先关闭
  if (modals.has(id)) {
    closeModal(id);
  }

  // 创建dialog元素
  const dialog = document.createElement("dialog");
  dialog.id = "tg-modal";

  // 根据position设置class
  const positionClass =
    {
      middle: "modal modal-middle",
      bottom: "modal modal-bottom",
      top: "modal modal-top",
      responsive: "modal modal-bottom sm:modal-middle",
    }[position] || "modal modal-bottom sm:modal-middle";

  dialog.className = positionClass + " overflow-hidden";

  // 创建弹窗盒子
  const modalBox = document.createElement("div");

  // 应用外部传入的modalBoxProps
  if (modalBoxProps.id) {
    modalBox.id = modalBoxProps.id;
  }
  if (modalBoxProps.dataset) {
    Object.entries(modalBoxProps.dataset).forEach(([key, value]) => {
      modalBox.dataset[key] = value;
    });
  }

  // 根据position和size确定类名
  let sizeClass;
  if (position === "responsive") {
    sizeClass =
      {
        sm: "modal-box max-w-full sm:max-w-sm",
        md: "modal-box max-w-full sm:max-w-lg",
        lg: "modal-box max-w-full sm:max-w-2xl",
        xl: "modal-box max-w-full sm:max-w-4xl",
        full: "modal-box max-w-full w-11/12",
        fit: "modal-box max-w-full sm:w-auto",
      }[size] || "modal-box max-w-full sm:max-w-lg";
  } else {
    sizeClass =
      {
        sm: "modal-box max-w-sm",
        md: "modal-box max-w-lg",
        lg: "modal-box max-w-2xl",
        xl: "modal-box max-w-4xl",
        full: "modal-box max-w-full w-11/12",
        fit: "modal-box w-auto",
      }[size] || "modal-box max-w-lg";
  }

  // 检查是否在iframe内部
  const isInIframe = window.self !== window.top;

  // 如果是bottom或responsive位置，且在iframe内部，添加底部内边距
  const paddingClass =
    (position === "bottom" || position === "responsive") && isInIframe ? " pb-12 sm:pb-6" : "";

  // 根据borderless设置类名
  if (borderless) {
    // 无边框模式
    modalBox.className = "modal-box max-w-full w-auto flex flex-col p-0";
  } else {
    modalBox.className = sizeClass + paddingClass + " flex flex-col overflow-hidden";
  }

  // 如果外部传入了额外的className，追加到现有className
  if (modalBoxProps.className) {
    modalBox.className += " " + modalBoxProps.className;
  }

  // 添加关闭按钮
  if (showCloseButton) {
    const closeForm = document.createElement("form");
    closeForm.method = "dialog";

    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10";
    closeBtn.onclick = () => closeModal(id);
    closeBtn.appendChild(XIcon({ className: "h-4 w-4" }));

    closeForm.appendChild(closeBtn);
    modalBox.appendChild(closeForm);
  }

  // 添加标题
  if (title) {
    if (typeof title === "string") {
      // 纯文字标题，使用h3标签和样式
      const titleEl = document.createElement("h3");
      titleEl.className = `text-lg font-bold${titleClassName ? " " + titleClassName : ""}`;
      titleEl.textContent = title;
      modalBox.appendChild(titleEl);
    } else {
      // HTMLElement或函数返回的元素，直接添加
      let titleNode = null;
      if (typeof title === "function") {
        titleNode = title();
      } else if (title instanceof HTMLElement) {
        titleNode = title;
      }

      if (titleNode) {
        modalBox.appendChild(titleNode);
      }
    }
  }

  // 添加内容
  const contentContainer = document.createElement("div");
  contentContainer.className = `${finalContentClassName} overflow-y-auto flex-1 min-h-12`;
  if (typeof content === "function") {
    const contentNode = content();
    if (contentNode) {
      contentContainer.appendChild(contentNode);
    }
  } else if (content instanceof HTMLElement) {
    contentContainer.appendChild(content);
  } else if (typeof content === "string") {
    contentContainer.innerHTML = content;
  }
  modalBox.appendChild(contentContainer);

  // 添加底栏
  if (footer) {
    const footerContainer = document.createElement("div");
    footerContainer.className = "border-t border-base-300 p-4";
    if (typeof footer === "function") {
      const footerNode = footer();
      if (footerNode) {
        footerContainer.appendChild(footerNode);
      }
    } else if (footer instanceof HTMLElement) {
      footerContainer.appendChild(footer);
    } else if (typeof footer === "string") {
      footerContainer.innerHTML = footer;
    }
    modalBox.appendChild(footerContainer);
  }

  dialog.appendChild(modalBox);

  // 创建背景遮罩
  const backdrop = document.createElement("form");
  backdrop.method = "dialog";
  backdrop.className = "modal-backdrop";
  const backdropBtn = document.createElement("button");
  backdropBtn.type = "button";
  backdropBtn.className = "cursor-default";
  backdropBtn.textContent = "close";
  // 根据closeOnBackdropClick决定是否关闭弹窗
  if (closeOnBackdropClick) {
    backdropBtn.onclick = () => closeModal(id);
  } else {
    backdropBtn.onclick = (e) => e.preventDefault();
  }
  backdrop.appendChild(backdropBtn);
  dialog.appendChild(backdrop);

  // 获取全局tinygrail容器并添加dialog
  const container = getGlobalTinygrailContainer();
  container.appendChild(dialog);

  // 打开弹窗
  dialog.showModal();

  // 保存弹窗实例
  const modalInstance = {
    id,
    dialog,
    modalBox,
    contentContainer,
    onClose,
  };
  modals.set(id, modalInstance);

  return {
    close: () => closeModal(id),
    bringToFront: () => bringToFront(id),
    updateContent: (newContent) => updateContent(id, newContent),
  };
}

/**
 * 关闭弹窗
 * @param {string} id - 弹窗ID
 */
export function closeModal(id) {
  const modal = modals.get(id);
  if (!modal) return;

  // 调用关闭回调
  if (modal.onClose) {
    modal.onClose();
  }

  // 关闭并移除dialog
  modal.dialog.close();
  modal.dialog.remove();

  // 从Map中删除
  modals.delete(id);
}

/**
 * 关闭所有弹窗
 */
export function closeAllModals() {
  const ids = Array.from(modals.keys());
  ids.forEach((id) => closeModal(id));
}

/**
 * 将弹窗置顶
 * @param {string} id - 弹窗ID
 */
export function bringToFront(id) {
  const modal = modals.get(id);
  if (!modal) return;

  // 重新插入到容器末尾
  const container = getGlobalTinygrailContainer();
  container.appendChild(modal.dialog);
}

/**
 * 更新弹窗内容
 * @param {string} id - 弹窗ID
 * @param {HTMLElement|Function|string} newContent - 新内容
 */
export function updateContent(id, newContent) {
  const modal = modals.get(id);
  if (!modal) return;

  // 清空现有内容
  modal.contentContainer.innerHTML = "";

  // 添加新内容
  if (typeof newContent === "function") {
    const contentNode = newContent();
    if (contentNode) {
      modal.contentContainer.appendChild(contentNode);
    }
  } else if (newContent instanceof HTMLElement) {
    modal.contentContainer.appendChild(newContent);
  } else if (typeof newContent === "string") {
    modal.contentContainer.innerHTML = newContent;
  }
}

/**
 * 检查弹窗是否打开
 * @param {string} id - 弹窗 ID
 * @returns {boolean}
 */
export function isModalOpen(id) {
  return modals.has(id);
}

/**
 * 获取所有打开的弹窗ID
 * @returns {string[]}
 */
export function getOpenModals() {
  return Array.from(modals.keys());
}

/**
 * 获取所有弹窗实例
 * @returns {Map}
 */
export function getAllModals() {
  return modals;
}

/**
 * 打开确认对话框
 * @param {Object} options - 配置选项
 * @param {string} options.title - 标题（默认"确认"）
 * @param {string} options.message - 提示消息
 * @param {string} options.confirmText - 确认按钮文字（默认"确定"）
 * @param {string} options.cancelText - 取消按钮文字（默认"取消"）
 * @param {Function} options.onConfirm - 确认回调
 * @param {Function} options.onCancel - 取消回调
 * @param {string} options.confirmButtonClass - 确认按钮额外类名（默认"btn-bgm"）
 * @param {string} options.size - 弹窗大小（默认"sm"）
 * @returns {string} 弹窗ID
 */
export function openConfirmModal(options = {}) {
  const {
    title = "确认",
    message,
    confirmText = "确定",
    cancelText = "取消",
    onConfirm,
    onCancel,
    confirmButtonClass = "btn-bgm",
    size = "sm",
  } = options;

  const modalId = `confirm-modal-${Date.now()}`;

  // 创建确认内容容器
  const confirmContent = document.createElement("div");
  confirmContent.className = "space-y-4";

  // 添加消息
  if (message) {
    const messageEl = document.createElement("p");
    messageEl.className = "text-sm opacity-70";
    messageEl.textContent = message;
    confirmContent.appendChild(messageEl);
  }

  // 创建按钮容器
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "flex justify-end gap-2 p-1";

  // 取消按钮
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-sm";
  cancelBtn.textContent = cancelText;
  cancelBtn.onclick = () => {
    closeModal(modalId);
    if (onCancel) onCancel();
  };

  // 确认按钮
  const confirmBtn = document.createElement("button");
  confirmBtn.className = `btn btn-sm ${confirmButtonClass}`;
  confirmBtn.textContent = confirmText;
  confirmBtn.onclick = async () => {
    closeModal(modalId);
    if (onConfirm) await onConfirm();
  };

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);
  confirmContent.appendChild(buttonContainer);

  openModal(modalId, {
    title,
    content: confirmContent,
    size,
    closeOnBackdropClick: false,
  });

  return modalId;
}

/**
 * 打开消息提示弹窗
 * @param {Object} options - 配置选项
 * @param {string} options.title - 标题（默认"提示"）
 * @param {string} options.message - 提示消息
 * @param {Function} options.onClose - 关闭回调
 * @param {string} options.size - 弹窗大小（默认"sm"）
 * @returns {string} 弹窗ID
 */
export function openAlertModal(options = {}) {
  const { title = "提示", message, onClose, size = "sm" } = options;

  const modalId = `alert-modal-${Date.now()}`;

  // 创建内容容器
  const alertContent = document.createElement("div");
  alertContent.className = "py-2";

  // 添加消息
  if (message) {
    const messageEl = document.createElement("p");
    messageEl.className = "text-sm";
    messageEl.textContent = message;
    alertContent.appendChild(messageEl);
  }

  openModal(modalId, {
    title,
    content: alertContent,
    size,
    onClose,
  });

  return modalId;
}

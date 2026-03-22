import { XIcon } from "@src/icons/XIcon.js";

/**
 * 清理指定modalId的Modal元素
 * @param {string} modalId - Modal的唯一ID
 */
export function closeModalById(modalId) {
  const modals = document.querySelectorAll("#tg-modal");
  modals.forEach((modal) => {
    if (modal.dataset.modalId === modalId && modal.parentNode === document.body) {
      document.body.removeChild(modal);
    }
  });

  // 检查是否还有其他弹窗存在
  const remainingModals = document.querySelectorAll("#tg-modal");
  if (remainingModals.length === 0) {
    // 只有当没有其他弹窗时才恢复滚动条
    document.body.style.overflow = "";
  }
}

/**
 * 通用弹窗组件
 * @param {Object} props
 * @param {boolean} props.visible - 是否显示弹窗
 * @param {Function} props.onClose - 关闭弹窗回调
 * @param {string} props.title - 弹窗标题
 * @param {('center'|'top'|'bottom')} props.position - 弹窗位置
 * @param {number} props.maxWidth - 最大宽度（px），不传入时使用w-full
 * @param {string} props.modalId - 可选的弹窗ID，用于精确清理
 * @param {string} props.padding - 内容区域的padding类名，默认p-4
 * @param {Function} props.getModalId - 可选的回调函数，用于获取生成的modalId
 * @param {JSX.Element} props.children - 弹窗内容
 */
export function Modal({
  visible,
  onClose,
  title,
  position = "top",
  maxWidth,
  modalId,
  padding = "p-4",
  getModalId,
  children,
}) {
  // 生成唯一的modalId
  const generatedModalId =
    modalId || `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 如果提供了getModalId回调，传出生成的ID
  if (getModalId && typeof getModalId === "function") {
    getModalId(generatedModalId);
  }

  // 关闭弹窗函数
  const handleClose = () => {
    // 按ID清理
    const modals = document.querySelectorAll("#tg-modal");
    modals.forEach((modal) => {
      if (modal.dataset.modalId === generatedModalId && modal.parentNode === document.body) {
        document.body.removeChild(modal);
      }
    });

    // 检查是否还有其他弹窗存在
    const remainingModals = document.querySelectorAll("#tg-modal");
    if (remainingModals.length === 0) {
      // 只有当没有其他弹窗时才恢复滚动条
      document.body.style.overflow = "";
    }

    // 调用onClose回调
    if (onClose) {
      onClose();
    }
  };

  // 如果visible为false，清理已存在的Modal并返回null
  if (!visible) {
    setTimeout(() => {
      handleClose();
    }, 0);
    return null;
  }

  // 检查是否已存在相同modalId的Modal
  const existingModal = document.querySelector(`#tg-modal[data-modal-id="${generatedModalId}"]`);
  if (existingModal && existingModal.parentNode === document.body) {
    // 如果Modal已存在，跳过创建
    return null;
  }

  // 根据位置设置对齐方式
  const positionClasses = {
    center: "items-center pt-4 pb-10",
    top: "items-start pt-8 pb-10",
    bottom: "items-end pt-4 pb-10",
  };

  // 根据maxWidth设置宽度类名和样式
  const widthClass = maxWidth ? "w-auto" : "w-full";
  const maxWidthStyle = maxWidth ? { maxWidth: `${maxWidth}px` } : {};

  // 记录鼠标按下的位置
  let mouseDownOnBackground = false;

  const modalElement = (
    <div id="tg-modal" className="tinygrail" data-modal-id={generatedModalId}>
      <div
        id="tg-modal-background"
        className={`fixed inset-0 flex justify-center bg-black/20 px-3 ${positionClasses[position]}`}
        style={{ zIndex: 999 }}
        onMouseDown={(e) => {
          // 点击蒙版时标记
          if (e.target.id === "tg-modal-background") {
            mouseDownOnBackground = true;
          }
        }}
        onClick={(e) => {
          // 只有在蒙版上按下且在蒙版上松开时才关闭
          if (e.target.id === "tg-modal-background" && mouseDownOnBackground) {
            handleClose();
          }
          mouseDownOnBackground = false;
        }}
      >
        <div
          id="tg-modal-content"
          className={`tg-bg-content relative flex max-h-full ${widthClass} max-w-6xl flex-col overflow-hidden rounded-[15px] shadow-2xl backdrop-blur`}
          style={maxWidthStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="tg-link absolute right-1 top-1 z-50 flex items-center justify-center rounded-full p-2 opacity-60 transition-colors hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-800"
            onClick={handleClose}
          >
            <XIcon className="size-4" />
          </button>

          {/* 标题区域 */}
          {title && (
            <div
              id="tg-modal-title"
              className="flex flex-shrink-0 items-center border-b border-gray-200 px-4 py-3 pr-12 dark:border-gray-700"
            >
              <h3 className="text-base font-semibold">{title}</h3>
            </div>
          )}

          {/* 内容区域 */}
          <div id="tg-modal-body" className={`min-h-32 overflow-auto ${padding}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // 使用setTimeout确保元素创建后再移动到body
  setTimeout(() => {
    if (modalElement.parentNode && modalElement.parentNode !== document.body) {
      document.body.appendChild(modalElement);
      // 禁止body滚动
      document.body.style.overflow = "hidden";
    }
  }, 0);

  return modalElement;
}

import { sendRedPacket } from "@src/api/event.js";
import { closeModal, openModal } from "@src/utils/modalManager.js";
import { showSuccess, showError, showWarning } from "@src/utils/toastManager.jsx";

/**
 * 打开发送红包弹窗
 * @param {Object} options
 * @param {string} options.username - 用户名
 * @param {string} options.nickname - 用户昵称（可选）
 * @param {Function} options.onSuccess - 发送成功回调（可选）
 * @returns {string} 弹窗ID
 */
export function openSendRedPacketModal({ username, nickname = "", onSuccess }) {
  const modalId = `send-red-packet-${username}`;

  openModal(modalId, {
    title: nickname ? `发送红包给「${nickname}」` : "发送红包",
    content: (
      <SendRedPacket
        username={username}
        onSuccess={() => {
          closeModal(modalId);
          onSuccess?.();
        }}
      />
    ),
    size: "sm",
  });

  return modalId;
}

/**
 * 发送红包组件
 * @param {Object} props
 * @param {string} props.username - 用户名
 * @param {Function} props.onSuccess - 发送成功回调
 */
export function SendRedPacket({ username, onSuccess }) {
  let message = "";
  let amount = "";
  let isLoading = false;

  const amountInput = (
    <input
      type="number"
      className="input input-sm input-bordered w-full"
      placeholder="请输入红包金额"
      onInput={(e) => {
        amount = e.target.value;
      }}
      min="0"
      step="1000"
    />
  );

  const messageInput = (
    <input
      type="text"
      className="input input-sm input-bordered w-full !bg-base-100"
      placeholder="请输入祝福留言"
      onInput={(e) => {
        message = e.target.value;
      }}
    />
  );

  const loadingSpinner = <span className="loading loading-spinner loading-sm"></span>;
  const submitButton = <button className="btn-bgm btn btn-sm btn-block">发送</button>;

  const handleSubmit = async () => {
    // 验证输入
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showWarning("请输入有效的红包金额");
      return;
    }

    if (isLoading) return;

    isLoading = true;
    submitButton.disabled = true;
    submitButton.insertBefore(loadingSpinner, submitButton.firstChild);

    const result = await sendRedPacket(username, Number(amount), message);

    isLoading = false;
    submitButton.disabled = false;
    loadingSpinner.remove();

    if (result.success) {
      showSuccess(result.message);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } else {
      showError(result.message);
    }
  };

  submitButton.onclick = handleSubmit;

  return (
    <div id="tg-send-red-packet" className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {/* 红包金额 */}
        <div className="p-1">{amountInput}</div>
        {/* 祝福留言 */}
        <div className="p-1">{messageInput}</div>
      </div>

      <div>
        {/* 按钮 */}
        <div className="flex justify-end gap-2 p-1">{submitButton}</div>
      </div>
    </div>
  );
}

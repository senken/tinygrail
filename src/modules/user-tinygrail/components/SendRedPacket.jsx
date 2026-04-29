import { sendRedPacket } from "@src/api/event.js";
import { closeModal, openModal } from "@src/utils/modalManager.js";

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
  let statusMessage = "";
  let statusType = "";

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

  const statusDiv = <div />;

  const updateStatus = (msg, type) => {
    statusMessage = msg;
    statusType = type;

    if (msg) {
      let className = "rounded-lg text-xs";
      if (type === "success") {
        className += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      } else if (type === "error") {
        className += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      } else {
        className += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      }
      statusDiv.className = className;
      statusDiv.textContent = msg;
      statusDiv.style.display = "block";
    } else {
      statusDiv.style.display = "none";
    }
  };

  const handleSubmit = async () => {
    // 验证输入
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      updateStatus("请输入有效的红包金额", "error");
      return;
    }

    updateStatus("发送中...", "");

    const result = await sendRedPacket(username, Number(amount), message);

    updateStatus(result.message, result.success ? "success" : "error");

    if (result.success && onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 500);
    }
  };

  statusDiv.style.display = "none";

  return (
    <div id="tg-send-red-packet" className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {/* 红包金额 */}
        <div className="p-1">{amountInput}</div>
        {/* 祝福留言 */}
        <div className="p-1">{messageInput}</div>
        {/* 状态消息 */}
        {statusDiv}
      </div>

      <div>
        {/* 按钮 */}
        <div className="flex justify-end gap-2 p-1">
          <button className="btn-bgm btn btn-sm btn-block" onClick={handleSubmit}>
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

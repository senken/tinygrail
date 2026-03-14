import { Button } from "@src/components/Button.jsx";
import { sendRedPacket } from "@src/api/event.js";

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

  const messageInput = (
    <input
      type="text"
      className="tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600"
      placeholder="请输入祝福留言"
      onInput={(e) => {
        message = e.target.value;
      }}
    />
  );

  const amountInput = (
    <input
      type="number"
      className="tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600"
      placeholder="请输入红包金额"
      onInput={(e) => {
        amount = e.target.value;
      }}
      min="0"
      step="1000"
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
    <div id="tg-send-red-packet" className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {/* 红包金额 */}
        <div className="flex flex-col gap-2">{amountInput}</div>

        {/* 祝福留言 */}
        <div className="flex flex-col gap-2">{messageInput}</div>
        {/* 状态消息 */}
        {statusDiv}
      </div>

      <div>
        {/* 按钮 */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleSubmit}>发送</Button>
        </div>
      </div>
    </div>
  );
}

import { Button } from "@src/components/Button.jsx";
import { convertStarForces } from "@src/api/chara.js";

/**
 * 星之力组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿对象
 * @param {Function} props.onSuccess - 成功回调函数，参数为转化的数量
 */
export function StarForces({ temple, onSuccess }) {
  let amount = 500;

  const amountInput = (
    <input
      type="number"
      className="tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600"
      placeholder="请输入数量"
      value={100}
      onInput={(e) => {
        amount = Number(e.target.value);
      }}
      min="0"
      step="1"
    />
  );

  const descriptionDiv = (
    <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      将固定资产转化为星之力。
    </div>
  );

  const statusDiv = <div />;

  const updateStatus = (msg, type) => {
    if (msg) {
      let className = "rounded-lg px-3 py-2 text-xs ";
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

  /**
   * 处理提交
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    // 验证输入
    if (!amount || isNaN(amount) || amount <= 0) {
      updateStatus("请输入有效的数量", "error");
      return;
    }

    updateStatus("处理中...", "");

    const result = await convertStarForces(temple.CharacterId, amount);

    if (result.success) {
      updateStatus(result.data, "success");
      if (onSuccess) {
        onSuccess(amount);
      }
    } else {
      updateStatus(result.message, "error");
    }
  };

  statusDiv.style.display = "none";

  const submitButton = <Button onClick={handleSubmit}>确定</Button>;

  return (
    <div id="tg-star-forces" className="flex min-w-64 flex-col gap-4">
      {/* 描述 */}
      {descriptionDiv}

      {/* 输入框 */}
      <div id="tg-star-forces-amount-input" className="flex flex-col gap-2">
        {amountInput}
      </div>

      {/* 状态消息 */}
      {statusDiv}

      {/* 提交按钮 */}
      <div id="tg-star-forces-submit" className="flex justify-end">
        {submitButton}
      </div>
    </div>
  );
}

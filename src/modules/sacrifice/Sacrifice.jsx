import { sacrificeCharacter } from "@src/api/chara.js";
import { Button } from "@src/components/Button.jsx";
import { formatCurrency } from "@src/utils/format.js";

/**
 * 资产重组/股权融资组件
 * @param {Object} props
 * @param {number} props.characterId - 角色ID
 */
export function Sacrifice({ characterId }) {
  let sacrificeType = "restructure";
  let amount = "500";

  const amountInput = (
    <input
      type="number"
      className="tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600"
      placeholder="请输入数量"
      value="500"
      onInput={(e) => {
        amount = e.target.value;
      }}
      min="0"
      step="1"
    />
  );

  const descriptionDiv = (
    <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      将股份转化为固定资产，同时获得现金奖励并掉落道具。
    </div>
  );

  const switchTrack = (
    <div className="relative inline-block h-6 w-11 rounded-full bg-gray-300 transition-colors dark:bg-gray-600" />
  );
  const switchThumb = (
    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform" />
  );

  switchTrack.appendChild(switchThumb);

  const switchButton = (
    <button
      type="button"
      className="flex items-center gap-2 outline-none"
      onClick={() => {
        sacrificeType = sacrificeType === "restructure" ? "equity" : "restructure";
        const isEquity = sacrificeType === "equity";

        // 重置数量为 500
        amount = "500";
        amountInput.value = "500";

        // 更新开关样式和按钮文本
        if (isEquity) {
          switchTrack.className =
            "relative inline-block h-6 w-11 rounded-full bgm-bg transition-colors";
          switchThumb.style.transform = "translateX(20px)";
          descriptionDiv.textContent = "将股份出售给幻想乡，立刻获取现金。";
          submitButton.textContent = "股权融资";
        } else {
          switchTrack.className =
            "relative inline-block h-6 w-11 rounded-full bg-gray-300 transition-colors dark:bg-gray-600";
          switchThumb.style.transform = "translateX(0)";
          descriptionDiv.textContent = "将股份转化为固定资产，同时获得现金奖励并掉落道具。";
          submitButton.textContent = "资产重组";
        }
      }}
    >
      {switchTrack}
    </button>
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
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      updateStatus("请输入有效的数量", "error");
      return;
    }

    const isEquity = sacrificeType === "equity";
    const amountNum = Number(amount);

    // 股权融资且数量大于2500时二次确认
    if (isEquity && amountNum >= 2500) {
      if (!confirm("当前股权融资数量过大，是否继续？")) {
        return;
      }
    }

    updateStatus("处理中...", "");

    const result = await sacrificeCharacter(characterId, amountNum, isEquity);

    if (result.success) {
      let message = `融资完成！获得资金${formatCurrency(result.data.Balance)}`;

      // 如果有掉落道具
      if (result.data.Items && result.data.Items.length > 0) {
        message += " 掉落道具";
        for (let i = 0; i < result.data.Items.length; i++) {
          const item = result.data.Items[i];
          message += ` 「${item.Name}」×${item.Count}`;
        }
      }

      updateStatus(message, "success");
    } else {
      updateStatus(result.message, "error");
    }
  };

  statusDiv.style.display = "none";

  const submitButton = <Button onClick={handleSubmit}>资产重组</Button>;

  return (
    <div id="tg-sacrifice" className="flex min-w-64 flex-col gap-4">
      {/* 类型切换 */}
      <div id="tg-sacrifice-type-switch" className="flex items-center gap-3">
        {switchButton}
        <span className="text-sm opacity-60">股权融资</span>
      </div>

      {/* 类型描述 */}
      {descriptionDiv}

      {/* 数量输入 */}
      <div id="tg-sacrifice-amount-input" className="flex flex-col gap-2">
        {amountInput}
      </div>

      {/* 状态消息 */}
      {statusDiv}

      {/* 提交按钮 */}
      <div id="tg-sacrifice-submit" className="flex justify-end">
        {submitButton}
      </div>
    </div>
  );
}

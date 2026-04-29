import { formatCurrency, formatNumber } from "@src/utils/format.js";
import { openConfirmModal } from "@src/utils/modalManager";
import { showWarning } from "@src/utils/toastManager.jsx";

/**
 * ICO注资组件
 * @param {Object} props
 * @param {Object} props.userIcoInfo - 当前用户ICO注资信息
 * @param {Object} props.userAssets - 用户资产数据
 * @param {Object} props.characterData - 角色ICO数据
 * @param {Object} props.predicted - 计算后的ICO数据
 * @param {Function} props.onInvest - 注资回调函数
 */
export function IcoBoxInvest({ userIcoInfo, userAssets, characterData, predicted, onInvest }) {
  const hasInvested = userIcoInfo?.Amount > 0;
  const investedAmount = userIcoInfo?.Amount || 0;
  const balance = userAssets?.balance || 0;

  // 计算下一级所需金额
  const nextLevelAmount = predicted.Next - characterData.Total;

  // 计算预计可得股数
  const expectedShares = Math.floor(
    investedAmount /
      (Math.max(predicted.Price, 10) + 500000 / (10000 + (predicted.Level - 1) * 7500))
  );

  const container = (
    <div id="tg-ico-box-invest" data-character-id={characterData.CharacterId} className="py-2" />
  );
  const input = (
    <input
      id="tg-ico-box-invest-input"
      type="number"
      className="input input-sm input-bordered w-full"
      placeholder="请输入注资金额"
      min="5000"
      value="5000"
    />
  );

  container.appendChild(
    <div className="flex flex-col gap-2 p-1">
      {/* 提示文字 */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {hasInvested ? (
          <span>
            已注资{formatCurrency(investedAmount, "₵", 2, false)}，预计可得
            {formatNumber(expectedShares, 0)}股
          </span>
        ) : (
          <span>追加注资请在下方输入金额</span>
        )}
      </div>

      {/* 输入框和按钮 */}
      <div className="flex items-center gap-2">
        {input}
        <button
          className="btn-bgm btn btn-sm"
          onClick={() => {
            const amount = parseFloat(input.value);
            if (isNaN(amount) || amount < 5000) {
              showWarning("请输入有效的金额（参与ICO至少需要5000cc。）");
              return;
            }

            // 注资确认
            const executeInvest = () => {
              openConfirmModal({
                title: "确认注资",
                message: "除非ICO启动失败，注资将不能退回，确定参与ICO？",
                onConfirm: () => {
                  if (onInvest) {
                    onInvest(amount);
                  }
                },
              });
            };

            // 过注提示
            const newTotal = characterData.Total + amount;
            if (amount > 1000000 && newTotal >= predicted.Next && predicted.Users > 0) {
              openConfirmModal({
                title: "注资提示",
                message: "当前参与人数不足，继续注资可能会导致高于正常发行价，是否继续？",
                confirmText: "继续",
                onConfirm: executeInvest,
              });
              return;
            }

            executeInvest();
          }}
        >
          注资
        </button>
      </div>

      {/* 余额和下一级按钮 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <button
          className="btn-bgm btn btn-outline btn-xs rounded-full"
          onClick={() => {
            if (nextLevelAmount > 0) {
              input.value = nextLevelAmount.toString();
            }
          }}
        >
          下一级
        </button>
        <span>账户余额：{formatCurrency(balance, "₵", 2, false)}</span>
      </div>
    </div>
  );

  return container;
}

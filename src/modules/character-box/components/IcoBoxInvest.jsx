import { formatCurrency } from "@src/utils/format.js";
import { Button } from "@src/components/Button.jsx";

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

  const container = <div id="tg-ico-box-invest" data-character-id={characterData.CharacterId} className="py-2" />;
  const input = (
    <input
      id="tg-ico-box-invest-input"
      type="number"
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
      placeholder="请输入注资金额"
      min="5000"
      value="5000"
    />
  );

  container.appendChild(
    <div className="flex flex-col gap-2">
      {/* 提示文字 */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {hasInvested ? (
          <span>
            已注资{formatCurrency(investedAmount, "₵", 2, false)}，追加注资请在下方输入金额
          </span>
        ) : (
          <span>追加注资请在下方输入金额</span>
        )}
      </div>

      {/* 输入框和按钮 */}
      <div className="flex items-center gap-2">
        {input}
        <Button
          variant="solid"
          size="sm"
          onClick={() => {
            const amount = parseFloat(input.value);
            if (isNaN(amount) || amount < 5000) {
              alert("请输入有效的金额（参与众筹至少需要5000cc。）");
              return;
            }

            // 过注提示
            const newTotal = characterData.Total + amount;
            if (amount > 1000000 && newTotal >= predicted.Next && predicted.Users > 0) {
              if (!confirm("当前参与人数不足，继续注资可能会导致高于正常发行价，是否继续？")) {
                return;
              }
            }

            if (confirm("除非ICO启动失败，注资将不能退回，确定参与ICO？")) {
              if (onInvest) {
                onInvest(amount);
              }
            }
          }}
        >
          注资
        </Button>
      </div>

      {/* 余额和下一级按钮 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
        <Button
          variant="outline"
          size="sm"
          rounded="full"
          className="px-1.5 py-0 text-[10px] leading-tight"
          onClick={() => {
            if (nextLevelAmount > 0) {
              input.value = nextLevelAmount.toString();
            }
          }}
        >
          下一级
        </Button>
        <span>账户余额：{formatCurrency(balance, "₵", 2, false)}</span>
      </div>
    </div>
  );

  return container;
}

import { normalizeAvatar } from "@src/utils/oos.js";
import { formatCurrency, formatNumber, formatDateTime } from "@src/utils/format.js";
import { SquareArrowOutUpRightIcon } from "@src/icons";
import { ProgressBar } from "@src/components/ProgressBar.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";

/**
 * ICO盒子头部组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色ICO数据
 * @param {Object} props.predicted - 计算后的ICO数据
 */
export function IcoBoxHeader({ characterData, predicted }) {
  if (!characterData) {
    return null;
  }

  const { CharacterId, Name, Icon, Begin, End, Total, Users, Type, Bonus } = characterData;
  const avatarUrl = normalizeAvatar(Icon);

  // 计算进度条百分比
  const percent = Math.round((Total / predicted.Next) * 100);
  const displayPercent = percent > 100 ? 100 : percent;

  // 下一等级的条件文本
  const goal = predicted.Level > 0 ? "下一等级还需要" : "成功上市还需要";
  const needUsers = predicted.Users > 0 ? `${predicted.Users}名参与者` : "";
  const needMoney =
    predicted.Next - Total > 0
      ? `投入${formatCurrency(predicted.Next - Total, "₵", 0, false)}`
      : "";
  const restText = `${goal}${needUsers}${needMoney}`;

  // 倒计时元素
  const countdownSpan = <span>剩余时间：计算中...</span>;

  // 倒计时
  if (End) {
    const updateCountdown = () => {
      const endDate = new Date(End);
      const now = new Date();
      const diff = endDate - now;

      if (diff <= 0) {
        countdownSpan.textContent = "剩余时间：已结束";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeText = "剩余时间：";
      timeText += `${days}天`;
      timeText += `${hours}小时`;
      timeText += `${minutes}分`;
      timeText += `${seconds}秒`;

      countdownSpan.textContent = timeText;
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  return (
    <div id="tg-ico-box-header" data-character-id={CharacterId} className="flex flex-col gap-2">
      <div className="flex gap-4">
        {/* 头像 */}
        <div
          id="tg-ico-box-header-avatar"
          className="size-16 flex-shrink-0 rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        />

        {/* 信息 */}
        <div id="tg-ico-box-header-info" className="flex min-w-0 flex-col justify-center gap-px">
          <div className="flex items-center gap-2">
            <a
              href={`https://bgm.tv/character/${CharacterId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tg-link flex min-w-0 flex-1 items-center gap-1 text-base font-semibold"
            >
              <span className="truncate">
                #{CharacterId} -「{Name}」
              </span>
              <SquareArrowOutUpRightIcon className="h-4 w-4 flex-shrink-0" />
            </a>
            {Type === 1 && Bonus > 0 && (
              <span
                className="inline-block h-4 flex-shrink-0 rounded-md bg-green-500 px-1.5 py-0 text-[10px] font-semibold leading-4 text-white"
                title={`剩余${Bonus}期额外分红`}
              >
                ×{Bonus}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-px">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">已筹集 {formatCurrency(Total, "₵", 0, false)}</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span>{restText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 等级和发行价 */}
      {predicted.Level > 0 && (
        <div id="tg-ico-box-header-level" className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400">ICO等级：</span>
              <LevelBadge level={predicted.Level} size="sm" />
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400">上市等级：</span>
              <LevelBadge
                level={Math.floor(Math.log(predicted.Amount / 7500.0) / Math.log(1.3) + 1)}
                size="sm"
              />
            </div>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            预计发行量：约{formatNumber(predicted.Amount, 0)}股 | 发行价：
            {formatCurrency(predicted.Price)}
          </div>
        </div>
      )}

      {/* 进度条 */}
      <div id="tg-ico-box-header-progress" className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs opacity-60">
          {countdownSpan}
          <span>{percent}%</span>
        </div>
        <ProgressBar value={Total} max={predicted.Next} color="#64ee10" height="h-1" />
      </div>
    </div>
  );
}

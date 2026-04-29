import { Avatar } from "@src/components/Avatar.jsx";
import { ArrowRightLeftIcon, SquareArrowOutUpRightIcon } from "@src/icons";
import { formatCurrency } from "@src/utils/format";
import { getCachedUserAssets, isGameMaster } from "@src/utils/session.js";

/**
 * 用户头部信息组件（弹窗版本）
 * @param {Object} props
 * @param {string} props.name - 用户名称
 * @param {string} props.nickname - 用户昵称
 * @param {number} props.balance - 余额
 * @param {number} props.assets - 总资产
 * @param {string} props.avatar - 头像URL
 * @param {number} props.state - 用户状态
 * @param {string} props.bgClassName - 背景色类名
 * @param {Function} props.onRedPacketLogClick - 点击红包记录按钮的回调
 * @param {Function} props.onSendRedPacketClick - 点击发送红包按钮的回调
 * @param {Function} props.onTradeHistoryClick - 点击交易记录按钮的回调
 * @param {Function} props.onBanClick - 点击封禁按钮的回调
 * @param {Function} props.onUnbanClick - 点击解封按钮的回调
 */
export function UserTinygrailHeader({
  name,
  nickname,
  balance,
  lastIndex,
  assets,
  avatar,
  state,
  bgClassName = "",
  onRedPacketLogClick,
  onSendRedPacketClick,
  onTradeHistoryClick,
  onBanClick,
  onUnbanClick,
}) {
  // 判断是否是自己
  let isSelf = false;
  const myAssets = getCachedUserAssets();
  if (myAssets) {
    isSelf = myAssets.name === name;
  }

  // 判断用户是否被封禁
  const isBanned = state === 666;

  // 管理余额缩略状态
  let abbreviateBalance = true;
  const balanceButton = (
    <button
      className="flex items-center gap-1 border-none bg-transparent p-0 text-xs font-medium opacity-60 transition-opacity hover:opacity-80"
      title={abbreviateBalance ? "显示完整金额" : "显示缩略金额"}
      aria-label="切换缩略显示"
    >
      <span>余额: {formatCurrency(balance, "₵", 2, abbreviateBalance)}</span>
      <ArrowRightLeftIcon className="h-3 w-3" />
    </button>
  );

  balanceButton.onclick = () => {
    abbreviateBalance = !abbreviateBalance;
    balanceButton.querySelector("span").textContent =
      `余额: ${formatCurrency(balance, "₵", 2, abbreviateBalance)}`;
    balanceButton.title = abbreviateBalance ? "显示完整金额" : "显示缩略金额";
  };

  return (
    <div id="tg-user-tinygrail-header" className={`pt-1 ${bgClassName}`}>
      <div className="mx-auto">
        {/* 头像 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={avatar}
              alt={nickname}
              rank={lastIndex > 0 ? lastIndex : null}
              isBanned={isBanned}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <a
                target="_blank"
                href={`/user/${name}`}
                className={`tg-link inline-flex min-w-0 items-center gap-1 text-sm font-semibold transition-colors ${isBanned ? "text-red-500" : ""}`}
              >
                <span className="min-w-0 truncate">
                  {nickname}
                  {isBanned && "[小圣杯已封禁]"}
                </span>
                <SquareArrowOutUpRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
              </a>
              <span className="text-xs opacity-60">@{name}</span>
            </div>
          </div>
          <div className="mr-2 flex shrink-0 gap-2">
            <button
              className="btn-bgm btn btn-outline btn-xs rounded-full"
              onClick={onRedPacketLogClick}
            >
              红包记录
            </button>
            {!isSelf && (
              <button
                className="btn-bgm btn btn-outline btn-xs rounded-full"
                onClick={onSendRedPacketClick}
              >
                发送红包
              </button>
            )}
          </div>
        </div>

        {/* 资产和余额 */}
        <div className="mt-2 flex gap-4 text-sm">
          <div className="text-xs font-medium opacity-60">资产: {formatCurrency(assets)}</div>
          {balanceButton}
        </div>

        {/* GM按钮组 */}
        <div
          id="tg-user-tinygrail-actions"
          className={`flex flex-wrap gap-2 ${isGameMaster() ? "mt-2" : ""}`}
        >
          {isGameMaster() && (
            <button className="btn-bgm btn btn-xs" onClick={onTradeHistoryClick}>
              交易记录
            </button>
          )}
          {isGameMaster() && (
            <button className="btn-bgm btn btn-xs" onClick={onBanClick}>
              封禁
            </button>
          )}
          {isGameMaster() && (
            <button className="btn-bgm btn btn-xs" onClick={onUnbanClick}>
              解封
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

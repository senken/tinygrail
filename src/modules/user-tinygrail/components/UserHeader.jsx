import { Button } from "@src/components/Button.jsx";
import { Avatar } from "@src/components/Avatar.jsx";
import { ArrowRightLeftIcon, SquareArrowOutUpRightIcon } from "@src/icons";
import { formatCurrency } from "@src/utils/format";
import { getCachedUserAssets, isGameMaster } from "@src/utils/session.js";

/**
 * 用户头部信息组件
 * @param {Object} props
 * @param {string} props.name - 用户名称
 * @param {string} props.nickname - 用户昵称
 * @param {number} props.balance - 余额
 * @param {number} props.assets - 总资产
 * @param {string} props.avatar - 头像URL
 * @param {number} props.state - 用户状态
 * @param {boolean} props.abbreviateBalance - 是否缩略显示余额
 * @param {Function} props.onToggleAbbreviate - 切换缩略显示的回调
 * @param {Function} props.onRedPacketLogClick - 点击红包记录按钮的回调
 * @param {Function} props.onSendRedPacketClick - 点击发送红包按钮的回调
 * @param {Function} props.onTradeHistoryClick - 点击交易记录按钮的回调
 * @param {Function} props.onBanClick - 点击封禁按钮的回调
 * @param {Function} props.onUnbanClick - 点击解封按钮的回调
 */
export function UserHeader({
  name,
  nickname,
  balance,
  lastIndex,
  assets,
  avatar,
  state,
  abbreviateBalance = true,
  onToggleAbbreviate,
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

  return (
    <div id="tg-user-tinygrail-header" className="tg-bg-content p-2 pt-0">
      <div className="mx-auto">
        {/* 头像 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={isBanned ? "rounded-full border-2 border-red-500" : ""}>
              <Avatar src={avatar} alt={nickname} rank={lastIndex > 0 ? lastIndex : null} />
            </div>
            <div className="flex flex-col gap-0.5">
              <a
                target="_blank"
                href={`/user/${name}`}
                className={`tg-link inline-flex items-center gap-1 text-sm font-semibold transition-colors ${isBanned ? "text-red-500" : ""}`}
              >
                <span>{nickname}</span>
                {isBanned && <span>[小圣杯已封禁]</span>}
                <SquareArrowOutUpRightIcon className="h-3.5 w-3.5" />
              </a>
              <span className="text-xs opacity-60">@{name}</span>
            </div>
          </div>
          <div className="mr-2 flex shrink-0 gap-2">
            <Button variant="outline" rounded="full" onClick={onRedPacketLogClick}>
              红包记录
            </Button>
            {!isSelf && (
              <Button variant="outline" rounded="full" onClick={onSendRedPacketClick}>
                发送红包
              </Button>
            )}
          </div>
        </div>

        {/* 资产和余额 */}
        <div className="mt-2 flex gap-4 text-sm">
          <div className="text-sm font-medium opacity-60">资产: {formatCurrency(assets)}</div>
          <button
            className="flex items-center gap-1 border-none bg-transparent p-0 text-sm font-medium opacity-60 transition-opacity hover:opacity-80"
            onClick={onToggleAbbreviate}
            title={abbreviateBalance ? "显示完整金额" : "显示缩略金额"}
            aria-label="切换缩略显示"
          >
            <span>余额: {formatCurrency(balance, "₵", 2, abbreviateBalance)}</span>
            <ArrowRightLeftIcon className="h-3 w-3" />
          </button>
        </div>

        {/* GM按钮组 */}
        {isGameMaster() && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={onTradeHistoryClick}>交易记录</Button>
            <Button onClick={onBanClick}>封禁</Button>
            <Button onClick={onUnbanClick}>解封</Button>
          </div>
        )}
      </div>
    </div>
  );
}

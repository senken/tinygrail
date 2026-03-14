import { formatCurrency } from "@src/utils/format.js";
import { Button } from "@src/components/Button.jsx";
import { Avatar } from "@src/components/Avatar.jsx";
import { ArrowRightLeftIcon, SquareArrowOutUpRightIcon } from "@src/icons";

export function UserInfoBox(userData) {
  const {
    name,
    nickname,
    avatar,
    balance,
    lastIndex,
    showDaily,
    showWeekly,
    showHoliday,
    holidayName,
    abbreviateBalance,
    onBonus,
    onShareBonus,
    onHolidayBonus,
    onLogout,
    onShareBonusTest,
    onScratch,
    onAvatarClick,
    onToggleAbbreviate,
    onBalanceLog,
  } = userData || {};

  // 按钮组
  const actionButtons = [
    {
      id: "scratch-button",
      label: "刮刮乐",
      show: true,
      onClick: () => {
        if (onScratch) onScratch();
      },
    },
    {
      id: "share-bonus-button",
      label: "每周分红",
      show: showWeekly,
      onClick: () => {
        if (onShareBonus) onShareBonus();
      },
    },
    {
      id: "bonus-button",
      label: "签到奖励",
      show: showDaily,
      onClick: () => {
        if (onBonus) onBonus();
      },
    },
    {
      id: "holiday-bonus-button",
      label: `${holidayName}福利`,
      show: showHoliday,
      onClick: () => {
        if (onHolidayBonus) onHolidayBonus();
      },
      className:
        "!bg-gradient-to-r !from-pink-500 !via-purple-500 !to-indigo-500 !text-white !font-semibold hover:!opacity-90 hover:!shadow-lg !transition-all",
    },
    {
      id: "balance-log-button",
      label: "资金日志",
      show: true,
      onClick: () => {
        if (onBalanceLog) onBalanceLog();
      },
    },
  ].filter((btn) => btn.show);

  return (
    <div
      id="tg-rakuen-home-user-info-box"
      className="tg-bg-content tg-border-card my-2 flex flex-wrap items-center gap-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
      data-name={name}
    >
      <div id="tg-rakuen-home-user-info" className="mr-auto flex flex-shrink-0 items-center gap-3">
        <Avatar
          src={avatar}
          alt={nickname}
          onClick={onAvatarClick}
          rank={lastIndex > 0 ? lastIndex : null}
        />
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <a
              target="_blank"
              href={`/user/${name}`}
              className="tg-link inline-flex items-center gap-1 text-sm font-semibold transition-colors"
            >
              <span>{nickname}</span>
              <SquareArrowOutUpRightIcon className="h-3.5 w-3.5" />
            </a>
            <button
              id="tg-rakuen-home-logout-button"
              className="tg-link cursor-pointer border-none bg-none p-0 text-xs text-gray-500 transition-colors"
              onClick={onLogout}
            >
              [退出登录]
            </button>
            <button
              id="tg-rakuen-home-test-button"
              className="tg-link cursor-pointer border-none bg-none p-0 text-xs text-gray-500 transition-colors"
              onClick={onShareBonusTest}
            >
              [股息预测]
            </button>
          </div>
          <button
            id="tg-rakuen-home-balance"
            className="flex items-center gap-0.5 border-none bg-transparent p-0 text-xs font-medium opacity-60 transition-opacity hover:opacity-80"
            onClick={onToggleAbbreviate}
            title={abbreviateBalance ? "显示完整金额" : "显示缩略金额"}
          >
            <span>余额：{formatCurrency(balance, "₵", 2, abbreviateBalance)}</span>
            <ArrowRightLeftIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div id="tg-rakuen-home-user-actions" className="flex flex-wrap gap-2 pt-1">
        {actionButtons.map(({ id, label, onClick, className }) => (
          <Button id={`tg-rakuen-home-${id}`} onClick={onClick} className={className}>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

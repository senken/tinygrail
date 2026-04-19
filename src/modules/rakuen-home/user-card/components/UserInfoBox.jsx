import { Avatar } from "@src/components/Avatar.jsx";
import {
  ArrowRightLeftIcon,
  CalendarCheckIcon,
  CircleCentIcon,
  ClipboardClockIcon,
  DicesIcon,
  GiftIcon,
  PentagramIcon,
  SquareArrowOutUpRightIcon,
  StarIcon,
} from "@src/icons";
import { formatCurrency } from "@src/utils/format.js";

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
    onFavorite,
    onTarot,
  } = userData || {};

  // 按钮组
  const actionButtons = [
    {
      id: "scratch-button",
      label: "刮刮乐",
      icon: DicesIcon,
      show: true,
      onClick: () => {
        if (onScratch) onScratch();
      },
    },
    {
      id: "share-bonus-button",
      label: "每周分红",
      icon: CircleCentIcon,
      show: showWeekly,
      onClick: () => {
        if (onShareBonus) onShareBonus();
      },
    },
    {
      id: "bonus-button",
      label: "签到奖励",
      icon: CalendarCheckIcon,
      show: showDaily,
      onClick: () => {
        if (onBonus) onBonus();
      },
    },
    {
      id: "balance-log-button",
      label: "资金日志",
      icon: ClipboardClockIcon,
      show: true,
      onClick: () => {
        if (onBalanceLog) onBalanceLog();
      },
    },
    {
      id: "favorite-button",
      label: "收藏夹",
      icon: StarIcon,
      iconProps: { filled: false },
      show: true,
      onClick: () => {
        if (onFavorite) onFavorite();
      },
    },
    {
      id: "holiday-bonus-button",
      label: `${holidayName}福利`,
      icon: GiftIcon,
      show: showHoliday,
      onClick: () => {
        if (onHolidayBonus) onHolidayBonus();
      },
      className: "text-white hover:opacity-90",
      style: {
        backgroundImage:
          "linear-gradient(to right, rgb(236 72 153), rgb(168 85 247), rgb(99 102 241))",
      },
    },
    {
      id: "tarot-button",
      label: "塔罗占卜",
      icon: PentagramIcon,
      show: true,
      onClick: () => {
        if (onTarot) onTarot();
      },
      className: "text-white hover:opacity-90",
      style: {
        backgroundImage: "linear-gradient(to right, rgb(6 182 212), rgb(37 99 235))",
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
        {actionButtons.map(({ id, label, onClick, className, icon: Icon, iconProps, style }) => (
          <button
            id={`tg-rakuen-home-${id}`}
            className={className ? `btn btn-xs ${className}` : "btn-bgm btn btn-xs"}
            onClick={onClick}
            style={style}
          >
            {Icon && <Icon className="h-3.5 w-3.5" {...iconProps} />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

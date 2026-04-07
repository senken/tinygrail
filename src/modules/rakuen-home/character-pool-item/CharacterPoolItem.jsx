import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { ChangeBadge } from "@src/components/ChangeBadge.jsx";
import { Button } from "@src/components/Button.jsx";
import { formatCurrency } from "@src/utils/format.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { getUserFavorites } from "@src/modules/favorite/favoriteStorage.js";
import { getCachedUserAssets } from "@src/utils/session.js";

/**
 * 角色奖池项组件
 * @param {Object} props
 * @param {Object} props.item - 角色数据
 * @param {number} props.rank - 排名
 * @param {Object} props.auction - 拍卖数据
 * @param {boolean} props.showAuction - 是否显示拍卖信息
 * @param {boolean} props.showButtons - 是否显示拍卖按钮
 * @param {Function} props.onClick - 点击回调函数
 * @param {Function} props.onAuctionClick - 出价按钮点击回调
 * @param {Function} props.onHistoryClick - 往期按钮点击回调
 */
export function CharacterPoolItem({
  item,
  rank,
  auction,
  showAuction = true,
  showButtons = true,
  onClick,
  onAuctionClick,
  onHistoryClick,
}) {
  /**
   * 获取涨跌幅信息
   * @param {number} fluctuation - 涨跌幅
   * @returns {Object} 包含color的对象
   */
  const getFluctuationInfo = (fluctuation) => {
    if (fluctuation > 0) {
      return { color: "#ffa7cc" };
    }
    if (fluctuation < 0) {
      return { color: "#a7e3ff" };
    }
    return { color: "#d2d2d2" };
  };

  const fluctuationInfo = getFluctuationInfo(item.Fluctuation);

  // 获取角色所在的收藏夹
  const getCharacterFavorites = () => {
    const userAssets = getCachedUserAssets();
    const currentUserId = userAssets?.id;
    const favorites = getUserFavorites(currentUserId);
    return favorites.filter((f) => f.characters && f.characters.includes(item.Id));
  };

  const characterFavorites = getCharacterFavorites();

  const container = (
    <div
      data-character-id={item.Id}
      className="tg-bg-content flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-lg p-4"
      onClick={() => onClick && onClick(item.Id)}
    >
      {/* 头像 */}
      <div className="relative">
        <div className="tg-avatar-border border-2 border-gray-300 dark:border-white/30">
          <div
            className="tg-avatar h-16 w-16"
            style={{
              backgroundImage: `url(${normalizeAvatar(item.Icon)})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
        </div>
        {/* 排名徽章 */}
        <div
          className="absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 rounded px-1.5 text-sm font-bold text-white shadow-md"
          style={{ background: "linear-gradient(45deg, #FFC107, #FFEB3B)" }}
        >
          #{rank}
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col items-center gap-2">
        <div className="flex w-full min-w-0 items-center justify-center gap-2 px-2">
          <LevelBadge level={item.Level} zeroCount={item.ZeroCount} size="sm" />
          <span className="min-w-0 truncate text-sm font-semibold" title={item.Name}>
            {item.Name}
          </span>
        </div>
        {/* 收藏标签行 */}
        {characterFavorites.length > 0 && (
          <div className="flex w-full flex-wrap items-center justify-center gap-1 px-2">
            {characterFavorites.map((favorite) => (
              <span
                className={`inline-block flex-shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold leading-4 text-white ${favorite.color}`}
              >
                {favorite.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex w-full min-w-0 flex-col gap-1.5 text-xs">
          <div
            className="flex min-w-0 items-center justify-center gap-2"
            title={`现价: ${formatCurrency(item.Current, "₵", 2, false)}`}
          >
            <div className="flex items-center gap-1">
              <span className="font-semibold" style={{ color: fluctuationInfo.color }}>
                {formatCurrency(item.Current, "₵", 2)}
              </span>
            </div>
            <ChangeBadge change={item.Fluctuation} size="sm" />
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            <div
              className="flex min-w-0 flex-col items-center gap-0.5"
              title={`股息: ${formatCurrency(item.Rate, "₵", 2, false)}`}
            >
              <span className="truncate text-[10px] opacity-60">股息</span>
              <span className="truncate text-xs font-semibold">
                +{formatCurrency(item.Rate, "₵", 2)}
              </span>
            </div>
            <div
              className="flex min-w-0 flex-col items-center gap-0.5"
              title={`底价: ${formatCurrency(item.Price, "₵", 0, false)}`}
            >
              <span className="truncate text-[10px] opacity-60">底价</span>
              <span className="truncate text-xs font-semibold">
                {formatCurrency(item.Price, "₵", 0)}
              </span>
            </div>
            <div
              className="flex min-w-0 flex-col items-center gap-0.5"
              title={`数量: ${item.State?.toLocaleString() || 0}`}
            >
              <span className="truncate text-[10px] opacity-60">数量</span>
              <span className="truncate text-xs font-semibold">
                {item.State?.toLocaleString() || 0}
              </span>
            </div>
          </div>
          {/* 拍卖信息 */}
          {showAuction && auction && (
            <div className="flex w-full min-w-0 items-center justify-center gap-2 text-[10px]">
              <div
                className="flex min-w-0 items-center justify-center gap-1"
                title="竞拍人数 / 竞拍数量"
                style={{ color: "#a7e3ff" }}
              >
                <span className="font-semibold">
                  {auction.State?.toLocaleString() || 0} / {auction.Type?.toLocaleString() || 0}
                </span>
              </div>
              {auction.Price != 0 && (
                <div
                  className="flex min-w-0 items-center justify-center gap-1"
                  title="出价 / 数量"
                  style={{ color: "#ffa7cc" }}
                >
                  <span className="font-semibold">
                    {formatCurrency(auction.Price, "₵", 2)} /{" "}
                    {auction.Amount?.toLocaleString() || 0}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* 拍卖按钮 */}
          {showButtons && (
            <div className="flex w-full min-w-0 items-center justify-center gap-2">
              <Button
                variant="solid"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuctionClick && onAuctionClick(item);
                }}
              >
                出价
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onHistoryClick && onHistoryClick(item);
                }}
              >
                往期
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return container;
}

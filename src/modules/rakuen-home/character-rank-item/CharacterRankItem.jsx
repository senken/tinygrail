import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { ChangeBadge } from "@src/components/ChangeBadge.jsx";
import { formatCurrency, formatTimeAgo } from "@src/utils/format.js";
import { normalizeAvatar } from "@src/utils/oos.js";

/**
 * 角色排行项组件
 * @param {Object} props
 * @param {Object} props.item - 角色数据
 * @param {number} props.rank - 排名
 * @param {Function} props.onClick - 点击回调函数
 */
export function CharacterRankItem({ item, rank, onClick }) {
  /**
   * 获取涨跌幅信息
   * @param {number} fluctuation - 涨跌幅
   * @returns {Object} 包含text和color的对象
   */
  const getFluctuationInfo = (fluctuation) => {
    if (fluctuation > 0) {
      return {
        text: `+${(fluctuation * 100).toFixed(2)}%`,
        color: "#ffa7cc",
      };
    }
    if (fluctuation < 0) {
      return {
        text: `${(fluctuation * 100).toFixed(2)}%`,
        color: "#a7e3ff",
      };
    }
    return { text: "0.00%", color: "#d2d2d2" };
  };

  const fluctuationInfo = getFluctuationInfo(item.Fluctuation);

  return (
    <div
      data-character-id={item.Id}
      className="tg-bg-content tg-border-card flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-lg p-3 transition-shadow hover:shadow-md"
      onClick={() => {
        if (onClick) {
          onClick(item.Id);
        }
      }}
    >
      {/* 头像 */}
      <div className="relative">
        <div
          className="tg-avatar h-16 w-16 border-2 border-white/30"
          style={{
            backgroundImage: `url(${normalizeAvatar(item.Icon)})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        {/* 排名 */}
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
          <span
            className="min-w-0 truncate text-sm font-semibold"
            title={item.CharacterName || item.Name}
          >
            {item.CharacterName || item.Name}
          </span>
        </div>
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
              title={`总股份: ${item.Total.toLocaleString()}`}
            >
              <span className="truncate text-[10px] opacity-60">总股份</span>
              <span className="truncate text-xs font-semibold">{item.Total.toLocaleString()}</span>
            </div>
            <div
              className="flex min-w-0 flex-col items-center gap-0.5"
              title={`总市值: ${formatCurrency(item.MarketValue, "₵", 2, false)}`}
            >
              <span className="truncate text-[10px] opacity-60">总市值</span>
              <span className="truncate text-xs font-semibold">
                {formatCurrency(item.MarketValue, "₵", 2)}
              </span>
            </div>
          </div>
          <div
            className="flex items-center justify-center gap-2 text-[10px]"
            title="买入 / 卖出 / 成交量"
          >
            <span style={{ color: "#ffa7cc" }}>+{item.Bids?.toLocaleString() || 0}</span>
            <span style={{ color: "#a7e3ff" }}>-{item.Asks?.toLocaleString() || 0}</span>
            <span style={{ color: "#d2d2d2" }}>{item.Change?.toLocaleString() || 0}</span>
          </div>
          <div className="truncate text-center opacity-60">{formatTimeAgo(item.LastOrder)}</div>
        </div>
      </div>
    </div>
  );
}

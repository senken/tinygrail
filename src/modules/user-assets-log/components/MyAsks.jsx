import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { formatCurrency, formatNumber, formatTimeAgo } from "@src/utils/format.js";
import { normalizeAvatar } from "@src/utils/oos.js";

/**
 * 我的卖单Tab组件
 * @param {Object} props - 组件属性
 * @param {Object} props.data - 卖单数据
 * @param {Function} props.onPageChange - 分页变化回调
 * @param {Function} props.onCharacterClick - 角色点击回调
 */
export function MyAsks({ data, onPageChange, onCharacterClick }) {
  if (!data) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-sm opacity-60">加载中...</p>
      </div>
    );
  }

  if (!data.items || data.items.length === 0) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-sm opacity-60">暂无数据</p>
      </div>
    );
  }

  return (
    <div id="tg-my-asks-tab" className="flex w-full flex-col gap-4">
      <div id="tg-my-asks-list" className="tg-bg-content rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.items.map((item, index) => {
            const fluctuation = item.Fluctuation || 0;
            let bgColor = "#d2d2d2";
            let fluText = "--";

            if (fluctuation > 0) {
              bgColor = "#ff658d";
              fluText = `+${formatNumber(fluctuation * 100, 2)}%`;
            } else if (fluctuation < 0) {
              bgColor = "#65bcff";
              fluText = `${formatNumber(fluctuation * 100, 2)}%`;
            }

            return (
              <li
                id="tg-my-asks-item"
                data-character-id={item.CharacterId}
                className="flex cursor-pointer items-center justify-between gap-3 px-3 py-1 transition-colors even:bg-gray-50/50 hover:bg-gray-100 dark:even:bg-gray-800/30 dark:hover:bg-gray-800/50"
                onClick={() => onCharacterClick && onCharacterClick(item.CharacterId)}
              >
                {/* 头像 */}
                <div>
                  <img
                    src={normalizeAvatar(item.Icon)}
                    alt={item.Name || `#${item.CharacterId}`}
                    className="size-10 rounded-lg border border-gray-200 object-cover object-top dark:border-gray-700"
                  />
                </div>

                {/* 角色信息 */}
                <div className="flex-1">
                  {/* 角色名称和操作时间 */}
                  <div className="flex items-center gap-2">
                    <LevelBadge level={item.Level} zeroCount={item.ZeroCount} />
                    <span className="text-base font-bold">
                      {item.Name || `#${item.CharacterId}`}
                    </span>
                    <span className="text-xs opacity-60">{formatTimeAgo(item.LastOrder)}</span>
                  </div>

                  {/* 卖单数量 */}
                  <div className="mt-1 text-xs opacity-60">
                    卖单数量：{formatNumber(item.State || 0, 0)}
                  </div>
                </div>

                {/* 价格标签 */}
                <div>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: bgColor,
                      color: "#fff",
                    }}
                    title={`₵${formatNumber(item.MarketValue || 0, 0)} / ${formatNumber(item.Total || 0, 0)}`}
                  >
                    {formatCurrency(item.Current || 0, "₵", 2, false)} {fluText}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 分页 */}
      {data.totalPages && data.totalPages >= 1 && (
        <div className="flex w-full justify-center">
          <Pagination
            current={Number(data.currentPage) || 1}
            total={Number(data.totalPages)}
            onChange={(page) => onPageChange && onPageChange(page)}
          />
        </div>
      )}
    </div>
  );
}

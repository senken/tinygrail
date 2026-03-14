import { formatTimeAgo, formatNumber } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { normalizeAvatar } from "@src/utils/oos.js";

/**
 * 我的道具Tab组件
 * @param {Object} props - 组件属性
 * @param {Object} props.data - 道具数据
 * @param {Function} props.onPageChange - 分页变化回调
 */
export function MyItemsTab({ data, onPageChange }) {
  if (!data) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">加载中...</p>
      </div>
    );
  }

  if (!data.items || data.items.length === 0) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">暂无数据</p>
      </div>
    );
  }

  return (
    <div id="tg-my-items-tab" className="flex w-full flex-col gap-4">
      <div id="tg-my-items-list" className="tg-bg-content rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.items.map((item, index) => {
            return (
              <li
                id="tg-my-items-item"
                data-item-id={item.Id}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors even:bg-gray-50/50 dark:even:bg-gray-800/30"
              >
                {/* 图标 */}
                {item.Icon && (
                  <div>
                    <img
                      src={normalizeAvatar(item.Icon)}
                      alt={item.Name || `#${item.Id}`}
                      className="h-12 w-12 rounded-lg border border-gray-200 object-cover object-top dark:border-gray-700"
                    />
                  </div>
                )}
                {/*道具信息 */}
                <div className="flex-1">
                  {/* 道具名称和时间 */}
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">{item.Name || `#${item.Id}`}</span>
                    <span className="text-xs opacity-60">{formatTimeAgo(item.Last)}</span>
                  </div>

                  {/* 道具描述 */}
                  <div className="mt-1 text-xs opacity-60">「{item.Line || ""}」</div>
                </div>
                {/* 数量 */}
                <div>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: "#FFC107" }}
                  >
                    ×{formatNumber(item.Amount || 0, 0)}
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

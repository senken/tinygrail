import { formatCurrency, formatTimeAgo } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { normalizeAvatar } from "@src/utils/oos.js";

/**
 * 我的拍卖Tab组件
 * @param {Object} props - 组件属性
 * @param {Object} props.data - 拍卖数据
 * @param {Function} props.onPageChange - 分页变化回调
 * @param {Function} props.onCharacterClick - 角色点击回调
 * @param {Function} props.onCancelAuction - 取消竞拍回调
 */
export function MyAuctions({ data, onPageChange, onCharacterClick, onCancelAuction }) {
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

  /**
   * 获取拍卖状态文本和颜色
   * @param {number} state - 拍卖状态
   * @returns {Object} 状态文本和颜色
   */
  const getAuctionStatus = (state) => {
    switch (state) {
      case 0:
        return { text: "竞拍中", color: "#45d216" };
      case 1:
        return { text: "竞拍成功", color: "#ff658d" };
      case 2:
        return { text: "竞拍失败", color: "#d2d2d2" };
      default:
        return { text: "竞拍失败", color: "#d2d2d2" };
    }
  };

  return (
    <div id="tg-my-auctions-tab" className="flex w-full flex-col gap-4">
      <div id="tg-my-auctions-list" className="tg-bg-content rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.items.map((item, index) => {
            const status = getAuctionStatus(item.State ?? 2);
            const isAuctioning = item.State === 0;

            return (
              <li
                id="tg-my-auctions-item"
                data-character-id={item.CharacterId}
                className="flex cursor-pointer items-start justify-between gap-3 px-3 py-1 transition-colors even:bg-gray-50/50 hover:bg-gray-100 dark:even:bg-gray-800/30 dark:hover:bg-gray-800/50"
                onClick={() => onCharacterClick && onCharacterClick(item.CharacterId)}
              >
                {/* 头像 */}
                {item.Icon && (
                  <div className="tg-avatar-border flex-shrink-0 border-2 border-gray-300 dark:border-white/30">
                    <img
                      src={normalizeAvatar(item.Icon)}
                      alt={item.Name || `#${item.CharacterId}`}
                      className="tg-avatar size-10 object-cover object-top"
                    />
                  </div>
                )}

                {/* 角色信息 */}
                <div className="flex-1">
                  {/* 角色名称和操作时间 */}
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">
                      {item.Name || `#${item.CharacterId}`}
                    </span>
                    {isAuctioning && (
                      <span
                        className="tg-link cursor-pointer text-xs hover:opacity-75"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelAuction && onCancelAuction(item.Id);
                        }}
                      >
                        [取消]
                      </span>
                    )}
                    <span className="text-xs opacity-60">{formatTimeAgo(item.Bid)}</span>
                  </div>

                  {/* 拍卖底价和英灵殿 */}
                  <div className="mt-1 text-xs opacity-60">
                    拍卖底价：{formatCurrency(item.Start || 0, "₵", 2, false)}
                    <span className="mx-2">•</span>
                    英灵殿：{item.Type || 0}
                  </div>

                  {/* 出价和数量 */}
                  <div
                    className="mt-1 text-xs"
                    style={isAuctioning ? { color: "#ffa7cc" } : { opacity: 0.6 }}
                  >
                    出价：{formatCurrency(item.Price, "₵", 2, false)}
                    <span className="mx-2">•</span>
                    数量：{item.Amount}
                  </div>

                  {/* 竞拍人数和竞拍数量 */}
                  {isAuctioning && item.auctionDetail && (
                    <div className="mt-1 text-xs" style={{ color: "#a7e3ff" }}>
                      竞拍人数：{item.auctionDetail.State || 0}
                      <span className="mx-2">•</span>
                      竞拍数量：{item.auctionDetail.Type || 0}
                    </div>
                  )}
                </div>

                {/* 拍卖状态 */}
                <div className="self-center">
                  <span
                    className="rounded px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: status.color,
                      color: "#fff",
                    }}
                  >
                    {status.text}
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

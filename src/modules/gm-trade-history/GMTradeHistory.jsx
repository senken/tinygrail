import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { getUserTradeHistory } from "@src/api/user.js";
import { getCharacterTradeHistory } from "@src/api/chara.js";
import { createRequestManager } from "@src/utils/requestManager.js";
import { formatCurrency, formatDateTime } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { unescapeHtml } from "@src/utils/escape.js";
import { scrollToTop } from "@src/utils/scroll.js";

/**
 * GM交易记录组件
 * @param {Object} props
 * @param {number} props.userId - 用户ID（与characterId二选一）
 * @param {number} props.characterId - 角色ID（与userId二选一）
 * @param {Function} props.onUserClick - 用户点击回调
 * @param {Function} props.onCharacterClick - 角色点击回调
 */
export function GMTradeHistory({ userId, characterId, onUserClick, onCharacterClick }) {
  const container = <div id="tg-gm-trade-history" className="max-w-4xl" />;

  // 创建请求管理器
  const requestManager = createRequestManager();

  // 判断是用户模式还是角色模式
  const isUserMode = !!userId;

  const { setState, render } = createMountedComponent(container, (state) => {
    const { tradeHistoryData = null } = state || {};

    if (!tradeHistoryData) {
      return <div className="p-4 text-center">加载中...</div>;
    }

    if (tradeHistoryData.error) {
      return <div className="p-4 text-center">加载失败</div>;
    }

    const { items = [], totalPages = 0, currentPage = 1 } = tradeHistoryData;

    // 分页处理
    const handlePageChange = (page) => {
      loadTradeHistoryPage(page);
    };

    return (
      <div>
        {items.length > 0 ? (
          <div>
            {/* 交易记录列表 */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item, index) => {
                // 检查是否为可疑交易（相同IP且IP不为空）
                const isSuspicious =
                  item.SellerIp !== "no record" &&
                  item.BuyerIp !== "no record" &&
                  item.SellerIp === item.BuyerIp;

                return (
                  <div
                    className={`py-3 text-sm first:pt-0 last:pb-0 ${
                      isSuspicious ? "bg-red-50 px-3 dark:bg-red-900/20" : ""
                    }`}
                  >
                    {/* 时间和角色名 */}
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {isUserMode && (
                        <span
                          className="tg-link cursor-pointer font-medium"
                          onClick={() => onCharacterClick && onCharacterClick(item.CharacterId)}
                        >
                          #{item.CharacterId} 「{item.Name}」
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(item.TradeTime)}
                      </span>
                    </div>

                    {/* 交易信息 */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className="tg-link cursor-pointer"
                        onClick={() => onUserClick && onUserClick(item.Seller)}
                      >
                        {unescapeHtml(item.SellerName)} ({item.SellerIp})
                      </span>
                      <span className="text-gray-400">→</span>
                      <span
                        className="tg-link cursor-pointer"
                        onClick={() => onUserClick && onUserClick(item.Buyer)}
                      >
                        {unescapeHtml(item.BuyerName)} ({item.BuyerIp})
                      </span>
                    </div>

                    {/* 价格和数量 */}
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.Price, "₵", 2, false)} / {item.Amount}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  current={currentPage}
                  total={totalPages}
                  onChange={(page) => handlePageChange(page)}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">暂无交易记录</div>
        )}
      </div>
    );
  });

  // 加载交易记录分页
  const loadTradeHistoryPage = (page) => {
    const apiCall = isUserMode
      ? getUserTradeHistory(userId, page, 48)
      : getCharacterTradeHistory(characterId, page, 48);

    requestManager.execute(
      () => apiCall,
      (result) => {
        if (result.success) {
          setState({ tradeHistoryData: result.data });
          scrollToTop(container);
        } else {
          setState({ tradeHistoryData: { error: true } });
        }
      }
    );
  };

  // 初始加载
  render();
  loadTradeHistoryPage(1);

  return container;
}

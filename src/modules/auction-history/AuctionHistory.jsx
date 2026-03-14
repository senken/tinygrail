import { getAuctionHistory } from "@src/api/chara.js";
import { formatCurrency, formatNumber, formatDateTime } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";

/**
 * 往期拍卖组件
 * @param {Object} props
 * @param {number} props.characterId - 角色ID
 */
export function AuctionHistory({ characterId }) {
  let historyData = [];
  let currentPage = 1;

  const descDiv = <div className="text-sm text-gray-600 dark:text-gray-400" />;
  const resultContainer = <div className="flex flex-col" />;
  const paginationContainer = <div className="flex justify-center" />;

  /**
   * 渲染分页组件
   */
  const renderPagination = () => {
    paginationContainer.innerHTML = "";

    const pagination = (
      <Pagination current={currentPage} type="simple" onChange={handlePageChange} />
    );
    paginationContainer.appendChild(pagination);
  };

  /**
   * 处理页码变化
   * @param {number} page - 新页码
   */
  const handlePageChange = (page) => {
    loadAuctionHistory(page);
  };

  /**
   * 渲染拍卖历史列表
   */
  const renderHistoryList = () => {
    resultContainer.innerHTML = "";

    if (!historyData || historyData.length === 0) {
      descDiv.textContent = "暂无拍卖数据";
      resultContainer.style.display = "none";
      renderPagination();
      return;
    }

    let success = 0;
    let total = 0;

    historyData.forEach((auction) => {
      let stateClass = "";
      let stateName = "失败";

      if (auction.State === 1) {
        success++;
        total += auction.Amount;
        stateClass = "text-green-600 dark:text-green-400";
        stateName = "成功";
      } else {
        stateClass = "text-red-600 dark:text-red-400";
      }

      const record = (
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 py-2 text-sm last:border-b-0 dark:border-gray-700">
          {/* 左侧：用户信息 */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={auction.Username !== "tinygrail" ? "bgm-color" : ""}>
                {auction.Nickname}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {formatCurrency(auction.Price)} / {formatNumber(auction.Amount, 0)}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDateTime(auction.Bid, "YYYY-MM-DD HH:mm:ss")}
            </span>
          </div>
          {/* 右侧：拍卖结果 */}
          <span className={`font-medium ${stateClass}`}>{stateName}</span>
        </div>
      );

      resultContainer.appendChild(record);
    });

    descDiv.textContent = `共有${historyData.length}人参与拍卖，成功${success}人 / ${total}股`;
    resultContainer.style.display = "flex";
    renderPagination();
  };

  /**
   * 加载往期拍卖数据
   * @param {number} page - 页码
   * @returns {Promise<void>}
   */
  const loadAuctionHistory = async (page = 1) => {
    const result = await getAuctionHistory(characterId, page);

    if (result.success) {
      historyData = result.data;
      currentPage = page;
      renderHistoryList();
    } else {
      descDiv.textContent = "暂无拍卖数据";
      resultContainer.style.display = "none";
      renderPagination();
    }
  };

  // 组件加载时请求数据
  loadAuctionHistory();

  return (
    <div
      id="tg-auction-history"
      data-character-id={characterId}
      className="flex min-w-64 flex-col gap-2"
    >
      <div className="min-h-32">
        {/* 描述信息 */}
        {descDiv}

        {/* 拍卖历史列表 */}
        {resultContainer}
      </div>

      {/* 分页 */}
      {paginationContainer}
    </div>
  );
}

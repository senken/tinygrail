import { getCharacterCharts } from "@src/api/chara.js";
import { formatCurrency, formatDateTime, formatNumber } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";

/**
 * 交易记录组件
 * @param {Object} props
 * @param {number} props.characterId - 角色ID
 */
export function TradeHistory({ characterId }) {
  let allRecords = [];
  let currentPage = 1;
  const pageSize = 10;

  const loadingDiv = <div className="text-center text-gray-600 dark:text-gray-400">加载中...</div>;
  const headerDiv = (
    <div className="grid grid-cols-4 gap-2 border-b border-gray-300 pb-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">
      <div>交易时间</div>
      <div className="text-right">价格</div>
      <div className="text-right">数量</div>
      <div className="text-right">交易额</div>
    </div>
  );
  const resultContainer = <div className="flex flex-col gap-2" />;
  const paginationContainer = <div className="flex justify-center" />;

  // 初始隐藏表头和其他容器
  headerDiv.style.display = "none";
  resultContainer.style.display = "none";
  paginationContainer.style.display = "none";

  /**
   * 渲染分页组件
   */
  const renderPagination = () => {
    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(allRecords.length / pageSize);
    if (totalPages > 1) {
      const pagination = (
        <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
      );
      paginationContainer.appendChild(pagination);
      paginationContainer.style.display = "flex";
    } else {
      paginationContainer.style.display = "none";
    }
  };

  /**
   * 渲染交易记录列表
   */
  const renderTradeList = () => {
    resultContainer.innerHTML = "";

    const totalPages = Math.ceil(allRecords.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const records = allRecords.slice(startIndex, endIndex);

    if (records.length === 0) {
      const emptyDiv = (
        <div className="text-center text-gray-600 dark:text-gray-400">暂无交易记录</div>
      );
      resultContainer.appendChild(emptyDiv);
      resultContainer.style.display = "block";
      return;
    }

    // 渲染记录
    records.forEach((record) => {
      const price = record.Amount > 0 ? record.Price / record.Amount : 0;
      const row = (
        <div className="grid grid-cols-4 gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400" title="交易时间">
            {formatDateTime(record.Time, "YYYY-MM-DD HH:mm")}
          </span>
          <span className="text-right text-gray-900 dark:text-gray-100" title="价格">
            {formatCurrency(price, "₵", 2, false)}
          </span>
          <span className="text-right text-gray-900 dark:text-gray-100" title="数量">
            {formatNumber(record.Amount, 0)}
          </span>
          <span className="text-right text-gray-900 dark:text-gray-100" title="交易额">
            {formatCurrency(record.Price)}
          </span>
        </div>
      );
      resultContainer.appendChild(row);
    });

    resultContainer.style.display = "flex";
    renderPagination();
  };

  /**
   * 处理页码变化
   * @param {number} page - 新页码
   */
  const handlePageChange = (page) => {
    currentPage = page;
    renderTradeList();
  };

  /**
   * 加载交易记录数据
   * @returns {Promise<void>}
   */
  const loadTradeHistory = async () => {
    const result = await getCharacterCharts(characterId);

    if (result.success) {
      allRecords = (result.data || []).reverse();
      renderTradeList();
    } else {
      const emptyDiv = (
        <div className="text-center text-gray-600 dark:text-gray-400">暂无交易记录</div>
      );
      resultContainer.appendChild(emptyDiv);
      resultContainer.style.display = "block";
    }

    // 隐藏加载中，显示内容
    loadingDiv.style.display = "none";
    headerDiv.style.display = "grid";
  };

  // 组件加载时请求数据
  loadTradeHistory();

  return (
    <div
      id="tg-trade-history"
      data-character-id={characterId}
      className="flex min-w-64 flex-col gap-2"
    >
      {loadingDiv}

      {/* 表头 */}
      {headerDiv}

      {/* 记录列表 */}
      {resultContainer}

      {/* 分页 */}
      {paginationContainer}
    </div>
  );
}

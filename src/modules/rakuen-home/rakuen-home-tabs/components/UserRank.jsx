import { Avatar } from "@src/components/Avatar.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { formatCurrency, formatTimeAgo } from "@src/utils/format.js";
import { unescapeHtml } from "@src/utils/escape.js";

/**
 * 用户排行组件
 * @param {Object} props
 * @param {Array} props.data - 用户排行列表数据
 * @param {number} props.currentPage - 当前页码
 * @param {Function} props.onPageChange - 页码变化回调函数
 * @param {Function} props.onUserClick - 用户点击回调函数
 */
export function UserRank({ data, currentPage = 1, onPageChange, onUserClick }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-sm opacity-60">
        <p>暂无数据</p>
      </div>
    );
  }

  const container = <div id="tg-rakuen-home-user-rank" className="flex w-full flex-col gap-4" />;
  const gridDiv = <div id="tg-rakuen-home-user-rank-list" className="grid w-full gap-4" />;
  const paginationDiv = (
    <div id="tg-rakuen-home-user-rank-pagination" className="flex w-full justify-center" />
  );

  /**
   * 获取排名变化信息
   * @param {Object} item - 用户数据
   * @param {number} currentRank - 当前排名
   * @returns {Object} 包含text和color的对象
   */
  const getRankChange = (item, currentRank) => {
    if (item.LastIndex === 0) {
      return { text: "new", color: "#45d216" };
    }

    if (item.LastIndex > currentRank) {
      return { text: `+${item.LastIndex - currentRank}`, color: "#ff658d" };
    }

    if (item.LastIndex < currentRank) {
      return { text: `${item.LastIndex - currentRank}`, color: "#65bcff" };
    }

    return { text: "-", color: "#d2d2d2" };
  };

  // 渲染函数
  const renderItems = (cols) => {
    gridDiv.innerHTML = "";
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    gridDiv.style.gap = "0px";

    data.forEach((item, index) => {
      const pageSize = 20;
      const currentRank = (currentPage - 1) * pageSize + index + 1;
      const rankChange = getRankChange(item, currentRank);
      const nickname = unescapeHtml(item.Nickname);
      const isBanned = item.State === 666;

      const userItem = (
        <div
          className="tg-bg-content flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-lg p-4"
          onClick={() => {
            if (onUserClick) {
              onUserClick(item.Name);
            }
          }}
          data-user-name={item.Name}
          data-rank={currentRank}
        >
          <Avatar
            src={item.Avatar}
            alt={nickname}
            size="lg"
            rank={currentRank}
            isBanned={isBanned}
          />
          <div className="flex w-full min-w-0 flex-col items-center gap-2">
            <div className="flex w-full min-w-0 items-center justify-center gap-2 px-2">
              <span
                className={`min-w-0 truncate text-sm font-semibold ${isBanned ? "text-red-500" : ""}`}
                title={nickname}
              >
                {nickname}
              </span>
              <span
                className="inline-block h-4 rounded-md px-1.5 py-0 text-[10px] font-semibold leading-4 text-white"
                style={{
                  backgroundColor: rankChange.color,
                }}
              >
                {rankChange.text}
              </span>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-1.5 text-xs">
              <div
                className="flex min-w-0 items-center justify-center gap-1 font-semibold"
                title={`总资产: ${formatCurrency(item.Assets, "₵", 2, false)}`}
              >
                <span className="opacity-60">总资产</span>
                <span style={{ color: rankChange.color }}>
                  {formatCurrency(item.Assets, "₵", 2)}
                </span>
              </div>
              <div className="grid w-full grid-cols-3 gap-2 opacity-60">
                <div
                  className="flex min-w-0 flex-col items-center gap-0.5"
                  title={`每周股息: ${formatCurrency(item.Share, "₵", 2, false)}`}
                >
                  <span className="truncate text-[10px]">股息</span>
                  <span className="truncate text-xs font-semibold">
                    {formatCurrency(item.Share, "₵", 2)}
                  </span>
                </div>
                <div
                  className="flex min-w-0 flex-col items-center gap-0.5"
                  title={`流动资金: ${formatCurrency(item.TotalBalance, "₵", 2, false)}`}
                >
                  <span className="truncate text-[10px]">流动</span>
                  <span className="truncate text-xs font-semibold">
                    {formatCurrency(item.TotalBalance, "₵", 2)}
                  </span>
                </div>
                <div
                  className="flex min-w-0 flex-col items-center gap-0.5"
                  title={`初始资金: ${formatCurrency(item.Principal, "₵", 2, false)}`}
                >
                  <span className="truncate text-[10px]">初始</span>
                  <span className="truncate text-xs font-semibold">
                    {formatCurrency(item.Principal, "₵", 2)}
                  </span>
                </div>
              </div>
              <div
                className="truncate text-center opacity-60"
                title={`最后活跃: ${formatTimeAgo(item.LastActiveDate)}`}
              >
                {formatTimeAgo(item.LastActiveDate)}
              </div>
            </div>
          </div>
        </div>
      );

      gridDiv.appendChild(userItem);
    });
  };

  // 计算列数
  const calculateColumns = (width) => {
    const minCellWidth = 200; // 最小单元格宽度
    const gap = 0;

    // 计算可以容纳的最大列数
    let cols = Math.floor((width + gap) / (minCellWidth + gap));

    // 20的因数
    const divisors = [10, 5, 4, 2, 1];
    for (const divisor of divisors) {
      if (cols >= divisor) {
        return divisor;
      }
    }
    return 1;
  };

  // 初始渲染
  const initialCols = calculateColumns(container.offsetWidth || 800);
  renderItems(initialCols);

  container.appendChild(gridDiv);

  // 添加分页
  const totalPages = 5;
  if (totalPages > 1) {
    const pagination = (
      <Pagination
        current={currentPage}
        total={totalPages}
        onChange={(page) => onPageChange && onPageChange(page)}
      />
    );
    paginationDiv.appendChild(pagination);
    container.appendChild(paginationDiv);
  }

  // 使用ResizeObserver监听容器宽度变化
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      const newCols = calculateColumns(width);
      renderItems(newCols);
    }
  });

  observer.observe(container);

  return container;
}

import { Temple } from "@src/components/Temple.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { formatNumber, getTimeDiff, formatTimeAgo } from "@src/utils/format.js";

/**
 * 精炼排行组件
 * @param {Object} props
 * @param {Object} props.data - 精炼排行数据
 * @param {Function} props.onPageChange - 页码变化回调函数
 * @param {Function} props.onCharacterClick - 角色点击回调函数
 * @param {Function} props.onTempleClick - 圣殿点击回调函数
 * @param {Function} props.onUserClick - 用户点击回调函数
 */
export function RefineRank({ data, onPageChange, onCharacterClick, onTempleClick, onUserClick }) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="text-center text-sm opacity-60">
        <p>暂无数据</p>
      </div>
    );
  }

  const container = <div id="tg-rakuen-home-refine-rank" className="flex w-full flex-col gap-4" />;

  const gridDiv = <div id="tg-rakuen-home-refine-rank-list" className="grid w-full gap-4" />;
  const paginationDiv = (
    <div id="tg-rakuen-home-refine-rank-pagination" className="flex w-full justify-center" />
  );

  // 渲染
  const renderItems = (cols) => {
    gridDiv.innerHTML = "";
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    gridDiv.style.gap = "16px";

    data.items.forEach((item, index) => {
      const processedItem = {
        ...item,
        Name: item.CharacterName,
      };

      // 计算名次
      const currentPage = data.currentPage || 1;
      const pageSize = data.pageSize || 24;
      const rank = (currentPage - 1) * pageSize + index + 1;

      const itemContainer = (
        <div
          className="flex w-full min-w-0 flex-col gap-1"
          data-character-id={item.CharacterId}
          data-user-name={item.Name}
        >
          <Temple
            temple={processedItem}
            bottomText={`+${formatNumber(item.Rate)}`}
            onClick={(temple) => {
              if (onTempleClick) {
                onTempleClick(temple);
              }
            }}
          />
          <div className="flex min-w-0 items-center justify-start gap-1 text-sm">
            <span
              className="inline-block h-4 rounded-md px-1.5 py-0 text-[10px] font-semibold leading-4 text-white"
              style={{ backgroundColor: "#FFC107" }}
            >
              #{rank}
            </span>
            <span
              className="tg-link min-w-0 cursor-pointer truncate opacity-80 hover:opacity-100"
              onClick={() => {
                if (onCharacterClick) {
                  onCharacterClick(item.CharacterId);
                }
              }}
            >
              {item.CharacterName}
            </span>
          </div>
          <div className="flex h-5 min-w-0 items-center justify-start gap-1 text-xs opacity-60">
            <span
              className="tg-link min-w-0 cursor-pointer truncate hover:opacity-100"
              onClick={() => {
                if (onUserClick) {
                  onUserClick(item.Name);
                }
              }}
            >
              @{item.Nickname}
            </span>
          </div>
          <div className="flex min-w-0 justify-start text-xs opacity-60">
            <span className="truncate">{formatTimeAgo(item.LastActive)}</span>
          </div>
        </div>
      );
      gridDiv.appendChild(itemContainer);
    });
  };

  // 计算列数
  const calculateColumns = (width) => {
    const minCellWidth = 120;
    const gap = 16;

    // 计算可以容纳的最大列数
    let cols = Math.floor((width + gap) / (minCellWidth + gap));

    // 确保列数是24的因数
    const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
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
  if (data.totalPages && data.totalPages >= 1) {
    // 限制最多显示5页
    const maxPages = Math.min(data.totalPages, 5);
    const pagination = (
      <Pagination
        current={Number(data.currentPage) || 1}
        total={maxPages}
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

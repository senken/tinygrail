import { Temple } from "@src/components/Temple.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { formatNumber } from "@src/utils/format";

/**
 * 圣殿列表Tab
 * @param {Object} props
 * @param {Object} props.data - 圣殿数据
 * @param {Function} props.onPageChange - 页码变化回调函数
 * @param {Function} props.onCharacterClick - 角色点击回调函数
 * @param {Function} props.onTempleClick - 圣殿点击回调函数
 */
export function TemplesTab({ data, onPageChange, onCharacterClick, onTempleClick }) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">暂无圣殿</p>
      </div>
    );
  }

  const container = <div className="flex w-full flex-col gap-4" />;
  const gridDiv = <div className="grid w-full gap-4" />;
  const paginationDiv = <div className="flex w-full justify-center" />;

  // 计算列数
  const calculateColumns = (width) => {
    const minCellWidth = 120;
    const gap = 16;
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

  // 渲染子元素
  data.items.forEach((item) => {
    const itemContainer = (
      <div className="flex w-full min-w-0 flex-col gap-1">
        <Temple
          temple={item}
          bottomText={`+${formatNumber(item.Rate)}`}
          onClick={(temple) => {
            if (onTempleClick) {
              onTempleClick(temple);
            }
          }}
        />
        <div className="flex min-w-0 items-center justify-start gap-1 text-sm">
          <LevelBadge level={item.CharacterLevel} zeroCount={item.ZeroCount} />
          <span
            className="tg-link min-w-0 cursor-pointer truncate opacity-80 hover:opacity-100"
            onClick={() => {
              if (onCharacterClick) {
                onCharacterClick(item.CharacterId);
              }
            }}
          >
            {item.Name}
          </span>
        </div>
      </div>
    );
    gridDiv.appendChild(itemContainer);
  });

  container.appendChild(gridDiv);

  // 添加分页
  if (data.totalPages && data.totalPages >= 1) {
    const pagination = (
      <Pagination
        current={Number(data.currentPage) || 1}
        total={Number(data.totalPages)}
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
      gridDiv.style.gridTemplateColumns = `repeat(${newCols}, 1fr)`;
    }
  });

  observer.observe(container);

  return container;
}

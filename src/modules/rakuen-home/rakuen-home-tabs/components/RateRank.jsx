import { Pagination } from "@src/components/Pagination.jsx";
import { CharacterRankItem } from "@src/modules/rakuen-home/character-rank-item/CharacterRankItem.jsx";

/**
 * 最高股息组件
 * @param {Object} props
 * @param {Array} props.data - 最高股息列表数据
 * @param {number} props.currentPage - 当前页码
 * @param {Function} props.onPageChange - 页码变化回调函数
 * @param {Function} props.onCharacterClick - 角色点击回调函数
 */
export function RateRank({ data, currentPage = 1, onPageChange, onCharacterClick }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-sm opacity-60">
        <p>暂无数据</p>
      </div>
    );
  }

  const container = <div id="tg-rakuen-home-rate-rank" className="flex w-full flex-col gap-4" />;
  const gridDiv = <div id="tg-rakuen-home-rate-rank-list" className="grid w-full gap-4" />;
  const paginationDiv = <div id="tg-rakuen-home-rate-rank-pagination" className="flex w-full justify-center" />;

  // 渲染函数
  const renderItems = (cols) => {
    gridDiv.innerHTML = "";
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    gridDiv.style.gap = "16px";

    data.forEach((item, index) => {
      const pageSize = 20;
      const currentRank = (currentPage - 1) * pageSize + index + 1;

      const characterItem = (
        <CharacterRankItem item={item} rank={currentRank} onClick={onCharacterClick} />
      );

      gridDiv.appendChild(characterItem);
    });
  };

  // 计算列数
  const calculateColumns = (width) => {
    const minCellWidth = 200;
    const gap = 16;

    // 计算可以容纳的最大列数
    let cols = Math.floor((width + gap) / (minCellWidth + gap));

    // 20的因数
    const divisors = [20, 10, 5, 4, 2, 1];
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

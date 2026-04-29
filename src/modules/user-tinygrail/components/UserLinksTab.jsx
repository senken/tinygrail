import { TempleLink } from "@src/components/TempleLink.jsx";
import { formatNumber } from "@src/utils/format";
import { Pagination } from "@src/components/Pagination.jsx";

/**
 * 角色连接列表Tab
 * @param {Object} props
 * @param {Object} props.data - 连接数据
 * @param {Function} props.onPageChange - 页码变化回调函数
 * @param {Function} props.onCharacterClick - 角色点击回调函数
 * @param {Function} props.onTempleClick - 圣殿点击回调函数
 */
export function UserLinksTab({ data, onPageChange, onCharacterClick, onTempleClick }) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">暂无连接</p>
      </div>
    );
  }

  const container = <div className="flex w-full flex-col gap-4" />;

  const gridDiv = <div className="grid w-full justify-items-center gap-2" />;
  const paginationDiv = <div className="flex w-full justify-center" />;

  // 渲染函数
  const renderItems = (cols, size) => {
    gridDiv.innerHTML = "";
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    data.items.forEach((item) => {
      // 跳过没有连接的项
      if (!item.Link) return;

      const minAssets = Math.min(item.Assets, item.Link.Assets);
      const itemContainer = (
        <div className="flex flex-col items-start gap-1">
          <TempleLink
            temple1={item}
            temple2={item.Link}
            size={size}
            onNameClick={(data) => {
              if (onCharacterClick) {
                onCharacterClick(data.CharacterId);
              }
            }}
            onCoverClick={(data) => {
              if (onTempleClick) {
                onTempleClick(data);
              }
            }}
          />
          <div className="text-xs opacity-80">+{formatNumber(minAssets, 0)}</div>
        </div>
      );
      gridDiv.appendChild(itemContainer);
    });
  };

  // 计算列数
  const calculateColumns = (width) => {
    const newSize = width >= 440 ? "small" : "mini";
    const minCellWidth = newSize === "small" ? 214 : 188;
    const gap = 8;

    // 计算可以容纳的最大列数
    let cols = Math.floor((width + gap) / (minCellWidth + gap));

    // 确保列数是12的因数
    const divisors = [12, 6, 4, 3, 2, 1];
    for (const divisor of divisors) {
      if (cols >= divisor) {
        return { cols: divisor, size: newSize };
      }
    }
    return { cols: 1, size: newSize };
  };

  // 初始渲染
  const initial = calculateColumns(container.offsetWidth || 800);
  renderItems(initial.cols, initial.size);

  container.appendChild(gridDiv);

  // 分页
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
      const result = calculateColumns(width);
      renderItems(result.cols, result.size);
    }
  });

  observer.observe(container);

  return container;
}

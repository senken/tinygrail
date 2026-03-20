import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";

/**
 * 角色列表Tab
 * @param {Object} props
 * @param {Object} props.data - 角色数据
 * @param {Function} props.onPageChange - 页码变化回调函数
 * @param {Function} props.onCharacterClick - 角色点击回调函数
 */
export function CharasTab({ data, onPageChange, onCharacterClick }) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">暂无角色</p>
      </div>
    );
  }

  const container = <div className="flex w-full flex-col gap-4" />;
  const gridDiv = <div className="grid w-full" />;
  const paginationDiv = <div className="flex w-full justify-center" />;

  // 渲染函数
  const renderItems = (cols, isMobile) => {
    gridDiv.innerHTML = "";

    if (isMobile) {
      // 移动端布局
      gridDiv.style.display = "flex";
      gridDiv.style.flexDirection = "column";
      gridDiv.style.gap = "0";
    } else {
      // PC端布局
      gridDiv.style.display = "grid";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      gridDiv.style.gap = "0.75rem";
    }

    data.items.forEach((item) => {
      const avatarUrl = normalizeAvatar(item.Icon);

      const itemDiv = (
        <div
          className={`flex min-w-0 cursor-pointer items-center gap-3 ${isMobile ? "tg-bg-content border-b border-gray-200 p-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-700" : "tg-bg-content"}`}
          onClick={() => {
            if (onCharacterClick) {
              onCharacterClick(item.CharacterId);
            }
          }}
        >
          {/* 头像 */}
          <div
            className="size-12 flex-shrink-0 rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600"
            style={{ backgroundImage: `url(${avatarUrl})` }}
          />

          {/* 信息 */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-1 text-sm font-medium">
              <LevelBadge level={item.Level} zeroCount={item.ZeroCount} />
              <span className="min-w-0 truncate">{item.Name}</span>
            </div>
            {isMobile ? (
              <div className="text-xs opacity-60">
                <span>持股：{item.UserTotal === 0 ? "--" : formatNumber(item.UserTotal, 0)}</span>
                <span className="mx-2">•</span>
                <span>
                  固定资产：{item.Sacrifices === 0 ? "--" : formatNumber(item.Sacrifices, 0)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className="text-xs opacity-60">
                  持股：{item.UserTotal === 0 ? "--" : formatNumber(item.UserTotal, 0)}
                </div>
                <div className="text-xs opacity-60">
                  固定资产：{item.Sacrifices === 0 ? "--" : formatNumber(item.Sacrifices, 0)}
                </div>
              </div>
            )}
          </div>
        </div>
      );

      gridDiv.appendChild(itemDiv);
    });
  };

  // 计算列数和是否为移动端
  const calculateLayout = (width) => {
    const isMobile = width < 640;

    if (isMobile) {
      return { cols: 1, isMobile: true };
    }

    const minCellWidth = 160;
    const gap = 12;

    // 计算可以容纳的最大列数
    let cols = Math.floor((width + gap) / (minCellWidth + gap));

    // 确保列数是48的因数
    const divisors = [48, 24, 16, 12, 8, 6, 4, 3, 2, 1];
    for (const divisor of divisors) {
      if (cols >= divisor) {
        return { cols: divisor, isMobile: false };
      }
    }
    return { cols: 1, isMobile: false };
  };

  // 初始渲染
  const initialLayout = calculateLayout(container.offsetWidth || 800);
  renderItems(initialLayout.cols, initialLayout.isMobile);

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

  // 使用 ResizeObserver 监听容器宽度变化
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      const layout = calculateLayout(width);
      renderItems(layout.cols, layout.isMobile);
    }
  });

  observer.observe(container);

  return container;
}

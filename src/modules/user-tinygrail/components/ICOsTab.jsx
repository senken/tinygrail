import { Pagination } from "@src/components/Pagination.jsx";
import { formatCurrency, formatRemainingTime } from "@src/utils/format.js";
import { normalizeAvatar } from "@src/utils/oos.js";

/**
 * ICO列表Tab
 * @param {Object} props
 * @param {Object} props.data - ICO数据
 * @param {Function} props.onPageChange - 页码变化回调函数
 * @param {Function} props.onCharacterClick - 角色点击回调函数
 */
export function ICOsTab({ data, onPageChange, onCharacterClick }) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">暂无ICO</p>
      </div>
    );
  }

  const container = <div className="flex w-full flex-col" />;
  const gridDiv = <div className="grid w-full" />;
  const paginationDiv = <div className="flex w-full justify-center" />;

  // 渲染函数
  const renderItems = (cols, isMobile) => {
    gridDiv.innerHTML = "";

    if (isMobile) {
      // 移动端布局：无间距
      gridDiv.style.display = "flex";
      gridDiv.style.flexDirection = "column";
      gridDiv.style.gap = "0";
    } else {
      // PC端布局：有间距
      gridDiv.style.display = "grid";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      gridDiv.style.gap = "0.75rem";
    }

    data.items.forEach((item) => {
      const avatarUrl = normalizeAvatar(item.Icon);
      const remainingTime = formatRemainingTime(item.End);

      const itemDiv = (
        <div
          className={`flex min-w-0 cursor-pointer items-start gap-3 ${
            isMobile
              ? "tg-bg-content border-b border-gray-200 p-3 px-3 py-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-700"
              : "tg-bg-content rounded-lg"
          }`}
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
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-1 text-sm font-medium">
              <span className="min-w-0 truncate">{item.Name}</span>
            </div>
            {isMobile ? (
              <div className="flex flex-col gap-0.5">
                <div className="text-xs opacity-60">
                  <span>已筹集：{formatCurrency(item.Total, "₵", 2, false)}</span>
                  <span className="mx-1">•</span>
                  <span>已注资：{formatCurrency(item.State, "₵", 2, false)}</span>
                </div>
                <div className="text-xs opacity-60">{remainingTime}</div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className="text-xs opacity-60">
                  已筹集：{formatCurrency(item.Total, "₵", 2, false)}
                </div>
                <div className="text-xs opacity-60">
                  已注资：{formatCurrency(item.State, "₵", 2, false)}
                </div>
                <div className="text-xs opacity-60">{remainingTime}</div>
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

    const minCellWidth = 240;
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

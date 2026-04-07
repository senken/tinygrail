import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { getUserFavorites } from "@src/modules/favorite/favoriteStorage.js";
import { getCachedUserAssets } from "@src/utils/session.js";

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
  const renderItems = (cols) => {
    gridDiv.innerHTML = "";

    gridDiv.style.display = "grid";
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridDiv.style.gap = "0rem";

    data.items.forEach((item) => {
      const avatarUrl = normalizeAvatar(item.Icon);

      // 获取角色所在的收藏夹
      const userAssets = getCachedUserAssets();
      const currentUserId = userAssets?.id;
      const favorites = getUserFavorites(currentUserId);
      const characterFavorites = favorites.filter(
        (f) => f.characters && f.characters.includes(item.CharacterId)
      );

      const itemDiv = (
        <div
          className="tg-bg-content flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-lg p-2"
          onClick={() => {
            if (onCharacterClick) {
              onCharacterClick(item.CharacterId);
            }
          }}
        >
          {/* 头像区域 */}
          <div className="relative flex-shrink-0">
            <div className="tg-avatar-border border-2 border-gray-300 dark:border-white/30">
              <div
                className="tg-avatar size-12 bg-cover bg-top"
                style={{ backgroundImage: `url(${avatarUrl})` }}
              />
            </div>
            <div className="absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4">
              <LevelBadge level={item.Level} zeroCount={item.ZeroCount} />
            </div>
          </div>

          {/* 信息区域 */}
          <div className="flex w-full flex-col items-center gap-1.5">
            {/* 角色名称 */}
            <div className="w-full min-w-0 text-center">
              <span className="block truncate text-sm font-semibold" title={item.Name}>
                {item.Name}
              </span>
            </div>

            {/* 收藏标签 */}
            {characterFavorites.length > 0 && (
              <div className="flex w-full flex-wrap items-center justify-center gap-1">
                {characterFavorites.map((favorite) => (
                  <span
                    className={`inline-block flex-shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold leading-4 text-white ${favorite.color}`}
                    title={favorite.name}
                  >
                    {favorite.name}
                  </span>
                ))}
              </div>
            )}

            {/* 数据信息 */}
            <div className="flex w-full flex-col items-center gap-0.5 text-xs opacity-70">
              <div>持股：{item.UserTotal === 0 ? "--" : formatNumber(item.UserTotal, 0)}</div>
              <div>固定资产：{item.Sacrifices === 0 ? "--" : formatNumber(item.Sacrifices, 0)}</div>
            </div>
          </div>
        </div>
      );

      gridDiv.appendChild(itemDiv);
    });
  };

  // 计算列数
  const calculateLayout = (width) => {
    const minCellWidth = 132;
    const gap = 0;

    // 计算可以容纳的最大列数
    let cols = Math.floor((width + gap) / (minCellWidth + gap));

    // 确保列数是48的因数
    const divisors = [48, 24, 16, 12, 8, 6, 4, 3, 2, 1];
    for (const divisor of divisors) {
      if (cols >= divisor) {
        return { cols: divisor };
      }
    }
    return { cols: 1 };
  };

  // 初始渲染
  const initialLayout = calculateLayout(container.offsetWidth || 800);
  renderItems(initialLayout.cols);

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
      renderItems(layout.cols);
    }
  });

  observer.observe(container);

  return container;
}

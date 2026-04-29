import { getLatestTemples } from "@src/api/chara.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { Temple } from "@src/components/Temple.jsx";
import { openCharacterBoxModal } from "@src/modules/character-box";
import { openTempleModal } from "@src/modules/temple-detail/TempleDetail.jsx";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { unescapeHtml } from "@src/utils/escape";
import { formatNumber } from "@src/utils/format.js";

/**
 * 最新圣殿组件
 */
export function LatestTemples() {
  const container = (
    <div
      id="tg-rakuen-home-latest-temples"
      className="tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    />
  );

  const { setState } = createMountedComponent(container, (state) => {
    const { templesData = null } = state || {};

    /**
     * 分页处理
     * @param {number} page - 页码
     */
    const handlePageChange = async (page) => {
      const result = await getLatestTemples(page);
      if (result.success) {
        setState({ templesData: result.data });
      }
    };

    const titleDiv = (
      <div id="tg-rakuen-home-latest-temples-header" className="flex items-center justify-between">
        <div id="tg-rakuen-home-latest-temples-title" className="text-sm font-semibold">
          / 最新圣殿
        </div>
      </div>
    );

    const contentDiv = <div id="tg-rakuen-home-latest-temples-content" className="mt-3" />;

    if (!templesData) {
      contentDiv.appendChild(
        <div className="text-center text-sm opacity-60">
          <p>加载中...</p>
        </div>
      );
    } else if (!templesData.items || templesData.items.length === 0) {
      contentDiv.appendChild(
        <div className="text-center text-sm opacity-60">
          <p>暂无数据</p>
        </div>
      );
    } else {
      const gridDiv = <div className="grid w-full gap-4" />;

      // 渲染函数
      const renderItems = (cols) => {
        gridDiv.innerHTML = "";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        templesData.items.forEach((item) => {
          // 处理数据字段
          const processedTemple = {
            ...item,
            Name: item.CharacterName,
          };

          const itemContainer = (
            <div className="flex w-full min-w-0 flex-col gap-1">
              <Temple
                temple={processedTemple}
                bottomText={`+${formatNumber(item.Rate)}`}
                onClick={(temple) => {
                  openTempleModal({
                    temple,
                    characterName: temple.Name,
                  });
                }}
                showProgress={false}
              />
              <div className="flex min-w-0 items-center justify-start gap-1 text-sm">
                <LevelBadge level={item.CharacterLevel} zeroCount={item.ZeroCount} />
                <span
                  className="tg-link min-w-0 cursor-pointer truncate opacity-80 hover:opacity-100"
                  onClick={() => {
                    openCharacterBoxModal(item.CharacterId);
                  }}
                >
                  {item.CharacterName}
                </span>
              </div>
              <div className="text-xs opacity-60">
                <div
                  className="tg-link cursor-pointer truncate hover:opacity-100"
                  onClick={() => openUserTinygrailModal(item.Name)}
                >
                  @{unescapeHtml(item.Nickname)}
                </div>
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
      const initialCols = calculateColumns(contentDiv.offsetWidth || 800);
      renderItems(initialCols);

      contentDiv.appendChild(gridDiv);

      // 分页
      if (templesData.totalPages && templesData.totalPages >= 1) {
        const paginationDiv = <div className="mt-4 flex w-full justify-center" />;
        const pagination = (
          <Pagination
            current={Number(templesData.currentPage) || 1}
            onChange={handlePageChange}
            type="simple"
          />
        );
        paginationDiv.appendChild(pagination);
        contentDiv.appendChild(paginationDiv);
      }

      // 使用ResizeObserver监听容器宽度变化
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          const newCols = calculateColumns(width);
          renderItems(newCols);
        }
      });

      observer.observe(contentDiv);
    }

    return (
      <div>
        {titleDiv}
        {contentDiv}
      </div>
    );
  });

  // 加载最新圣殿数据
  const loadLatestTemplesData = async () => {
    const result = await getLatestTemples(1);
    if (result.success) {
      setState({ templesData: result.data });
    } else {
      setState({ templesData: { items: [] } });
    }
  };

  loadLatestTemplesData();

  return container;
}

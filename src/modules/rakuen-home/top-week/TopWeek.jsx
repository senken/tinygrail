import { getAuctionList, getTopWeek, getTopWeekHistory } from "@src/api/chara.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { ChevronRightIcon } from "@src/icons/ChevronRightIcon.js";
import { RefreshCwIcon } from "@src/icons/RefreshCwIcon.js";
import { openAuctionModal } from "@src/modules/auction/Auction.jsx";
import { openCharacterBoxModal } from "@src/modules/character-box/utils/modalOpeners.jsx";
import { openTempleModal } from "@src/modules/temple-detail/TempleDetail.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { formatCurrency, formatNumber } from "@src/utils/format.js";
import { getCover, normalizeAvatar } from "@src/utils/oos.js";
import { openTopWeekHistoryModal } from "./components/TopWeekHistory.jsx";

/**
 * 每周萌王组件
 */
export function TopWeek() {
  const container = (
    <div
      id="tg-rakuen-home-top-week"
      className="tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    />
  );

  const { setState } = createMountedComponent(container, (state) => {
    const { topWeekData = null, isRefreshing = false } = state || {};

    /**
     * 刷新数据处理
     */
    const handleRefresh = async () => {
      if (isRefreshing) return;
      setState({ isRefreshing: true });
      await loadTopWeekData();
      setState({ isRefreshing: false });
    };

    /**
     * 圣殿图片点击处理
     * @param {Object} temple - 圣殿数据
     */
    const handleTempleClick = (temple) => {
      openTempleModal({
        temple,
        characterName: temple.Name,
        imageOnly: true,
      });
    };

    /**
     * 拍卖区域点击处理
     * @param {Object} item - 每周萌王数据
     */
    const handleAuctionClick = (item) => {
      openAuctionModal({
        characterId: item.CharacterId,
        characterName: item.CharacterName,
        basePrice: item.Price ?? 0,
        maxAmount: item.Sacrifices ?? 0,
        onSuccess: () => {
          handleRefresh();
        },
      });
    };

    /**
     * 往期萌王按钮点击处理
     */
    const handleHistoryClick = async () => {
      const result = await getTopWeekHistory(1);
      if (result.success) {
        openTopWeekHistoryModal({
          initialHistoryData: result.data.items,
          initialPage: result.data.currentPage,
          onCharacterClick: (characterId) => {
            openCharacterBoxModal(characterId);
          },
        });
      }
    };

    const titleDiv = (
      <div id="tg-rakuen-home-top-week-header" className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">/ 每周萌王</div>
          <button
            id="tg-rakuen-home-top-week-history-button"
            className="flex items-center gap-0.5 rounded-full border border-gray-300 px-2 py-0.5 text-xs transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            onClick={handleHistoryClick}
          >
            <span>往期萌王</span>
            <span className="opacity-60">
              <ChevronRightIcon className="size-3" />
            </span>
          </button>
        </div>
        <button
          id="tg-rakuen-home-top-week-refresh"
          className="tg-link flex items-center gap-1 text-xs opacity-60 transition-opacity hover:opacity-100"
          onClick={handleRefresh}
          title="刷新"
        >
          <RefreshCwIcon className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    );
    const contentDiv = <div id="tg-rakuen-home-top-week-content" className="mt-3" />;

    if (!topWeekData) {
      contentDiv.appendChild(
        <div className="text-center text-sm opacity-60">
          <p>加载中...</p>
        </div>
      );
    } else if (!topWeekData.length || topWeekData.length === 0) {
      contentDiv.appendChild(
        <div className="text-center text-sm opacity-60">
          <p>暂无数据</p>
        </div>
      );
    } else {
      const gridDiv = <div id="tg-rakuen-home-top-week-list" className="grid w-full gap-4" />;

      // 渲染函数
      const renderItems = (cols) => {
        gridDiv.innerHTML = "";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        topWeekData.forEach((item, index) => {
          const cover = getCover(item.Cover);
          const hasCover = !!item.Cover;
          const avatarUrl = normalizeAvatar(item.Avatar);
          const rank = index + 1;

          // 根据名次确定颜色
          const getRankColor = (rank) => {
            if (rank === 1) return "#ffc107";
            if (rank === 2) return "#c0c0c0";
            if (rank === 3) return "#b36b00";
            return "#ddd";
          };

          const rankColor = getRankColor(rank);

          const itemContainer = (
            <div
              className="tg-bg-content flex w-full flex-col overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700"
              data-character-id={item.CharacterId}
              data-rank={rank}
            >
              {/* 圣殿图片 */}
              <div
                className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden border-b-2"
                style={{ borderColor: rankColor }}
                onClick={() => handleTempleClick(item)}
              >
                {hasCover ? (
                  // 有圣殿图片
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage: `url(${cover})`,
                      backgroundPosition: "top",
                      backgroundSize: "cover",
                    }}
                  />
                ) : (
                  // 无圣殿图片
                  <div>
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${avatarUrl})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        filter: "blur(10px)",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="aspect-square w-1/2 rounded-full bg-cover bg-top"
                        style={{
                          backgroundImage: `url(${avatarUrl})`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 左上角名次 */}
                <div
                  className={`absolute left-1 top-1 flex items-center justify-center rounded-full px-2 text-white ${rank <= 3 ? "size-6 text-base font-bold" : "size-5 text-xs font-semibold"}`}
                  style={{ backgroundColor: rankColor }}
                >
                  {rank}
                </div>

                {/* 右下角Extra字段 */}
                {item.Extra !== undefined && (
                  <div
                    className={`absolute bottom-5 right-0 rounded-l-md px-2 py-0.5 text-xs font-semibold ${rank <= 3 ? "text-white" : "text-gray-700"}`}
                    style={{ backgroundColor: rankColor }}
                    title="超出总额"
                  >
                    +{formatCurrency(item.Extra, "₵", 0, false)}
                  </div>
                )}
              </div>

              {/* 角色信息 */}
              <div className="flex flex-col gap-2 p-2">
                <div className="flex items-center justify-between gap-1 text-sm">
                  <span
                    className="tg-link cursor-pointer truncate font-semibold opacity-80 hover:opacity-100"
                    onClick={() => openCharacterBoxModal(item.CharacterId)}
                    title={item.CharacterName}
                  >
                    {item.CharacterName}
                  </span>
                  <LevelBadge level={item.CharacterLevel} zeroCount={item.ZeroCount} />
                </div>

                {/* 数据信息 */}
                <div className="flex flex-col gap-0.5">
                  <div className="truncate text-xs opacity-60" title="竞拍人数 • 竞拍数量">
                    <span>{formatNumber(item.Type || 0, 0)} 人</span>
                    <span className="mx-1.5">•</span>
                    <span>{formatNumber(item.Assets || 0, 0)} 股</span>
                  </div>
                  <div className="truncate text-xs opacity-60">
                    <span>英灵殿：{formatNumber(item.Sacrifices || 0, 0)} 股</span>
                  </div>
                </div>

                {/* 均价和竞拍按钮 */}
                <div className="flex items-center justify-between gap-2">
                  <div className="bgm-color truncate text-sm font-bold" title="均价">
                    {formatCurrency(
                      ((item.Extra || 0) + (item.Price || 0) * (item.Sacrifices || 0)) /
                        (item.Assets || 1)
                    )}
                  </div>
                  <button
                    className={
                      item.auction?.Price > 0 && item.auction?.Amount > 0
                        ? "btn btn-xs rounded-full border-green-500 bg-green-500 text-white hover:border-green-600 hover:bg-green-600"
                        : "btn-bgm btn btn-xs rounded-full"
                    }
                    onClick={() => handleAuctionClick(item)}
                  >
                    {item.auction?.Price > 0 && item.auction?.Amount > 0 ? "改价" : "竞拍"}
                  </button>
                </div>
              </div>
            </div>
          );
          gridDiv.appendChild(itemContainer);
        });
      };

      // 计算列数（12的因数：12, 6, 4, 3, 2, 1）
      const calculateColumns = (width) => {
        const minCellWidth = 160;
        const gap = 16;

        // 计算可以容纳的最大列数
        let cols = Math.floor((width + gap) / (minCellWidth + gap));

        // 确保列数是12的因数
        const divisors = [12, 6, 4, 3, 2, 1];
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

  // 加载每周萌王数据
  const loadTopWeekData = async () => {
    const result = await getTopWeek();
    if (result.success) {
      // 获取所有CharacterId并调用getAuctionList
      const characterIds = result.data.map((item) => item.CharacterId);
      const auctionResult = await getAuctionList(characterIds);

      // 合并数据
      const mergedData = result.data.map((item) => {
        const auctionData =
          auctionResult.success && auctionResult.data
            ? auctionResult.data.find((auction) => auction.CharacterId === item.CharacterId)
            : null;
        return {
          ...item,
          auction: auctionData,
        };
      });

      setState({ topWeekData: mergedData });
    } else {
      setState({ topWeekData: [] });
    }
  };

  loadTopWeekData();

  return container;
}

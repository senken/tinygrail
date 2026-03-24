import { getTopWeek, getTopWeekHistory } from "@src/api/chara.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { getCover, normalizeAvatar } from "@src/utils/oos.js";
import { formatCurrency, formatNumber } from "@src/utils/format.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { TempleDetail } from "@src/modules/temple-detail/TempleDetail.jsx";
import { Auction } from "@src/modules/auction/Auction.jsx";
import { RefreshCwIcon } from "@src/icons/RefreshCwIcon.js";
import { ChevronRightIcon } from "@src/icons/ChevronRightIcon.js";
import { TopWeekHistory } from "./components/TopWeekHistory.jsx";
import { scrollToTop } from "@src/utils/scroll.js";

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

  // 存储Modal生成的ID
  let generatedCharacterModalId = null;
  let generatedAuctionModalId = null;
  let generatedHistoryModalId = null;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  const { setState } = createMountedComponent(container, (state) => {
    const {
      topWeekData = null,
      showCharacterModal = false,
      characterModalId = null,
      showTempleModal = false,
      templeModalData = null,
      showAuctionModal = false,
      auctionData = null,
      isRefreshing = false,
      showHistoryModal = false,
      historyData = null,
      historyCurrentPage = 1,
    } = state || {};

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
     * 角色点击处理
     * @param {number} characterId - 角色ID
     */
    const handleCharacterClick = (characterId) => {
      setState({
        showCharacterModal: true,
        characterModalId: characterId,
      });
    };

    /**
     * 圣殿图片点击处理
     * @param {Object} temple - 圣殿数据
     */
    const handleTempleClick = (temple) => {
      setState({
        showTempleModal: true,
        templeModalData: temple,
      });
    };

    /**
     * 拍卖区域点击处理
     * @param {Object} item - 每周萌王数据
     */
    const handleAuctionClick = (item) => {
      setState({
        showAuctionModal: true,
        auctionData: item,
      });
    };

    /**
     * 往期萌王按钮点击处理
     */
    const handleHistoryClick = async () => {
      setState({
        showHistoryModal: true,
        historyData: null,
        historyCurrentPage: 1,
      });
      const result = await getTopWeekHistory(1);
      if (result.success) {
        setState({
          historyData: result.data.items,
          historyCurrentPage: result.data.currentPage,
        });
      }
    };

    /**
     * 往期萌王分页处理
     * @param {number} page - 页码
     */
    const handleHistoryPageChange = async (page) => {
      const result = await getTopWeekHistory(page);
      if (result.success) {
        const newHistoryData = result.data.items;
        const newCurrentPage = result.data.currentPage;

        setState({
          historyData: newHistoryData,
          historyCurrentPage: newCurrentPage,
        });

        // 手动更新Modal内容
        if (generatedHistoryModalId) {
          const modalContent = document.querySelector(
            `#tg-modal[data-modal-id="${generatedHistoryModalId}"] #tg-modal-content`
          );
          if (modalContent) {
            modalContent.innerHTML = "";
            const newHistoryComponent = (
              <TopWeekHistory
                historyData={newHistoryData}
                currentPage={newCurrentPage}
                onPageChange={handleHistoryPageChange}
                onCharacterClick={(characterId) => {
                  setState({
                    showHistoryModal: false,
                    showCharacterModal: true,
                    characterModalId: characterId,
                  });
                }}
              />
            );
            modalContent.appendChild(newHistoryComponent);
            scrollToTop(modalContent);
          }
        }
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
              className="flex w-full flex-col gap-1"
              data-character-id={item.CharacterId}
              data-rank={rank}
            >
              {/* 圣殿图片 */}
              <div
                className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg border-2"
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
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-start gap-1 text-sm">
                  <LevelBadge level={item.CharacterLevel} zeroCount={item.ZeroCount} />
                  <span
                    className="tg-link cursor-pointer font-semibold opacity-80 hover:opacity-100"
                    onClick={() => handleCharacterClick(item.CharacterId)}
                  >
                    {item.CharacterName}
                  </span>
                </div>
                <div
                  className="tg-link cursor-pointer text-xs opacity-60 hover:opacity-100"
                  title="竞拍人数 / 竞拍数量 / 拍卖总数"
                  onClick={() => handleAuctionClick(item)}
                >
                  {formatNumber(item.Type || 0, 0)} / {formatNumber(item.Assets || 0, 0)} /{" "}
                  {formatNumber(item.Sacrifices || 0, 0)}
                </div>
              </div>
            </div>
          );
          gridDiv.appendChild(itemContainer);
        });
      };

      // 计算列数（12的因数：12, 6, 4, 3, 2, 1）
      const calculateColumns = (width) => {
        const minCellWidth = 120;
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
        {showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && (
          <Modal
            visible={showCharacterModal}
            onClose={() => setState({ showCharacterModal: false })}
            modalId={generatedCharacterModalId}
            getModalId={(id) => {
              generatedCharacterModalId = id;
            }}
            padding="p-6"
          >
            <CharacterBox characterId={characterModalId} sticky={true} />
          </Modal>
        )}
        {showTempleModal && templeModalData && (
          <Modal
            visible={showTempleModal}
            onClose={() => setState({ showTempleModal: false })}
            position="top"
            maxWidth={1080}
            padding="p-0"
            scrollMode="outside"
          >
            <TempleDetail
              temple={templeModalData}
              characterName={templeModalData.Name}
              imageOnly={true}
            />
          </Modal>
        )}
        {showAuctionModal && auctionData && !isModalExist(generatedAuctionModalId) && (
          <Modal
            visible={showAuctionModal}
            onClose={() => {
              setState({ showAuctionModal: false });
              handleRefresh();
            }}
            title={`拍卖 - #${auctionData.CharacterId ?? ""}「${auctionData.CharacterName ?? ""}」`}
            position="center"
            maxWidth={480}
            modalId={generatedAuctionModalId}
            getModalId={(id) => {
              generatedAuctionModalId = id;
            }}
          >
            <Auction
              characterId={auctionData.CharacterId}
              basePrice={auctionData.Price ?? 0}
              maxAmount={auctionData.Sacrifices ?? 0}
            />
          </Modal>
        )}
        {showHistoryModal && historyData && !isModalExist(generatedHistoryModalId) && (
          <Modal
            visible={showHistoryModal}
            onClose={() => setState({ showHistoryModal: false })}
            title="往期萌王"
            position="center"
            maxWidth={600}
            padding="p-4"
            modalId={generatedHistoryModalId}
            getModalId={(id) => {
              generatedHistoryModalId = id;
            }}
          >
            <TopWeekHistory
              historyData={historyData}
              currentPage={historyCurrentPage}
              onPageChange={handleHistoryPageChange}
              onCharacterClick={(characterId) => {
                setState({
                  showHistoryModal: false,
                  showCharacterModal: true,
                  characterModalId: characterId,
                });
              }}
            />
          </Modal>
        )}
      </div>
    );
  });

  // 加载每周萌王数据
  const loadTopWeekData = async () => {
    const result = await getTopWeek();
    if (result.success) {
      setState({ topWeekData: result.data });
    } else {
      setState({ topWeekData: [] });
    }
  };

  loadTopWeekData();

  return container;
}

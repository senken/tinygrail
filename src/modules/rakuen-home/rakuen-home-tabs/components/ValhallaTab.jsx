import { getAuctionList, getUserCharas } from "@src/api/chara.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { SegmentedControl } from "@src/components/SegmentedControl.jsx";
import { openAuctionHistoryModal } from "@src/modules/auction-history/AuctionHistory.jsx";
import { openAuctionModal } from "@src/modules/auction/Auction.jsx";
import { openCharacterBoxModal } from "@src/modules/character-box/utils/modalOpeners.jsx";
import { CharacterPoolItem } from "@src/modules/rakuen-home/character-pool-item/CharacterPoolItem.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";

/**
 * 英灵殿Tab组件
 */
export function ValhallaTab() {
  const container = (
    <div
      id="tg-rakuen-home-valhalla-tab"
      className="tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    />
  );

  // 英灵殿类型选项
  const valhallaOptions = [
    { value: "valhalla", label: "英灵殿" },
    { value: "gensokyo", label: "幻想乡" },
  ];

  const { setState } = createMountedComponent(container, (state) => {
    const {
      activeValhallaType = "valhalla",
      valhallaData = null,
      valhallaLoading = true,
      valhallaPage = 1,
      valhallaAuctions = {},
      gensokyoData = null,
      gensokyoLoading = true,
      gensokyoPage = 1,
    } = state || {};

    // 标题栏
    const headerDiv = (
      <div
        id="tg-rakuen-home-valhalla-header"
        className="mb-3 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">/ {getValhallaTitle(activeValhallaType)}</div>
        </div>
        <SegmentedControl
          options={valhallaOptions}
          value={activeValhallaType}
          onChange={(value) => {
            setState({
              activeValhallaType: value,
              valhallaPage: 1,
              gensokyoPage: 1,
            });
            // 切换时加载对应数据
            if (value === "valhalla") {
              loadValhallaData();
            } else if (value === "gensokyo") {
              loadGensokyoData();
            }
          }}
          size="small"
        />
      </div>
    );

    // 拍卖按钮点击处理
    const handleAuctionClick = (item) => {
      openAuctionModal({
        characterId: item.Id,
        characterName: item.Name,
        basePrice: item.Price || 0,
        maxAmount: item.State || 0,
        onSuccess: () => {
          // 重新加载英灵殿拍卖信息
          if (activeValhallaType === "valhalla") {
            loadValhallaData(valhallaPage, false);
          }
        },
      });
    };

    // 往期按钮点击处理
    const handleHistoryClick = (item) => {
      openAuctionHistoryModal({
        characterId: item.Id,
        characterName: item.Name,
      });
    };

    /**
     * 渲染英灵殿内容
     * @param {string} type - 英灵殿类型
     * @returns {HTMLElement} 内容元素
     */
    const renderValhallaContent = (type) => {
      let data, loading, currentPage, onPageChange, totalPages;

      if (type === "valhalla") {
        data = valhallaData;
        loading = valhallaLoading;
        currentPage = valhallaPage;
        totalPages = valhallaData?.totalPages || 1;
        onPageChange = (page) => {
          setState({ valhallaPage: page });
          loadValhallaData(page);
        };
      } else {
        data = gensokyoData;
        loading = gensokyoLoading;
        currentPage = gensokyoPage;
        totalPages = gensokyoData?.totalPages || 1;
        onPageChange = (page) => {
          setState({ gensokyoPage: page });
          loadGensokyoData(page);
        };
      }

      if (loading) {
        return (
          <div className="text-center text-sm opacity-60">
            <p>加载中...</p>
          </div>
        );
      }

      if (!data || !data.items || data.items.length === 0) {
        return (
          <div className="text-center text-sm opacity-60">
            <p>暂无数据</p>
          </div>
        );
      }

      // 网格布局
      const gridContainer = (
        <div id="tg-rakuen-home-valhalla-content" className="flex w-full flex-col gap-4" />
      );
      const gridDiv = <div id="tg-rakuen-home-valhalla-list" className="grid w-full" />;
      const paginationDiv = (
        <div id="tg-rakuen-home-valhalla-pagination" className="flex w-full justify-center" />
      );

      // 渲染函数
      const renderItems = (cols) => {
        gridDiv.innerHTML = "";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
        gridDiv.style.gap = "0px";

        const auctions = type === "valhalla" ? valhallaAuctions : {};

        data.items.forEach((item, index) => {
          const pageSize = 24;
          const currentRank = (currentPage - 1) * pageSize + index + 1;
          const auction = auctions[item.Id];

          const characterItem = (
            <CharacterPoolItem
              item={item}
              rank={currentRank}
              auction={auction}
              showAuction={type === "valhalla"}
              showButtons={type === "valhalla"}
              onClick={openCharacterBoxModal}
              onAuctionClick={handleAuctionClick}
              onHistoryClick={handleHistoryClick}
            />
          );

          gridDiv.appendChild(characterItem);
        });
      };

      // 计算列数
      const calculateColumns = (width) => {
        const minCellWidth = 200;
        const gap = 0;

        let cols = Math.floor((width + gap) / (minCellWidth + gap));

        // 24的因数
        const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
        for (const divisor of divisors) {
          if (cols >= divisor) {
            return divisor;
          }
        }
        return 1;
      };

      // 初始渲染
      const initialCols = calculateColumns(gridContainer.offsetWidth || 800);
      renderItems(initialCols);

      gridContainer.appendChild(gridDiv);

      // 添加分页
      if (totalPages > 1) {
        const pagination = (
          <Pagination current={currentPage} total={totalPages} onChange={onPageChange} />
        );
        paginationDiv.appendChild(pagination);
        gridContainer.appendChild(paginationDiv);
      }

      // 使用ResizeObserver监听容器宽度变化
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          const newCols = calculateColumns(width);
          renderItems(newCols);
        }
      });

      observer.observe(gridContainer);

      return gridContainer;
    };

    // 内容区域
    const contentDiv = <div className="mt-3">{renderValhallaContent(activeValhallaType)}</div>;

    const wrapper = <div />;
    wrapper.appendChild(headerDiv);
    wrapper.appendChild(contentDiv);

    return wrapper;
  });

  // 加载英灵殿数据
  const loadValhallaData = async (page = 1, showLoading = true) => {
    if (showLoading) {
      setState({ valhallaLoading: true });
    }
    const result = await getUserCharas("tinygrail", page, 24);
    if (result.success) {
      setState({ valhallaData: result.data, valhallaLoading: false });
      // 加载拍卖信息
      loadAuctionData(result.data.items);
    } else {
      setState({ valhallaData: null, valhallaLoading: false });
    }
  };

  // 加载幻想乡数据
  const loadGensokyoData = async (page = 1) => {
    setState({ gensokyoLoading: true });
    const result = await getUserCharas("blueleaf", page, 24);
    if (result.success) {
      setState({ gensokyoData: result.data, gensokyoLoading: false });
    } else {
      setState({ gensokyoData: null, gensokyoLoading: false });
    }
  };

  /**
   * 加载拍卖信息
   * @param {Array} items - 角色列表
   */
  const loadAuctionData = async (items) => {
    if (!items || items.length === 0) return;

    const characterIds = items.map((item) => item.Id);
    const result = await getAuctionList(characterIds);

    if (result.success && result.data) {
      const auctionMap = {};
      result.data.forEach((auction) => {
        auctionMap[auction.CharacterId] = auction;
      });

      setState({ valhallaAuctions: auctionMap });
    }
  };

  /**
   * 获取英灵殿标题
   * @param {string} type - 英灵殿类型
   * @returns {string} 标题
   */
  const getValhallaTitle = (type) => {
    switch (type) {
      case "valhalla":
        return "英灵殿";
      case "gensokyo":
        return "幻想乡";
      default:
        return "英灵殿";
    }
  };

  // 初始化加载英灵殿数据
  loadValhallaData();

  return container;
}

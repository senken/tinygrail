import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { SegmentedControl } from "@src/components/SegmentedControl.jsx";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { CharacterRankItem } from "@src/modules/rakuen-home/character-rank-item/CharacterRankItem.jsx";
import { getMarketValueRank, getMaxRiseRank, getMaxFallRank } from "@src/api/chara.js";

/**
 * 交易榜单Tab组件
 */
export function TradeTab() {
  const container = (
    <div
      id="tg-rakuen-home-trade-tab"
      className="tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    />
  );

  // 交易榜单类型选项
  const tradeOptions = [
    { value: "marketValue", label: "最高市值" },
    { value: "maxRise", label: "最大涨幅" },
    { value: "maxFall", label: "最大跌幅" },
  ];

  // 存储Modal生成的ID
  let generatedCharacterModalId = null;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  const { setState } = createMountedComponent(container, (state) => {
    const {
      activeTradeType = "marketValue",
      marketValueData = null,
      marketValueLoading = true,
      marketValuePage = 1,
      maxRiseData = null,
      maxRiseLoading = true,
      maxRisePage = 1,
      maxFallData = null,
      maxFallLoading = true,
      maxFallPage = 1,
      showCharacterModal = false,
      characterModalId = null,
    } = state || {};

    // 标题栏
    const headerDiv = (
      <div
        id="tg-rakuen-home-trade-header"
        className="mb-3 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">/ {getTradeTitle(activeTradeType)}</div>
        </div>
        <SegmentedControl
          options={tradeOptions}
          value={activeTradeType}
          onChange={(value) => {
            setState({
              activeTradeType: value,
              marketValuePage: 1,
              maxRisePage: 1,
              maxFallPage: 1,
            });
            // 切换时加载对应数据
            if (value === "marketValue") {
              loadMarketValueData();
            } else if (value === "maxRise") {
              loadMaxRiseData();
            } else if (value === "maxFall") {
              loadMaxFallData();
            }
          }}
          size="small"
        />
      </div>
    );

    // 角色点击处理
    const handleCharacterClick = (characterId) => {
      setState({
        showCharacterModal: true,
        characterModalId: characterId,
      });
    };

    /**
     * 渲染交易榜单内容
     * @param {string} type - 交易榜单类型
     * @returns {HTMLElement} 内容元素
     */
    const renderTradeContent = (type) => {
      let data, loading, currentPage, onPageChange;

      switch (type) {
        case "marketValue":
          data = marketValueData;
          loading = marketValueLoading;
          currentPage = marketValuePage;
          onPageChange = (page) => {
            setState({ marketValuePage: page });
            loadMarketValueData(page);
          };
          break;
        case "maxRise":
          data = maxRiseData;
          loading = maxRiseLoading;
          currentPage = maxRisePage;
          onPageChange = (page) => {
            setState({ maxRisePage: page });
            loadMaxRiseData(page);
          };
          break;
        case "maxFall":
          data = maxFallData;
          loading = maxFallLoading;
          currentPage = maxFallPage;
          onPageChange = (page) => {
            setState({ maxFallPage: page });
            loadMaxFallData(page);
          };
          break;
        default:
          data = marketValueData;
          loading = marketValueLoading;
          currentPage = marketValuePage;
          onPageChange = (page) => {
            setState({ marketValuePage: page });
            loadMarketValueData(page);
          };
      }

      if (loading) {
        return (
          <div className="text-center text-sm opacity-60">
            <p>加载中...</p>
          </div>
        );
      }

      if (!data || data.length === 0) {
        return (
          <div className="text-center text-sm opacity-60">
            <p>暂无数据</p>
          </div>
        );
      }

      const gridContainer = (
        <div id="tg-rakuen-home-trade-content" className="flex w-full flex-col gap-4" />
      );
      const gridDiv = <div id="tg-rakuen-home-trade-list" className="grid w-full gap-4" />;
      const paginationDiv = (
        <div id="tg-rakuen-home-trade-pagination" className="flex w-full justify-center" />
      );

      // 渲染函数
      const renderItems = (cols) => {
        gridDiv.innerHTML = "";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
        gridDiv.style.gap = "16px";

        data.forEach((item, index) => {
          const pageSize = 20;
          const currentRank = (currentPage - 1) * pageSize + index + 1;

          const characterItem = (
            <CharacterRankItem item={item} rank={currentRank} onClick={handleCharacterClick} />
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
      const initialCols = calculateColumns(gridContainer.offsetWidth || 800);
      renderItems(initialCols);

      gridContainer.appendChild(gridDiv);

      // 添加分页
      const totalPages = 5;
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
    const contentDiv = <div className="mt-3">{renderTradeContent(activeTradeType)}</div>;

    const wrapper = <div />;
    wrapper.appendChild(headerDiv);
    wrapper.appendChild(contentDiv);

    // 角色弹窗
    if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
      const modal = (
        <Modal
          visible={showCharacterModal}
          onClose={() => setState({ showCharacterModal: false })}
          modalId={generatedCharacterModalId}
          getModalId={(id) => {
            generatedCharacterModalId = id;
          }}
        >
          <CharacterBox characterId={characterModalId} sticky={true} stickyTop={-16} />
        </Modal>
      );
      wrapper.appendChild(modal);
    }

    return wrapper;
  });

  // 加载最高市值数据
  const loadMarketValueData = async (page = 1) => {
    setState({ marketValueLoading: true });
    const result = await getMarketValueRank(page, 20);
    if (result.success) {
      setState({ marketValueData: result.data, marketValueLoading: false });
    } else {
      setState({ marketValueData: null, marketValueLoading: false });
    }
  };

  // 加载最大涨幅数据
  const loadMaxRiseData = async (page = 1) => {
    setState({ maxRiseLoading: true });
    const result = await getMaxRiseRank(page, 20);
    if (result.success) {
      setState({ maxRiseData: result.data, maxRiseLoading: false });
    } else {
      setState({ maxRiseData: null, maxRiseLoading: false });
    }
  };

  // 加载最大跌幅数据
  const loadMaxFallData = async (page = 1) => {
    setState({ maxFallLoading: true });
    const result = await getMaxFallRank(page, 20);
    if (result.success) {
      setState({ maxFallData: result.data, maxFallLoading: false });
    } else {
      setState({ maxFallData: null, maxFallLoading: false });
    }
  };

  /**
   * 获取交易榜单标题
   * @param {string} type - 交易榜单类型
   * @returns {string} 标题
   */
  const getTradeTitle = (type) => {
    switch (type) {
      case "marketValue":
        return "最高市值";
      case "maxRise":
        return "最大涨幅";
      case "maxFall":
        return "最大跌幅";
      default:
        return "最高市值";
    }
  };

  // 初始化加载最高市值数据
  loadMarketValueData();

  return container;
}

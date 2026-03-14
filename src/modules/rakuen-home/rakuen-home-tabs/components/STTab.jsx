import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { CharacterPoolItem } from "@src/modules/rakuen-home/character-pool-item/CharacterPoolItem.jsx";
import { getDelistCharas } from "@src/api/chara.js";

/**
 * ST角色Tab组件
 */
export function STTab() {
  const container = (
    <div id="tg-rakuen-home-st-tab" className="tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md" />
  );

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
      stData = null,
      stLoading = true,
      stPage = 1,
      showCharacterModal = false,
      characterModalId = null,
    } = state || {};

    // 标题栏
    const headerDiv = (
      <div id="tg-rakuen-home-st-header" className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">/ ST角色</div>
        </div>
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
     * 渲染ST内容
     * @returns {HTMLElement} 内容元素
     */
    const renderSTContent = () => {
      if (stLoading) {
        return (
          <div className="text-center text-sm opacity-60">
            <p>加载中...</p>
          </div>
        );
      }

      if (!stData || !stData.items || stData.items.length === 0) {
        return (
          <div className="text-center text-sm opacity-60">
            <p>暂无数据</p>
          </div>
        );
      }

      // 网格布局
      const gridContainer = <div id="tg-rakuen-home-st-content" className="flex w-full flex-col gap-4" />;
      const gridDiv = <div id="tg-rakuen-home-st-list" className="grid w-full gap-4" />;
      const paginationDiv = <div id="tg-rakuen-home-st-pagination" className="flex w-full justify-center" />;

      // 渲染函数
      const renderItems = (cols) => {
        gridDiv.innerHTML = "";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
        gridDiv.style.gap = "16px";

        stData.items.forEach((item, index) => {
          const pageSize = 24;
          const currentRank = (stPage - 1) * pageSize + index + 1;

          const characterItem = (
            <CharacterPoolItem
              item={item}
              rank={currentRank}
              auction={null}
              showAuction={false}
              showButtons={false}
              onClick={handleCharacterClick}
            />
          );

          gridDiv.appendChild(characterItem);
        });
      };

      // 计算列数
      const calculateColumns = (width) => {
        const minCellWidth = 200;
        const gap = 16;

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
      const totalPages = stData.totalPages || 1;
      if (totalPages > 1) {
        const pagination = (
          <Pagination
            current={stPage}
            total={totalPages}
            onChange={(page) => {
              setState({ stPage: page });
              loadSTData(page);
            }}
          />
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
    const contentDiv = <div className="mt-3">{renderSTContent()}</div>;

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

  // 加载ST数据
  const loadSTData = async (page = 1) => {
    setState({ stLoading: true });
    const result = await getDelistCharas(page, 24);
    if (result.success) {
      setState({ stData: result.data, stLoading: false });
    } else {
      setState({ stData: null, stLoading: false });
    }
  };

  // 初始化加载ST数据
  loadSTData();

  return container;
}

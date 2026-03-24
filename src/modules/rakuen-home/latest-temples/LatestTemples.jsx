import { getLatestTemples } from "@src/api/chara.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { Temple } from "@src/components/Temple.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { formatNumber } from "@src/utils/format.js";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { TempleDetail } from "@src/modules/temple-detail/TempleDetail.jsx";
import { UserTinygrail } from "@src/modules/user-tinygrail/UserTinygrail.jsx";

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

  // 存储Modal生成的ID
  let generatedCharacterModalId = null;
  let generatedTempleModalId = null;
  let generatedUserModalId = null;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  const { setState } = createMountedComponent(container, (state) => {
    const {
      templesData = null,
      showCharacterModal = false,
      characterModalId = null,
      showTempleModal = false,
      templeModalData = null,
      showUserModal = false,
      userModalName = null,
    } = state || {};

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
     * 圣殿点击处理
     * @param {Object} temple - 圣殿数据
     */
    const handleTempleClick = (temple) => {
      setState({
        showTempleModal: true,
        templeModalData: temple,
      });
    };

    /**
     * 用户点击处理
     * @param {string} username - 用户名
     */
    const handleUserClick = (username) => {
      setState({
        showUserModal: true,
        userModalName: username,
      });
    };

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
                  handleTempleClick(temple);
                }}
                showProgress={false}
              />
              <div className="flex min-w-0 items-center justify-start gap-1 text-sm">
                <LevelBadge level={item.CharacterLevel} zeroCount={item.ZeroCount} />
                <span
                  className="tg-link min-w-0 cursor-pointer truncate opacity-80 hover:opacity-100"
                  onClick={() => {
                    handleCharacterClick(item.CharacterId);
                  }}
                >
                  {item.CharacterName}
                </span>
              </div>
              <div className="text-xs opacity-60">
                <div
                  className="tg-link cursor-pointer truncate hover:opacity-100"
                  onClick={() => handleUserClick(item.Name)}
                >
                  @{item.Nickname}
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
            <TempleDetail temple={templeModalData} characterName={templeModalData.Name} />
          </Modal>
        )}
        {showUserModal && userModalName && !isModalExist(generatedUserModalId) && (
          <Modal
            visible={showUserModal}
            onClose={() => setState({ showUserModal: false })}
            modalId={generatedUserModalId}
            getModalId={(id) => {
              generatedUserModalId = id;
            }}
          >
            <UserTinygrail username={userModalName} stickyTop="-8px" />
          </Modal>
        )}
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

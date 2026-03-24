import { getLatestLinks } from "@src/api/chara.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { TempleLink } from "@src/components/TempleLink.jsx";
import { formatNumber } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { TempleDetail } from "@src/modules/temple-detail/TempleDetail.jsx";
import { UserTinygrail } from "@src/modules/user-tinygrail/UserTinygrail.jsx";

/**
 * 最新连接组件
 */
export function LatestLinks() {
  const container = (
    <div
      id="tg-rakuen-home-latest-links"
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
      linksData = null,
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
      const result = await getLatestLinks(page);
      if (result.success) {
        setState({ linksData: result.data });
      }
    };

    const titleDiv = (
      <div id="tg-rakuen-home-latest-links-header" className="flex items-center justify-between">
        <div id="tg-rakuen-home-latest-links-title" className="text-sm font-semibold">
          / 最新连接
        </div>
      </div>
    );

    const contentDiv = <div id="tg-rakuen-home-latest-links-content" className="mt-3" />;

    if (!linksData) {
      contentDiv.appendChild(
        <div className="text-center text-sm opacity-60">
          <p>加载中...</p>
        </div>
      );
    } else if (!linksData.items || linksData.items.length === 0) {
      contentDiv.appendChild(
        <div className="text-center text-sm opacity-60">
          <p>暂无数据</p>
        </div>
      );
    } else {
      const gridDiv = <div className="grid w-full justify-items-center gap-4" />;

      // 渲染函数
      const renderItems = (cols, size) => {
        gridDiv.innerHTML = "";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        let i = 0;
        while (i < linksData.items.length - 1) {
          const temple1 = linksData.items[i];
          const temple2 = linksData.items[i + 1];

          // 验证第一个的LinkId是否等于第二个的CharacterId
          if (temple1.LinkId === temple2.CharacterId) {
            // 匹配成功，处理数据字段
            const processedTemple1 = {
              ...temple1,
              Name: temple1.CharacterName,
            };
            const processedTemple2 = {
              ...temple2,
              Name: temple2.CharacterName,
            };

            const minAssets = Math.min(temple1.Assets, temple2.Assets);
            const itemContainer = (
              <div className="flex flex-col items-start gap-1">
                <TempleLink
                  temple1={processedTemple1}
                  temple2={processedTemple2}
                  size={size}
                  onNameClick={(data) => {
                    handleCharacterClick(data.CharacterId);
                  }}
                  onCoverClick={(data) => {
                    handleTempleClick(data);
                  }}
                />
                <div
                  className="tg-link cursor-pointer text-xs opacity-80 hover:opacity-100"
                  onClick={() => handleUserClick(temple1.Name)}
                >
                  @{temple1.Nickname} +{formatNumber(minAssets, 0)}
                </div>
              </div>
            );
            gridDiv.appendChild(itemContainer);
            i += 2;
          } else {
            // 匹配失败，跳过
            i += 1;
          }
        }
      };

      // 计算列数
      const calculateColumns = (width) => {
        const newSize = width >= 440 ? "small" : "mini";
        const minCellWidth = newSize === "small" ? 214 : 188;
        const gap = 8;

        // 计算可以容纳的最大列数
        let cols = Math.floor((width + gap) / (minCellWidth + gap));

        // 确保列数是12的因数
        const divisors = [12, 6, 4, 3, 2, 1];
        for (const divisor of divisors) {
          if (cols >= divisor) {
            return { cols: divisor, size: newSize };
          }
        }
        return { cols: 1, size: newSize };
      };

      // 初始渲染
      const initial = calculateColumns(contentDiv.offsetWidth || 800);
      renderItems(initial.cols, initial.size);

      contentDiv.appendChild(gridDiv);

      // 分页
      if (linksData.totalPages && linksData.totalPages >= 1) {
        const paginationDiv = <div className="mt-4 flex w-full justify-center" />;
        const pagination = (
          <Pagination
            current={Number(linksData.currentPage) || 1}
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
          const result = calculateColumns(width);
          renderItems(result.cols, result.size);
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
            position="center"
            maxWidth={1080}
            padding="p-0"
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

  // 加载最新连接数据
  const loadLatestLinksData = async () => {
    const result = await getLatestLinks(1);
    if (result.success) {
      setState({ linksData: result.data });
    } else {
      setState({ linksData: { items: [] } });
    }
  };

  loadLatestLinksData();

  return container;
}

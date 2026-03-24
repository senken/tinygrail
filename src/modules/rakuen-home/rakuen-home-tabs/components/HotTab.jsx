import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { SegmentedControl } from "@src/components/SegmentedControl.jsx";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { TempleDetail } from "@src/modules/temple-detail/TempleDetail.jsx";
import { UserTinygrail } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { getRefineRank, getUserRank, getRateRank } from "@src/api/chara.js";
import { RefineRank } from "./RefineRank.jsx";
import { UserRank } from "./UserRank.jsx";
import { RateRank } from "./RateRank.jsx";

/**
 * 热门Tab组件
 */
export function HotTab() {
  const container = (
    <div
      id="tg-rakuen-home-hot-tab"
      className="tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    />
  );

  // 排行类型选项
  const rankingOptions = [
    { value: "refineRank", label: "精炼排行" },
    { value: "userRank", label: "番市首富" },
    { value: "rateRank", label: "最高股息" },
  ];

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
      activeRanking = "refineRank",
      refineRankData = null,
      refineRankLoading = true,
      userRankData = null,
      userRankLoading = true,
      userRankPage = 1,
      rateRankData = null,
      rateRankLoading = true,
      rateRankPage = 1,
      showCharacterModal = false,
      characterModalId = null,
      showTempleModal = false,
      templeModalData = null,
      showUserModal = false,
      userModalUsername = null,
    } = state || {};

    // 标题栏
    const headerDiv = (
      <div
        id="tg-rakuen-home-hot-tab-header"
        className="mb-3 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <div id="tg-rakuen-home-hot-tab-title" className="text-sm font-semibold">
            / {getRankingTitle(activeRanking)}
          </div>
        </div>
        <SegmentedControl
          options={rankingOptions}
          value={activeRanking}
          onChange={(value) => {
            setState({ activeRanking: value, userRankPage: 1, rateRankPage: 1 });
            // 切换时加载对应数据
            if (value === "refineRank") {
              loadRefineRankData();
            } else if (value === "userRank") {
              loadUserRankData();
            } else if (value === "rateRank") {
              loadRateRankData();
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

    // 圣殿点击处理
    const handleTempleClick = (temple) => {
      setState({
        showTempleModal: true,
        templeModalData: temple,
      });
    };

    // 用户点击处理
    const handleUserClick = (username) => {
      setState({
        showUserModal: true,
        userModalUsername: username,
      });
    };

    // 精炼排行分页处理
    const handleRefineRankPageChange = (page) => {
      loadRefineRankData(page);
    };

    // 用户排行分页处理
    const handleUserRankPageChange = (page) => {
      setState({ userRankPage: page });
      loadUserRankData(page);
    };

    // 最高股息分页处理
    const handleRateRankPageChange = (page) => {
      setState({ rateRankPage: page });
      loadRateRankData(page);
    };

    /**
     * 渲染排行内容
     * @param {string} type - 排行类型
     * @returns {HTMLElement} 内容元素
     */
    const renderRankingContent = (type) => {
      switch (type) {
        case "refineRank":
          if (refineRankLoading) {
            return (
              <div className="text-center text-sm opacity-60">
                <p>加载中...</p>
              </div>
            );
          }
          return (
            <RefineRank
              data={refineRankData}
              onPageChange={handleRefineRankPageChange}
              onCharacterClick={handleCharacterClick}
              onTempleClick={handleTempleClick}
              onUserClick={handleUserClick}
            />
          );
        case "userRank":
          if (userRankLoading) {
            return (
              <div className="text-center text-sm opacity-60">
                <p>加载中...</p>
              </div>
            );
          }
          return (
            <UserRank
              data={userRankData}
              currentPage={userRankPage}
              onPageChange={handleUserRankPageChange}
              onUserClick={handleUserClick}
            />
          );
        case "rateRank":
          if (rateRankLoading) {
            return (
              <div className="text-center text-sm opacity-60">
                <p>加载中...</p>
              </div>
            );
          }
          return (
            <RateRank
              data={rateRankData}
              currentPage={rateRankPage}
              onPageChange={handleRateRankPageChange}
              onCharacterClick={handleCharacterClick}
            />
          );
        default:
          return (
            <RefineRank
              data={refineRankData}
              onPageChange={handleRefineRankPageChange}
              onCharacterClick={handleCharacterClick}
              onTempleClick={handleTempleClick}
              onUserClick={handleUserClick}
            />
          );
      }
    };

    // 内容区域
    const contentDiv = (
      <div id="tg-rakuen-home-hot-tab-content" className="mt-3">
        {renderRankingContent(activeRanking)}
      </div>
    );

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
          padding="p-6"
        >
          <CharacterBox characterId={characterModalId} sticky={true} />
        </Modal>
      );
      wrapper.appendChild(modal);
    }

    // 圣殿弹窗
    if (showTempleModal && templeModalData && !isModalExist(generatedTempleModalId)) {
      const templeModal = (
        <Modal
          visible={showTempleModal}
          onClose={() => setState({ showTempleModal: false })}
          position="center"
          maxWidth={1080}
          padding="p-0"
          modalId={generatedTempleModalId}
          getModalId={(id) => {
            generatedTempleModalId = id;
          }}
        >
          <TempleDetail temple={templeModalData} characterName={templeModalData.Name} />
        </Modal>
      );
      wrapper.appendChild(templeModal);
    }

    // 用户弹窗
    if (showUserModal && userModalUsername && !isModalExist(generatedUserModalId)) {
      const userModal = (
        <Modal
          visible={showUserModal}
          onClose={() => setState({ showUserModal: false })}
          modalId={generatedUserModalId}
          getModalId={(id) => {
            generatedUserModalId = id;
          }}
        >
          <UserTinygrail username={userModalUsername} stickyTop="-8px" />
        </Modal>
      );
      wrapper.appendChild(userModal);
    }

    return wrapper;
  });

  // 加载精炼排行数据
  const loadRefineRankData = async (page = 1) => {
    setState({ refineRankLoading: true });
    const result = await getRefineRank(page, 24);
    if (result.success) {
      setState({ refineRankData: result.data, refineRankLoading: false });
    } else {
      setState({ refineRankData: null, refineRankLoading: false });
    }
  };

  // 加载用户排行数据
  const loadUserRankData = async (page = 1) => {
    setState({ userRankLoading: true });
    const result = await getUserRank(page, 20);
    if (result.success) {
      setState({ userRankData: result.data, userRankLoading: false });
    } else {
      setState({ userRankData: null, userRankLoading: false });
    }
  };

  // 加载最高股息数据
  const loadRateRankData = async (page = 1) => {
    setState({ rateRankLoading: true });
    const result = await getRateRank(page, 20);
    if (result.success) {
      setState({ rateRankData: result.data, rateRankLoading: false });
    } else {
      setState({ rateRankData: null, rateRankLoading: false });
    }
  };

  /**
   * 获取排行标题
   * @param {string} type - 排行类型
   * @returns {string} 标题
   */
  const getRankingTitle = (type) => {
    switch (type) {
      case "refineRank":
        return "精炼排行";
      case "userRank":
        return "番市首富";
      case "rateRank":
        return "最高股息";
      default:
        return "精炼排行";
    }
  };

  // 初始化加载精炼排行数据
  loadRefineRankData();

  return container;
}

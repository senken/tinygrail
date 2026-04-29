import { getCharacter, getCharacterUsers, getICOUsers, initICO, joinICO } from "@src/api/chara.js";
import { getUserAssets } from "@src/api/user.js";
import { AddToFavorite } from "@src/modules/favorite/index.js";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { calculateICO } from "@src/utils/ico.js";
import { closeModal, openModal } from "@src/utils/modalManager.js";
import { createRequestManager } from "@src/utils/requestManager.js";
import { showError, showSuccess } from "@src/utils/toastManager.jsx";
import { IcoBoxHeader } from "../components/IcoBoxHeader.jsx";
import { IcoBoxInit } from "../components/IcoBoxInit.jsx";
import { IcoBoxInvest } from "../components/IcoBoxInvest.jsx";
import { IcoBoxUser } from "../components/IcoBoxUser.jsx";
import { TradeBoxHeaderActions } from "../components/TradeBoxHeaderActions.jsx";
import { TradeBoxHeaderDetails } from "../components/TradeBoxHeaderDetails.jsx";
import { TradeBoxHeaderInfo } from "../components/TradeBoxHeaderInfo.jsx";
import { TradeBoxLink } from "../components/TradeBoxLink.jsx";
import { TradeBoxSection } from "../components/TradeBoxSection.jsx";
import { TradeBoxTemple } from "../components/TradeBoxTemple.jsx";
import { TradeBoxUser } from "../components/TradeBoxUser.jsx";
import { loadIcoBoxAllData, loadTradeBoxAllData } from "./dataLoader.js";
import { createModalCallbacks } from "./modalCallbacks.jsx";

/**
 * 加载动画组件
 */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <span
      className="loading loading-ring loading-lg"
      style={{ color: "var(--primary-color, #f09199)" }}
    ></span>
  </div>
);

/**
 * 打开角色弹窗
 * @param {number} characterId - 角色ID
 */
export async function openCharacterBoxModal(characterId) {
  if (!characterId) {
    showError("角色ID不能为空");
    return;
  }

  const modalId = `character-box-modal-${characterId}`;

  // 先打开弹窗显示加载动画
  openModal(modalId, {
    content: <LoadingSpinner />,
    size: "xl",
  });

  // 异步加载角色数据和用户资产
  const [characterResult, userAssetsResult] = await Promise.all([
    getCharacter(characterId),
    getUserAssets(),
  ]);

  const userAssets = userAssetsResult.success ? userAssetsResult.data : null;

  // 如果用户资产加载失败，显示错误信息
  if (!userAssetsResult.success) {
    closeModal(modalId);
    showError("加载用户资产失败");
    return;
  }

  // 如果查询不到角色数据，显示启动ICO弹窗
  if (!characterResult.success) {
    openModal(modalId, {
      content: (
        <IcoBoxInit
          characterId={characterId}
          userAssets={userAssets}
          onInit={async (amount) => {
            const result = await initICO(characterId, amount);
            if (result.success) {
              showSuccess("ICO启动成功，邀请更多朋友加入吧。");
              // 重新打开角色弹窗
              closeModal(modalId);
              openCharacterBoxModal(characterId);
            } else {
              showError(result.message || "启动ICO失败");
            }
          }}
        />
      ),
      modalBoxProps: {
        id: "tg-character-box",
        dataset: {
          characterId: characterId.toString(),
        },
      },
    });
    return;
  }

  const characterData = characterResult.data;

  // 根据角色状态调用不同的弹窗，传入 modalId 以便复用同一个弹窗
  if (characterData.Current !== undefined) {
    // 已上市，打开TradeBox弹窗
    await openTradeBoxModal(characterId, characterData, userAssets, modalId);
  } else {
    // ICO角色，打开IcoBox弹窗
    await openIcoBoxModal(characterId, characterData, userAssets, modalId);
  }
}

/**
 * 创建角色交易Modal组件
 */
function createTradeBoxModalContent(options) {
  const {
    characterData,
    userAssets,
    userCharacter,
    tinygrailCharacter,
    gensokyoCharacter,
    pool,
    depth,
    links,
    temples,
    users,
    fixedAssets,
    onRefresh,
    setLoading,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    openSacrificeModal,
    openFavoriteModal,
    openAuctionModal,
    openAuctionHistoryModal,
    openChangeAvatarModal,
    openTradeHistoryModal,
    openGMTradeHistoryModal,
    openTempleModal,
    canChangeAvatar,
    hideDuplicates = true,
    onToggleDuplicates,
    isLinkCollapsed = false,
    onToggleLinkCollapse,
    isSectionCollapsed = false,
    onToggleSectionCollapse,
    isTempleCollapsed = false,
    onToggleTempleCollapse,
    isUserCollapsed = false,
    onToggleUserCollapse,
  } = options || {};

  if (!characterData) {
    return { title: <div />, content: <div /> };
  }

  // 创建标题容器
  const titleContainer = (
    <div>
      <TradeBoxHeaderInfo
        characterData={characterData}
        userCharacter={userCharacter}
        fixedAssets={fixedAssets}
        onFavoriteClick={openFavoriteModal}
      />
      <TradeBoxHeaderDetails
        characterData={characterData}
        pool={pool}
        tinygrailCharacter={tinygrailCharacter}
        gensokyoCharacter={gensokyoCharacter}
      />
      <TradeBoxHeaderActions
        tinygrailCharacter={tinygrailCharacter}
        canChangeAvatar={canChangeAvatar}
        isInModal={true}
        onSacrificeClick={openSacrificeModal}
        onAuctionClick={openAuctionModal}
        onAuctionHistoryClick={openAuctionHistoryModal}
        onChangeAvatarClick={openChangeAvatarModal}
        onTradeHistoryClick={openTradeHistoryModal}
        onGMTradeHistoryClick={openGMTradeHistoryModal}
      />
    </div>
  );

  // 创建内容容器
  const contentContainer = (
    <div>
      <TradeBoxSection
        characterData={characterData}
        userAssets={userAssets}
        userCharacter={userCharacter}
        depth={depth}
        stickyTop={0}
        onRefresh={onRefresh}
        setLoading={setLoading}
        isCollapsed={isSectionCollapsed}
        onToggleCollapse={onToggleSectionCollapse}
        headerBgClass="bg-base-100"
      />
      {links && links.length > 0 && (
        <TradeBoxLink
          characterData={characterData}
          links={links}
          openUserModal={openUserModal}
          openCharacterModal={openCharacterModal}
          openTempleModal={openTempleModal}
          stickyTop={0}
          isCollapsed={isLinkCollapsed}
          onToggleCollapse={onToggleLinkCollapse}
          headerBgClass="bg-base-100"
        />
      )}
      {temples && temples.length > 0 && (
        <TradeBoxTemple
          characterData={characterData}
          userAssets={userAssets}
          temples={temples}
          openUserModal={openUserModal}
          openTempleModal={openTempleModal}
          stickyTop={0}
          hideDuplicates={hideDuplicates}
          onToggleDuplicates={onToggleDuplicates}
          isCollapsed={isTempleCollapsed}
          onToggleCollapse={onToggleTempleCollapse}
          headerBgClass="bg-base-100"
        />
      )}
      {users && (
        <TradeBoxUser
          characterData={characterData}
          users={users}
          loadUsersPage={loadUsersPage}
          openUserModal={openUserModal}
          stickyTop={0}
          isCollapsed={isUserCollapsed}
          onToggleUserCollapse={onToggleUserCollapse}
          headerBgClass="bg-base-100"
        />
      )}
    </div>
  );

  return {
    title: titleContainer,
    content: contentContainer,
  };
}

/**
 * 打开TradeBox弹窗
 */
async function openTradeBoxModal(characterId, characterData, userAssets, existingModalId = null) {
  const modalId = existingModalId || `character-box-modal-${characterId}`;

  // 存储当前用户列表页数
  let currentUsersPage = 1;

  // 创建请求管理器
  const usersRequestManager = createRequestManager();

  // 从 localStorage 读取所有折叠状态
  const getCollapsedStates = () => {
    try {
      const stored = localStorage.getItem("tinygrail:character-box-trade-collapsed-states");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("读取折叠状态失败:", e);
    }
    return {
      link: false,
      section: false,
      temple: false,
      user: false,
    };
  };

  // 保存所有折叠状态到localStorage
  const saveCollapsedStates = (states) => {
    try {
      localStorage.setItem(
        "tinygrail:character-box-trade-collapsed-states",
        JSON.stringify(states)
      );
    } catch (e) {
      console.warn("保存折叠状态失败:", e);
    }
  };

  const initialCollapsedStates = getCollapsedStates();

  // 创建title和content容器
  const titleContainer = <div />;
  const contentContainer = <div />;

  // title容器
  const { setState: setTitleState } = createMountedComponent(titleContainer, (state) => {
    const {
      characterData,
      userAssets,
      userCharacter,
      tinygrailCharacter,
      gensokyoCharacter,
      pool,
      fixedAssets,
      canChangeAvatar,
    } = state || {};

    // 创建Modal回调
    const modalCallbacks = createModalCallbacks({
      characterId,
      characterData,
      userCharacter,
      tinygrailCharacter,
      refreshFn: refreshTradeBoxData,
      rerenderFn: () => setTitleState({}),
      openCharacterModal: openCharacterBoxModal,
    });

    const { title } = createTradeBoxModalContent({
      characterData,
      userAssets,
      userCharacter,
      tinygrailCharacter,
      gensokyoCharacter,
      pool,
      fixedAssets,
      canChangeAvatar,
      ...modalCallbacks,
    });

    return title;
  });

  // content容器
  const { setState: setContentState } = createMountedComponent(contentContainer, (state) => {
    const {
      characterData,
      userAssets,
      userCharacter,
      tinygrailCharacter,
      gensokyoCharacter,
      pool,
      depth,
      links,
      temples,
      users,
      fixedAssets,
      canChangeAvatar,
      hideDuplicates = true,
      isLinkCollapsed = initialCollapsedStates.link,
      isSectionCollapsed = initialCollapsedStates.section,
      isTempleCollapsed = initialCollapsedStates.temple,
      isUserCollapsed = initialCollapsedStates.user,
    } = state || {};

    // 创建Modal回调
    const modalCallbacks = createModalCallbacks({
      characterId,
      characterData,
      userCharacter,
      tinygrailCharacter,
      refreshFn: refreshTradeBoxData,
      rerenderFn: () => setContentState({}),
      openCharacterModal: openCharacterBoxModal,
    });

    // 创建折叠切换处理函数
    const createToggleCollapseHandler = (stateKey, storageKey) => () => {
      const newValue = !state[stateKey];
      setContentState({ [stateKey]: newValue });
      const states = getCollapsedStates();
      states[storageKey] = newValue;
      saveCollapsedStates(states);
    };

    const { content } = createTradeBoxModalContent({
      characterData,
      userAssets,
      userCharacter,
      tinygrailCharacter,
      gensokyoCharacter,
      pool,
      depth,
      links,
      temples,
      users,
      fixedAssets,
      onRefresh: refreshTradeBoxData,
      setLoading: () => {},
      loadUsersPage,
      openUserModal: openUserTinygrailModal,
      openCharacterModal: openCharacterBoxModal,
      ...modalCallbacks,
      canChangeAvatar,
      hideDuplicates,
      onToggleDuplicates: () => setContentState({ hideDuplicates: !hideDuplicates }),
      isLinkCollapsed,
      onToggleLinkCollapse: createToggleCollapseHandler("isLinkCollapsed", "link"),
      isSectionCollapsed,
      onToggleSectionCollapse: createToggleCollapseHandler("isSectionCollapsed", "section"),
      isTempleCollapsed,
      onToggleTempleCollapse: createToggleCollapseHandler("isTempleCollapsed", "temple"),
      isUserCollapsed,
      onToggleUserCollapse: createToggleCollapseHandler("isUserCollapsed", "user"),
    });

    return content;
  });

  // 加载TradeBox组件数据
  const loadTradeBoxData = async () => {
    const data = await loadTradeBoxAllData(characterId, currentUsersPage);
    setTitleState(data);
    setContentState(data);
  };

  // 加载指定页的持股用户数据
  const loadUsersPage = (page) => {
    currentUsersPage = page;
    usersRequestManager.execute(
      () => getCharacterUsers(characterId, page),
      (result) => {
        if (result.success) {
          setContentState({ users: result.data });
        }
      }
    );
  };

  // 更新角色和用户资产数据
  const updateCharacterAndUserData = async () => {
    const [characterResult, userAssetsResult] = await Promise.all([
      getCharacter(characterId),
      getUserAssets(),
    ]);

    if (characterResult.success && userAssetsResult.success) {
      setTitleState({
        characterData: characterResult.data,
        userAssets: userAssetsResult.data,
      });
      setContentState({
        characterData: characterResult.data,
        userAssets: userAssetsResult.data,
      });
    }
  };

  // 刷新TradeBox组件数据
  const refreshTradeBoxData = async (showLoading = false) => {
    await updateCharacterAndUserData();
    await loadTradeBoxData();
  };

  // 如果没有传入existingModalId，先显示加载动画
  if (!existingModalId) {
    openModal(modalId, {
      title: titleContainer,
      content: <LoadingSpinner />,
      contentClassName: "pt-0",
      size: "xl",
    });
  }

  // 异步加载初始数据
  const initialData = await loadTradeBoxAllData(characterId, currentUsersPage);
  setTitleState({ ...initialData, characterData, userAssets });
  setContentState({ ...initialData, characterData, userAssets });

  // 更新弹窗内容
  openModal(modalId, {
    title: titleContainer,
    content: contentContainer,
    contentClassName: "pt-0",
    size: "xl",
    modalBoxProps: {
      id: "tg-character-box",
      dataset: {
        characterId: characterId.toString(),
      },
    },
  });
}

/**
 * 创建ICO Modal组件
 */
function createIcoBoxModalContent(options) {
  const {
    data,
    userAssets,
    icoUsers,
    userIcoInfo,
    loadIcoUsersPage,
    openUserModal,
    onInvest,
    onFavoriteClick,
  } = options || {};

  if (!data) {
    return { title: <div />, content: <div /> };
  }

  // 计算ICO数据
  const predicted = calculateICO({ Total: data.Total, Users: data.Users });

  // 创建标题容器
  const titleContainer = (
    <IcoBoxHeader characterData={data} predicted={predicted} onFavoriteClick={onFavoriteClick} />
  );

  // 创建内容容器
  const contentContainer = (
    <div>
      <IcoBoxUser
        users={icoUsers}
        predicted={predicted}
        loadUsersPage={loadIcoUsersPage}
        openUserModal={openUserModal}
        stickyTop={0}
        headerBgClass="bg-base-100"
      />
      <IcoBoxInvest
        userIcoInfo={userIcoInfo}
        userAssets={userAssets}
        characterData={data}
        predicted={predicted}
        onInvest={onInvest}
      />
    </div>
  );

  return {
    title: titleContainer,
    content: contentContainer,
  };
}

/**
 * 打开Ico弹窗
 */
async function openIcoBoxModal(characterId, characterData, userAssets, existingModalId = null) {
  const modalId = existingModalId || `character-box-modal-${characterId}`;

  // 存储当前ICO用户列表页数
  let currentIcoUsersPage = 1;

  // 创建请求管理器
  const icoUsersRequestManager = createRequestManager();

  // 创建title和content容器
  const titleContainer = <div />;
  const contentContainer = <div />;

  const { setState: setTitleState } = createMountedComponent(titleContainer, (state) => {
    const { characterData, userAssets, icoUsers, userIcoInfo } = state || {};

    const { title } = createIcoBoxModalContent({
      data: characterData,
      userAssets,
      icoUsers,
      userIcoInfo,
      onFavoriteClick: () => {
        openModal(`favorite-${characterId}`, {
          title: `收藏 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`,
          content: <AddToFavorite characterData={characterData} />,
          size: "sm",
          onClose: () => setTitleState({}),
        });
      },
    });

    return title;
  });

  const { setState: setContentState } = createMountedComponent(contentContainer, (state) => {
    const { characterData, userAssets, icoUsers, userIcoInfo } = state || {};

    const { content } = createIcoBoxModalContent({
      data: characterData,
      userAssets,
      icoUsers,
      userIcoInfo,
      loadIcoUsersPage,
      openUserModal: openUserTinygrailModal,
      onInvest: handleIcoInvest,
    });

    return content;
  });

  // 加载IcoBox组件数据
  const loadIcoBoxData = async () => {
    const data = await loadIcoBoxAllData(characterData.Id, currentIcoUsersPage);
    setTitleState(data);
    setContentState(data);
  };

  // 加载指定页的ICO参与者数据
  const loadIcoUsersPage = (page) => {
    currentIcoUsersPage = page;
    icoUsersRequestManager.execute(
      () => getICOUsers(characterData.Id, page),
      (result) => {
        if (result.success) {
          setContentState({ icoUsers: result.data });
        }
      }
    );
  };

  // 更新角色和用户资产数据
  const updateCharacterAndUserData = async () => {
    const [characterResult, userAssetsResult] = await Promise.all([
      getCharacter(characterId),
      getUserAssets(),
    ]);

    if (characterResult.success && userAssetsResult.success) {
      setTitleState({
        characterData: characterResult.data,
        userAssets: userAssetsResult.data,
      });
      setContentState({
        characterData: characterResult.data,
        userAssets: userAssetsResult.data,
      });
    }
  };

  // 刷新IcoBox组件数据
  const refreshIcoBoxData = async () => {
    await updateCharacterAndUserData();
    await loadIcoBoxData();
  };

  // 处理ICO注资
  const handleIcoInvest = async (amount) => {
    const result = await joinICO(characterData.Id, amount);
    if (result.success) {
      showSuccess("注资成功");
      await refreshIcoBoxData();
    } else {
      showError(result.message || "注资失败");
    }
  };

  // 如果没有传入existingModalId，先显示加载动画
  if (!existingModalId) {
    openModal(modalId, {
      title: titleContainer,
      content: <LoadingSpinner />,
      contentClassName: "pt-0",
      size: "xl",
    });
  }

  // 异步加载初始数据
  const initialData = await loadIcoBoxAllData(characterData.Id, currentIcoUsersPage);
  setTitleState({ ...initialData, characterData, userAssets });
  setContentState({ ...initialData, characterData, userAssets });

  // 更新弹窗内容
  openModal(modalId, {
    title: titleContainer,
    content: contentContainer,
    contentClassName: "pt-0",
    size: "xl",
    modalBoxProps: {
      id: "tg-character-box",
      dataset: {
        characterId: characterId.toString(),
      },
    },
  });
}

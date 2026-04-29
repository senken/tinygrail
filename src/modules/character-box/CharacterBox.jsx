import { Fragment } from "@src/utils/jsx-dom.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { createRequestManager } from "@src/utils/requestManager.js";
import {
  getCharacter,
  getCharacterUsers,
  getICOUsers,
  joinICO,
  initICO,
} from "@src/api/chara.js";
import { getUserAssets } from "@src/api/user.js";
import { IcoBox } from "./components/IcoBox.jsx";
import { IcoBoxInit } from "./components/IcoBoxInit.jsx";
import { TradeBox } from "./components/TradeBox.jsx";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { loadTradeBoxAllData, loadIcoBoxAllData } from "./utils/dataLoader.js";
import { createModalCallbacks } from "./utils/modalCallbacks.jsx";
import { openCharacterBoxModal } from "./utils/modalOpeners.jsx";
import { showSuccess, showError } from "@src/utils/toastManager.jsx";
import { openAlertModal } from "@src/utils/modalManager.js";

/**
 * 角色页面组件
 * @param {Object} props
 * @param {number} props.characterId - 角色ID
 */
export function CharacterBox(props) {
  const { characterId } = props || {};

  const container = <div id="tg-character-box" data-character-id={characterId} className="relative" />;

  // 存储当前用户列表页数
  let currentUsersPage = 1;
  let currentIcoUsersPage = 1;

  // 创建请求管理器
  const usersRequestManager = createRequestManager();
  const icoUsersRequestManager = createRequestManager();

  // 从localStorage读取所有折叠状态
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

  const { setState } = createMountedComponent(container, (state) => {
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
      icoUsers,
      userIcoInfo,
      loading,
      error,
      canChangeAvatar,
      hideDuplicates = true,
      isLinkCollapsed = initialCollapsedStates.link,
      isSectionCollapsed = initialCollapsedStates.section,
      isTempleCollapsed = initialCollapsedStates.temple,
      isUserCollapsed = initialCollapsedStates.user,
    } = state || {};

    if (error) {
      return <div className="p-4 text-center">加载失败</div>;
    }

    // 加载中
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <span
            className="loading loading-ring loading-lg"
            style={{ color: "var(--primary-color, #f09199)" }}
          ></span>
        </div>
      );
    }

    // 创建Modal回调
    const modalCallbacks = createModalCallbacks({
      characterId,
      characterData,
      userCharacter,
      tinygrailCharacter,
      refreshFn: refreshTradeBoxData,
      rerenderFn: () => setState({}),
      openCharacterModal: openCharacterBoxModal,
    });

    // 创建折叠切换处理函数
    const createToggleCollapseHandler = (stateKey, storageKey) => () => {
      const newValue = !state[stateKey];
      setState({ [stateKey]: newValue });
      const states = getCollapsedStates();
      states[storageKey] = newValue;
      saveCollapsedStates(states);
    };

    // 渲染内容
    let content = null;
    if (characterData) {
      if (characterData.Current !== undefined) {
        // 已上市角色，显示交易窗口
        content = (
          <TradeBox
            characterData={characterData}
            userAssets={userAssets}
            userCharacter={userCharacter}
            tinygrailCharacter={tinygrailCharacter}
            gensokyoCharacter={gensokyoCharacter}
            pool={pool}
            depth={depth}
            links={links}
            temples={temples}
            users={users}
            fixedAssets={fixedAssets}
            onRefresh={refreshTradeBoxData}
            setLoading={setLoading}
            loadUsersPage={loadUsersPage}
            openUserModal={openUserTinygrailModal}
            openCharacterModal={openCharacterBoxModal}
            {...modalCallbacks}
            canChangeAvatar={canChangeAvatar}
            hideDuplicates={hideDuplicates}
            onToggleDuplicates={() => setState({ hideDuplicates: !hideDuplicates })}
            isLinkCollapsed={isLinkCollapsed}
            onToggleLinkCollapse={createToggleCollapseHandler("isLinkCollapsed", "link")}
            isSectionCollapsed={isSectionCollapsed}
            onToggleSectionCollapse={createToggleCollapseHandler("isSectionCollapsed", "section")}
            isTempleCollapsed={isTempleCollapsed}
            onToggleTempleCollapse={createToggleCollapseHandler("isTempleCollapsed", "temple")}
            isUserCollapsed={isUserCollapsed}
            onToggleUserCollapse={createToggleCollapseHandler("isUserCollapsed", "user")}
          />
        );
      } else {
        // 显示ICO窗口
        content = (
          <IcoBox
            data={characterData}
            userAssets={userAssets}
            icoUsers={icoUsers}
            userIcoInfo={userIcoInfo}
            loadIcoUsersPage={(page) => loadIcoUsersPage(page, characterData.Id)}
            openUserModal={openUserTinygrailModal}
            onInvest={(amount) => handleIcoInvest(amount, characterData.Id)}
            onFavoriteClick={modalCallbacks.openFavoriteModal}
          />
        );
      }
    } else if (userAssets) {
      // 角色未上市，渲染启动ICO组件
      content = (
        <IcoBoxInit
          characterId={characterId}
          userAssets={userAssets}
          onInit={(amount) => handleInitICO(amount)}
        />
      );
    }

    return content;
  });

  // 设置加载状态
  const setLoading = (isLoading) => {
    setState({ loading: isLoading });
  };

  // 加载角色和用户资产数据
  const loadCharacterAndUserData = async () => {
    const [characterResult, userAssetsResult] = await Promise.all([
      getCharacter(characterId),
      getUserAssets(),
    ]);

    return { characterResult, userAssetsResult };
  };

  // 更新角色和用户资产数据
  const updateCharacterAndUserData = async () => {
    const { characterResult, userAssetsResult } = await loadCharacterAndUserData();

    if (characterResult.success && userAssetsResult.success) {
      setState({
        characterData: characterResult.data,
        userAssets: userAssetsResult.data,
      });
    }
  };

  // 加载初始数据
  const loadInitialData = async () => {
    setState({ loading: true });

    const { characterResult, userAssetsResult } = await loadCharacterAndUserData();

    // 如果用户资产加载失败，显示错误
    if (!userAssetsResult.success) {
      setState({ loading: false, error: true });
      return;
    }

    // 如果查询不到角色数据，显示启动ICO界面
    if (!characterResult.success) {
      setState({
        loading: false,
        characterData: null,
        userAssets: userAssetsResult.data,
      });
      return;
    }

    setState({
      characterData: characterResult.data,
      userAssets: userAssetsResult.data,
    });

    // 已上市角色，加载TradeBox数据
    if (characterResult.data?.Current !== undefined) {
      await loadTradeBoxData();
    } else {
      // ICO角色，加载IcoBox数据
      await loadIcoBoxData(characterResult.data.Id);
    }

    // 所有数据加载完成后结束loading状态
    setState({ loading: false });
  };

  // 加载TradeBox组件数据
  const loadTradeBoxData = async () => {
    const data = await loadTradeBoxAllData(characterId, currentUsersPage);
    setState(data);
  };

  // 加载指定页的持股用户数据
  const loadUsersPage = (page) => {
    currentUsersPage = page; // 存储当前页数
    usersRequestManager.execute(
      () => getCharacterUsers(characterId, page),
      (result) => {
        if (result.success) {
          setState({ users: result.data });
        }
      }
    );
  };

  // 加载IcoBox组件数据
  const loadIcoBoxData = async (icoId) => {
    const data = await loadIcoBoxAllData(icoId, currentIcoUsersPage);
    setState(data);
  };

  // 加载指定页的ICO参与者数据
  const loadIcoUsersPage = (page, icoId) => {
    currentIcoUsersPage = page; // 存储当前页数
    icoUsersRequestManager.execute(
      () => getICOUsers(icoId, page),
      (result) => {
        if (result.success) {
          setState({ icoUsers: result.data });
        }
      }
    );
  };

  // 刷新TradeBox组件数据
  const refreshTradeBoxData = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    await updateCharacterAndUserData();
    await loadTradeBoxData();
    if (showLoading) {
      setLoading(false);
    }
  };

  // 刷新IcoBox组件数据
  const refreshIcoBoxData = async (icoId) => {
    await updateCharacterAndUserData();
    await loadIcoBoxData(icoId);
  };

  // 处理ICO注资
  const handleIcoInvest = async (amount, icoId) => {
    const result = await joinICO(icoId, amount);

    if (result.success) {
      showSuccess("注资成功");
      await refreshIcoBoxData(icoId);
    } else {
      showError(result.message || "注资失败");
    }
  };

  // 处理启动ICO
  const handleInitICO = async (amount) => {
    const result = await initICO(characterId, amount);

    if (result.success) {
      openAlertModal({
        title: "成功",
        message: "ICO启动成功，邀请更多朋友加入吧。",
      });
      // 重新加载初始数据
      await loadInitialData();
    } else {
      showError(result.message || "启动ICO失败");
    }
  };

  if (characterId) {
    loadInitialData();
  }

  return container;
}



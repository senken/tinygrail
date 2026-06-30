import { getStoreState } from "@src/utils/store.js";
import {
  createDefaultTempleFilterOptions,
  createTradeBoxContentStateActions,
  createTradeBoxContentStateDefaults,
} from "./tradeBoxState.js";
import { mergeGroupedProps } from "../utils/groupedProps.js";

/**
 * 将标题参数整理为分组props
 * @param {Object} props 标题参数
 * @returns {Object} 标题区域参数
 */
export function createTradeBoxTitleProps(props) {
  const {
    characterData,
    userCharacter,
    tinygrailCharacter,
    gensokyoCharacter,
    pool,
    killVotes,
    fixedAssets,
    openFavoriteModal,
    openSacrificeModal,
    openAuctionModal,
    openAuctionHistoryModal,
    openChangeAvatarModal,
    openTradeHistoryModal,
    openGMTradeHistoryModal,
    canChangeAvatar,
    isInModal,
  } = props || {};

  return {
    data: {
      characterData,
      userCharacter,
      tinygrailCharacter,
      gensokyoCharacter,
      pool,
      killVotes,
      fixedAssets,
    },
    actions: {
      openFavoriteModal,
      openSacrificeModal,
      openAuctionModal,
      openAuctionHistoryModal,
      openChangeAvatarModal,
      openTradeHistoryModal,
      openGMTradeHistoryModal,
    },
    options: {
      canChangeAvatar,
      isInModal,
    },
  };
}

/**
 * 从状态中创建TradeBox标题props
 * @param {Object} state 状态数据
 * @param {Object} extraProps 附加参数
 * @returns {Object} 标题区域参数
 */
export function createTradeBoxTitlePropsFromState(state, extraProps) {
  const {
    characterData,
    userCharacter,
    tinygrailCharacter,
    gensokyoCharacter,
    pool,
    killVotes,
    fixedAssets,
    canChangeAvatar,
  } = state || {};

  return createTradeBoxTitleProps({
    characterData,
    userCharacter,
    tinygrailCharacter,
    gensokyoCharacter,
    pool,
    killVotes,
    fixedAssets,
    canChangeAvatar,
    ...(extraProps || {}),
  });
}

/**
 * 从store中创建TradeBox标题props
 * @param {string} storeKey 标题区storeKey
 * @returns {Object} 标题区域参数
 */
export function createTradeBoxTitlePropsFromStore(storeKey) {
  const storeState = storeKey ? getStoreState(storeKey) : {};

  return createTradeBoxTitlePropsFromState(storeState, {
    ...(storeState.actions || {}),
    isInModal: true,
  });
}

/**
 * 从TradeBox标题组件参数中创建最终props
 * @param {Object} props 标题组件参数
 * @param {string} props.storeKey 标题区storeKey
 * @param {Object} props.data 标题数据
 * @param {Object} props.actions 标题操作
 * @param {Object} props.options 标题配置
 * @returns {Object} 标题区域参数
 */
export function createTradeBoxTitlePropsFromComponentProps(props) {
  const {
    storeKey,
    data,
    actions,
    options,
  } = props || {};
  const storeProps = createTradeBoxTitlePropsFromStore(storeKey);

  return mergeGroupedProps(storeProps, { data, actions, options }, ["data", "actions", "options"]);
}

/**
 * 将内容参数整理为分组props
 * @param {Object} props 内容参数
 * @returns {Object} 内容区域参数
 */
export function createTradeBoxContentProps(props) {
  const {
    characterData,
    userAssets,
    userCharacter,
    depth,
    links,
    temples,
    users,
    onRefresh,
    setLoading,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    openTempleModal,
    isLinkCollapsed = false,
    onToggleLinkCollapse,
    isSectionCollapsed = false,
    onToggleSectionCollapse,
    isTempleCollapsed = false,
    onToggleTempleCollapse,
    templeFilterOptions = createDefaultTempleFilterOptions(),
    onTempleFilterChange,
    isUserCollapsed = false,
    onToggleUserCollapse,
    stickyTop,
    headerBgClass,
  } = props || {};

  return {
    data: {
      characterData,
      userAssets,
      userCharacter,
      depth,
      links,
      temples,
      users,
    },
    actions: {
      onRefresh,
      setLoading,
      loadUsersPage,
      openUserModal,
      openCharacterModal,
      openTempleModal,
      onToggleLinkCollapse,
      onToggleSectionCollapse,
      onToggleTempleCollapse,
      onTempleFilterChange,
      onToggleUserCollapse,
    },
    state: {
      isLinkCollapsed,
      isSectionCollapsed,
      isTempleCollapsed,
      templeFilterOptions,
      isUserCollapsed,
    },
    options: {
      stickyTop,
      headerBgClass,
    },
  };
}

/**
 * 从状态中创建TradeBox内容props
 * @param {Object} state 状态数据
 * @param {Object} initialCollapsedStates 初始折叠状态
 * @param {Object} extraProps 附加参数
 * @returns {Object} 内容区域参数
 */
export function createTradeBoxContentPropsFromState(state, initialCollapsedStates, extraProps) {
  const currentState = state || {};
  const contentStateDefaults = createTradeBoxContentStateDefaults(initialCollapsedStates);
  const {
    characterData,
    userAssets,
    userCharacter,
    depth,
    links,
    temples,
    users,
    templeFilterOptions = contentStateDefaults.templeFilterOptions,
    isLinkCollapsed = contentStateDefaults.isLinkCollapsed,
    isSectionCollapsed = contentStateDefaults.isSectionCollapsed,
    isTempleCollapsed = contentStateDefaults.isTempleCollapsed,
    isUserCollapsed = contentStateDefaults.isUserCollapsed,
  } = currentState;

  return createTradeBoxContentProps({
    characterData,
    userAssets,
    userCharacter,
    depth,
    links,
    temples,
    users,
    templeFilterOptions,
    isLinkCollapsed,
    isSectionCollapsed,
    isTempleCollapsed,
    isUserCollapsed,
    ...(extraProps || {}),
  });
}

/**
 * 从store中创建TradeBox内容props
 * @param {string} storeKey 内容区storeKey
 * @returns {Object} 内容区域参数
 */
export function createTradeBoxContentPropsFromStore(storeKey) {
  const storeState = storeKey ? getStoreState(storeKey) : {};

  return createTradeBoxContentPropsFromState(storeState, null, {
    ...(storeState.actions || {}),
    stickyTop: storeState.stickyTop,
    headerBgClass: storeState.headerBgClass,
  });
}

/**
 * 从TradeBox内容组件参数中创建最终props
 * @param {Object} props 内容组件参数
 * @param {string} props.storeKey 内容区storeKey
 * @param {Object} props.data 内容数据
 * @param {Object} props.actions 内容操作
 * @param {Object} props.state 内容状态
 * @param {Object} props.options 内容配置
 * @returns {Object} 内容区域参数
 */
export function createTradeBoxContentPropsFromComponentProps(props) {
  const {
    storeKey,
    data,
    actions,
    state,
    options,
  } = props || {};
  const storeProps = createTradeBoxContentPropsFromStore(storeKey);

  return mergeGroupedProps(storeProps, { data, actions, state, options }, [
    "data",
    "actions",
    "state",
    "options",
  ]);
}

/**
 * 从状态中创建TradeBox分组props
 * @param {Object} options 配置项
 * @param {Object} options.state 状态数据
 * @param {Function} options.setState 状态更新函数
 * @param {Object} options.initialCollapsedStates 初始折叠状态
 * @param {Object} options.titleExtraProps 标题附加参数
 * @param {Object} options.contentExtraProps 内容附加参数
 * @returns {Object} TradeBox组件参数
 */
export function createTradeBoxPropsFromState(options) {
  const {
    state,
    setState,
    initialCollapsedStates,
    titleExtraProps,
    contentExtraProps,
  } = options || {};
  const currentState = state || {};
  const contentStateDefaults = createTradeBoxContentStateDefaults(initialCollapsedStates);
  const contentActionState = {
    ...contentStateDefaults,
    ...currentState,
  };
  const contentStateActions = createTradeBoxContentStateActions({
    state: contentActionState,
    setState,
  });

  return {
    titleProps: createTradeBoxTitlePropsFromState(currentState, titleExtraProps),
    contentProps: createTradeBoxContentPropsFromState(currentState, initialCollapsedStates, {
      ...(contentExtraProps || {}),
      ...contentStateActions,
    }),
  };
}

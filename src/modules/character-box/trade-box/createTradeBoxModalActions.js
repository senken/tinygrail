import { getStoreState } from "@src/utils/store.js";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { getCollapsedStates } from "../utils/collapsedState.js";
import {
  createTradeBoxContentStateActions,
  createTradeBoxContentStateDefaults,
} from "./tradeBoxState.js";
import { createCharacterBoxCallbacksFromState } from "../utils/characterBoxCallbacks.jsx";
import {
  createTradeBoxContentActions,
  createTradeBoxTitleActions,
} from "../utils/characterBoxActions.js";

/**
 * 空的加载状态处理函数
 * @returns {void}
 */
const noop = () => {};

/**
 * 根据当前store状态创建TradeBox弹窗回调
 * @param {Object} options 回调配置
 * @param {number} options.characterId 角色ID
 * @param {string} options.storeKey 弹窗storeKey
 * @param {Function} options.refreshTradeBoxData 刷新TradeBox数据的函数
 * @param {Function} options.rerenderFn 触发当前区域重新渲染的函数
 * @param {Function} options.openCharacterModal 打开角色弹窗的函数
 * @returns {Object} TradeBox弹窗回调集合
 */
function createCurrentTradeBoxModalCallbacks(options) {
  const {
    characterId,
    storeKey,
    refreshTradeBoxData,
    rerenderFn,
    openCharacterModal,
  } = options || {};

  return createCharacterBoxCallbacksFromState({
    characterId,
    state: getStoreState(storeKey),
    refreshFn: refreshTradeBoxData,
    rerenderFn,
    openCharacterModal,
  });
}

/**
 * 注册TradeBox弹窗标题区域action
 * @param {Object} options action配置
 * @param {number} options.characterId 角色ID
 * @param {string} options.titleStoreKey 标题区域storeKey
 * @param {Function} options.setTitleState 标题区域状态更新函数
 * @param {Function} options.refreshTradeBoxData 刷新TradeBox数据的函数
 * @param {Function} options.openCharacterModal 打开角色弹窗的函数
 */
export function registerTradeBoxModalTitleActions(options) {
  const {
    characterId,
    titleStoreKey,
    setTitleState,
    refreshTradeBoxData,
    openCharacterModal,
  } = options || {};

  /**
   * 触发标题区域重新渲染
   * @returns {void}
   */
  const rerenderTitle = () => setTitleState({});

  /**
   * 获取标题区域最新回调
   * 弹窗action执行时要重新读取store，避免使用过期的角色数据
   * @returns {Object} 标题区域回调集合
   */
  const getTitleCallbacks = () =>
    createCurrentTradeBoxModalCallbacks({
      characterId,
      storeKey: titleStoreKey,
      refreshTradeBoxData,
      rerenderFn: rerenderTitle,
      openCharacterModal,
    });

  setTitleState({
    actions: createTradeBoxTitleActions(getTitleCallbacks),
  });
}

/**
 * 注册TradeBox弹窗内容区域action
 * @param {Object} options action配置
 * @param {number} options.characterId 角色ID
 * @param {string} options.contentStoreKey 内容区域storeKey
 * @param {Function} options.setContentState 内容区域状态更新函数
 * @param {Function} options.refreshTradeBoxData 刷新TradeBox数据的函数
 * @param {Function} options.loadUsersPage 加载持有人分页数据的函数
 * @param {Function} options.openUserModal 打开用户弹窗的函数
 * @param {Function} options.openCharacterModal 打开角色弹窗的函数
 * @param {Object} options.initialCollapsedStates 初始折叠状态
 */
export function registerTradeBoxModalContentActions(options) {
  const {
    characterId,
    contentStoreKey,
    setContentState,
    refreshTradeBoxData,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    initialCollapsedStates,
  } = options || {};

  /**
   * 触发内容区域重新渲染
   * @returns {void}
   */
  const rerenderContent = () => setContentState({});

  /**
   * 获取内容区域最新回调
   * 弹窗action执行时要重新读取store，避免使用过期的角色数据
   * @returns {Object} 内容区域回调集合
   */
  const getContentCallbacks = () =>
    createCurrentTradeBoxModalCallbacks({
      characterId,
      storeKey: contentStoreKey,
      refreshTradeBoxData,
      rerenderFn: rerenderContent,
      openCharacterModal,
    });
  const contentStateActions = createTradeBoxContentStateActions({
    getState: () => getStoreState(contentStoreKey),
    setState: setContentState,
  });
  const contentStateDefaults = createTradeBoxContentStateDefaults(initialCollapsedStates);
  const contentActions = createTradeBoxContentActions({
    onRefresh: refreshTradeBoxData,
    setLoading: noop,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    openTempleModal: (temple) => getContentCallbacks()?.openTempleModal?.(temple),
  });

  setContentState({
    ...contentStateDefaults,
    actions: {
      ...contentActions,
      ...contentStateActions,
    },
  });
}

/**
 * 注册TradeBox弹窗标题区域和内容区域action
 * @param {Object} options action配置
 * @param {number} options.characterId 角色ID
 * @param {string} options.titleStoreKey 标题区域storeKey
 * @param {string} options.contentStoreKey 内容区域storeKey
 * @param {Function} options.setTitleState 标题区域状态更新函数
 * @param {Function} options.setContentState 内容区域状态更新函数
 * @param {Function} options.refreshTradeBoxData 刷新TradeBox数据的函数
 * @param {Function} options.loadUsersPage 加载持有人分页数据的函数
 * @param {Function} options.openCharacterModal 打开角色弹窗的函数
 */
export function registerTradeBoxModalActions(options) {
  const {
    characterId,
    titleStoreKey,
    contentStoreKey,
    setTitleState,
    setContentState,
    refreshTradeBoxData,
    loadUsersPage,
    openCharacterModal,
  } = options || {};
  const initialCollapsedStates = getCollapsedStates();

  registerTradeBoxModalTitleActions({
    characterId,
    titleStoreKey,
    setTitleState,
    refreshTradeBoxData,
    openCharacterModal,
  });

  registerTradeBoxModalContentActions({
    characterId,
    contentStoreKey,
    setContentState,
    refreshTradeBoxData,
    loadUsersPage,
    openUserModal: openUserTinygrailModal,
    openCharacterModal,
    initialCollapsedStates,
  });
}

import { getStoreState } from "@src/utils/store.js";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import {
  createIcoBoxContentActionsFromState,
  createIcoBoxTitleActionsFromState,
} from "../utils/characterBoxActions.js";

/**
 * 注册IcoBox弹窗标题区域action
 * @param {Object} options action配置
 * @param {number} options.characterId 角色ID
 * @param {string} options.titleStoreKey 标题区域storeKey
 * @param {Function} options.setTitleState 标题区域状态更新函数
 */
export function registerIcoBoxModalTitleActions(options) {
  const { characterId, titleStoreKey, setTitleState } = options || {};

  setTitleState({
    actions: createIcoBoxTitleActionsFromState({
      characterId,
      getState: () => getStoreState(titleStoreKey),
      onFavoriteClose: () => setTitleState({}),
    }),
  });
}

/**
 * 注册IcoBox弹窗内容区域action
 * @param {Object} options action配置
 * @param {string} options.contentStoreKey 内容区域storeKey
 * @param {Function} options.setContentState 内容区域状态更新函数
 * @param {Function} options.loadIcoUsersPage 加载ICO参与者分页数据的函数
 * @param {Function} options.openUserModal 打开用户弹窗的函数
 * @param {Function} options.refreshIcoBoxData 刷新IcoBox数据的函数
 */
export function registerIcoBoxModalContentActions(options) {
  const {
    contentStoreKey,
    setContentState,
    loadIcoUsersPage,
    openUserModal,
    refreshIcoBoxData,
  } = options || {};

  setContentState({
    actions: createIcoBoxContentActionsFromState({
      getState: () => getStoreState(contentStoreKey),
      loadIcoUsersPage,
      openUserModal,
      onInvestSuccess: refreshIcoBoxData,
    }),
  });
}

/**
 * 注册IcoBox弹窗标题区域和内容区域action
 * @param {Object} options action配置
 * @param {number} options.characterId 角色ID
 * @param {string} options.titleStoreKey 标题区域storeKey
 * @param {string} options.contentStoreKey 内容区域storeKey
 * @param {Function} options.setTitleState 标题区域状态更新函数
 * @param {Function} options.setContentState 内容区域状态更新函数
 * @param {Function} options.loadIcoUsersPage 加载ICO参与者分页数据的函数
 * @param {Function} options.refreshIcoBoxData 刷新IcoBox数据的函数
 */
export function registerIcoBoxModalActions(options) {
  const {
    characterId,
    titleStoreKey,
    contentStoreKey,
    setTitleState,
    setContentState,
    loadIcoUsersPage,
    refreshIcoBoxData,
  } = options || {};

  registerIcoBoxModalTitleActions({
    characterId,
    titleStoreKey,
    setTitleState,
  });

  registerIcoBoxModalContentActions({
    contentStoreKey,
    setContentState,
    loadIcoUsersPage,
    openUserModal: openUserTinygrailModal,
    refreshIcoBoxData,
  });
}

import { initICO, joinICO } from "@src/api/chara.js";
import { openAddToFavoriteModal } from "@src/modules/favorite/index.js";
import { showError, showSuccess } from "@src/utils/toastManager.jsx";

/**
 * 创建收藏弹窗打开函数
 * @param {Object} options 配置项
 * @param {number} options.characterId 角色ID
 * @param {Function} options.getCharacterData 获取角色数据的函数
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @returns {Function} 收藏弹窗打开函数
 */
export function createFavoriteModalOpener(options) {
  const { characterId, getCharacterData, onClose } = options || {};

  return () =>
    openAddToFavoriteModal({
      characterId,
      characterData: getCharacterData(),
      onClose,
    });
}

/**
 * 创建从状态读取角色数据的收藏弹窗打开函数
 * @param {Object} options 配置项
 * @param {number} options.characterId 角色ID
 * @param {Function} options.getState 获取当前状态的函数
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @returns {Function} 收藏弹窗打开函数
 */
export function createFavoriteModalOpenerFromState(options) {
  const { characterId, getState, onClose } = options || {};

  return createFavoriteModalOpener({
    characterId,
    getCharacterData: () => {
      const state = typeof getState === "function" ? getState() : {};
      return state.characterData;
    },
    onClose,
  });
}

/**
 * 创建ICO启动处理函数
 * @param {Object} options 配置项
 * @param {number} options.characterId 角色ID
 * @param {Function} options.onSuccess 启动成功后的回调
 * @param {boolean} options.showSuccessToast 是否显示成功提示
 * @returns {Function} ICO启动处理函数
 */
export function createIcoInitHandler({ characterId, onSuccess, showSuccessToast = true }) {
  return async (amount) => {
    const result = await initICO(characterId, amount);

    if (result.success) {
      if (showSuccessToast) {
        showSuccess("ICO启动成功，邀请更多朋友加入吧。");
      }
      if (typeof onSuccess === "function") {
        await onSuccess();
      }
    } else {
      showError(result.message || "启动ICO失败");
    }
  };
}

/**
 * 创建ICO注资处理函数
 * @param {Object} options 配置项
 * @param {number} options.icoId ICO ID
 * @param {Function} options.onSuccess 注资成功后的回调
 * @returns {Function} 注资处理函数
 */
export function createIcoInvestHandler({ icoId, onSuccess }) {
  return async (amount) => {
    const result = await joinICO(icoId, amount);

    if (result.success) {
      showSuccess("注资成功");
      if (typeof onSuccess === "function") {
        await onSuccess();
      }
      return;
    }

    showError(result.message || "注资失败");
  };
}

/**
 * 创建从状态读取ICO ID的注资处理函数
 * @param {Object} options 配置项
 * @param {Function} options.getState 获取当前状态的函数
 * @param {Function} options.onSuccess 注资成功后的回调
 * @returns {Function} 注资处理函数
 */
export function createIcoInvestHandlerFromState(options) {
  const { getState, onSuccess } = options || {};

  return (amount) => {
    const state = typeof getState === "function" ? getState() : {};
    const handleIcoInvest = createIcoInvestHandler({
      icoId: state.characterData?.Id,
      onSuccess: () => {
        if (typeof onSuccess === "function") {
          return onSuccess(state);
        }
      },
    });

    return handleIcoInvest(amount);
  };
}

/**
 * 创建IcoBox标题区action
 * @param {Object} options 配置项
 * @param {number} options.characterId 角色ID
 * @param {Function} options.getState 获取当前状态的函数
 * @param {Function} options.onFavoriteClose 收藏弹窗关闭后的回调
 * @returns {Object} 标题区action
 */
export function createIcoBoxTitleActionsFromState(options) {
  const { characterId, getState, onFavoriteClose } = options || {};

  return {
    openFavoriteModal: createFavoriteModalOpenerFromState({
      characterId,
      getState,
      onClose: onFavoriteClose,
    }),
  };
}

/**
 * 创建IcoBox内容区action
 * @param {Object} options 配置项
 * @param {Function} options.getState 获取当前状态的函数
 * @param {Function} options.loadIcoUsersPage 加载ICO参与者分页数据的函数
 * @param {Function} options.openUserModal 打开用户弹窗的函数
 * @param {Function} options.onInvestSuccess 注资成功后的回调
 * @returns {Object} 内容区action
 */
export function createIcoBoxContentActionsFromState(options) {
  const { getState, loadIcoUsersPage, openUserModal, onInvestSuccess } = options || {};

  return {
    loadIcoUsersPage,
    openUserModal,
    onInvest: createIcoInvestHandlerFromState({
      getState,
      onSuccess: onInvestSuccess,
    }),
  };
}

/**
 * 创建从当前回调集合读取的TradeBox标题区action
 * @param {Function} getCallbacks 获取当前弹窗回调集合的函数
 * @returns {Object} TradeBox标题区action
 */
export function createTradeBoxTitleActions(getCallbacks) {
  return {
    openFavoriteModal: () => getCallbacks().openFavoriteModal(),
    openSacrificeModal: () => getCallbacks().openSacrificeModal(),
    openAuctionModal: () => getCallbacks().openAuctionModal(),
    openAuctionHistoryModal: () => getCallbacks().openAuctionHistoryModal(),
    openChangeAvatarModal: () => getCallbacks().openChangeAvatarModal(),
    openTradeHistoryModal: () => getCallbacks().openTradeHistoryModal(),
    openGMTradeHistoryModal: () => getCallbacks().openGMTradeHistoryModal(),
  };
}

/**
 * 创建TradeBox内容区通用action
 * @param {Object} options 配置项
 * @param {Function} options.onRefresh 刷新TradeBox数据的函数
 * @param {Function} options.setLoading 设置加载状态的函数
 * @param {Function} options.loadUsersPage 加载持有人分页数据的函数
 * @param {Function} options.openUserModal 打开用户弹窗的函数
 * @param {Function} options.openCharacterModal 打开角色弹窗的函数
 * @param {Function} options.openTempleModal 打开圣殿弹窗的函数
 * @returns {Object} TradeBox内容区action
 */
export function createTradeBoxContentActions(options) {
  const {
    onRefresh,
    setLoading,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    openTempleModal,
  } = options || {};

  return {
    onRefresh,
    setLoading,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    openTempleModal,
  };
}

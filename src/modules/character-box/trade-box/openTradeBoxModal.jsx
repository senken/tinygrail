import { registerTradeBoxModalActions } from "./createTradeBoxModalActions.js";
import { createTradeBoxModalDataLoader } from "../modals/modalDataLoader.js";
import { createTradeBoxModalMount } from "../modals/modalMounts.jsx";

/**
 * 打开TradeBox弹窗
 * @param {Object} options 弹窗配置
 * @param {number} options.characterId 角色ID
 * @param {Object} options.characterData 角色交易数据
 * @param {Object|null} options.userAssets 当前用户资产
 * @param {string} options.modalId 弹窗ID
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @param {Function} options.openCharacterModal 打开角色弹窗的函数
 * @returns {Promise<void>}
 */
export async function openTradeBoxModal(options) {
  const { characterId, characterData, userAssets, modalId, onClose, openCharacterModal } =
    options || {};
  const { titleStoreKey, contentStoreKey, setTitleState, setContentState, initialize } =
    createTradeBoxModalMount({
      modalId,
      characterId,
      characterData,
      userAssets,
    });

  const {
    loadUsersPage,
    loadTradeBoxData,
    refreshTradeBoxData,
  } = createTradeBoxModalDataLoader({
    characterId,
    setTitleState,
    setContentState,
  });

  registerTradeBoxModalActions({
    characterId,
    titleStoreKey,
    contentStoreKey,
    setTitleState,
    setContentState,
    refreshTradeBoxData,
    loadUsersPage,
    openCharacterModal,
  });

  await initialize({
    loadData: loadTradeBoxData,
    onClose,
  });
}

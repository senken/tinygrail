import { registerIcoBoxModalActions } from "./createIcoBoxModalActions.js";
import { createIcoBoxModalDataLoader } from "../modals/modalDataLoader.js";
import { createIcoBoxModalMount } from "../modals/modalMounts.jsx";

/**
 * 打开IcoBox弹窗
 * @param {Object} options 弹窗配置
 * @param {number} options.characterId 角色ID
 * @param {Object} options.characterData 角色ICO数据
 * @param {Object|null} options.userAssets 当前用户资产
 * @param {string} options.modalId 弹窗ID
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @returns {Promise<void>}
 */
export async function openIcoBoxModal(options) {
  const { characterId, characterData, userAssets, modalId, onClose } = options || {};
  const { titleStoreKey, contentStoreKey, setTitleState, setContentState, initialize } =
    createIcoBoxModalMount({
      modalId,
      characterId,
      characterData,
      userAssets,
    });

  const {
    loadIcoUsersPage,
    loadIcoBoxData,
    refreshIcoBoxData,
  } = createIcoBoxModalDataLoader({
    characterId,
    icoId: characterData.Id,
    setTitleState,
    setContentState,
  });

  registerIcoBoxModalActions({
    characterId,
    titleStoreKey,
    contentStoreKey,
    setTitleState,
    setContentState,
    loadIcoUsersPage,
    refreshIcoBoxData,
  });

  await initialize({
    loadData: loadIcoBoxData,
    onClose,
  });
}

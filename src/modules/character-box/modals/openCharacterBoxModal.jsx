import { openModal } from "@src/utils/modalManager.js";
import { showError } from "@src/utils/toastManager.jsx";
import { CharacterBoxLoading } from "../components/CharacterBoxLoading.jsx";
import { openIcoInitModal } from "../ico-box-init/IcoBoxInit.jsx";
import {
  CHARACTER_BOX_STATUS,
  loadCharacterBoxInitialState,
} from "../utils/characterBoxState.js";
import { openIcoBoxModal } from "../ico-box/openIcoBoxModal.jsx";
import { openTradeBoxModal } from "../trade-box/openTradeBoxModal.jsx";

/**
 * 创建CharacterBox弹窗ID
 * @param {number} characterId 角色ID
 * @returns {string} 弹窗ID
 */
function createCharacterBoxModalId(characterId) {
  return `character-box-modal-${characterId}`;
}

/**
 * 创建只执行一次的回调函数
 * @param {Function} callback 原始回调函数
 * @returns {Function|undefined} 只执行一次的回调函数
 */
function createOnceCallback(callback) {
  if (typeof callback !== "function") {
    return undefined;
  }

  let called = false;

  return () => {
    if (called) {
      return;
    }

    called = true;
    callback();
  };
}

/**
 * 打开CharacterBox加载弹窗
 * @param {string} modalId 弹窗ID
 * @returns {Function} 关闭加载弹窗的函数
 */
function openCharacterBoxLoadingModal(modalId) {
  const { close } = openModal(modalId, {
    content: <CharacterBoxLoading />,
    size: "xl",
  });

  return close;
}

/**
 * 处理CharacterBox加载失败状态
 * @param {Function} closeLoadingModal 关闭加载弹窗的函数
 * @returns {void}
 */
function handleCharacterBoxModalError(closeLoadingModal) {
  closeLoadingModal();
  showError("加载用户资产失败");
}

/**
 * 打开CharacterBox的ICO启动弹窗
 * @param {Object} options 弹窗配置
 * @param {string} options.modalId 弹窗ID
 * @param {number} options.characterId 角色ID
 * @param {Object|null} options.userAssets 当前用户资产
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @returns {void}
 */
function openCharacterBoxIcoInitModal(options) {
  const { modalId, characterId, userAssets, onClose } = options || {};

  openIcoInitModal({
    modalId,
    characterId,
    userAssets,
    onClose,
    reopenCharacterModal: openCharacterBoxModal,
  });
}

/**
 * 按初始状态打开对应的CharacterBox弹窗内容
 * @param {Object} options 弹窗配置
 * @param {number} options.characterId 角色ID
 * @param {string} options.modalId 弹窗ID
 * @param {Object} options.initialState 初始状态解析结果
 * @param {Function} options.closeLoadingModal 关闭加载弹窗的函数
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @returns {Promise<void>}
 */
async function openCharacterBoxModalByInitialState(options) {
  const { characterId, modalId, initialState, closeLoadingModal, onClose } = options || {};
  const { characterData, userAssets } = initialState?.state || {};

  switch (initialState?.status) {
    case CHARACTER_BOX_STATUS.ERROR:
      handleCharacterBoxModalError(closeLoadingModal);
      return;

    case CHARACTER_BOX_STATUS.NOT_FOUND:
      openCharacterBoxIcoInitModal({
        modalId,
        characterId,
        userAssets,
        onClose,
      });
      return;

    case CHARACTER_BOX_STATUS.TRADE:
      await openTradeBoxModal({
        characterId,
        characterData,
        userAssets,
        modalId,
        onClose,
        openCharacterModal: openCharacterBoxModal,
      });
      return;

    case CHARACTER_BOX_STATUS.ICO:
      await openIcoBoxModal({
        characterId,
        characterData,
        userAssets,
        modalId,
        onClose,
      });
      return;

    default:
      handleCharacterBoxModalError(closeLoadingModal);
  }
}

/**
 * 打开角色弹窗
 *
 * @param {number} characterId 角色ID
 * @param {Object} options 弹窗配置
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @returns {Promise<void>}
 */
export async function openCharacterBoxModal(characterId, options = {}) {
  if (!characterId) {
    showError("角色ID不能为空");
    return;
  }

  const modalId = createCharacterBoxModalId(characterId);
  const onClose = createOnceCallback(options.onClose);
  const closeLoadingModal = openCharacterBoxLoadingModal(modalId);
  const initialState = await loadCharacterBoxInitialState(characterId);

  await openCharacterBoxModalByInitialState({
    characterId,
    modalId,
    initialState,
    closeLoadingModal,
    onClose,
  });
}

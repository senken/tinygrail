import { openModal } from "@src/utils/modalManager.js";
import { UserAssetsFeedback } from "@src/components/UserAssetsFeedback.jsx";
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
 * @param {Function} onClose 关闭回调
 * @returns {Object} 弹窗控制对象
 */
function openCharacterBoxLoadingModal(modalId, onClose) {
  return openModal(modalId, {
    content: <CharacterBoxLoading />,
    size: "xl",
    onClose,
  });
}

/**
 * 处理CharacterBox加载失败状态
 * @param {Object} options 弹窗配置
 * @param {Function} options.updateContent 更新当前弹窗内容
 * @param {Function} options.onRetry 重试加载当前角色
 * @param {Object} options.result 用户资产失败结果
 * @returns {void}
 */
function handleCharacterBoxModalError({ updateContent, onRetry, result }) {
  updateContent(
    <UserAssetsFeedback
      result={result || { message: "加载用户资产失败" }}
      onRetry={onRetry}
    />
  );
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
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @param {Function} options.shouldOpen 检查是否仍需打开并转交关闭回调
 * @returns {Promise<void>}
 */
async function openCharacterBoxModalByInitialState(options) {
  const { characterId, modalId, initialState, onClose, shouldOpen } = options || {};
  const { characterData, userAssets } = initialState?.state || {};

  switch (initialState?.status) {
    case CHARACTER_BOX_STATUS.NOT_FOUND:
      if (!shouldOpen()) return;
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
        shouldOpen,
      });
      return;

    case CHARACTER_BOX_STATUS.ICO:
      await openIcoBoxModal({
        characterId,
        characterData,
        userAssets,
        modalId,
        onClose,
        shouldOpen,
      });
      return;

    default:
      showError("加载角色失败");
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
  let closed = false;
  let replacing = false;
  const { updateContent } = openCharacterBoxLoadingModal(modalId, () => {
    closed = true;
    if (!replacing) onClose?.();
  });

  /**
   * 重载当前角色，授权和请求结束后不重新打开用户已经关闭的弹窗
   * @returns {Promise<void>} 当前内容加载结束
   */
  const loadData = async () => {
    if (closed) return;
    updateContent(<CharacterBoxLoading />);
    const initialState = await loadCharacterBoxInitialState(characterId);
    if (closed) return;

    if (initialState.status === CHARACTER_BOX_STATUS.ERROR) {
      handleCharacterBoxModalError({
        updateContent,
        onRetry: loadData,
        result: initialState.state.assetsError,
      });
      return;
    }

    await openCharacterBoxModalByInitialState({
      characterId,
      modalId,
      initialState,
      onClose,
      shouldOpen: () => {
        if (closed) return false;
        // 内容弹窗替换加载弹窗时，最终关闭回调交给新的弹窗持有
        replacing = true;
        return true;
      },
    });
  };

  await loadData();
}

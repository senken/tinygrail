import { createMountedComponentWithStore } from "@src/utils/createMountedComponentWithStore.js";
import { openModal } from "@src/utils/modalManager.js";

/**
 * 创建CharacterBox弹窗标题和内容storeKey
 * @param {string} modalId 弹窗ID
 * @param {string} boxType 弹窗内容类型
 * @returns {{titleStoreKey: string, contentStoreKey: string}} 弹窗storeKey
 */
export function createCharacterBoxModalStoreKeys(modalId, boxType) {
  if (!modalId || !boxType) {
    throw new TypeError("modalId和boxType不能为空");
  }

  return {
    titleStoreKey: `${modalId}:${boxType}-title`,
    contentStoreKey: `${modalId}:${boxType}-content`,
  };
}

/**
 * 创建CharacterBox弹窗store和挂载控制器
 * @param {Object} options 挂载配置
 * @param {string} options.modalId 弹窗ID
 * @param {string} options.boxType 弹窗内容类型
 * @param {number} options.characterId 角色ID
 * @param {Object} options.characterData 角色数据
 * @param {Object|null} options.userAssets 当前用户资产
 * @param {Function} options.renderTitle 标题渲染函数
 * @param {Function} options.renderContent 内容渲染函数
 * @returns {Object} 弹窗storeKey和挂载控制器
 */
export function createCharacterBoxModalStoreMount(options) {
  const {
    modalId,
    boxType,
    characterId,
    characterData,
    userAssets,
    renderTitle,
    renderContent,
  } = options || {};
  const { titleStoreKey, contentStoreKey } = createCharacterBoxModalStoreKeys(modalId, boxType);
  const initialState = {
    characterData,
    userAssets,
  };

  return {
    titleStoreKey,
    contentStoreKey,
    ...createCharacterBoxModalMount({
      renderTitle: () => renderTitle(titleStoreKey),
      renderContent: () => renderContent(contentStoreKey),
      modalId,
      characterId,
      titleStoreKey,
      contentStoreKey,
      initialState,
    }),
  };
}

/**
 * 校验CharacterBox弹窗挂载配置
 * @param {Object} options 挂载配置
 * @param {Function} options.renderTitle 标题渲染函数
 * @param {Function} options.renderContent 内容渲染函数
 * @param {string} options.modalId 弹窗ID
 * @param {number} options.characterId 角色ID
 * @param {string} options.titleStoreKey 标题storeKey
 * @param {string} options.contentStoreKey 内容storeKey
 */
function validateCharacterBoxModalMountOptions(options) {
  const { renderTitle, renderContent, modalId, characterId, titleStoreKey, contentStoreKey } =
    options || {};

  if (
    typeof renderTitle !== "function" ||
    typeof renderContent !== "function" ||
    !modalId ||
    !characterId ||
    !titleStoreKey ||
    !contentStoreKey
  ) {
    throw new TypeError(
      "renderTitle、renderContent、modalId、characterId、titleStoreKey和contentStoreKey不能为空"
    );
  }
}

/**
 * 创建绑定store的CharacterBox弹窗标题和内容挂载容器
 * @param {Object} options 挂载配置
 * @param {Function} options.renderTitle 标题渲染函数
 * @param {Function} options.renderContent 内容渲染函数
 * @param {string} options.titleStoreKey 标题storeKey
 * @param {string} options.contentStoreKey 内容storeKey
 * @param {Object} options.initialState 初始状态
 * @returns {Object} 标题和内容容器及状态更新函数
 */
function createCharacterBoxMountedContainers(options) {
  const { renderTitle, renderContent, titleStoreKey, contentStoreKey, initialState } =
    options || {};
  const titleContainer = document.createElement("div");
  const contentContainer = document.createElement("div");

  const titleComponent = createMountedComponentWithStore(
    titleContainer,
    titleStoreKey,
    renderTitle,
    {
      initialState,
    }
  );
  const contentComponent = createMountedComponentWithStore(
    contentContainer,
    contentStoreKey,
    renderContent,
    {
      initialState,
    }
  );

  // 同一个modalId复用store时，需要重置标题和内容的初始状态
  titleComponent.replaceState(initialState);
  contentComponent.replaceState(initialState);

  return {
    titleContainer,
    contentContainer,
    setTitleState: titleComponent.setState,
    setContentState: contentComponent.setState,
  };
}

/**
 * 创建CharacterBox弹窗挂载控制器
 * @param {Object} options 挂载配置
 * @param {Function} options.renderTitle 标题渲染函数
 * @param {Function} options.renderContent 内容渲染函数
 * @param {string} options.modalId 弹窗ID
 * @param {number} options.characterId 角色ID
 * @param {string} options.titleStoreKey 标题storeKey
 * @param {string} options.contentStoreKey 内容storeKey
 * @param {Object} options.initialState 初始状态
 * @returns {Object} 弹窗挂载控制器
 */
export function createCharacterBoxModalMount(options = {}) {
  validateCharacterBoxModalMountOptions(options);

  const {
    renderTitle,
    renderContent,
    modalId,
    characterId,
    titleStoreKey,
    contentStoreKey,
    initialState,
  } = options;
  const { titleContainer, contentContainer, setTitleState, setContentState } =
    createCharacterBoxMountedContainers({
      renderTitle,
      renderContent,
      titleStoreKey,
      contentStoreKey,
      initialState,
    });

  return {
    setTitleState,
    setContentState,
    initialize: (initializeOptions) =>
      initializeCharacterBoxModal({
        ...(initializeOptions || {}),
        modalId,
        characterId,
        initialState,
        titleContainer,
        contentContainer,
      }),
  };
}

/**
 * 打开CharacterBox弹窗主体内容
 * @param {Object} options 弹窗渲染配置
 * @param {string} options.modalId 弹窗ID
 * @param {number} options.characterId 角色ID
 * @param {HTMLElement} options.titleContainer 标题容器
 * @param {HTMLElement} options.contentContainer 内容容器
 * @param {Function} options.onClose 弹窗关闭后的回调
 */
function openCharacterBoxMountedModal(options) {
  const { modalId, characterId, titleContainer, contentContainer, onClose } = options || {};

  openModal(modalId, {
    title: titleContainer,
    content: contentContainer,
    onClose,
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
 * 加载数据后打开CharacterBox弹窗内容
 * @param {Object} options 弹窗初始化配置
 * @param {string} options.modalId 弹窗ID
 * @param {number} options.characterId 角色ID
 * @param {HTMLElement} options.titleContainer 标题容器
 * @param {HTMLElement} options.contentContainer 内容容器
 * @param {Function} options.loadData 加载弹窗数据的函数
 * @param {Function} options.onClose 弹窗关闭后的回调
 * @returns {Promise<void>}
 */
async function initializeCharacterBoxModal(options) {
  const { modalId, characterId, titleContainer, contentContainer, loadData, initialState, onClose } =
    options || {};

  await loadData(initialState);
  openCharacterBoxMountedModal({
    modalId,
    characterId,
    titleContainer,
    contentContainer,
    onClose,
  });
}

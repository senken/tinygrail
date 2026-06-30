import { getStoreState } from "@src/utils/store.js";

const REQUIRED_DATA_CONTROLLER_METHODS = [
  "refreshTradeBoxData",
  "refreshIcoBoxData",
  "loadUsersPage",
  "loadIcoUsersPage",
  "loadInitialData",
];
const REQUIRED_MODAL_OPENER_METHODS = ["openUserModal", "openCharacterModal"];

/**
 * 判断对象是否包含指定函数
 * @param {Object} target 待校验对象
 * @param {string[]} methodNames 函数名列表
 * @returns {boolean} 是否全部为函数
 */
function hasRequiredMethods(target, methodNames) {
  return methodNames.every((methodName) => typeof target?.[methodName] === "function");
}

/**
 * 校验CharacterBoxContent的storeKey
 * @param {string} storeKey 页面storeKey
 */
function assertCharacterBoxContentStoreKey(storeKey) {
  if (!storeKey) {
    throw new TypeError("CharacterBoxContent的storeKey不能为空");
  }
}

/**
 * 校验CharacterBox页面store上下文
 * @param {Object} storeState 页面store状态
 */
function assertCharacterBoxPageStoreState(storeState) {
  const { setState, dataController, modalOpeners } = storeState || {};

  if (
    typeof setState !== "function" ||
    !hasRequiredMethods(dataController, REQUIRED_DATA_CONTROLLER_METHODS) ||
    !hasRequiredMethods(modalOpeners, REQUIRED_MODAL_OPENER_METHODS)
  ) {
    throw new TypeError("CharacterBoxContent的store上下文不完整");
  }
}

/**
 * 创建CharacterBox页面store初始上下文
 * @param {Object} options 页面上下文配置
 * @param {number} options.characterId 角色ID
 * @param {Function} options.setState 页面状态更新函数
 * @param {Object} options.initialCollapsedStates 初始折叠状态
 * @param {Object} options.dataController 页面数据控制器
 * @param {Object} options.modalOpeners 页面弹窗打开函数集合
 * @returns {Object} 页面store初始上下文
 */
export function createCharacterBoxPageInitialState(options) {
  const {
    characterId,
    setState,
    initialCollapsedStates,
    dataController,
    modalOpeners,
  } = options || {};

  return {
    characterId,
    loading: true,
    setState,
    initialCollapsedStates,
    dataController,
    modalOpeners,
  };
}

/**
 * 从store中读取CharacterBox页面上下文
 * @param {string} storeKey 页面storeKey
 * @returns {Object} 页面上下文
 */
export function createCharacterBoxPageContextFromStore(storeKey) {
  assertCharacterBoxContentStoreKey(storeKey);

  const storeState = getStoreState(storeKey);
  assertCharacterBoxPageStoreState(storeState);

  const dataController = storeState.dataController || {};
  const modalOpeners = storeState.modalOpeners || {};

  return {
    characterId: storeState.characterId,
    state: storeState,
    setState: storeState.setState,
    initialCollapsedStates: storeState.initialCollapsedStates,
    dataController,
    modalOpeners,
  };
}

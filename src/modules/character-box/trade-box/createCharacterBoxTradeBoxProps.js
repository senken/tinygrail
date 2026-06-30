import { createTradeBoxPropsFromState } from "./tradeBoxProps.js";
import {
  createTradeBoxContentActions,
  createTradeBoxTitleActions,
} from "../utils/characterBoxActions.js";
import { createCharacterBoxCallbacksFromState } from "../utils/characterBoxCallbacks.jsx";

/**
 * 根据页面状态创建TradeBox回调
 * @param {Object} options 回调配置
 * @param {number} options.characterId 角色ID
 * @param {Object} options.state 页面状态
 * @param {Function} options.rerenderFn 触发页面重新渲染的函数
 * @param {Object} options.dataController 页面数据控制器
 * @param {Object} options.modalOpeners 页面弹窗打开函数集合
 * @returns {Object} TradeBox回调集合
 */
function createCurrentTradeBoxPageCallbacks(options) {
  const { characterId, state, rerenderFn, dataController, modalOpeners } = options || {};

  return createCharacterBoxCallbacksFromState({
    characterId,
    state,
    refreshFn: dataController?.refreshTradeBoxData,
    rerenderFn,
    openCharacterModal: modalOpeners?.openCharacterModal,
  });
}

/**
 * 创建角色页面TradeBox分组props
 * @param {Object} options 页面TradeBox配置
 * @param {number} options.characterId 角色ID
 * @param {Object} options.state 页面状态
 * @param {Function} options.setState 页面状态更新函数
 * @param {Object} options.initialCollapsedStates 初始折叠状态
 * @param {Object} options.dataController 页面数据控制器
 * @param {Object} options.modalOpeners 页面弹窗打开函数集合
 * @returns {Object} 标题和内容组件参数
 */
export function createCharacterBoxTradeBoxProps(options) {
  const {
    characterId,
    state,
    setState,
    initialCollapsedStates,
    dataController,
    modalOpeners,
  } = options || {};

  /**
   * 触发页面TradeBox重新渲染
   * @returns {void}
   */
  const rerender = () => setState({});

  /**
   * 获取页面TradeBox最新回调
   * 页面action执行时要重新读取当前状态，避免使用过期的角色数据
   * @returns {Object} TradeBox回调集合
   */
  const getCallbacks = () =>
    createCurrentTradeBoxPageCallbacks({
      characterId,
      state,
      rerenderFn: rerender,
      dataController,
      modalOpeners,
    });

  /**
   * 打开当前角色的圣殿弹窗
   * @param {Object} temple 圣殿数据
   * @returns {void}
   */
  const openCurrentTempleModal = (temple) => getCallbacks()?.openTempleModal?.(temple);

  const contentActions = createTradeBoxContentActions({
    onRefresh: dataController?.refreshTradeBoxData,
    loadUsersPage: dataController?.loadUsersPage,
    openUserModal: modalOpeners?.openUserModal,
    openCharacterModal: modalOpeners?.openCharacterModal,
    openTempleModal: openCurrentTempleModal,
  });

  return createTradeBoxPropsFromState({
    state,
    setState,
    initialCollapsedStates,
    titleExtraProps: createTradeBoxTitleActions(getCallbacks),
    contentExtraProps: contentActions,
  });
}

import {
  createIcoBoxContentActionsFromState,
  createIcoBoxTitleActionsFromState,
} from "../utils/characterBoxActions.js";
import { createIcoBoxPropsFromState } from "./icoBoxProps.js";

/**
 * 创建CharacterBox页面IcoBox分组props
 * @param {Object} options 页面IcoBox配置
 * @param {number} options.characterId 角色ID
 * @param {Object} options.state 页面状态
 * @param {Function} options.setState 页面状态更新函数
 * @param {Object} options.dataController 页面数据控制器
 * @param {Object} options.modalOpeners 页面弹窗打开函数集合
 * @returns {Object} 标题和内容组件参数
 */
export function createCharacterBoxIcoBoxProps(options) {
  const { characterId, state, setState, dataController, modalOpeners } = options || {};

  /**
   * 获取当前页面状态
   * @returns {Object} 当前页面状态
   */
  const getState = () => state;

  /**
   * 触发页面重新渲染
   * @returns {void}
   */
  const rerender = () => setState({});

  /**
   * 加载当前ICO的参与者分页
   * @param {number} page 页码
   * @returns {Promise<void>}
   */
  const loadCurrentIcoUsersPage = (page) =>
    dataController?.loadIcoUsersPage(page, state?.characterData?.Id);

  /**
   * 注资成功后刷新当前ICO数据
   * @param {Object} currentState 注资时读取到的状态
   * @returns {Promise<void>}
   */
  const refreshCurrentIcoBoxData = (currentState) =>
    dataController?.refreshIcoBoxData(currentState?.characterData?.Id);

  const titleActions = createIcoBoxTitleActionsFromState({
    characterId,
    getState,
    onFavoriteClose: rerender,
  });
  const contentActions = createIcoBoxContentActionsFromState({
    getState,
    loadIcoUsersPage: loadCurrentIcoUsersPage,
    openUserModal: modalOpeners?.openUserModal,
    onInvestSuccess: refreshCurrentIcoBoxData,
  });

  return createIcoBoxPropsFromState({
    state,
    titleExtraProps: {
      actions: titleActions,
    },
    contentExtraProps: {
      actions: contentActions,
    },
  });
}

import {
  isCharacterBoxTerminalInitialState,
  loadCharacterBoxInitialState,
  shouldLoadIcoBoxDetail,
  shouldLoadTradeBoxDetail,
} from "./characterBoxState.js";
import {
  createIcoBoxDetailDataLoader,
  createTradeBoxDetailDataLoader,
  updateCharacterBoxBaseState,
} from "./characterBoxDataLoader.js";
import {
  createIcoBoxUsersPageLoader,
  createTradeBoxUsersPageLoader,
} from "./pageLoader.js";

/**
 * 创建CharacterBox数据控制器
 * @param {Object} options 配置项
 * @param {number} options.characterId 角色ID
 * @param {Function} options.setState 状态更新函数
 * @returns {Object} 数据加载和刷新函数集合
 */
export function createCharacterBoxDataController(options) {
  const { characterId, setState } = options || {};
  let currentIcoId = null;
  const tradeUsersPageLoader = createTradeBoxUsersPageLoader(characterId, setState);
  const icoUsersPageLoader = createIcoBoxUsersPageLoader(setState);
  const {
    loadData: loadTradeBoxData,
    refreshData: refreshTradeBoxData,
  } = createTradeBoxDetailDataLoader({
    characterId,
    getCurrentPage: tradeUsersPageLoader.getCurrentPage,
    setState,
  });
  const { loadData: loadCurrentIcoBoxData } = createIcoBoxDetailDataLoader({
    characterId,
    getIcoId: () => currentIcoId,
    getCurrentPage: icoUsersPageLoader.getCurrentPage,
    setState,
  });

  /**
   * 刷新页面基础角色数据和当前用户资产
   * @returns {Promise<void>}
   */
  const refreshBaseState = async () => {
    await updateCharacterBoxBaseState({
      characterId,
      writeState: setState,
    });
  };

  /**
   * 加载IcoBox详情数据
   * @param {number} icoId ICO ID
   * @returns {Promise<void>}
   */
  const loadIcoBoxData = async (icoId) => {
    currentIcoId = icoId;
    icoUsersPageLoader.setRequestContext(icoId);
    await loadCurrentIcoBoxData();
  };

  /**
   * 按初始状态加载对应详情数据
   * @param {Object} initialState 初始状态解析结果
   * @returns {Promise<void>}
   */
  const loadDetailDataByInitialState = async (initialState) => {
    if (shouldLoadTradeBoxDetail(initialState)) {
      await loadTradeBoxData();
      return;
    }

    if (shouldLoadIcoBoxDetail(initialState)) {
      await loadIcoBoxData(initialState.state.characterData.Id);
    }
  };

  /**
   * 加载CharacterBox初始数据并判断展示TradeBox或IcoBox
   * @returns {Promise<void>}
   */
  const loadInitialData = async () => {
    const initialState = await loadCharacterBoxInitialState(characterId);

    if (isCharacterBoxTerminalInitialState(initialState)) {
      setState(initialState.state);
      return;
    }

    setState(initialState.state);
    await loadDetailDataByInitialState(initialState);

    setState({ loading: false });
  };

  /**
   * 刷新IcoBox需要的角色和ICO数据
   * @param {number} icoId ICO ID
   * @returns {Promise<void>}
   */
  const refreshIcoBoxData = async (icoId) => {
    await refreshBaseState();
    await loadIcoBoxData(icoId);
  };

  return {
    loadInitialData,
    refreshTradeBoxData,
    refreshIcoBoxData,
    loadUsersPage: tradeUsersPageLoader.loadPage,
    loadIcoUsersPage: icoUsersPageLoader.loadPageWithContext,
  };
}

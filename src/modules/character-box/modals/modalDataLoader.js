import {
  createIcoBoxDetailDataLoader,
  createTradeBoxDetailDataLoader,
} from "../utils/characterBoxDataLoader.js";
import {
  createIcoBoxUsersPageLoader,
  createTradeBoxUsersPageLoader,
} from "../utils/pageLoader.js";

/**
 * 创建TradeBox弹窗数据加载器
 * @param {Object} options 数据加载配置
 * @param {number} options.characterId 角色ID
 * @param {Function} options.setTitleState 标题状态更新函数
 * @param {Function} options.setContentState 内容状态更新函数
 * @returns {{loadUsersPage: Function, loadTradeBoxData: Function, refreshTradeBoxData: Function}} TradeBox弹窗数据加载函数集合
 */
export function createTradeBoxModalDataLoader(options) {
  const { characterId, setTitleState, setContentState } = options || {};
  const tradeUsersPageLoader = createTradeBoxUsersPageLoader(characterId, setContentState);
  const { loadPage: loadUsersPage } = tradeUsersPageLoader;
  const {
    loadData: loadTradeBoxData,
    refreshData: refreshTradeBoxData,
  } = createTradeBoxDetailDataLoader({
    characterId,
    getCurrentPage: tradeUsersPageLoader.getCurrentPage,
    setState: [setTitleState, setContentState],
  });

  return {
    loadUsersPage,
    loadTradeBoxData,
    refreshTradeBoxData,
  };
}

/**
 * 创建IcoBox弹窗数据加载器
 * @param {Object} options 数据加载配置
 * @param {number} options.characterId 角色ID
 * @param {number} options.icoId ICO ID
 * @param {Function} options.setTitleState 标题状态更新函数
 * @param {Function} options.setContentState 内容状态更新函数
 * @returns {{loadIcoUsersPage: Function, loadIcoBoxData: Function, refreshIcoBoxData: Function}} IcoBox弹窗数据加载函数集合
 */
export function createIcoBoxModalDataLoader(options) {
  const { characterId, icoId, setTitleState, setContentState } = options || {};
  const icoUsersPageLoader = createIcoBoxUsersPageLoader(setContentState, icoId);
  const { loadPage: loadIcoUsersPage } = icoUsersPageLoader;
  const {
    loadData: loadIcoBoxData,
    refreshData: refreshIcoBoxData,
  } = createIcoBoxDetailDataLoader({
    characterId,
    getIcoId: () => icoId,
    getCurrentPage: icoUsersPageLoader.getCurrentPage,
    setState: [setTitleState, setContentState],
  });

  return {
    loadIcoUsersPage,
    loadIcoBoxData,
    refreshIcoBoxData,
  };
}

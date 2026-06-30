import { getCharacterUsers, getICOUsers } from "@src/api/chara.js";
import { createRequestManager } from "@src/utils/requestManager.js";

/**
 * 创建角色分页加载器
 * @param {Function} requestFn 分页请求函数
 * @param {Function} setState 状态更新函数
 * @param {string} stateKey 请求成功后写入的状态字段
 * @returns {{getCurrentPage: Function, setRequestContext: Function, loadPage: Function, loadPageWithContext: Function}} 分页状态和加载函数
 */
export function createCharacterBoxPageLoader(requestFn, setState, stateKey) {
  let currentPage = 1;
  let requestContext = null;
  const requestManager = createRequestManager();

  /**
   * 获取当前页码
   * @returns {number} 当前页码
   */
  const getCurrentPage = () => currentPage;

  /**
   * 设置后续分页请求使用的上下文
   * @param {*} context 请求上下文
   * @returns {void}
   */
  const setRequestContext = (context) => {
    requestContext = context;
  };

  /**
   * 加载指定页数据并写入状态
   * @param {number} page 页码
   * @returns {void}
   */
  const loadPage = (page) => {
    currentPage = page;
    requestManager.execute(
      () => requestFn(page, requestContext),
      (result) => {
        if (result.success) {
          setState({ [stateKey]: result.data });
        }
      }
    );
  };

  /**
   * 设置请求上下文后加载指定页数据
   * @param {number} page 页码
   * @param {*} context 请求上下文
   * @returns {void}
   */
  const loadPageWithContext = (page, context) => {
    setRequestContext(context);
    loadPage(page);
  };

  return {
    getCurrentPage,
    setRequestContext,
    loadPage,
    loadPageWithContext,
  };
}

/**
 * 创建TradeBox持有人分页加载器
 * @param {number} characterId 角色ID
 * @param {Function} setState 状态更新函数
 * @returns {{getCurrentPage: Function, setRequestContext: Function, loadPage: Function, loadPageWithContext: Function}} 分页状态和加载函数
 */
export function createTradeBoxUsersPageLoader(characterId, setState) {
  return createCharacterBoxPageLoader(
    (page) => getCharacterUsers(characterId, page),
    setState,
    "users"
  );
}

/**
 * 创建IcoBox参与者分页加载器
 * @param {Function} setState 状态更新函数
 * @param {number} icoId ICO ID
 * @returns {{getCurrentPage: Function, setRequestContext: Function, loadPage: Function, loadPageWithContext: Function}} 分页状态和加载函数
 */
export function createIcoBoxUsersPageLoader(setState, icoId) {
  return createCharacterBoxPageLoader(
    (page, requestIcoId) => getICOUsers(requestIcoId ?? icoId, page),
    setState,
    "icoUsers"
  );
}

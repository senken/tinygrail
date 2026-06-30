import { getJsonStorageItem, setJsonStorageItem } from "@src/utils/storage.js";

/**
 * 交易区块折叠状态缓存键
 */
const COLLAPSED_STATES_STORAGE_KEY = "character-box-trade-collapsed-states";

/**
 * 默认交易区块折叠状态
 */
const DEFAULT_COLLAPSED_STATES = {
  link: false,
  section: false,
  temple: false,
  user: false,
};

/**
 * 获取交易区块折叠状态
 *
 * @returns {Object} 折叠状态
 */
export function getCollapsedStates() {
  const states = getJsonStorageItem(COLLAPSED_STATES_STORAGE_KEY, DEFAULT_COLLAPSED_STATES);

  return {
    ...DEFAULT_COLLAPSED_STATES,
    ...states,
  };
}

/**
 * 保存交易区块折叠状态
 *
 * @param {Object} states 折叠状态
 */
export function saveCollapsedStates(states) {
  setJsonStorageItem(COLLAPSED_STATES_STORAGE_KEY, states);
}

/**
 * 创建交易区块折叠切换函数
 *
 * @param {Object} options 配置项
 * @param {Object} options.state 当前组件状态
 * @param {string} options.stateKey 组件状态字段
 * @param {string} options.storageKey 缓存状态字段
 * @param {Function} options.setState 状态更新函数
 * @returns {Function} 折叠切换函数
 */
export function createToggleCollapseHandler(options) {
  const { state, getState, stateKey, storageKey, setState } = options;

  return () => {
    const currentState = getState ? getState() : state;
    const newValue = !(currentState?.[stateKey] ?? false);
    setState({ [stateKey]: newValue });

    const states = getCollapsedStates();
    states[storageKey] = newValue;
    saveCollapsedStates(states);
  };
}

/**
 * 创建交易区块折叠切换函数集合
 *
 * @param {Object} options 配置项
 * @param {Object} options.state 当前组件状态
 * @param {Function} options.getState 获取当前组件状态的函数
 * @param {Function} options.setState 状态更新函数
 * @returns {Object} 折叠切换函数集合
 */
export function createCollapseHandlers(options) {
  const { state, getState, setState } = options;
  const resolveState = getState || (() => state);

  return {
    onToggleLinkCollapse: createToggleCollapseHandler({
      getState: resolveState,
      stateKey: "isLinkCollapsed",
      storageKey: "link",
      setState,
    }),
    onToggleSectionCollapse: createToggleCollapseHandler({
      getState: resolveState,
      stateKey: "isSectionCollapsed",
      storageKey: "section",
      setState,
    }),
    onToggleTempleCollapse: createToggleCollapseHandler({
      getState: resolveState,
      stateKey: "isTempleCollapsed",
      storageKey: "temple",
      setState,
    }),
    onToggleUserCollapse: createToggleCollapseHandler({
      getState: resolveState,
      stateKey: "isUserCollapsed",
      storageKey: "user",
      setState,
    }),
  };
}

import { createCollapseHandlers } from "../utils/collapsedState.js";

/**
 * 创建圣殿筛选默认配置
 * @returns {Object} 圣殿筛选默认配置
 */
export function createDefaultTempleFilterOptions() {
  return {
    sort: { sortBy: "Sacrifices", order: "desc" },
    filter: { selectedFilters: [], mode: "or", pinUserTemple: true, deduplicateByCover: true },
  };
}

/**
 * 创建TradeBox内容状态默认值
 * @param {Object} initialCollapsedStates 初始折叠状态
 * @returns {Object} 内容状态默认值
 */
export function createTradeBoxContentStateDefaults(initialCollapsedStates) {
  const collapsedStates = initialCollapsedStates || {};

  return {
    templeFilterOptions: createDefaultTempleFilterOptions(),
    isLinkCollapsed: collapsedStates.link ?? false,
    isSectionCollapsed: collapsedStates.section ?? false,
    isTempleCollapsed: collapsedStates.temple ?? false,
    isUserCollapsed: collapsedStates.user ?? false,
  };
}

/**
 * 创建圣殿筛选变更处理函数
 * @param {Function} setState 状态更新函数
 * @returns {Function} 圣殿筛选变更处理函数
 */
export function createTempleFilterChangeHandler(setState) {
  return (options) => setState({ templeFilterOptions: options });
}

/**
 * 创建TradeBox内容区状态action
 * @param {Object} options 配置项
 * @param {Object} options.state 当前状态
 * @param {Function} options.getState 获取当前状态的函数
 * @param {Function} options.setState 状态更新函数
 * @returns {Object} 内容区状态action
 */
export function createTradeBoxContentStateActions(options) {
  const { state, getState, setState } = options || {};

  return {
    ...createCollapseHandlers({
      state,
      getState,
      setState,
    }),
    onTempleFilterChange: createTempleFilterChangeHandler(setState),
  };
}

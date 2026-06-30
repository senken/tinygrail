import { getStoreState } from "@src/utils/store.js";
import { mergeGroupedProps } from "../utils/groupedProps.js";

/**
 * 从IcoBox标题组件参数中创建最终props
 * @param {Object} props 标题组件参数
 * @param {string} props.storeKey 标题区storeKey
 * @param {Object} props.data 标题数据
 * @param {Object} props.actions 标题操作
 * @returns {Object} 标题组件参数
 */
export function createIcoBoxTitlePropsFromComponentProps(props) {
  const { storeKey, data, actions } = props || {};
  const storeProps = createIcoBoxTitlePropsFromStore(storeKey);

  return mergeGroupedProps(storeProps, { data, actions }, ["data", "actions"]);
}

/**
 * 从IcoBox内容组件参数中创建最终props
 * @param {Object} props 内容组件参数
 * @param {string} props.storeKey 内容区storeKey
 * @param {Object} props.data 内容数据
 * @param {Object} props.actions 内容操作
 * @param {Object} props.options 内容配置
 * @returns {Object} 内容组件参数
 */
export function createIcoBoxContentPropsFromComponentProps(props) {
  const { storeKey, data, actions, options } = props || {};
  const storeProps = createIcoBoxContentPropsFromStore(storeKey);

  return mergeGroupedProps(storeProps, { data, actions, options }, ["data", "actions", "options"]);
}

/**
 * 从状态中创建IcoBox标题props
 * @param {Object} state 状态数据
 * @param {Object} extraProps 附加参数
 * @returns {Object} 标题组件参数
 */
export function createIcoBoxTitlePropsFromState(state, extraProps) {
  const { characterData } = state || {};
  const { actions } = extraProps || {};

  return {
    data: {
      characterData,
    },
    actions: actions || {},
  };
}

/**
 * 从store中创建IcoBox标题props
 * @param {string} storeKey 标题区storeKey
 * @returns {Object} 标题组件参数
 */
export function createIcoBoxTitlePropsFromStore(storeKey) {
  const storeState = storeKey ? getStoreState(storeKey) : {};

  return createIcoBoxTitlePropsFromState(storeState, {
    actions: storeState.actions || {},
  });
}

/**
 * 从状态中创建IcoBox内容props
 * @param {Object} state 状态数据
 * @param {Object} extraProps 附加参数
 * @returns {Object} 内容组件参数
 */
export function createIcoBoxContentPropsFromState(state, extraProps) {
  const { characterData, userAssets, icoUsers, userIcoInfo } = state || {};
  const { actions, options } = extraProps || {};

  return {
    data: {
      characterData,
      userAssets,
      icoUsers,
      userIcoInfo,
    },
    actions: actions || {},
    options: options || {},
  };
}

/**
 * 从store中创建IcoBox内容props
 * @param {string} storeKey 内容区storeKey
 * @returns {Object} 内容组件参数
 */
export function createIcoBoxContentPropsFromStore(storeKey) {
  const storeState = storeKey ? getStoreState(storeKey) : {};

  return createIcoBoxContentPropsFromState(storeState, {
    actions: storeState.actions || {},
    options: {
      stickyTop: storeState.stickyTop,
      headerBgClass: storeState.headerBgClass,
    },
  });
}

/**
 * 从状态中创建IcoBox props
 * @param {Object} options 配置项
 * @param {Object} options.state 状态数据
 * @param {Object} options.titleExtraProps 标题附加参数
 * @param {Object} options.contentExtraProps 内容附加参数
 * @returns {Object} IcoBox组件参数
 */
export function createIcoBoxPropsFromState(options) {
  const { state, titleExtraProps, contentExtraProps } = options || {};

  return {
    titleProps: createIcoBoxTitlePropsFromState(state, titleExtraProps),
    contentProps: createIcoBoxContentPropsFromState(state, contentExtraProps),
  };
}

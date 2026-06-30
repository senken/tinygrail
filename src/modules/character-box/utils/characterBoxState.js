import { loadCharacterAndUserResults } from "./characterBoxData.js";

export const CHARACTER_BOX_STATUS = Object.freeze({
  ERROR: "error",
  NOT_FOUND: "not-found",
  TRADE: "trade",
  ICO: "ico",
  INIT: "init",
  EMPTY: "empty",
});

/**
 * 根据角色和用户资产判断CharacterBox内容类型
 * @param {Object} options 内容判断参数
 * @param {Object|null} options.characterData 角色数据
 * @param {Object|null} options.userAssets 当前用户资产
 * @returns {"trade"|"ico"|"init"|"empty"} 内容类型
 */
export function resolveCharacterBoxContentType(options) {
  const { characterData, userAssets } = options || {};

  if (characterData?.Current !== undefined) {
    return CHARACTER_BOX_STATUS.TRADE;
  }

  if (characterData) {
    return CHARACTER_BOX_STATUS.ICO;
  }

  if (userAssets) {
    return CHARACTER_BOX_STATUS.INIT;
  }

  return CHARACTER_BOX_STATUS.EMPTY;
}

/**
 * 解析角色页面初始状态
 * @param {Object} characterResult 角色请求结果
 * @param {Object} userAssetsResult 当前用户资产请求结果
 * @returns {Object} 初始状态解析结果
 */
export function resolveCharacterBoxInitialState(characterResult, userAssetsResult) {
  if (!userAssetsResult.success) {
    return {
      status: CHARACTER_BOX_STATUS.ERROR,
      state: {
        loading: false,
        error: true,
      },
    };
  }

  if (!characterResult.success) {
    return {
      status: CHARACTER_BOX_STATUS.NOT_FOUND,
      state: {
        loading: false,
        characterData: null,
        userAssets: userAssetsResult.data,
      },
    };
  }

  return {
    status: resolveCharacterBoxContentType({
      characterData: characterResult.data,
      userAssets: userAssetsResult.data,
    }),
    state: {
      characterData: characterResult.data,
      userAssets: userAssetsResult.data,
    },
  };
}

/**
 * 加载并解析CharacterBox初始状态
 * @param {number} characterId 角色ID
 * @returns {Promise<Object>} 初始状态解析结果
 */
export async function loadCharacterBoxInitialState(characterId) {
  const { characterResult, userAssetsResult } = await loadCharacterAndUserResults(characterId);

  return resolveCharacterBoxInitialState(characterResult, userAssetsResult);
}

/**
 * 判断初始状态是否已经结束加载流程
 * @param {Object} initialState 初始状态解析结果
 * @returns {boolean} 是否不需要继续加载详情数据
 */
export function isCharacterBoxTerminalInitialState(initialState) {
  return (
    initialState?.status === CHARACTER_BOX_STATUS.ERROR ||
    initialState?.status === CHARACTER_BOX_STATUS.NOT_FOUND
  );
}

/**
 * 判断初始状态是否需要加载TradeBox详情
 * @param {Object} initialState 初始状态解析结果
 * @returns {boolean} 是否需要加载TradeBox详情
 */
export function shouldLoadTradeBoxDetail(initialState) {
  return initialState?.status === CHARACTER_BOX_STATUS.TRADE;
}

/**
 * 判断初始状态是否需要加载IcoBox详情
 * @param {Object} initialState 初始状态解析结果
 * @returns {boolean} 是否需要加载IcoBox详情
 */
export function shouldLoadIcoBoxDetail(initialState) {
  return initialState?.status === CHARACTER_BOX_STATUS.ICO;
}

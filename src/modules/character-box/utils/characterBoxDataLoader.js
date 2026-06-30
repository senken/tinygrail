import { loadCharacterAndUserAssets } from "./characterBoxData.js";
import {
  loadIcoBoxDetailData,
  loadTradeBoxDetailData,
} from "./characterBoxDetailData.js";

/**
 * 创建CharacterBox状态写入函数
 * @param {Function|Function[]} setState 状态更新函数或状态更新函数数组
 * @returns {Function} 状态写入函数
 */
export function createCharacterBoxStateWriter(setState) {
  const setStateList = Array.isArray(setState) ? setState : [setState];

  return (statePatch) => {
    setStateList.forEach((writeState) => {
      if (typeof writeState === "function") {
        writeState(statePatch);
      }
    });
  };
}

/**
 * 更新CharacterBox基础角色数据和当前用户资产
 * @param {Object} options 更新配置
 * @param {number} options.characterId 角色ID
 * @param {Function} options.writeState 状态写入函数
 * @returns {Promise<void>}
 */
export async function updateCharacterBoxBaseState(options) {
  const { characterId, writeState } = options || {};
  const data = await loadCharacterAndUserAssets(characterId);

  if (data && typeof writeState === "function") {
    writeState(data);
  }
}

/**
 * 创建CharacterBox详情数据加载器
 * @param {Object} options 数据加载配置
 * @param {number} options.characterId 角色ID
 * @param {Function} options.loadDetailData 请求详情数据的函数
 * @param {Function|Function[]} options.setState 状态更新函数或状态更新函数数组
 * @returns {{loadData: Function, refreshData: Function}} 数据加载函数集合
 */
export function createCharacterBoxDetailDataLoader(options) {
  const { characterId, loadDetailData, setState } = options || {};
  const writeState = createCharacterBoxStateWriter(setState);

  /**
   * 加载详情数据并合并额外状态
   * @param {Object} extraState 额外写入状态的数据
   * @returns {Promise<void>}
   */
  const loadData = async (extraState = {}) => {
    const data = await loadDetailData();
    writeState({
      ...data,
      ...extraState,
    });
  };

  /**
   * 刷新基础数据和详情数据
   * @returns {Promise<void>}
   */
  const refreshData = async () => {
    await updateCharacterBoxBaseState({
      characterId,
      writeState,
    });
    await loadData();
  };

  return {
    loadData,
    refreshData,
  };
}

/**
 * 创建TradeBox详情数据加载器
 * @param {Object} options 数据加载配置
 * @param {number} options.characterId 角色ID
 * @param {Function} options.getCurrentPage 获取当前持有人页码的函数
 * @param {Function|Function[]} options.setState 状态更新函数或状态更新函数数组
 * @returns {{loadData: Function, refreshData: Function}} TradeBox详情数据加载函数集合
 */
export function createTradeBoxDetailDataLoader(options) {
  const { characterId, getCurrentPage, setState } = options || {};

  return createCharacterBoxDetailDataLoader({
    characterId,
    loadDetailData: () => loadTradeBoxDetailData(characterId, getCurrentPage()),
    setState,
  });
}

/**
 * 创建IcoBox详情数据加载器
 * @param {Object} options 数据加载配置
 * @param {number} options.characterId 角色ID
 * @param {Function} options.getIcoId 获取ICO ID的函数
 * @param {Function} options.getCurrentPage 获取当前ICO参与者页码的函数
 * @param {Function|Function[]} options.setState 状态更新函数或状态更新函数数组
 * @returns {{loadData: Function, refreshData: Function}} IcoBox详情数据加载函数集合
 */
export function createIcoBoxDetailDataLoader(options) {
  const { characterId, getIcoId, getCurrentPage, setState } = options || {};

  return createCharacterBoxDetailDataLoader({
    characterId,
    loadDetailData: () => loadIcoBoxDetailData(getIcoId(), getCurrentPage()),
    setState,
  });
}

import { IcoBoxContent, IcoBoxTitle } from "../ico-box/IcoBox.jsx";
import { TradeBoxContent, TradeBoxTitle } from "../trade-box/TradeBox.jsx";
import { createCharacterBoxModalStoreMount } from "./modalState.js";

const CHARACTER_BOX_MODAL_CONTENT_OPTIONS = {
  stickyTop: 0,
  headerBgClass: "bg-base-100",
};

/**
 * 创建TradeBox弹窗挂载控制器
 * @param {Object} options 挂载配置
 * @param {string} options.modalId 弹窗ID
 * @param {number} options.characterId 角色ID
 * @param {Object} options.characterData 角色交易数据
 * @param {Object|null} options.userAssets 当前用户资产
 * @returns {Object} TradeBox弹窗storeKey和挂载控制器
 */
export function createTradeBoxModalMount(options) {
  const { modalId, characterId, characterData, userAssets } = options || {};

  return createCharacterBoxModalStoreMount({
    modalId,
    boxType: "trade",
    characterId,
    characterData,
    userAssets,
    renderTitle: (titleStoreKey) => <TradeBoxTitle storeKey={titleStoreKey} />,
    renderContent: (contentStoreKey) => (
      <TradeBoxContent storeKey={contentStoreKey} options={CHARACTER_BOX_MODAL_CONTENT_OPTIONS} />
    ),
  });
}

/**
 * 创建IcoBox弹窗挂载控制器
 * @param {Object} options 挂载配置
 * @param {string} options.modalId 弹窗ID
 * @param {number} options.characterId 角色ID
 * @param {Object} options.characterData 角色ICO数据
 * @param {Object|null} options.userAssets 当前用户资产
 * @returns {Object} IcoBox弹窗storeKey和挂载控制器
 */
export function createIcoBoxModalMount(options) {
  const { modalId, characterId, characterData, userAssets } = options || {};

  return createCharacterBoxModalStoreMount({
    modalId,
    boxType: "ico",
    characterId,
    characterData,
    userAssets,
    renderTitle: (titleStoreKey) => <IcoBoxTitle storeKey={titleStoreKey} />,
    renderContent: (contentStoreKey) => (
      <IcoBoxContent storeKey={contentStoreKey} options={CHARACTER_BOX_MODAL_CONTENT_OPTIONS} />
    ),
  });
}

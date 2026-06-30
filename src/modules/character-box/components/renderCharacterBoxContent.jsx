import { IcoBox } from "../ico-box/IcoBox.jsx";
import { IcoBoxInit } from "../ico-box-init/IcoBoxInit.jsx";
import { TradeBox } from "../trade-box/TradeBox.jsx";
import { createCharacterBoxIcoInitProps } from "../ico-box-init/createCharacterBoxIcoInitProps.js";
import { createCharacterBoxIcoBoxProps } from "../ico-box/createCharacterBoxIcoBoxProps.js";
import { createCharacterBoxTradeBoxProps } from "../trade-box/createCharacterBoxTradeBoxProps.js";
import {
  CHARACTER_BOX_STATUS,
  resolveCharacterBoxContentType,
} from "../utils/characterBoxState.js";

/**
 * 按当前状态渲染CharacterBox页面内容
 * @param {Object} options 页面内容配置
 * @param {number} options.characterId 角色ID
 * @param {Object} options.state 页面状态
 * @param {Function} options.setState 页面状态更新函数
 * @param {Object} options.initialCollapsedStates 初始折叠状态
 * @param {Object} options.dataController 页面数据控制器
 * @param {Object} options.modalOpeners 页面弹窗打开函数集合
 * @returns {HTMLElement|null} 页面内容元素
 */
export function renderCharacterBoxContent(options) {
  const { characterId, state, dataController } = options || {};
  const { characterData, userAssets } = state || {};
  const contentType = resolveCharacterBoxContentType({ characterData, userAssets });

  if (contentType === CHARACTER_BOX_STATUS.TRADE) {
    const tradeBoxProps = createCharacterBoxTradeBoxProps(options);

    return <TradeBox {...tradeBoxProps} />;
  }

  if (contentType === CHARACTER_BOX_STATUS.ICO) {
    const icoBoxProps = createCharacterBoxIcoBoxProps(options);

    return <IcoBox {...icoBoxProps} />;
  }

  if (contentType === CHARACTER_BOX_STATUS.INIT) {
    const icoInitProps = createCharacterBoxIcoInitProps({
      characterId,
      userAssets,
      loadInitialData: dataController?.loadInitialData,
    });

    return <IcoBoxInit {...icoInitProps} />;
  }

  return null;
}

import { renderCharacterBoxContent } from "./renderCharacterBoxContent.jsx";
import { createCharacterBoxPageContextFromStore } from "../utils/characterBoxPageStore.js";

/**
 * 角色页面内容组件
 * @param {Object} props 组件参数
 * @param {string} props.storeKey 页面storeKey
 * @returns {HTMLElement|null} 页面内容元素
 */
export function CharacterBoxContent(props) {
  const pageContext = createCharacterBoxPageContextFromStore(props?.storeKey);

  return renderCharacterBoxContent(pageContext);
}

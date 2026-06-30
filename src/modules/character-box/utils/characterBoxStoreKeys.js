/**
 * 创建CharacterBox页面storeKey
 * @param {number|string} characterId 角色ID
 * @returns {string} 页面storeKey
 */
export function createCharacterBoxPageStoreKey(characterId) {
  return `character-box:${characterId}:page`;
}

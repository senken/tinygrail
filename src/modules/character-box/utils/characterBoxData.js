import { getCharacter } from "@src/api/chara.js";
import { getUserAssetsWithSync } from "@src/services/userAssetsSync.js";

/**
 * 加载角色和当前用户资产请求结果
 * @param {number} characterId 角色ID
 * @returns {Promise<{characterResult: Object, userAssetsResult: Object}>} 请求结果
 */
export async function loadCharacterAndUserResults(characterId) {
  const [characterResult, userAssetsResult] = await Promise.all([
    getCharacter(characterId),
    getUserAssetsWithSync(),
  ]);

  return {
    characterResult,
    userAssetsResult,
  };
}

/**
 * 加载角色和当前用户资产数据
 * @param {number} characterId 角色ID
 * @returns {Promise<Object|null>} 角色和用户资产数据
 */
export async function loadCharacterAndUserAssets(characterId) {
  const { characterResult, userAssetsResult } = await loadCharacterAndUserResults(characterId);

  if (!characterResult.success || !userAssetsResult.success) {
    return null;
  }

  return {
    characterData: characterResult.data,
    userAssets: userAssetsResult.data,
  };
}

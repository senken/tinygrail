import { openAlertModal } from "@src/utils/modalManager.js";
import { createIcoInitHandler } from "../utils/characterBoxActions.js";

/**
 * 创建CharacterBox页面IcoBoxInit props
 * @param {Object} options 页面IcoBoxInit配置
 * @param {number} options.characterId 角色ID
 * @param {Object} options.userAssets 用户资产数据
 * @param {Function} options.loadInitialData 加载初始数据的函数
 * @returns {Object} IcoBoxInit组件参数
 */
export function createCharacterBoxIcoInitProps(options) {
  const { characterId, userAssets, loadInitialData } = options || {};

  return {
    characterId,
    userAssets,
    onInit: createIcoInitHandler({
      characterId,
      showSuccessToast: false,
      onSuccess: async () => {
        openAlertModal({
          title: "成功",
          message: "ICO启动成功，邀请更多朋友加入吧。",
        });
        await loadInitialData();
      },
    }),
  };
}

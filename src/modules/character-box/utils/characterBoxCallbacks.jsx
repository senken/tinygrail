import { openAuctionModal } from "@src/modules/auction/index.js";
import { openAuctionHistoryModal } from "@src/modules/auction-history/index.js";
import { openChangeAvatarModal } from "@src/components/ImageCropper.jsx";
import { openGMTradeHistoryModal } from "@src/modules/gm-trade-history/index.js";
import { openSacrificeModal } from "@src/modules/sacrifice/index.js";
import { openTempleModal } from "@src/modules/temple-detail/index.js";
import { openTradeHistoryModal } from "@src/modules/trade-history/index.js";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { createFavoriteModalOpener } from "./characterBoxActions.js";

/**
 * 根据CharacterBox状态创建操作回调
 * @param {Object} options 回调配置
 * @param {number} options.characterId 角色ID
 * @param {Object} options.state CharacterBox状态
 * @param {Function} options.refreshFn 刷新数据的回调函数
 * @param {Function} options.rerenderFn 触发重新渲染的回调函数
 * @param {Function} options.openCharacterModal 打开角色弹窗的函数
 * @returns {Object} CharacterBox操作回调集合
 */
export function createCharacterBoxCallbacksFromState(options) {
  const { characterId, state, refreshFn, rerenderFn, openCharacterModal } = options || {};
  const { characterData, userCharacter, tinygrailCharacter } = state || {};

  return createCharacterBoxCallbacks({
    characterId,
    characterData,
    userCharacter,
    tinygrailCharacter,
    refreshFn,
    rerenderFn,
    openCharacterModal,
  });
}

/**
 * 创建CharacterBox操作回调
 * @param {Object} options 配置项
 * @param {number} options.characterId 角色ID
 * @param {Object} options.characterData 角色数据
 * @param {Object} options.userCharacter 用户角色数据
 * @param {Object} options.tinygrailCharacter tinygrail角色数据
 * @param {Function} options.refreshFn 刷新数据的回调函数
 * @param {Function} options.rerenderFn 触发重新渲染的回调函数
 * @param {Function} options.openCharacterModal 打开角色弹窗的函数
 * @returns {Object} CharacterBox操作回调集合
 */
export function createCharacterBoxCallbacks(options) {
  const {
    characterId,
    characterData,
    userCharacter,
    tinygrailCharacter,
    refreshFn,
    rerenderFn,
    openCharacterModal,
  } = options || {};

  return {
    openSacrificeModal: () => {
      openSacrificeModal({
        characterId,
        characterName: characterData?.Name ?? "",
        availableAmount: userCharacter?.Amount ?? 0,
        onSuccess: refreshFn,
      });
    },

    openFavoriteModal: createFavoriteModalOpener({
      characterId,
      getCharacterData: () => characterData,
      onClose: rerenderFn,
    }),

    openAuctionModal: () => {
      openAuctionModal({
        characterId,
        characterName: characterData?.Name ?? "",
        basePrice: tinygrailCharacter?.Price ?? 0,
        maxAmount: tinygrailCharacter?.Amount ?? 0,
        onSuccess: refreshFn,
      });
    },

    openAuctionHistoryModal: () => {
      openAuctionHistoryModal({
        characterId,
        characterName: characterData?.Name ?? "",
      });
    },

    openChangeAvatarModal: () => {
      openChangeAvatarModal({
        characterId,
        characterName: characterData?.Name ?? "",
        onSuccess: refreshFn,
      });
    },

    openTradeHistoryModal: () => {
      openTradeHistoryModal({
        characterId,
        characterName: characterData?.Name ?? "",
      });
    },

    openGMTradeHistoryModal: () => {
      openGMTradeHistoryModal({
        characterId,
        characterName: characterData?.Name ?? "",
        onUserClick: openUserTinygrailModal,
        onCharacterClick: openCharacterModal,
      });
    },

    openTempleModal: (temple) => {
      openTempleModal({
        temple: { ...temple, Name: characterData?.Name },
        characterName: characterData?.Name ?? "",
        onClose: refreshFn,
      });
    },
  };
}

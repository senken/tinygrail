import { processImage } from "@src/utils/image.js";
import { openModal, closeModal } from "@src/utils/modalManager.js";
import { getOssSignature, uploadToOss, buildOssUrl } from "@src/api/oss.js";
import { changeCharacterAvatar } from "@src/api/chara.js";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { showError, showSuccess } from "@src/utils/toastManager.jsx";
import { openSacrificeModal } from "@src/modules/sacrifice/index.js";
import { openAddToFavoriteModal } from "@src/modules/favorite/index.js";
import { openAuctionModal } from "@src/modules/auction/index.js";
import { openAuctionHistoryModal } from "@src/modules/auction-history/index.js";
import { openTradeHistoryModal } from "@src/modules/trade-history/index.js";
import { openGMTradeHistoryModal } from "@src/modules/gm-trade-history/index.js";
import { openChangeAvatarModal } from "@src/components/ImageCropper.jsx";
import { openTempleModal } from "@src/modules/temple-detail/index.js";

/**
 * 创建Modal回调函数
 * @param {Object} params
 * @param {number} params.characterId - 角色ID
 * @param {Object} params.characterData - 角色数据
 * @param {Object} params.userCharacter - 用户角色数据
 * @param {Object} params.tinygrailCharacter - tinygrail角色数据
 * @param {Function} params.refreshFn - 刷新数据的回调函数
 * @param {Function} params.rerenderFn - 触发重新渲染的回调函数
 * @param {Function} params.openCharacterModal - 打开角色弹窗的函数
 * @returns {Object} 所有Modal回调函数
 */
export function createModalCallbacks({
  characterId,
  characterData,
  userCharacter,
  tinygrailCharacter,
  refreshFn,
  rerenderFn,
  openCharacterModal,
}) {
  return {
    /** 打开资产重组弹窗 */
    openSacrificeModal: () => {
      openSacrificeModal({
        characterId,
        characterName: characterData?.Name ?? "",
        availableAmount: userCharacter?.Amount ?? 0,
        onSuccess: refreshFn,
      });
    },

    /** 打开添加到收藏夹弹窗 */
    openFavoriteModal: () => {
      openAddToFavoriteModal({
        characterId,
        characterData,
        onClose: rerenderFn,
      });
    },

    /** 打开拍卖弹窗 */
    openAuctionModal: () => {
      openAuctionModal({
        characterId,
        characterName: characterData?.Name ?? "",
        basePrice: tinygrailCharacter?.Price ?? 0,
        maxAmount: tinygrailCharacter?.Amount ?? 0,
        onSuccess: refreshFn,
      });
    },

    /** 打开往期拍卖弹窗 */
    openAuctionHistoryModal: () => {
      openAuctionHistoryModal({
        characterId,
        characterName: characterData?.Name ?? "",
      });
    },

    /** 打开更换头像弹窗 */
    openChangeAvatarModal: () => {
      openChangeAvatarModal({
        characterId,
        characterName: characterData?.Name ?? "",
        onSuccess: refreshFn,
      });
    },

    /** 打开交易记录弹窗 */
    openTradeHistoryModal: () => {
      openTradeHistoryModal({
        characterId,
        characterName: characterData?.Name ?? "",
      });
    },

    /** 打开GM交易记录弹窗 */
    openGMTradeHistoryModal: () => {
      openGMTradeHistoryModal({
        characterId,
        characterName: characterData?.Name ?? "",
        onUserClick: openUserTinygrailModal,
        onCharacterClick: openCharacterModal,
      });
    },

    /** 打开圣殿详情弹窗 */
    openTempleModal: (temple) => {
      openTempleModal({
        temple: { ...temple, Name: characterData?.Name },
        characterName: characterData?.Name ?? "",
        onClose: refreshFn,
      });
    },
  };
}

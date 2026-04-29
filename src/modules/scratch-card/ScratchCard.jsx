import { askCharacter, getUserCharacterByUsername, sacrificeCharacter } from "@src/api/chara.js";
import { openCharacterBoxModal } from "@src/modules/character-box/utils/modalOpeners.jsx";
import { openStardustModal } from "@src/modules/stardust/index.js";
import { openTempleSearchModal } from "@src/modules/temple-search/index.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { formatNumber } from "@src/utils/format.js";
import { openAlertModal, openModal } from "@src/utils/modalManager.js";
import { showError } from "@src/utils/toastManager.jsx";
import { ScratchCardItem } from "./components/ScratchCardItem.jsx";

/**
 * 刮刮乐组件
 * @param {Object} props
 * @param {Array} props.charas - 角色数据数组
 * @param {Function} props.onSell - 出售回调
 * @param {Function} props.onFinance - 融资回调
 * @param {Function} props.onCharge - 充能回调
 */
export function ScratchCard({ charas, onSell, onFinance, onCharge }) {
  const container = (
    <div id="tg-scratch-card" className="flex min-w-80 flex-wrap justify-evenly gap-4 p-4" />
  );

  let hasRevealed = false; // 记录是否已执行过翻转动画

  const { setState, render } = createMountedComponent(container, (state) => {
    const { cardData = charas || [], chargedCardIds = [] } = state || {};

    if (cardData.length === 0) {
      return <div className="text-center text-sm opacity-60">暂无角色</div>;
    }

    // 获取当前用户名
    const getCurrentUsername = () => {
      try {
        const cachedUserAssets = localStorage.getItem("tinygrail:user-assets");
        if (cachedUserAssets) {
          const userAssets = JSON.parse(cachedUserAssets);
          return userAssets.name || "";
        }
      } catch (e) {
        console.warn("读取用户资产缓存失败:", e);
      }
      return "";
    };

    // 处理出售按钮点击
    const handleSell = async (chara) => {
      try {
        const result = await askCharacter(chara.Id, chara.SellPrice, chara.SellAmount);
        if (!result.success) {
          showError(result.message);
          return;
        }

        // 更新卡片数据
        const updatedCards = cardData.map((card) => {
          if (card.Id === chara.Id) {
            const restAmount = card.Amount - chara.SellAmount;
            return {
              ...card,
              Amount: restAmount,
              SellAmount: 0,
              SellPrice: 0,
            };
          }
          return card;
        });

        setState({ cardData: updatedCards });

        openAlertModal({
          message: `出售完成：获得资金 ₵${formatNumber(chara.SellPrice * chara.SellAmount, 0)}`,
        });

        if (onSell) {
          onSell(chara);
        }
      } catch (error) {
        console.error("出售失败:", error);
        showError("出售失败");
      }
    };

    // 处理融资按钮点击
    const handleFinance = async (chara) => {
      try {
        const result = await sacrificeCharacter(chara.Id, chara.Amount, true);
        if (!result.success) {
          showError(result.message);
          return;
        }

        // 融资后移除该卡片的所有按钮
        const updatedCards = cardData.map((card) => {
          if (card.Id === chara.Id) {
            return {
              ...card,
              Amount: 0,
              SellAmount: 0,
              SellPrice: 0,
            };
          }
          return card;
        });

        setState({ cardData: updatedCards });

        openAlertModal({
          message: `融资完成：获得资金 ₵${formatNumber(result.data.Balance, 0)}`,
        });

        if (onFinance) {
          onFinance(chara);
        }
      } catch (error) {
        console.error("融资失败:", error);
        showError("融资失败");
      }
    };

    // 处理充能按钮点击
    const handleChargeClick = async (chara) => {
      const username = getCurrentUsername();
      if (!username) {
        showError("无法获取用户名");
        return;
      }

      // 获取用户的该角色数据
      const result = await getUserCharacterByUsername(chara.Id, username);
      if (!result.success) {
        showError(result.message || "获取角色数据失败");
        return;
      }

      // 合并刮刮乐角色数据和用户角色数据
      const mergedCharacter = {
        ...result.data,
        Id: result.data.CharacterId,
        Name: chara.Name,
        Icon: chara.Cover,
        UserTotal: result.data.Total,
        UserAmount: result.data.Amount,
      };

      // 打开圣殿搜索弹窗
      openTempleSearchModal({
        title: "选择「星光碎片」充能的目标",
        username,
        onTempleClick: (temple) => {
          // 打开星光碎片确认弹窗
          openStardustModal({
            temple,
            character: mergedCharacter,
            onSuccess: () => {
              // 将该角色标记为已充能
              setState({
                chargedCardIds: [...chargedCardIds, mergedCharacter.Id],
              });
            },
          });
        },
      });
    };

    return (
      <div className="contents">
        {cardData.map((chara, index) => {
          const card = (
            <ScratchCardItem
              chara={chara}
              onSell={handleSell}
              onFinance={handleFinance}
              onCharge={handleChargeClick}
              onCharacterClick={openCharacterBoxModal}
              index={index}
              hasRevealed={hasRevealed}
              chargedCardIds={chargedCardIds}
            />
          );
          if (index === cardData.length - 1 && !hasRevealed) {
            hasRevealed = true;
          }
          return card;
        })}
      </div>
    );
  });

  // 初始化数据
  setState({ cardData: charas || [] });

  return container;
}

/**
 * 打开刮刮乐弹窗
 * @param {Object} params
 * @param {Array} params.charas - 角色数据数组
 * @param {string} params.title - 弹窗标题
 * @param {Function} params.onSell - 出售回调
 * @param {Function} params.onFinance - 融资回调
 * @param {Function} params.onCharge - 充能回调
 */
export function openScratchCardModal({ charas, title = "刮刮乐", onSell, onFinance, onCharge }) {
  const modalId = `scratch-card-${Date.now()}`;

  openModal(modalId, {
    title,
    content: (
      <ScratchCard charas={charas} onSell={onSell} onFinance={onFinance} onCharge={onCharge} />
    ),
    size: "lg",
  });
}

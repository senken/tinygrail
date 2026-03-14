import { formatNumber } from "@src/utils/format.js";
import { Button } from "@src/components/Button.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { Modal, closeModalById } from "@src/components/Modal.jsx";
import { TempleSearch } from "@src/modules/temple-search/TempleSearch.jsx";
import { Stardust } from "@src/modules/stardust/Stardust.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { getUserCharacterByUsername, askCharacter, sacrificeCharacter } from "@src/api/chara.js";
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

  let generatedChargeModalId = null;
  let generatedChargeConfirmModalId = null;
  let generatedCharacterModalId = null;
  let hasRevealed = false; // 记录是否已执行过翻转动画
  let currentCardData = charas || []; // 跟踪当前的卡片数据

  const { setState, render } = createMountedComponent(container, (state) => {
    const {
      cardData = charas || [],
      showChargeModal = false,
      showChargeConfirmModal = false,
      showCharacterModal = false,
      selectedChargeCharacter = null,
      selectedChargeTemple = null,
      characterModalId = null,
      chargedCardIds = [],
    } = state || {};

    if (cardData.length === 0) {
      return <div className="text-center text-sm opacity-60">暂无角色</div>;
    }

    // 检查Modal是否已存在
    const isModalExist = (modalId) => {
      return (
        modalId &&
        document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode ===
          document.body
      );
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
              onCharacterClick={handleCharacterClick}
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
        {showChargeModal && !isModalExist(generatedChargeModalId) && (
          <Modal
            visible={showChargeModal}
            onClose={closeChargeModal}
            title="选择「星光碎片」充能的目标"
            modalId={generatedChargeModalId}
            maxWidth={640}
            getModalId={(id) => {
              generatedChargeModalId = id;
            }}
          >
            <TempleSearch username={getCurrentUsername()} onTempleClick={handleTempleSelect} />
          </Modal>
        )}
        {showChargeConfirmModal && !isModalExist(generatedChargeConfirmModalId) && (
          <Modal
            visible={showChargeConfirmModal}
            onClose={closeChargeConfirmModal}
            title="确定「星光碎片」充能的目标"
            position="center"
            maxWidth={480}
            modalId={generatedChargeConfirmModalId}
            getModalId={(id) => {
              generatedChargeConfirmModalId = id;
            }}
          >
            <Stardust
              temple={selectedChargeTemple}
              character={selectedChargeCharacter}
              onSuccess={() => {
                // 将该角色标记为已充能
                setState({
                  chargedCardIds: [...chargedCardIds, selectedChargeCharacter.Id],
                });
                closeChargeConfirmModal();
                closeChargeModal();
              }}
            />
          </Modal>
        )}
        {showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && (
          <Modal
            visible={showCharacterModal}
            onClose={() => setState({ showCharacterModal: false })}
            modalId={generatedCharacterModalId}
            getModalId={(id) => {
              generatedCharacterModalId = id;
            }}
          >
            <CharacterBox characterId={characterModalId} sticky={true} stickyTop={-16} />
          </Modal>
        )}
      </div>
    );
  });

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
        alert(result.message);
        return;
      }

      // 更新卡片数据
      const updatedCards = currentCardData.map((card) => {
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

      currentCardData = updatedCards;
      setState({ cardData: updatedCards });

      alert(`出售完成：获得资金 ₵${formatNumber(chara.SellPrice * chara.SellAmount, 0)}`);

      if (onSell) {
        onSell(chara);
      }
    } catch (error) {
      console.error("出售失败:", error);
      alert("出售失败");
    }
  };

  // 处理融资按钮点击
  const handleFinance = async (chara) => {
    try {
      const result = await sacrificeCharacter(chara.Id, chara.Amount, true);
      if (!result.success) {
        alert(result.message);
        return;
      }

      // 融资后移除该卡片的所有按钮
      const updatedCards = currentCardData.map((card) => {
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

      currentCardData = updatedCards;
      setState({ cardData: updatedCards });

      alert(`融资完成：获得资金 ₵${formatNumber(result.data.Balance, 0)}`);

      if (onFinance) {
        onFinance(chara);
      }
    } catch (error) {
      console.error("融资失败:", error);
      alert("融资失败");
    }
  };

  // 处理充能按钮点击
  const handleChargeClick = async (chara) => {
    const username = getCurrentUsername();
    if (!username) {
      alert("无法获取用户名");
      return;
    }

    // 获取用户的该角色数据
    const result = await getUserCharacterByUsername(chara.Id, username);
    if (!result.success) {
      alert(result.message || "获取角色数据失败");
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

    setState({
      selectedChargeCharacter: mergedCharacter,
      showChargeModal: true,
    });
  };

  // 关闭充能弹窗
  const closeChargeModal = () => {
    closeModalById(generatedChargeModalId);
    setState({ showChargeModal: false });
  };

  // 选择圣殿
  const handleTempleSelect = (temple) => {
    setState({
      selectedChargeTemple: temple,
      showChargeConfirmModal: true,
    });
  };

  // 关闭充能确认弹窗
  const closeChargeConfirmModal = () => {
    closeModalById(generatedChargeConfirmModalId);
    setState({ showChargeConfirmModal: false });
  };

  // 角色点击处理
  const handleCharacterClick = (characterId) => {
    setState({
      showCharacterModal: true,
      characterModalId: characterId,
    });
  };

  // 初始化数据
  setState({ cardData: charas || [] });

  return container;
}

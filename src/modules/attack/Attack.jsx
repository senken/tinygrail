import { starbreak } from "@src/api/magic.js";
import { Temple } from "@src/components/Temple.jsx";
import { ArrowBigRightIcon } from "@src/icons/ArrowBigRightIcon.js";
import { closeModal, openAlertModal, openModal } from "@src/utils/modalManager.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { showError } from "@src/utils/toastManager.jsx";

/**
 * 闪光结晶组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿对象
 * @param {Object} props.character - 角色对象
 * @param {Function} props.onSuccess - 成功回调
 */
export function Attack({ temple, character, onSuccess }) {
  /**
   * 处理闪光结晶操作
   */
  const handleAttack = async () => {
    try {
      const result = await starbreak(temple.CharacterId, character.Id);
      if (!result.success) {
        showError(result.message);
        return;
      }

      openAlertModal({
        message: result.data,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("闪光结晶失败:", error);
      showError("闪光结晶失败");
    }
  };

  return (
    <div
      id="tg-attack"
      data-temple-character-id={temple.CharacterId}
      data-character-id={character.Id}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-center gap-4">
        {/* 圣殿 */}
        <div className="w-[120px]">
          <Temple temple={temple} />
        </div>

        {/* 箭头图标 */}
        <div className="flex-shrink-0 opacity-60">
          <ArrowBigRightIcon className="h-6 w-6" />
        </div>

        {/* 角色头像和星之力 */}
        <div className="flex flex-col items-center gap-1">
          <img
            src={normalizeAvatar(character.Icon)}
            alt={character.Name}
            className="h-20 w-20 rounded-md object-cover object-top"
          />
          <div className="text-xs opacity-60">星之力：{character.StarForces}</div>
        </div>
      </div>

      {/* 说明文字 */}
      <div className="text-center text-sm opacity-80">
        消耗「{temple.Name}」100固定资产攻击「{character.Name}」的星之力
      </div>

      {/* 按钮 */}
      <div className="flex justify-center p-1">
        <button className="btn-bgm btn btn-sm btn-block" onClick={handleAttack}>
          ATTACK
        </button>
      </div>
    </div>
  );
}

/**
 * 打开闪光结晶弹窗
 * @param {Object} params
 * @param {Object} params.temple - 圣殿对象
 * @param {Object} params.character - 角色对象
 * @param {Function} params.onSuccess - 成功回调
 */
export function openAttackModal({ temple, character, onSuccess }) {
  const modalId = `attack-${temple.CharacterId}-${character.Id}`;

  openModal(modalId, {
    title: "确定「闪光结晶」攻击的目标",
    content: (
      <Attack
        temple={temple}
        character={character}
        onSuccess={() => {
          if (onSuccess) {
            onSuccess();
          }
          closeModal(modalId);
        }}
      />
    ),
    size: "sm",
  });
}

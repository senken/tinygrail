import { fisheye } from "@src/api/magic.js";
import { Temple } from "@src/components/Temple.jsx";
import { ArrowBigRightIcon } from "@src/icons/ArrowBigRightIcon.js";
import { closeModal, openAlertModal, openModal } from "@src/utils/modalManager.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { showError } from "@src/utils/toastManager.jsx";

/**
 * 鲤鱼之眼组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿对象
 * @param {Object} props.character - 角色对象
 * @param {Function} props.onSuccess - 成功回调
 */
export function Fisheye({ temple, character, onSuccess }) {
  /**
   * 处理鲤鱼之眼操作
   */
  const handleFisheye = async () => {
    try {
      const result = await fisheye(temple.CharacterId, character.Id);

      if (!result.success) {
        showError(result.message);
        return;
      }

      openAlertModal({
        title: "鲤鱼之眼",
        message: result.data,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("鲤鱼之眼失败:", error);
      showError("鲤鱼之眼失败");
    }
  };

  return (
    <div
      id="tg-fisheye"
      data-temple-character-id={temple.CharacterId}
      data-target-character-id={character.Id}
      className="flex flex-col gap-4"
    >
      <div id="tg-fisheye-content" className="flex items-center justify-center gap-4">
        {/* 圣殿 */}
        <div id="tg-fisheye-temple" className="w-[120px]" data-character-id={temple.CharacterId}>
          <Temple temple={temple} />
        </div>

        {/* 箭头图标 */}
        <div id="tg-fisheye-arrow" className="flex-shrink-0 opacity-60">
          <ArrowBigRightIcon className="h-6 w-6" />
        </div>

        {/* 角色头像和持股数 */}
        <div
          id="tg-fisheye-character"
          className="flex flex-col items-center gap-1"
          data-character-id={character.Id}
        >
          <img
            src={normalizeAvatar(character.Icon)}
            alt={character.Name}
            className="h-20 w-20 rounded-md object-cover object-top"
          />
          <div className="text-xs opacity-60">持股：{character.UserTotal}</div>
        </div>
      </div>

      {/* 说明文字 */}
      <div id="tg-fisheye-description" className="text-center text-sm opacity-80">
        消耗「{temple.Name}」100固定资产将「{character.Name}」的部分股份转移到英灵殿
      </div>

      {/* 按钮 */}
      <div id="tg-fisheye-action" className="flex justify-center p-1">
        <button className="btn-bgm btn btn-sm btn-block" onClick={handleFisheye}>
          TRANSFER
        </button>
      </div>
    </div>
  );
}

/**
 * 打开鲤鱼之眼弹窗
 * @param {Object} params
 * @param {Object} params.temple - 圣殿对象
 * @param {Object} params.character - 角色对象
 * @param {Function} params.onSuccess - 成功回调
 */
export function openFisheyeModal({ temple, character, onSuccess }) {
  const modalId = `fisheye-${temple.CharacterId}-${character.Id}`;

  openModal(modalId, {
    title: `确定「鲤鱼之眼」获取的目标`,
    content: (
      <Fisheye
        temple={temple}
        character={character}
        onSuccess={() => {
          closeModal(modalId);
          if (onSuccess) {
            onSuccess();
          }
        }}
      />
    ),
    size: "sm",
  });
}

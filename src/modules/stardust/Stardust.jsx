import { stardust } from "@src/api/magic.js";
import { Temple } from "@src/components/Temple.jsx";
import { ArrowBigRightIcon } from "@src/icons/ArrowBigRightIcon.js";
import { closeModal, openAlertModal, openModal } from "@src/utils/modalManager.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { showError, showWarning } from "@src/utils/toastManager.jsx";

/**
 * 星光碎片组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿对象
 * @param {Object} props.character - 角色对象
 * @param {Function} props.onSuccess - 成功回调
 */
export function Stardust({ temple, character, onSuccess }) {
  let inputElement = null;
  let isDownSacrifices = false; // 是否降塔

  /**
   * 处理星光碎片操作
   */
  const handleStardust = async () => {
    const amount = inputElement?.value?.trim();

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      showWarning("请输入有效的数量");
      return;
    }

    try {
      const result = await stardust(
        character.Id,
        temple.CharacterId,
        Number(amount),
        isDownSacrifices
      );

      if (!result.success) {
        showError(result.message);
        return;
      }

      openAlertModal({
        title: "星光碎片",
        message: result.data,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("星光碎片使用失败:", error);
      showError("星光碎片使用失败");
    }
  };

  const input = (
    <input
      type="number"
      className="input input-sm input-bordered mx-1 w-20"
      placeholder="数量"
      min="1"
    />
  );
  inputElement = input;

  const descriptionDiv = (
    <div className="text-center text-sm opacity-80 leading-loose">
      消耗「{character.Name}」{input}股补充「{temple.Name}」的固定资产
    </div>
  );

  // 降塔复选框
  const checkbox = (
    <input
      type="checkbox"
      className="checkbox checkbox-sm [--chkbg:var(--primary-color,#f09199)] [--chkfg:white]"
    />
  );

  const downSacrificesCheckbox = (
    <label className="flex cursor-pointer items-center gap-2">
      {checkbox}
      <span className="select-none text-xs opacity-60">降塔</span>
    </label>
  );

  checkbox.onchange = (e) => {
    isDownSacrifices = e.target.checked;
    // 保存当前输入框的值
    const currentValue = inputElement?.value || "";
    // 更新说明文字
    if (e.target.checked) {
      descriptionDiv.innerHTML = `消耗「${character.Name}」${input.outerHTML}股降低「${temple.Name}」的固定资产上限`;
    } else {
      descriptionDiv.innerHTML = `消耗「${character.Name}」${input.outerHTML}股补充「${temple.Name}」的固定资产`;
    }
    // 重新绑定input引用
    inputElement = descriptionDiv.querySelector('input[type="number"]');
    // 恢复输入框的值
    if (inputElement && currentValue) {
      inputElement.value = currentValue;
    }
  };

  return (
    <div id="tg-stardust" className="flex flex-col gap-4">
      <div id="tg-stardust-content" className="flex items-center justify-center gap-4">
        {/* 角色头像和持股数 */}
        <div className="flex flex-col items-center gap-1">
          <img
            src={normalizeAvatar(character.Icon)}
            alt={character.Name}
            className="h-20 w-20 rounded-md object-cover object-top"
          />
          <div className="text-xs opacity-60">持股：{character.UserTotal}</div>
        </div>

        {/* 箭头图标 */}
        <div className="flex-shrink-0 opacity-60">
          <ArrowBigRightIcon className="h-6 w-6" />
        </div>

        {/* 圣殿 */}
        <div className="w-[120px]">
          <Temple temple={temple} />
        </div>
      </div>

      {/* 降塔复选框 */}
      <div className="flex items-center justify-center gap-1">{downSacrificesCheckbox}</div>

      {/* 说明文字和输入框 */}
      <div id="tg-stardust-input" className="flex flex-col items-center gap-2">
        {descriptionDiv}
      </div>

      {/* 按钮 */}
      <div id="tg-stardust-submit" className="flex justify-center p-1">
        <button className="btn-bgm btn btn-sm btn-block" onClick={handleStardust}>
          CONVERT
        </button>
      </div>
    </div>
  );
}

/**
 * 打开星光碎片弹窗
 * @param {Object} params
 * @param {Object} params.temple - 圣殿对象
 * @param {Object} params.character - 角色对象
 * @param {Function} params.onSuccess - 成功回调
 */
export function openStardustModal({ temple, character, onSuccess }) {
  const modalId = `stardust-${temple.CharacterId}-${character.Id}`;

  openModal(modalId, {
    title: `确定「星光碎片」消耗的目标`,
    content: (
      <Stardust
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

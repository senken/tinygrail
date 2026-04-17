import { Temple } from "@src/components/Temple.jsx";
import { Button } from "@src/components/Button.jsx";
import { ArrowBigRightIcon } from "@src/icons/ArrowBigRightIcon.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { stardust } from "@src/api/magic.js";

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
      alert("请输入有效的数量");
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
        alert(result.message);
        return;
      }

      alert(result.data);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("星光碎片失败:", error);
      alert("星光碎片失败");
    }
  };

  const input = (
    <input
      type="number"
      className="mx-1 w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800"
      placeholder="数量"
      min="1"
    />
  );
  inputElement = input;

  // 降塔复选框
  const descriptionDiv = (
    <div className="text-center text-sm opacity-80">
      消耗「{character.Name}」{input}
      股补充「{temple.Name}」的固定资产
    </div>
  );

  const downSacrificesCheckbox = (
    <div className="relative inline-flex cursor-pointer">
      <input
        type="checkbox"
        id="tg-stardust-downsacrifices-checkbox"
        className="peer sr-only"
        onChange={(e) => {
          isDownSacrifices = e.target.checked;
          // 更新复选框状态
          const indicator = document.getElementById("tg-stardust-downsacrifices-indicator");
          if (indicator) {
            indicator.style.display = e.target.checked ? "block" : "none";
          }
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
        }}
      />
      <div className="flex h-4 w-4 items-center justify-center rounded border-2 border-gray-400 bg-white transition-colors peer-checked:border-blue-500 dark:bg-gray-800">
        <div
          id="tg-stardust-downsacrifices-indicator"
          className="h-2 w-2 rounded-sm bg-blue-500"
          style={{ display: "none" }}
        />
      </div>
    </div>
  );

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
      <div className="flex items-center justify-center gap-1">
        <label className="flex cursor-pointer items-center gap-2">
          {downSacrificesCheckbox}
          <span className="text-xs opacity-60">降塔</span>
        </label>
      </div>

      {/* 说明文字和输入框 */}
      <div id="tg-stardust-input" className="flex flex-col items-center gap-2">
        {descriptionDiv}
      </div>

      {/* 按钮 */}
      <div id="tg-stardust-submit" className="flex justify-center">
        <Button variant="solid" onClick={handleStardust}>
          CONVERT
        </Button>
      </div>
    </div>
  );
}

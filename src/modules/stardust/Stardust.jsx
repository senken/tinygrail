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
      const result = await stardust(character.Id, temple.CharacterId, Number(amount));

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

      {/* 说明文字和输入框 */}
      <div id="tg-stardust-input" className="flex flex-col items-center gap-2">
        <div className="text-center text-sm opacity-80">
          消耗「{character.Name}」{input}
          股补充「{temple.Name}」的固定资产
        </div>
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

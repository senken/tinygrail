import { Temple } from "@src/components/Temple.jsx";
import { Button } from "@src/components/Button.jsx";
import { ArrowBigRightIcon } from "@src/icons/ArrowBigRightIcon.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { guidepost } from "@src/api/magic.js";
import { formatNumber } from "@src/utils/format.js";

/**
 * 虚空道标组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿对象
 * @param {Object} props.character - 角色对象
 * @param {Function} props.onSuccess - 成功回调
 */
export function Guidepost({ temple, character, onSuccess }) {
  /**
   * 处理虚空道标操作
   */
  const handleGuidepost = async () => {
    try {
      const result = await guidepost(temple.CharacterId, character.Id);

      if (!result.success) {
        alert(result.message);
        return;
      }

      const count = result.data.Amount;
      const price = formatNumber(count * result.data.SellPrice, 0);
      alert(`成功获取「${character.Name}」${count}股，市值₵${price}`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("虚空道标失败:", error);
      alert("虚空道标失败");
    }
  };

  return (
    <div
      id="tg-guidepost"
      data-temple-character-id={temple.CharacterId}
      data-target-character-id={character.Id}
      className="flex flex-col gap-4"
    >
      <div id="tg-guidepost-content" className="flex items-center justify-center gap-4">
        {/* 圣殿 */}
        <div id="tg-guidepost-temple" className="w-[120px]" data-character-id={temple.CharacterId}>
          <Temple temple={temple} />
        </div>

        {/* 箭头图标 */}
        <div id="tg-guidepost-arrow" className="flex-shrink-0 opacity-60">
          <ArrowBigRightIcon className="h-6 w-6" />
        </div>

        {/* 角色头像和持股数 */}
        <div
          id="tg-guidepost-character"
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
      <div id="tg-guidepost-description" className="text-center text-sm opacity-80">
        消耗「{temple.Name}」100固定资产获取「{character.Name}」的随机数量（10-100）股份
      </div>

      {/* 按钮 */}
      <div id="tg-guidepost-action" className="flex justify-center">
        <Button variant="solid" onClick={handleGuidepost}>
          POST
        </Button>
      </div>
    </div>
  );
}

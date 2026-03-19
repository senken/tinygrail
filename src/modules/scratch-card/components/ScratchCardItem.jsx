import { getLargeCover } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Button } from "@src/components/Button.jsx";

/**
 * 刮刮乐卡片项组件
 * @param {Object} props
 * @param {Object} props.chara - 角色数据
 * @param {Function} props.onSell - 出售回调
 * @param {Function} props.onFinance - 融资回调
 * @param {Function} props.onCharge - 充能回调
 * @param {Function} props.onCharacterClick - 角色点击回调
 * @param {number} props.index - 卡片索引
 * @param {boolean} props.hasRevealed - 是否已执行过翻转动画
 * @param {Array} props.chargedCardIds - 已充能的卡片ID列表
 */
export function ScratchCardItem({
  chara,
  onSell,
  onFinance,
  onCharge,
  onCharacterClick,
  index,
  hasRevealed,
  chargedCardIds,
}) {
  const cover = getLargeCover(chara.Cover);
  const isCharged = chargedCardIds.includes(chara.Id);

  const inner = (
    <div
      className="relative aspect-[3/4]"
      style={{
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d",
        transition: "transform 0.7s ease-in-out",
        WebkitTransition: "transform 0.7s ease-in-out",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
      }}
    >
      {/* 背面 */}
      <div
        className="absolute inset-0 rounded-lg bg-cover bg-center shadow-lg"
        style={{
          backgroundImage: "url(https://tinygrail.mange.cn/image/tinygrail_card2.png!w240)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(0deg) translateZ(1px)",
          WebkitTransform: "rotateY(0deg) translateZ(1px)",
        }}
      />

      {/* 正面 */}
      <div
        className="absolute inset-0 rounded-lg shadow-lg"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg) translateZ(1px)",
          WebkitTransform: "rotateY(180deg) translateZ(1px)",
        }}
      >
        <div
          className="h-full w-full rounded-lg bg-cover bg-top"
          style={{ backgroundImage: `url(${cover})` }}
        >
          {/* 等级徽章 */}
          <div className="absolute left-2 top-2">
            <LevelBadge level={chara.Level} zeroCount={chara.ZeroCount} size="md" />
          </div>

          {/* 价格标签 */}
          <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
            ₵{formatNumber(chara.CurrentPrice, 0)}
          </div>
        </div>
      </div>
    </div>
  );

  const nameSpan = (
    <span
      className="tg-link min-w-0 flex-1 cursor-pointer truncate text-sm font-medium opacity-80 transition-opacity duration-300 hover:opacity-100"
      onClick={(e) => {
        e.stopPropagation();
        onCharacterClick && onCharacterClick(chara.Id);
      }}
    >
      ???
    </span>
  );

  const actions = (
    <div
      className="mb-0.5 mt-2 flex flex-col gap-1 overflow-hidden transition-all duration-300"
      style={{ maxHeight: "0", opacity: "0" }}
    >
      {chara.SellPrice > 0 && chara.SellAmount > 0 && (
        <Button
          variant="solid"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSell && onSell(chara);
          }}
        >
          出售 (₵{formatNumber(chara.SellPrice, 0)})
        </Button>
      )}
      {chara.Amount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onFinance && onFinance(chara);
          }}
        >
          融资
        </Button>
      )}
      {chara.Amount > 0 && !isCharged && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onCharge && onCharge(chara);
          }}
        >
          充能
        </Button>
      )}
    </div>
  );

  const cardContainer = (
    <div
      id="tg-scratch-card-item"
      data-character-id={chara.Id}
      className="relative w-40"
      data-id={chara.Id}
      style={{
        perspective: "1000px",
        WebkitPerspective: "1000px",
      }}
    >
      {inner}
      <div className="mt-2 flex items-center justify-between gap-2">
        {nameSpan}
        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">
          ×{chara.Amount}
        </span>
      </div>
      {actions}
    </div>
  );

  // 第一次渲染时自动依次翻转卡片
  if (!hasRevealed) {
    const delay = 500 + index * 300;
    setTimeout(() => {
      // 翻转动画
      inner.style.transform = "rotateY(180deg)";
      inner.style.WebkitTransform = "rotateY(180deg)";

      // 延迟显示名称和按钮
      setTimeout(() => {
        nameSpan.textContent = chara.Name;
        actions.style.maxHeight = "200px";
        actions.style.opacity = "1";
      }, 350);
    }, delay);
  } else {
    // 如果已经翻转过，直接设置为翻转后的状态
    inner.style.transform = "rotateY(180deg)";
    inner.style.WebkitTransform = "rotateY(180deg)";
    nameSpan.textContent = chara.Name;
    actions.style.maxHeight = "200px";
    actions.style.opacity = "1";
  }

  return cardContainer;
}

import { ChangeBadge } from "@src/components/ChangeBadge.jsx";
import { CrownBadge } from "@src/components/CrownBadge.jsx";
import { StarLevelIcons } from "@src/components/StarLevelIcons.jsx";
import { StarRankBadge } from "@src/components/StarRankBadge.jsx";
import { Tooltip } from "@src/components/Tooltip.jsx";
import { EllipsisIcon, QuestionIcon } from "@src/icons";
import { formatCurrency, formatDateTime, formatNumber } from "@src/utils/format.js";
import { openModal } from "@src/utils/modalManager.js";

/**
 * 交易盒子角色属性和详细信息组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {number} props.pool - 奖池数量
 * @param {Object} props.tinygrailCharacter - tinygrail用户的角色数据
 * @param {Object} props.gensokyoCharacter - gensokyo用户的角色数据
 */
export function TradeBoxHeaderDetails(props) {
  const { characterData, pool, tinygrailCharacter, gensokyoCharacter } = props || {};

  if (!characterData) {
    return null;
  }

  const {
    CharacterId,
    Current,
    Total,
    ListedDate,
    Fluctuation,
    Level,
    Crown,
    Rank,
    StarForces,
    Stars,
    Rate,
    ZeroCount,
  } = characterData;

  // 计算股息
  const dividend = Rank <= 500 ? Rate * 0.005 * (601 - Rank) : Stars * 2;
  const dividendFormula =
    Rank <= 500
      ? `${formatCurrency(Rate)} × ${formatNumber(0.005 * (601 - Rank))}`
      : `₵${Stars} × 2`;

  // 打开详细信息弹窗
  const openDetailsModal = () => {
    const modalContent = (
      <div
        id="tg-trade-box-details-modal"
        className="flex flex-col gap-2"
        data-character-id={CharacterId}
      >
        <div className="grid grid-cols-2 gap-2">
          <div id="tg-modal-price" className="flex flex-col gap-1" data-current={Current}>
            <span id="label" className="text-xs text-gray-600 dark:text-gray-400">
              现价
            </span>
            <span id="value" className="text-sm font-medium">
              {formatCurrency(Current)}
            </span>
          </div>
          <div id="tg-modal-dividend" className="flex flex-col gap-1" data-dividend={dividend}>
            <span id="label" className="text-xs text-gray-600 dark:text-gray-400">
              股息
            </span>
            <span id="value" className="text-sm font-medium">
              {formatCurrency(dividend)}{" "}
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                ({dividendFormula})
              </span>
            </span>
          </div>
          <div id="tg-modal-total" className="flex flex-col gap-1" data-total={Total}>
            <span id="label" className="text-xs text-gray-600 dark:text-gray-400">
              流通
            </span>
            <span id="value" className="text-sm font-medium">
              {formatNumber(Total, 0)}
            </span>
          </div>
          <div id="tg-modal-pool" className="flex flex-col gap-1" data-pool={pool}>
            <span id="label" className="text-xs text-gray-600 dark:text-gray-400">
              奖池
            </span>
            <span id="value" className="text-sm font-medium">
              {pool !== undefined ? formatNumber(pool, 0) : "..."}
            </span>
          </div>
          <div
            id="tg-modal-tinygrail"
            className="flex flex-col gap-1"
            data-amount={tinygrailCharacter?.Amount}
          >
            <span id="label" className="text-xs text-gray-600 dark:text-gray-400">
              英灵殿
            </span>
            <span id="value" className="text-sm font-medium">
              {tinygrailCharacter?.Amount !== undefined
                ? formatNumber(tinygrailCharacter.Amount, 0)
                : "..."}
            </span>
          </div>
          <div
            id="tg-modal-gensokyo"
            className="flex flex-col gap-1"
            data-amount={gensokyoCharacter?.Amount}
          >
            <span id="label" className="text-xs text-gray-600 dark:text-gray-400">
              幻想乡
            </span>
            <span id="value" className="text-sm font-medium">
              {gensokyoCharacter?.Amount !== undefined
                ? formatNumber(gensokyoCharacter.Amount, 0)
                : "..."}
            </span>
          </div>
        </div>
        <div
          id="tg-modal-listed-date"
          className="flex flex-col gap-1 border-t border-gray-200 pt-2 dark:border-gray-700"
          data-listed-date={ListedDate}
        >
          <span id="label" className="text-xs text-gray-600 dark:text-gray-400">
            上市时间
          </span>
          <span id="value" className="text-sm font-medium">
            {formatDateTime(ListedDate, "YYYY-MM-DD HH:mm")}
          </span>
        </div>
      </div>
    );

    openModal("character-details", {
      title: "角色详细信息",
      content: modalContent,
    });
  };

  return (
    <div id="tg-trade-box-header-details" className="flex flex-col gap-2">
      {/* 角色属性 */}
      <div id="tg-trade-box-header-badges" className="flex flex-wrap items-center gap-2">
        {/* 徽章组 */}
        <div className="flex flex-wrap gap-2">
          {Fluctuation !== undefined && <ChangeBadge change={Fluctuation} size="md" />}
          {Crown !== undefined && Crown > 0 && <CrownBadge count={Crown} size="md" />}
          {Rank !== undefined && <StarRankBadge rank={Rank} starForces={StarForces} size="md" />}
        </div>

        {/* 等级图标 */}
        {Stars !== undefined && <StarLevelIcons level={Stars} size={20} />}
      </div>

      {/* 详细信息 */}
      <div id="tg-trade-box-header-details-info" className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">
          <span id="price" data-current={Current}>
            现价：{formatCurrency(Current)}
          </span>
          <span className="mx-1.5 h-3 border-l border-gray-300 dark:border-gray-600"></span>
          <span id="dividend" data-dividend={dividend} className="inline-flex items-center gap-0.5">
            股息：{formatCurrency(dividend)}
            <span className="hidden sm:inline-flex">
              <Tooltip content={dividendFormula} trigger="click">
                <QuestionIcon className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" />
              </Tooltip>
            </span>
          </span>
        </span>
        <span
          id="total"
          data-total={Total}
          className="hidden rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800 sm:inline-block"
        >
          流通：{formatNumber(Total, 0)}
        </span>
        <span
          id="pool"
          data-pool={pool}
          className="hidden rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800 sm:inline-block"
        >
          奖池：{pool !== undefined ? formatNumber(pool, 0) : "..."}
        </span>
        <span
          id="tinygrail"
          data-amount={tinygrailCharacter?.Amount}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800"
        >
          英灵殿：
          {tinygrailCharacter?.Amount !== undefined
            ? formatNumber(tinygrailCharacter.Amount, 0)
            : "..."}
        </span>
        <span
          id="gensokyo"
          data-amount={gensokyoCharacter?.Amount}
          className="hidden rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800 sm:inline-block"
        >
          幻想乡：
          {gensokyoCharacter?.Amount !== undefined
            ? formatNumber(gensokyoCharacter.Amount, 0)
            : "..."}
        </span>
        <span
          id="listed-date"
          data-listed-date={ListedDate}
          className="hidden rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800 sm:inline-block"
          title="上市时间"
        >
          {formatDateTime(ListedDate, "YYYY-MM-DD HH:mm")}
        </span>
        {/* 移动端显示更多按钮 */}
        <button
          className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 sm:hidden"
          onClick={openDetailsModal}
        >
          <EllipsisIcon className="h-3 w-3" />
          更多
        </button>
      </div>
    </div>
  );
}

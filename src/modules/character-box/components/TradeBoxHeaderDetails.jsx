import { formatCurrency, formatNumber, formatDateTime } from "@src/utils/format.js";
import { QuestionIcon } from "@src/icons";
import { ChangeBadge } from "@src/components/ChangeBadge.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { CrownBadge } from "@src/components/CrownBadge.jsx";
import { StarRankBadge } from "@src/components/StarRankBadge.jsx";
import { StarLevelIcons } from "@src/components/StarLevelIcons.jsx";
import { Tooltip } from "@src/components/Tooltip.jsx";

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

  return (
    <div id="tg-trade-box-header-details" className="flex flex-col gap-2">
      {/* 角色属性 */}
      <div id="tg-trade-box-header-badges" className="flex flex-wrap items-center gap-2">
        {/* 徽章组 */}
        <div className="flex flex-wrap gap-2">
          {Fluctuation !== undefined && <ChangeBadge change={Fluctuation} size="md" />}
          {Level !== undefined && <LevelBadge level={Level} zeroCount={ZeroCount} size="md" />}
          {Crown !== undefined && Crown > 0 && <CrownBadge count={Crown} size="md" />}
          {Rank !== undefined && <StarRankBadge rank={Rank} starForces={StarForces} size="md" />}
        </div>

        {/* 等级图标 */}
        {Stars !== undefined && <StarLevelIcons level={Stars} size={20} />}
      </div>

      {/* 详细信息 */}
      <div id="tg-trade-box-header-details-info" className="flex flex-wrap gap-1.5">
        <span
          id="price"
          data-current={Current}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800"
        >
          现价：{formatCurrency(Current)}
        </span>
        <span
          id="total"
          data-total={Total}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800"
        >
          流通：{formatNumber(Total, 0)}
        </span>
        <span
          id="dividend"
          data-dividend={dividend}
          className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800"
        >
          股息：{formatCurrency(dividend)}
          <Tooltip content={dividendFormula} trigger="click">
            <QuestionIcon className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" />
          </Tooltip>
        </span>
        <span
          id="pool"
          data-pool={pool}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800"
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
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800"
        >
          幻想乡：
          {gensokyoCharacter?.Amount !== undefined
            ? formatNumber(gensokyoCharacter.Amount, 0)
            : "..."}
        </span>
        <span
          id="listed-date"
          data-listed-date={ListedDate}
          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800"
          title="上市时间"
        >
          {formatDateTime(ListedDate, "YYYY-MM-DD HH:mm")}
        </span>
      </div>
    </div>
  );
}

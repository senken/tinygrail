import { SparklesIcon } from "@src/icons";
import { formatNumber } from "@src/utils/format.js";

/**
 * 通天塔排名徽章组件
 * @param {Object} props
 * @param {number} props.rank - 排名
 * @param {number} props.starForces - 星之力，默认 0
 * @param {string} props.size - 尺寸 ('sm' | 'md' | 'lg')，默认 'sm'
 * @param {string} props.className - 额外的CSS类名
 */
export function StarRankBadge({ rank, starForces = 0, size = "sm", className = "" }) {
  const bgColor = rank < 500 ? "#673ab7" : "#757575";

  // 根据尺寸设置样式
  const sizeClasses = {
    sm: "h-4 text-[10px] leading-4 px-1.5",
    md: "h-5 text-xs leading-5 px-2",
    lg: "h-6 text-sm leading-6 px-2.5",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  const iconSize = iconSizes[size] || iconSizes.sm;

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span
        className={`inline-flex items-center rounded-md py-0 font-semibold text-white ${sizeClass}`}
        style={{ backgroundColor: bgColor }}
      >
        <span title="通天塔排名">#{rank}</span>
        <span className="mx-1.5 h-3 border-l border-white/30"></span>
        <span className="inline-flex items-center gap-0.5" title="星之力">
          <SparklesIcon className={iconSize} />
          {formatNumber(starForces, 0)}
        </span>
      </span>
    </div>
  );
}

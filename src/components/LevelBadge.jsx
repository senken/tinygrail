/**
 * 等级徽章组件
 * @param {Object} props
 * @param {number} props.level - 等级
 * @param {number} props.zeroCount - 当等级为0时显示的ST计数，默认0
 * @param {string} props.size - 尺寸 ('sm' | 'md' | 'lg')，默认 'sm'
 * @param {string} props.type - 类型 ('default' | 'unlisted' | 'ico')，默认 'default'
 * @param {string} props.className - 额外的CSS类名
 */
export function LevelBadge({ level, zeroCount = 0, size = "sm", type = "default", className = "" }) {
  // 根据等级获取背景颜色
  const getLevelColor = (lv) => {
    if (lv === 0) return "#d2d2d2";
    if (lv === 1) return "#45d216";
    if (lv === 2) return "#70bbff";
    if (lv === 3) return "#ffdc51";
    if (lv === 4) return "#FF9800";
    if (lv === 5) return "#d965ff";
    if (lv === 6) return "#ff5555";
    if (lv === 7) return "#e9ea54";
    if (lv === 8) return "#4293e4";
    if (lv === 9) return "#ffb851";
    if (lv >= 9) return "#ffc107";
    return "#d2d2d2";
  };

  // 根据尺寸设置样式
  const sizeClasses = {
    sm: "h-4 text-[10px] leading-4 px-1.5",
    md: "h-5 text-xs leading-5 px-2",
    lg: "h-6 text-sm leading-6 px-2.5",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  // 根据类型确定显示文本和颜色
  let displayText;
  let bgColor;

  if (type === "unlisted") {
    displayText = "未上市";
    bgColor = getLevelColor(0);
  } else if (type === "ico") {
    displayText = "ico";
    bgColor = getLevelColor(0);
  } else {
    // 默认类型
    bgColor = getLevelColor(level);
    // 当等级为0且传入了zeroCount时，显示ST计数；否则显示等级
    displayText = level === 0 && zeroCount !== 0 ? `st${zeroCount}` : `lv${level}`;
  }

  // 根据类型确定title
  const getTitle = () => {
    if (type === "unlisted") return "未上市";
    if (type === "ico") return "ICO";
    if (level === 0 && zeroCount !== 0) return "ST";
    return "等级";
  };

  return (
    <div
      id="tg-level-badge"
      data-level={level}
      className={`inline-flex items-center ${className}`}
      title={getTitle()}
    >
      <span
        className={`inline-block rounded-md py-0 font-semibold text-white ${sizeClass}`}
        style={{ backgroundColor: bgColor }}
      >
        {displayText}
      </span>
    </div>
  );
}

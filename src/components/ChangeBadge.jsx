/**
 * 涨跌徽章组件
 * @param {Object} props
 * @param {number} props.change - 变动
 * @param {string} props.size - 尺寸 ('sm' | 'md' | 'lg')，默认 'sm'
 * @param {string} props.className - 额外的CSS类名
 */
export function ChangeBadge({ change, size = "sm", className = "" }) {
  let bgColor;
  let text;

  if (change > 0) {
    bgColor = "#ff658d"; // 涨
    text = `+${(change * 100).toFixed(2)}%`;
  } else if (change < 0) {
    bgColor = "#65bcff"; // 跌
    text = `${(change * 100).toFixed(2)}%`;
  } else {
    bgColor = "#9e9e9e"; // 无变化
    text = "0.00%";
  }

  // 根据尺寸设置样式
  const sizeClasses = {
    sm: "h-4 text-[10px] leading-4 px-1.5",
    md: "h-5 text-xs leading-5 px-2",
    lg: "h-6 text-sm leading-6 px-2.5",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  return (
    <div className={`inline-flex items-center ${className}`} title="涨跌">
      <span
        className={`inline-block rounded-md py-0 font-semibold text-white ${sizeClass}`}
        style={{ backgroundColor: bgColor }}
      >
        {text}
      </span>
    </div>
  );
}

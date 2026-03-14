/**
 * 萌王次数徽章组件
 * @param {Object} props
 * @param {number} props.count - 萌王次数
 * @param {string} props.size - 尺寸 ('sm' | 'md' | 'lg')，默认 'sm'
 * @param {string} props.className - 额外的CSS类名
 */
export function CrownBadge({ count, size = "sm", className = "" }) {
  const bgColor = "#FFD700"; // 金色

  // 根据尺寸设置样式
  const sizeClasses = {
    sm: "h-4 text-[10px] leading-4 px-1.5",
    md: "h-5 text-xs leading-5 px-2",
    lg: "h-6 text-sm leading-6 px-2.5",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  return (
    <div className={`inline-flex items-center ${className}`} title="萌王次数">
      <span
        className={`inline-block rounded-md py-0 font-semibold text-white ${sizeClass}`}
        style={{ backgroundColor: bgColor }}
      >
        ×{count}
      </span>
    </div>
  );
}

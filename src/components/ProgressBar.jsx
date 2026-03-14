/**
 * 细进度条组件
 * @param {Object} props
 * @param {number} props.value - 当前值
 * @param {number} props.max - 最大值
 * @param {string} props.color - 进度条颜色
 * @param {string} props.bgColor - 背景颜色
 * @param {string} props.height - 高度
 * @param {string} props.className - 额外的 CSS 类名
 */
export function ProgressBar({
  value = 0,
  max = 100,
  color = "bg-blue-500",
  bgColor = "bg-gray-200 dark:bg-gray-700",
  height = "h-1",
  className = "",
}) {
  // 计算百分比
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // 判断color是否为Tailwind 类名
  const isTailwindClass = color.startsWith("bg-");

  return (
    <div
      id="tg-progress-bar"
      data-value={value}
      data-max={max}
      className={`w-full overflow-hidden rounded-full ${bgColor} ${height} ${className}`}
    >
      <div
        className={`${height} transition-all duration-300 ${isTailwindClass ? color : ""}`}
        style={{
          width: `${percentage}%`,
          backgroundColor: isTailwindClass ? undefined : color,
        }}
      />
    </div>
  );
}

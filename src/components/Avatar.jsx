/**
 * 头像组件
 * @param {Object} props
 * @param {string} props.src - 头像图片URL
 * @param {string} props.alt - 图片描述
 * @param {('sm'|'md'|'lg')} props.size - 尺寸
 * @param {number} props.rank - 排名
 * @param {boolean} props.isBanned - 是否被封禁
 * @param {Function} props.onClick - 点击回调
 * @param {string} props.className - 额外的类名
 */
export function Avatar({
  src,
  alt = "avatar",
  size = "md",
  rank,
  isBanned = false,
  onClick,
  className = "",
}) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const rankSizeClasses = {
    sm: "text-[10px] px-1",
    md: "text-xs px-1",
    lg: "text-sm px-1.5",
  };

  const baseClasses = "tg-avatar flex-shrink-0";
  const interactiveClasses = onClick ? "cursor-pointer transition-transform hover:scale-105" : "";
  const borderClasses = isBanned ? "border-red-500" : "border-gray-300 dark:border-white/30";

  return (
    <div
      id="tg-user-avatar"
      className={`tg-avatar-border relative border-2 ${borderClasses} ${interactiveClasses} ${className}`}
    >
      <div
        className={`${baseClasses} ${sizeClasses[size]}`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={alt}
      />
      {rank != null && rank > 0 && (
        <div
          className={`absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 rounded font-bold text-white shadow-md ${rankSizeClasses[size]}`}
          style={{ background: "linear-gradient(45deg, #FFC107, #FFEB3B)" }}
        >
          #{rank}
        </div>
      )}
    </div>
  );
}

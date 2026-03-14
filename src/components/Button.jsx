/**
 * 按钮组件
 * @param {Object} props
 * @param {string} props.children - 按钮文字内容
 * @param {Function} props.onClick - 点击事件处理函数
 * @param {string} props.variant - 按钮变体: 'outline' | 'solid'
 * @param {string} props.size - 按钮尺寸: 'sm' | 'md' | 'lg'
 * @param {string} props.rounded - 圆角样式: 'default' | 'full'
 * @param {string} props.className - 额外的 CSS 类名
 * @param {Object} props.rest - 其他 HTML button 属性
 */
export function Button({
  children,
  onClick,
  variant = "solid",
  size = "sm",
  rounded = "default",
  className = "",
  ...rest
}) {
  // 基础样式
  const baseStyles =
    "whitespace-nowrap font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  // 尺寸样式
  const sizeStyles = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-5 py-2 text-base",
  };

  // 圆角样式
  const roundedStyles = {
    default: "rounded-md",
    full: "rounded-full",
  };

  // 变体样式
  const variantStyles = {
    outline:
      "bgm-color border border-current hover:bgm-bg hover:border-transparent hover:text-white",
    solid: "bgm-bg text-white font-semibold shadow-sm hover:opacity-90",
  };

  const buttonClass = `${baseStyles} ${sizeStyles[size]} ${roundedStyles[rounded]} ${variantStyles[variant]} ${className}`;

  return (
    <button className={buttonClass} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

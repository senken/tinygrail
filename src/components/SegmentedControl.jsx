/**
 * 分段控制器组件
 * @param {Object} props
 * @param {Array} props.options - 选项数组,每个选项包含 {value, label}
 * @param {string|number} props.value - 当前选中的值
 * @param {Function} props.onChange - 值变化回调函数
 * @param {string} props.size - 尺寸: 'small' | 'medium' | 'large'
 */
export function SegmentedControl({ options, value, onChange, size = "medium" }) {
  if (!options || options.length === 0) {
    return null;
  }

  // 尺寸样式映射
  const sizeClasses = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-5 py-2.5 text-base",
  };

  const buttonClass = sizeClasses[size] || sizeClasses.medium;

  return (
    <div
      id="tg-segmented-control"
      className="inline-flex rounded-full bg-gray-100 p-1 dark:bg-gray-800"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            className={`${buttonClass} rounded-full font-medium transition-all ${
              isActive
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => {
              if (!isActive) {
                onChange(option.value);
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

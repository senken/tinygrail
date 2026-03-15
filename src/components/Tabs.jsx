/**
 * Tabs组件
 * @param {Object} props
 * @param {Array<{key: string, label: string, component: Function}>} props.items - tab配置对象数组
 * @param {number} props.activeTab - 当前激活的tab索引
 * @param {Function} props.onTabChange - tab切换回调
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {string} props.stickyTop - 粘性布局的top值
 * @param {string} props.size - 尺寸：'large'(默认) | 'small'
 * @param {string} props.padding - 内容区域的padding类名
 * @param {JSX.Element} props.icon - 导航右侧的图标
 * @param {Function} props.onIconClick - 图标点击回调
 */
export function Tabs({
  items,
  activeTab,
  onTabChange,
  sticky = false,
  stickyTop = "0",
  size = "large",
  padding = "px-1 py-3",
  icon = null,
  onIconClick = null,
}) {
  const activeItem = items[activeTab];
  const TabComponent = activeItem?.component;

  const stickyClass = sticky ? "sticky" : "";
  const stickyStyle = sticky ? { top: stickyTop, zIndex: 5 } : {};

  // 根据尺寸设置样式
  const sizeClasses = {
    large: "px-4 py-3 text-sm",
    small: "px-3 py-2 text-xs",
  };

  const tabClass = sizeClasses[size] || sizeClasses.large;

  return (
    <div id="tg-tabs">
      {/* Tabs导航 */}
      <div
        id="tg-tabs-nav"
        className={`${stickyClass} tg-bg-content border-b border-gray-200 dark:border-gray-600`}
        style={stickyStyle}
      >
        <div className="mx-auto flex">
          <div className="flex flex-1 overflow-x-auto">
            {items.map((item, index) => (
              <button
                className={`flex-shrink-0 whitespace-nowrap border-b-2 ${tabClass} font-medium transition-colors ${
                  activeTab === index
                    ? "bgm-border-color bgm-color"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                onClick={() => {
                  // 如果点击的是当前tab，不触发回调
                  if (index !== activeTab) {
                    onTabChange(index);
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {icon && (
            <div className="flex flex-shrink-0 items-center">
              <button
                className={`${tabClass} border-b-2 border-transparent opacity-60 transition-colors hover:opacity-100`}
                onClick={onIconClick}
              >
                {icon}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab内容 */}
      <div id="tg-tabs-content" className={`mx-auto ${padding}`}>
        {TabComponent && <TabComponent />}
      </div>
    </div>
  );
}

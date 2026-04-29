/**
 * 用户小圣杯Tabs容器组件（弹窗版本）
 * 纯粹的 tabs 容器,只负责渲染和切换
 * @param {Object} props
 * @param {Array} props.tabs - tab 配置数组 [{label: string, content: HTMLElement}]
 * @param {number} props.activeTab - 当前激活的tab索引
 * @param {Function} props.onTabChange - tab切换回调
 * @param {string} props.stickyTop - 粘性定位的top值，不传则不使用粘性布局
 * @param {string} props.bgClassName - 背景色类名
 */
export function UserTinygrailTabs({
  tabs = [],
  activeTab,
  onTabChange,
  stickyTop = null,
  bgClassName = "",
}) {
  // 如果没有数据，显示加载中
  if (tabs.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className={`rounded-lg p-8 text-center ${bgClassName}`}>
          <p className="text-lg opacity-60">加载中...</p>
        </div>
      </div>
    );
  }

  // 构建粘性布局样式
  const stickyStyle = stickyTop !== null ? { position: "sticky", top: stickyTop, zIndex: 5 } : {};

  return (
    <div className={bgClassName}>
      <div
        role="tablist"
        className={`tabs tabs-bordered overflow-x-auto whitespace-nowrap pt-2 ${bgClassName}`}
        style={stickyStyle}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          const tabStyle = {};
          if (isActive) {
            tabStyle.borderBottomColor = "var(--primary-color, #f09199)";
            tabStyle.color = "var(--primary-color, #f09199)";
          }

          const tabLink = (
            <a role="tab" className={`tab${isActive ? " tab-active" : ""}`} style={tabStyle}>
              {tab.label}
            </a>
          );

          tabLink.onclick = () => onTabChange(index);

          return tabLink;
        })}
      </div>
      <div className="mt-4">{tabs[activeTab]?.content}</div>
    </div>
  );
}

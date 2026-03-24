import { TempleLink } from "@src/components/TempleLink.jsx";
import { unescapeHtml } from "@src/utils/escape";
import { formatNumber } from "@src/utils/format";
import { ChevronDownIcon } from "@src/icons/index.js";

/**
 * LINK区域组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Array} props.links - LINK数据
 * @param {Function} props.openUserModal - 打开用户信息Modal的函数
 * @param {Function} props.openCharacterModal - 打开角色信息Modal的函数
 * @param {Function} props.openTempleModal - 打开圣殿Modal的函数
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {number} props.stickyTop - 粘性布局的top值
 * @param {boolean} props.isCollapsed - 是否折叠
 * @param {Function} props.onToggleCollapse - 切换折叠状态的回调
 */
export function TradeBoxLink({
  characterData,
  links = [],
  openUserModal,
  openCharacterModal,
  openTempleModal,
  sticky = false,
  stickyTop = 0,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const stickyClass = sticky ? "sticky" : "";
  const stickyStyle = sticky ? { top: `${stickyTop}px` } : {};

  // 按 LinkId 分组
  const groupedLinks = {};
  links.forEach((link) => {
    if (!groupedLinks[link.LinkId]) {
      groupedLinks[link.LinkId] = [];
    }
    groupedLinks[link.LinkId].push(link);
  });

  // 按每组数量排序（从大到小）
  const sortedGroups = Object.entries(groupedLinks)
    .map(([linkId, items]) => {
      return {
        linkId,
        items,
        count: items.length, // 该组的数量
        linkInfo: items[0].Link, // 获取 Link 信息
      };
    })
    .sort((a, b) => b.count - a.count); // 按数量从大到小排序

  return (
    <div id="tg-trade-box-link">
      {/* 标题 */}
      <div
        id="tg-trade-box-link-header"
        className={`tg-bg-content z-10 mb-2 flex cursor-pointer items-center justify-between border-b border-gray-200 py-2 dark:border-gray-700 ${stickyClass}`}
        style={stickyStyle}
        onClick={onToggleCollapse}
      >
        <span className="bgm-color text-sm font-semibold">LINK {links.length}</span>
        <div
          className="flex items-center justify-center opacity-60 transition-all"
          style={{
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <ChevronDownIcon className="h-5 w-5" />
        </div>
      </div>

      {/* 内容区域 */}
      {!isCollapsed && (
        <div id="tg-trade-box-link-content" className="space-y-4 py-2">
          {sortedGroups.map((group, index) => (
            <div id="tg-trade-box-link-group" data-link-id={group.linkId} className="space-y-2">
              {/* 排名标题 */}
              <div className="text-sm font-semibold">
                第{index + 1}位
                <span
                  className="tg-link cursor-pointer"
                  onClick={() => openCharacterModal(group.linkInfo.CharacterId)}
                >
                  「{group.linkInfo.Name}」
                </span>
              </div>

              {/* 渲染 TempleLink 组件 */}
              <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(188px,1fr))] justify-items-center gap-2">
                {group.items.map((item, itemIndex) => {
                  const sacrifices = Math.min(item.Assets, item.Link.Assets);
                  return (
                    <div className="flex flex-col">
                      <TempleLink
                        temple1={item}
                        temple2={item.Link}
                        size="mini"
                        showCharaName={false}
                        onCoverClick={(temple) => {
                          if (openTempleModal) {
                            openTempleModal(temple);
                          }
                        }}
                      />
                      <div
                        className="tg-link cursor-pointer text-left text-xs opacity-80"
                        onClick={() => openUserModal(item.Name)}
                      >
                        @{unescapeHtml(item.Nickname)} +{formatNumber(sacrifices, 0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

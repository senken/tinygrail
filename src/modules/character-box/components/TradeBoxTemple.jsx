import { Temple } from "@src/components/Temple.jsx";
import { unescapeHtml } from "@src/utils/escape";
import { ChevronDownIcon } from "@src/icons/index.js";

/**
 * 根据圣殿等级获取加成文本
 * @param {number} level - 圣殿等级
 * @returns {string} 加成文本
 */
function getTempleLevelBonus(level) {
  const bonusMap = {
    1: "+0.10",
    2: "+0.30",
    3: "+0.60",
  };
  return bonusMap[level] || "+0.10";
}

/**
 * 圣殿区域组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.userAssets - 用户资产数据
 * @param {Array} props.temples - 圣殿数据
 * @param {Function} props.openUserModal - 打开用户信息Modal的函数
 * @param {Function} props.openTempleModal - 打开圣殿Modal的函数
 * @param {boolean} props.hideDuplicates - 是否隐藏重复
 * @param {Function} props.onToggleDuplicates - 切换显示/隐藏重复的回调
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {number} props.stickyTop - 粘性布局的top值
 * @param {boolean} props.isCollapsed - 是否折叠
 * @param {Function} props.onToggleCollapse - 切换折叠状态的回调
 */
export function TradeBoxTemple({
  characterData,
  userAssets,
  temples = [],
  openUserModal,
  openTempleModal,
  hideDuplicates = true,
  onToggleDuplicates,
  sticky = false,
  stickyTop = 0,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const stickyClass = sticky ? "sticky" : "";
  const stickyStyle = sticky ? { top: `${stickyTop}px` } : {};

  // Switch 按钮样式
  const baseTrackClass = "relative inline-block h-4 w-8 rounded-full transition-colors";
  const trackClass = hideDuplicates
    ? `${baseTrackClass} bgm-bg`
    : `${baseTrackClass} bg-gray-300 dark:bg-gray-600`;

  const switchTrack = <div className={trackClass} />;
  const switchThumb = (
    <div
      className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform"
      style={{ transform: hideDuplicates ? "translateX(16px)" : "translateX(0)" }}
    />
  );

  switchTrack.appendChild(switchThumb);

  const switchButton = (
    <button
      type="button"
      className="flex items-center gap-2 outline-none"
      onClick={() => {
        if (onToggleDuplicates) {
          onToggleDuplicates();
        }
      }}
    >
      {switchTrack}
    </button>
  );

  // 找到自己的圣殿
  const userTempleName = userAssets?.name;
  const userTempleIndex = temples.findIndex((temple) => temple.Name === userTempleName);

  // 自己的圣殿置顶
  let sortedTemples = [...temples];
  if (userTempleIndex > -1) {
    const userTemple = sortedTemples.splice(userTempleIndex, 1)[0];
    sortedTemples.unshift(userTemple);
  }

  // 根据Cover字段去重并计数
  let displayTemples = sortedTemples;
  const templeCounts = {}; // 记录每个封面的数量

  if (hideDuplicates) {
    // 先统计每个封面的数量
    sortedTemples.forEach((temple) => {
      const key = temple.Cover || "empty"; // 空封面用'empty'作为key
      templeCounts[key] = (templeCounts[key] || 0) + 1;
    });

    const seenCovers = new Set();
    let hasSeenEmptyCover = false;

    displayTemples = sortedTemples.filter((temple, index) => {
      // 自己的圣殿永远不隐藏
      if (index === 0 && userTempleIndex > -1) {
        if (temple.Cover) {
          seenCovers.add(temple.Cover);
        } else {
          hasSeenEmptyCover = true;
        }
        return true;
      }

      // 处理空封面
      if (!temple.Cover) {
        if (hasSeenEmptyCover) {
          return false;
        }
        hasSeenEmptyCover = true;
        return true;
      }

      // 处理有封面的情况
      if (!seenCovers.has(temple.Cover)) {
        seenCovers.add(temple.Cover);
        return true;
      }

      return false;
    });
  }

  return (
    <div id="tg-trade-box-temple" data-character-id={characterData?.Id}>
      {/* 标题 */}
      <div
        id="tg-trade-box-temple-header"
        className={`tg-bg-content z-10 mb-2 flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700 ${stickyClass}`}
        style={stickyStyle}
      >
        <span className="bgm-color text-sm font-semibold">固定资产 {temples.length}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {switchButton}
            <span className="text-xs opacity-60">隐藏重复</span>
          </div>
          <button
            className="flex items-center justify-center border-none bg-transparent p-0 opacity-60 transition-all hover:opacity-100"
            onClick={onToggleCollapse}
            style={{
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      {!isCollapsed && (
        <div
          id="tg-trade-box-temple-list"
          className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] justify-items-center gap-2 p-2"
        >
          {displayTemples.map((temple, index) => {
            const coverKey = temple.Cover || "empty";
            const count = hideDuplicates ? templeCounts[coverKey] : 1;

            return (
              <div
                className="flex w-full flex-col gap-1"
                data-character-id={temple.CharacterId}
                data-user-name={temple.Name}
              >
                <Temple
                  temple={temple}
                  bottomText={getTempleLevelBonus(temple.Level)}
                  onClick={(templeData) => {
                    if (openTempleModal) {
                      openTempleModal(templeData);
                    }
                  }}
                />
                <div
                  className="tg-link w-full cursor-pointer truncate text-left text-xs opacity-80"
                  onClick={() => openUserModal(temple.Name)}
                >
                  @{unescapeHtml(temple.Nickname)} {hideDuplicates && count > 1 ? `×${count}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

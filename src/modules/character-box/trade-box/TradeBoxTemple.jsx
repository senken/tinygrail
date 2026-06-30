import { Temple } from "@src/components/Temple.jsx";
import { unescapeHtml } from "@src/utils/escape";
import { ChevronDownIcon, SlidersHorizontalIcon, SparklesIcon } from "@src/icons/index.js";
import { openTempleFilterModal } from "./TempleFilterModal.jsx";
import { formatNumber, formatDateTime } from "@src/utils/format.js";

/**
 * 根据圣殿等级获取加成文本
 * @param {number} level 圣殿等级
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
 * 根据Cover字段去重圣殿列表并计数
 * @param {Array} temples 圣殿列表
 * @param {number} userTempleIndex 用户圣殿在原列表中的索引
 * @param {boolean} pinUserTemple 是否置顶用户圣殿
 * @returns {Object} { displayTemples: 去重后的圣殿列表, templeCounts: 每个封面的数量 }
 */
function deduplicateTemplesByCover(temples, userTempleIndex, pinUserTemple) {
  const templeCounts = {}; // 记录每个封面的数量

  // 先统计每个封面的数量
  temples.forEach((temple) => {
    const key = temple.Cover || "empty"; // 空封面用empty作为key
    templeCounts[key] = (templeCounts[key] || 0) + 1;
  });

  const seenCovers = new Set();
  let hasSeenEmptyCover = false;

  const displayTemples = temples.filter((temple, index) => {
    // 如果置顶了用户圣殿，不隐藏
    if (index === 0 && userTempleIndex > -1 && pinUserTemple) {
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

  return { displayTemples, templeCounts };
}

/**
 * 圣殿区域组件
 * @param {Object} props 组件参数
 * @param {Object} props.characterData 角色数据
 * @param {Object} props.userAssets 用户资产数据
 * @param {Array} props.temples 圣殿数据
 * @param {Function} props.openUserModal 打开用户信息弹窗的函数
 * @param {Function} props.openTempleModal 打开圣殿弹窗的函数
 * @param {Object} props.templeFilterOptions 圣殿筛选排序选项 { sortBy: string, filters: {} }
 * @param {Function} props.onTempleFilterChange 圣殿筛选排序变更回调
 * @param {number} props.stickyTop 粘性布局的top值，不传则不启用粘性布局
 * @param {boolean} props.isCollapsed 是否折叠
 * @param {Function} props.onToggleCollapse 切换折叠状态的回调
 * @param {string} props.headerBgClass 标题背景色类名
 * @returns {HTMLElement} 圣殿区域元素
 */
export function TradeBoxTemple({
  characterData,
  userAssets,
  temples = [],
  openUserModal,
  openTempleModal,
  templeFilterOptions = { sortBy: "Sacrifices", filters: {} },
  onTempleFilterChange,
  stickyTop,
  isCollapsed = false,
  onToggleCollapse,
  headerBgClass = "",
}) {
  const stickyClass = stickyTop !== undefined ? "sticky" : "";
  const stickyStyle = stickyTop !== undefined ? { top: `${stickyTop}px` } : {};

  // 找到自己的圣殿
  const userTempleName = userAssets?.name;
  const userTempleIndex = temples.findIndex((temple) => temple.Name === userTempleName);

  // 排序和过滤
  let sortedTemples = [...temples];

  // 检查是否需要置顶用户圣殿
  const pinUserTemple = templeFilterOptions.filter?.pinUserTemple ?? true;
  let userTemple = null;

  // 如果需要置顶，先移除用户圣殿
  if (pinUserTemple && userTempleIndex > -1) {
    userTemple = sortedTemples.splice(userTempleIndex, 1)[0];
  }

  // 根据选择的字段排序
  const sortBy = templeFilterOptions.sort?.sortBy;
  const sortOrder = templeFilterOptions.sort?.order || "desc";

  if (sortBy) {
    sortedTemples.sort((a, b) => {
      let aValue = a[sortBy] || 0;
      let bValue = b[sortBy] || 0;

      // 如果是日期字段，转换为时间戳
      if (sortBy === "Create") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });
  }

  // 应用过滤条件
  const selectedFilters = templeFilterOptions.filter?.selectedFilters || [];
  const filterMode = templeFilterOptions.filter?.mode || "or";

  if (selectedFilters.length > 0) {
    sortedTemples = sortedTemples.filter((temple) => {
      const conditions = selectedFilters.map((filterKey) => {
        switch (filterKey) {
          case "level1":
            return temple.Level === 1;
          case "level2":
            return temple.Level === 2;
          case "level3":
            return temple.Level === 3;
          case "refined":
            return temple.Refine > 0;
          case "starred":
            return temple.StarForces >= 10000;
          case "unstarred":
            return temple.StarForces < 10000;
          case "undamaged":
            return temple.Assets >= temple.Sacrifices;
          case "damaged":
            return temple.Assets < temple.Sacrifices;
          default:
            return false;
        }
      });

      // 根据模式返回结果
      if (filterMode === "and") {
        return conditions.every((c) => c);
      } else {
        return conditions.some((c) => c);
      }
    });
  }

  // 如果需要置顶，将用户圣殿放在最前面
  if (pinUserTemple && userTemple) {
    sortedTemples.unshift(userTemple);
  }

  // 封面去重
  let displayTemples = sortedTemples;
  let templeCounts = {};
  const deduplicateByCover = templeFilterOptions.filter?.deduplicateByCover ?? false;

  if (deduplicateByCover) {
    const result = deduplicateTemplesByCover(sortedTemples, userTempleIndex, pinUserTemple);
    displayTemples = result.displayTemples;
    templeCounts = result.templeCounts;
  }

  return (
    <div id="tg-trade-box-temple" data-character-id={characterData?.Id}>
      {/* 标题 */}
      <div
        id="tg-trade-box-temple-header"
        className={`${headerBgClass} z-10 mb-2 flex cursor-pointer items-center justify-between border-b border-gray-200 py-2 dark:border-gray-700 ${stickyClass}`}
        style={stickyStyle}
        onClick={onToggleCollapse}
      >
        <span className="bgm-color text-sm font-semibold">固定资产 {temples.length}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1 px-1 text-xs opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              openTempleFilterModal({
                characterId: characterData?.Id,
                templeFilterOptions,
                onTempleFilterChange,
              });
            }}
          >
            <SlidersHorizontalIcon className="h-4 w-4" />
            <span>筛选</span>
          </button>
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
      </div>

      {/* 内容区域 */}
      {!isCollapsed && (
        <div
          id="tg-trade-box-temple-list"
          className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] justify-items-center gap-2 py-2"
        >
          {displayTemples.length > 0 ? (
            displayTemples.map((temple, index) => {
              const coverKey = temple.Cover || "empty";
              const count = deduplicateByCover ? templeCounts[coverKey] : 1;
              const sortBy = templeFilterOptions.sort?.sortBy;

              // 根据排序方式决定显示的额外信息
              let extraInfo = null;
              if (sortBy === "StarForces") {
                extraInfo = (
                  <div className="flex items-center gap-1">
                    <SparklesIcon className="h-3 w-3 flex-shrink-0 text-yellow-400" />
                    <span>{formatNumber(temple.StarForces || 0)}</span>
                  </div>
                );
              } else if (sortBy === "Create" && temple.Create) {
                extraInfo = formatDateTime(temple.Create, "YYYY-MM-DD");
              }

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
                    @{unescapeHtml(temple.Nickname)}{" "}
                    {deduplicateByCover && count > 1 ? `×${count}` : ""}
                  </div>
                  {extraInfo && (
                    <div className="w-full truncate text-left text-xs opacity-60">
                      {extraInfo}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-sm opacity-60">
              没有符合条件的圣殿
            </div>
          )}
        </div>
      )}
    </div>
  );
}

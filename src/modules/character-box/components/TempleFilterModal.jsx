import { openModal } from "@src/utils/modalManager.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import {
  ArrowUpNarrowWideIcon,
  ArrowDownNarrowWideIcon,
  VectorIntersectionIcon,
  VectorUnionIcon,
} from "@src/icons/index.js";

/**
 * 圣殿筛选排序内容组件
 * @param {Object} props
 * @param {Object} props.templeFilterOptions - 当前筛选排序选项
 * @param {Function} props.onTempleFilterChange - 筛选排序变更回调
 * @param {Function} props.onClose - 关闭弹窗函数
 */
function TempleFilterContent({ templeFilterOptions, onTempleFilterChange, onClose }) {
  const container = <div className="space-y-4"></div>;

  createMountedComponent(
    container,
    (state, setState) => {
      // 从state或templeFilterOptions获取当前值
      const currentSort = state.sort ||
        templeFilterOptions.sort || { sortBy: "Sacrifices", order: "desc" };
      const currentFilter = state.filter ||
        templeFilterOptions.filter || { selectedFilters: [], mode: "or" };

      return (
        <div className="space-y-4">
          {/* 排序区域 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">排序</h3>
              <button
                className="flex select-none items-center gap-1 text-xs opacity-60 hover:opacity-100"
                onClick={() => {
                  const newOrder = currentSort.order === "desc" ? "asc" : "desc";
                  const newSort = { ...currentSort, order: newOrder };
                  setState({ sort: newSort });
                  if (onTempleFilterChange) {
                    onTempleFilterChange({ ...templeFilterOptions, sort: newSort });
                  }
                }}
              >
                {currentSort.order === "desc" ? (
                  <div className="flex items-center gap-1">
                    <span>降序</span>
                    <ArrowDownNarrowWideIcon className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>升序</span>
                    <ArrowUpNarrowWideIcon className="h-4 w-4" />
                  </div>
                )}
              </button>
            </div>
            <div className="flex select-none flex-wrap gap-2">
              {[
                { id: "Sacrifices", label: "固定资产" },
                { id: "StarForces", label: "星之力" },
                { id: "Refine", label: "精炼等级" },
                { id: "Create", label: "创建日期" },
              ].map((sort) => (
                <button
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    currentSort.sortBy === sort.id
                      ? "bgm-bg text-white"
                      : "bg-base-200 hover:bg-base-300"
                  }`}
                  onClick={() => {
                    const newSort = { ...currentSort, sortBy: sort.id };
                    setState({ sort: newSort });
                    if (onTempleFilterChange) {
                      onTempleFilterChange({ ...templeFilterOptions, sort: newSort });
                    }
                  }}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>

          {/* 过滤区域 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">过滤</h3>
              <button
                className="flex select-none items-center gap-1 text-xs opacity-60 hover:opacity-100"
                onClick={() => {
                  const newMode = currentFilter.mode === "or" ? "and" : "or";
                  const newFilter = { ...currentFilter, mode: newMode };
                  setState({ filter: newFilter });
                  if (onTempleFilterChange) {
                    onTempleFilterChange({ ...templeFilterOptions, filter: newFilter });
                  }
                }}
              >
                {currentFilter.mode === "or" ? (
                  <div className="flex items-center gap-1">
                    <span>满足任一条件</span>
                    <VectorUnionIcon className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>满足所有条件</span>
                    <VectorIntersectionIcon className="h-4 w-4" />
                  </div>
                )}
              </button>
            </div>
            <div className="flex select-none flex-wrap gap-2">
              {[
                { id: "starred", label: "已冲星" },
                { id: "unstarred", label: "未冲星" },
                { id: "damaged", label: "已受损" },
                { id: "undamaged", label: "未受损" },
                { id: "level1", label: "光辉圣殿" },
                { id: "level2", label: "闪耀圣殿" },
                { id: "level3", label: "奇迹圣殿" },
                { id: "refined", label: "无限圣殿" },
              ].map((filter) => {
                const isSelected = currentFilter.selectedFilters.includes(filter.id);
                return (
                  <button
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      isSelected ? "bgm-bg text-white" : "bg-base-200 hover:bg-base-300"
                    }`}
                    onClick={() => {
                      let newSelectedFilters;
                      if (isSelected) {
                        newSelectedFilters = currentFilter.selectedFilters.filter(
                          (f) => f !== filter.id
                        );
                      } else {
                        newSelectedFilters = [...currentFilter.selectedFilters, filter.id];
                      }
                      const newFilter = { ...currentFilter, selectedFilters: newSelectedFilters };
                      setState({ filter: newFilter });
                      if (onTempleFilterChange) {
                        onTempleFilterChange({ ...templeFilterOptions, filter: newFilter });
                      }
                    }}
                  >
                    {filter.label}
                  </button>
                );
              })}
              <button
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  currentFilter.pinUserTemple
                    ? "bgm-bg text-white"
                    : "bg-base-200 hover:bg-base-300"
                }`}
                onClick={() => {
                  const newFilter = {
                    ...currentFilter,
                    pinUserTemple: !currentFilter.pinUserTemple,
                  };
                  setState({ filter: newFilter });
                  if (onTempleFilterChange) {
                    onTempleFilterChange({ ...templeFilterOptions, filter: newFilter });
                  }
                }}
              >
                置顶我的
              </button>
              <button
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  currentFilter.deduplicateByCover
                    ? "bgm-bg text-white"
                    : "bg-base-200 hover:bg-base-300"
                }`}
                onClick={() => {
                  const newFilter = {
                    ...currentFilter,
                    deduplicateByCover: !currentFilter.deduplicateByCover,
                  };
                  setState({ filter: newFilter });
                  if (onTempleFilterChange) {
                    onTempleFilterChange({ ...templeFilterOptions, filter: newFilter });
                  }
                }}
              >
                封面去重
              </button>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn no-animation btn-sm"
              onClick={() => {
                const resetOptions = {
                  sort: { sortBy: "Sacrifices", order: "desc" },
                  filter: {
                    selectedFilters: [],
                    mode: "or",
                    pinUserTemple: true,
                    deduplicateByCover: true,
                  },
                };
                setState(resetOptions);
                if (onTempleFilterChange) {
                  onTempleFilterChange(resetOptions);
                }
              }}
            >
              重置
            </button>
            <button
              className="btn-bgm btn no-animation btn-sm"
              onClick={() => {
                if (onClose) {
                  onClose();
                }
              }}
            >
              关闭
            </button>
          </div>
        </div>
      );
    },
    true
  );

  return container;
}

/**
 * 打开圣殿筛选排序弹窗
 * @param {Object} options
 * @param {string} options.characterId - 角色ID
 * @param {Object} options.templeFilterOptions - 当前筛选排序选项
 * @param {Function} options.onTempleFilterChange - 筛选排序变更回调
 */
export function openTempleFilterModal({ characterId, templeFilterOptions, onTempleFilterChange }) {
  const modalId = `temple-filter-${characterId}`;

  const { close } = openModal(modalId, {
    title: "排序和筛选",
    content: (
      <TempleFilterContent
        templeFilterOptions={templeFilterOptions}
        onTempleFilterChange={onTempleFilterChange}
        onClose={() => close()}
      />
    ),
    size: "sm",
  });
}

import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { getUserTemples } from "@src/api/chara.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { Temple } from "@src/components/Temple.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Button } from "@src/components/Button.jsx";
import { formatNumber } from "@src/utils/format.js";

/**
 * 圣殿搜索组件
 * @param {Object} props
 * @param {string} props.username - 用户名
 * @param {Function} props.onTempleClick - 点击圣殿回调
 * @param {string} props.className - 额外的CSS类名
 */
export function TempleSearch({ username, onTempleClick, className = "" }) {
  const container = <div id="tg-temple-search" className={className} />;

  const { setState } = createMountedComponent(container, (state) => {
    const {
      keyword = "",
      temples = null,
      currentPage = 1,
      totalPages = 0,
      loading = false,
    } = state || {};

    let currentInputValue = keyword;

    /**
     * 处理搜索操作
     */
    const handleSearch = () => {
      const searchKeyword = currentInputValue.trim();
      setState({ keyword: searchKeyword, currentPage: 1 });
      loadTemples(searchKeyword, 1);
    };

    /**
     * 处理分页变化
     * @param {number} page - 目标页码
     */
    const handlePageChange = (page) => {
      setState({ currentPage: page });
      loadTemples(keyword, page);
    };

    /**
     * 处理圣殿点击
     * @param {Object} temple - 圣殿对象
     */
    const handleTempleClick = (temple) => {
      if (onTempleClick) {
        onTempleClick(temple);
      }
    };

    /**
     * 计算网格列数
     * @param {number} width - 容器宽度
     * @returns {number} 列数
     */
    const calculateColumns = (width) => {
      const minCellWidth = 120;
      const gap = 16;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      // 确保列数是24的因数
      const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return divisor;
        }
      }
      return 1;
    };

    /**
     * 渲染网格项
     * @param {HTMLElement} gridDiv - 网格容器元素
     * @param {number} cols - 列数
     */
    const renderItems = (gridDiv, cols) => {
      gridDiv.innerHTML = "";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      if (!temples) return;

      temples.forEach((temple) => {
        const itemContainer = (
          <div
            data-character-id={temple.CharacterId}
            className="flex w-full cursor-pointer flex-col gap-1 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => handleTempleClick(temple)}
          >
            <Temple temple={temple} />
            <div className="flex flex-col gap-0.5 text-sm">
              {/* 等级徽章和角色名称 */}
              <div className="flex items-center gap-1">
                <LevelBadge level={temple.CharacterLevel} zeroCount={temple.ZeroCount} />
                <span className="opacity-80">{temple.Name}</span>
              </div>
              {/* LINK状态 */}
              <div className="text-xs opacity-60">
                {temple.Link ? `×「${temple.Link.Name}」` : "NO LINK"}
              </div>
            </div>
          </div>
        );
        gridDiv.appendChild(itemContainer);
      });
    };

    // 主容器
    const contentDiv = <div id="tg-temple-search-content" className="flex w-full flex-col gap-4" />;

    // 搜索框
    const searchDiv = (
      <div id="tg-temple-search-input" className="flex gap-2">
        <input
          type="text"
          className="tg-input flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 dark:border-gray-600"
          placeholder="搜索圣殿（角色ID或名称）"
          value={keyword}
          onInput={(e) => {
            currentInputValue = e.target.value;
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Button variant="solid" size="sm" onClick={handleSearch}>
          搜索
        </Button>
      </div>
    );
    contentDiv.appendChild(searchDiv);

    // 加载状态
    if (loading) {
      const loadingDiv = <div className="py-8 text-center text-sm opacity-60">加载中...</div>;
      contentDiv.appendChild(loadingDiv);
    }

    // 圣殿网格
    if (!loading && temples && temples.length > 0) {
      const gridDiv = <div className="grid w-full gap-1" />;

      // 初始渲染网格
      const initialCols = calculateColumns(container.offsetWidth || 800);
      renderItems(gridDiv, initialCols);

      contentDiv.appendChild(gridDiv);

      // 使用ResizeObserver监听容器宽度变化，动态调整列数
      const observer = new ResizeObserver(() => {
        const newCols = calculateColumns(container.offsetWidth);
        renderItems(gridDiv, newCols);
      });
      observer.observe(container);
    }

    // 空状态
    if (!loading && temples && temples.length === 0) {
      const emptyDiv = <div className="py-8 text-center text-sm opacity-60">未找到相关圣殿</div>;
      contentDiv.appendChild(emptyDiv);
    }

    // 分页
    if (!loading && totalPages > 1) {
      const paginationDiv = (
        <div className="flex justify-center">
          <Pagination
            current={Number(currentPage) || 1}
            total={Number(totalPages)}
            onChange={handlePageChange}
          />
        </div>
      );
      contentDiv.appendChild(paginationDiv);
    }

    return contentDiv;
  });

  /**
   * 加载圣殿列表
   * @param {string} keyword - 搜索关键字
   * @param {number} page - 页码
   */
  const loadTemples = (keyword, page) => {
    setState({ loading: true });

    getUserTemples(username, page, 24, keyword).then((result) => {
      if (result.success) {
        setState({
          temples: result.data.items,
          currentPage: result.data.currentPage,
          totalPages: result.data.totalPages,
          loading: false,
        });
      } else {
        setState({
          temples: [],
          loading: false,
        });
      }
    });
  };

  // 组件初始化
  loadTemples("", 1);

  return container;
}

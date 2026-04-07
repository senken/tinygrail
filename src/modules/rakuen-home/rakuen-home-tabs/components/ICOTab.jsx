import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { SegmentedControl } from "@src/components/SegmentedControl.jsx";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { ProgressBar } from "@src/components/ProgressBar.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { getMaxValueICO, getRecentActiveICO, getMostRecentICO } from "@src/api/chara.js";
import { calculateICO } from "@src/utils/ico.js";
import { formatCurrency, formatNumber, formatRemainingTime } from "@src/utils/format.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { getUserFavorites } from "@src/modules/favorite/favoriteStorage.js";
import { getCachedUserAssets } from "@src/utils/session.js";

/**
 * ICO Tab组件
 */
export function ICOTab() {
  const container = (
    <div
      id="tg-rakuen-home-ico-tab"
      className="tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    />
  );

  // ICO类型选项
  const icoOptions = [
    { value: "maxValue", label: "最多资金" },
    { value: "recentActive", label: "最近活跃" },
    { value: "mostRecent", label: "即将结束" },
  ];

  // 存储Modal生成的ID
  let generatedCharacterModalId = null;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  const { setState } = createMountedComponent(container, (state) => {
    const {
      activeICOType = "maxValue",
      maxValueData = null,
      maxValueLoading = true,
      maxValuePage = 1,
      recentActiveData = null,
      recentActiveLoading = true,
      recentActivePage = 1,
      mostRecentData = null,
      mostRecentLoading = true,
      mostRecentPage = 1,
      showCharacterModal = false,
      characterModalId = null,
    } = state || {};

    // 标题栏
    const headerDiv = (
      <div
        id="tg-rakuen-home-ico-tab-header"
        className="mb-3 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <div id="tg-rakuen-home-ico-tab-title" className="text-sm font-semibold">
            / {getICOTitle(activeICOType)}
          </div>
        </div>
        <SegmentedControl
          options={icoOptions}
          value={activeICOType}
          onChange={(value) => {
            setState({
              activeICOType: value,
              maxValuePage: 1,
              recentActivePage: 1,
              mostRecentPage: 1,
            });
            // 切换时加载对应数据
            if (value === "maxValue" && !maxValueData) {
              loadMaxValueData();
            } else if (value === "recentActive" && !recentActiveData) {
              loadRecentActiveData();
            } else if (value === "mostRecent" && !mostRecentData) {
              loadMostRecentData();
            }
          }}
          size="small"
        />
      </div>
    );

    // 角色点击处理
    const handleCharacterClick = (characterId) => {
      setState({
        showCharacterModal: true,
        characterModalId: characterId,
      });
    };

    /**
     * 渲染ICO项
     * @param {Object} item - ICO数据
     * @param {number} rank - 排名
     * @returns {HTMLElement} ICO项元素
     */
    const renderICOItem = (item, rank) => {
      const predicted = calculateICO(item);
      const percent = Math.round((item.Total / predicted.Next) * 100);
      const displayPercent = percent > 100 ? 100 : percent;

      // 倒计时元素
      const countdownSpan = <span className="text-xs opacity-60">计算中...</span>;

      // 倒计时
      if (item.End) {
        const updateCountdown = () => {
          const localOffset = new Date().getTimezoneOffset();
          const serverOffset = -8 * 60; // 服务器是UTC+8
          const endDate = new Date(item.End) - (localOffset - serverOffset) * 60 * 1000;
          const now = new Date();
          const diff = endDate - now;

          if (diff <= 0) {
            countdownSpan.textContent = "已结束";
            return;
          }

          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          let timeText = "";
          timeText += `${days}天`;
          timeText += `${hours}小时`;
          timeText += `${minutes}分`;
          timeText += `${seconds}秒`;

          countdownSpan.textContent = timeText;
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
      }

      // 获取角色所在的收藏夹
      const getCharacterFavorites = () => {
        const userAssets = getCachedUserAssets();
        const currentUserId = userAssets?.id;
        const favorites = getUserFavorites(currentUserId);
        return favorites.filter((f) => f.characters && f.characters.includes(item.CharacterId));
      };

      const characterFavorites = getCharacterFavorites();

      const icoItem = (
        <div
          data-character-id={item.CharacterId}
          className="tg-bg-content flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-lg p-4"
          onClick={() => handleCharacterClick(item.CharacterId)}
        >
          {/* 头像 */}
          <div className="relative">
            <div className="tg-avatar-border border-2 border-gray-300 dark:border-white/30">
              <div
                className="tg-avatar h-16 w-16"
                style={{
                  backgroundImage: `url(${normalizeAvatar(item.Icon)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                }}
              />
            </div>
            {/* 排名 */}
            <div
              className="absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 rounded px-1.5 text-sm font-bold text-white shadow-md"
              style={{ background: "linear-gradient(45deg, #FFC107, #FFEB3B)" }}
            >
              #{rank}
            </div>
            {/* 额外分红 */}
            {item.Type === 1 && item.Bonus > 0 && (
              <div
                className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 rounded-md bg-green-500 px-1.5 text-[10px] font-semibold text-white shadow-md"
                title={`剩余${item.Bonus}期额外分红`}
              >
                ×{item.Bonus}
              </div>
            )}
          </div>

          <div className="flex w-full min-w-0 flex-col items-center gap-2">
            {/* 等级和角色名称 */}
            <div className="flex w-full min-w-0 items-center justify-center gap-2 px-2">
              <LevelBadge level={predicted.Level} size="sm" />
              <span className="min-w-0 truncate text-sm font-semibold" title={item.Name}>
                {item.Name}
              </span>
            </div>

            {/* 收藏标签行 */}
            {characterFavorites.length > 0 && (
              <div className="flex w-full flex-wrap items-center justify-center gap-1 px-2">
                {characterFavorites.map((favorite) => (
                  <span
                    className={`inline-block flex-shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold leading-4 text-white ${favorite.color}`}
                  >
                    {favorite.name}
                  </span>
                ))}
              </div>
            )}

            {/* 资金和人数 */}
            <div className="text-xs opacity-80">
              {formatCurrency(item.Total, "₵", 0, false)} / {formatNumber(item.Users, 0)}人
            </div>

            {/* 进度条 */}
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center justify-between text-xs opacity-60">
                {countdownSpan}
                <span>{percent}%</span>
              </div>
              <ProgressBar value={item.Total} max={predicted.Next} color="#64ee10" height="h-1" />
            </div>
          </div>
        </div>
      );

      return icoItem;
    };

    /**
     * 渲染ICO内容
     * @param {string} type - ICO类型
     * @returns {HTMLElement} 内容元素
     */
    const renderICOContent = (type) => {
      let data, loading, currentPage, onPageChange;
      const pageSize = 24;

      if (type === "maxValue") {
        data = maxValueData;
        loading = maxValueLoading;
        currentPage = maxValuePage;
        onPageChange = (page) => setState({ maxValuePage: page });
      } else if (type === "recentActive") {
        data = recentActiveData;
        loading = recentActiveLoading;
        currentPage = recentActivePage;
        onPageChange = (page) => setState({ recentActivePage: page });
      } else {
        data = mostRecentData;
        loading = mostRecentLoading;
        currentPage = mostRecentPage;
        onPageChange = (page) => setState({ mostRecentPage: page });
      }

      if (loading) {
        return (
          <div className="text-center text-sm opacity-60">
            <p>加载中...</p>
          </div>
        );
      }

      if (!data || data.length === 0) {
        return (
          <div className="text-center text-sm opacity-60">
            <p>暂无数据</p>
          </div>
        );
      }

      const gridContainer = <div className="flex w-full flex-col gap-4" />;
      const gridDiv = <div className="grid w-full" />;
      const paginationDiv = <div className="flex w-full justify-center" />;

      // 渲染函数
      const renderItems = (cols) => {
        gridDiv.innerHTML = "";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
        gridDiv.style.gap = "0px";

        // 计算当前页显示的数据
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = data.slice(startIndex, endIndex);

        pageData.forEach((item, index) => {
          const currentRank = startIndex + index + 1;
          const icoItem = renderICOItem(item, currentRank);
          gridDiv.appendChild(icoItem);
        });
      };

      // 计算列数
      const calculateColumns = (width) => {
        const minCellWidth = 200;
        const gap = 0;

        let cols = Math.floor((width + gap) / (minCellWidth + gap));

        // 24的因数
        const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
        for (const divisor of divisors) {
          if (cols >= divisor) {
            return divisor;
          }
        }
        return 1;
      };

      // 初始渲染
      const initialCols = calculateColumns(gridContainer.offsetWidth || 800);
      renderItems(initialCols);

      gridContainer.appendChild(gridDiv);

      // 添加分页
      const totalPages = Math.ceil(data.length / pageSize);
      if (totalPages > 1) {
        const pagination = (
          <Pagination current={currentPage} total={totalPages} onChange={onPageChange} />
        );
        paginationDiv.appendChild(pagination);
        gridContainer.appendChild(paginationDiv);
      }

      // 使用ResizeObserver监听容器宽度变化
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          const newCols = calculateColumns(width);
          renderItems(newCols);
        }
      });

      observer.observe(gridContainer);

      return gridContainer;
    };

    // 内容区域
    const contentDiv = (
      <div id="tg-rakuen-home-ico-tab-content" className="mt-3">
        {renderICOContent(activeICOType)}
      </div>
    );

    const wrapper = <div />;
    wrapper.appendChild(headerDiv);
    wrapper.appendChild(contentDiv);

    // 角色弹窗
    if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
      const modal = (
        <Modal
          visible={showCharacterModal}
          onClose={() => setState({ showCharacterModal: false })}
          modalId={generatedCharacterModalId}
          getModalId={(id) => {
            generatedCharacterModalId = id;
          }}
          padding="p-6"
        >
          <CharacterBox characterId={characterModalId} sticky={true} />
        </Modal>
      );
      wrapper.appendChild(modal);
    }

    return wrapper;
  });

  // 加载最多资金数据
  const loadMaxValueData = async () => {
    setState({ maxValueLoading: true });
    const result = await getMaxValueICO(1, 999999);
    if (result.success) {
      setState({
        maxValueData: result.data,
        maxValueLoading: false,
      });
    } else {
      setState({ maxValueData: null, maxValueLoading: false });
    }
  };

  // 加载最近活跃数据
  const loadRecentActiveData = async () => {
    setState({ recentActiveLoading: true });
    const result = await getRecentActiveICO(1, 999999);
    if (result.success) {
      setState({
        recentActiveData: result.data,
        recentActiveLoading: false,
      });
    } else {
      setState({ recentActiveData: null, recentActiveLoading: false });
    }
  };

  // 加载即将结束数据
  const loadMostRecentData = async () => {
    setState({ mostRecentLoading: true });
    const result = await getMostRecentICO(1, 999999);
    if (result.success) {
      setState({
        mostRecentData: result.data,
        mostRecentLoading: false,
      });
    } else {
      setState({ mostRecentData: null, mostRecentLoading: false });
    }
  };

  /**
   * 获取ICO标题
   * @param {string} type - ICO类型
   * @returns {string} 标题
   */
  const getICOTitle = (type) => {
    switch (type) {
      case "maxValue":
        return "最多资金";
      case "recentActive":
        return "最近活跃";
      case "mostRecent":
        return "即将结束";
      default:
        return "最多资金";
    }
  };

  // 初始化加载最多资金数据
  loadMaxValueData();

  return container;
}

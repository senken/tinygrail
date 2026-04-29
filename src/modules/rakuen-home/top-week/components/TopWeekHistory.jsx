import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber, formatCurrency } from "@src/utils/format.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { openModal } from "@src/utils/modalManager.js";
import { getTopWeekHistory } from "@src/api/chara.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { scrollToTop } from "@src/utils/scroll.js";

/**
 * 往期萌王组件
 * @param {Object} props
 * @param {Array} props.historyData - 往期萌王数据
 * @param {number} props.currentPage - 当前页码
 * @param {Function} props.onPageChange - 页码变化回调
 * @param {Function} props.onCharacterClick - 角色点击回调
 */
export function TopWeekHistory({
  historyData = [],
  currentPage = 1,
  onPageChange,
  onCharacterClick,
}) {
  const container = <div id="tg-rakuen-home-top-week-history" className="min-w-96" />;

  if (!historyData || historyData.length === 0) {
    container.appendChild(
      <div className="text-center text-sm opacity-60">
        <p>暂无数据</p>
      </div>
    );
    return container;
  }

  /**
   * 计算周数
   * @param {Date|string} date - 日期
   * @returns {Object} 包含year和week的对象
   */
  const getWeek = (date) => {
    const d1 = new Date(date);
    const d2 = new Date(date);
    d2.setMonth(0);
    d2.setDate(1);
    const rq = d1 - d2;
    const days = Math.ceil(rq / (24 * 60 * 60 * 1000));
    const week = Math.ceil(days / 7);
    return {
      year: d1.getFullYear(),
      week,
    };
  };

  // 计算周数
  const firstItem = historyData[0];
  const { year, week } = getWeek(firstItem.Create);

  // 周标题
  const weekTitle = (
    <div id="tg-rakuen-home-top-week-history-title" className="text-sm font-semibold opacity-80">
      {year}年第{week}周
    </div>
  );
  container.appendChild(weekTitle);

  // 列表容器
  const itemsContainer = <div id="tg-rakuen-home-top-week-history-list" className="divide-y divide-gray-200 dark:divide-gray-700" />;

  // 渲染所有数据
  [...historyData].reverse().forEach((item) => {
    const avatarUrl = normalizeAvatar(item.Avatar);
    const rank = item.Level;

    // 根据名次确定颜色
    const getRankColor = (rank) => {
      if (rank === 1) return "#ffc107";
      if (rank === 2) return "#c0c0c0";
      if (rank === 3) return "#b36b00";
      return "#ddd";
    };

    const rankColor = getRankColor(rank);

    const itemDiv = (
      <div
        className="flex cursor-pointer items-center gap-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        onClick={() => onCharacterClick && onCharacterClick(item.CharacterId)}
        data-character-id={item.CharacterId}
        data-rank={rank}
      >
        {/* 名次 */}
        <div
          className="flex w-6 flex-shrink-0 justify-center text-base font-bold"
          style={{ color: rankColor }}
        >
          {rank}
        </div>

        {/* 头像 */}
        <div
          className={`size-10 flex-shrink-0 rounded-lg border ${rank <= 3 ? "border-opacity-80" : "border-transparent"}`}
          style={{
            borderColor: rank <= 3 ? rankColor : "transparent",
            boxShadow: rank === 1 ? "#fff555 0px 0px 3px 1px" : "none",
          }}
        >
          <div
            className="size-full rounded-lg bg-cover bg-top"
            style={{ backgroundImage: `url(${avatarUrl})` }}
          />
        </div>

        {/* 信息 */}
        <div className="flex-1">
          <div className="flex items-center gap-1 text-sm font-semibold">
            <LevelBadge level={item.CharacterLevel} zeroCount={item.ZeroCount} />
            <span>{item.Name}</span>
          </div>
          <div className="mt-0.5 text-xs opacity-60" title="超出总额 / 总额 / 人数">
            +{formatCurrency(item.Extra || 0, "₵", 0, false)} /{" "}
            {formatCurrency(item.Price || 0, "₵", 0, false)} / {formatNumber(item.Assets || 0, 0)}
          </div>
        </div>
      </div>
    );

    itemsContainer.appendChild(itemDiv);
  });

  container.appendChild(itemsContainer);

  // 添加分页
  if (historyData.length > 0) {
    const paginationDiv = (
      <div id="tg-rakuen-home-top-week-history-pagination" className="mt-2 flex justify-center">
        <Pagination current={currentPage} onChange={onPageChange} type="simple" />
      </div>
    );
    container.appendChild(paginationDiv);
  }

  return container;
}

/**
 * 打开往期萌王弹窗
 * @param {Object} params
 * @param {Array} params.initialHistoryData - 初始往期萌王数据
 * @param {number} params.initialPage - 初始页码
 * @param {Function} params.onCharacterClick - 角色点击回调
 */
export function openTopWeekHistoryModal({ initialHistoryData, initialPage = 1, onCharacterClick }) {
  const modalId = "top-week-history";
  
  const container = <div />;
  
  const { setState } = createMountedComponent(container, (state) => {
    const { historyData = initialHistoryData, currentPage = initialPage } = state || {};
    
    const handlePageChange = async (page) => {
      const result = await getTopWeekHistory(page);
      if (result.success) {
        setState({ historyData: result.data.items, currentPage: page });
        
        // 滚动到顶部
        scrollToTop(container);
      }
    };
    
    return (
      <TopWeekHistory
        historyData={historyData}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onCharacterClick={onCharacterClick}
      />
    );
  }, true);

  openModal(modalId, {
    title: "往期萌王",
    content: container,
    size: "md",
  });
}
